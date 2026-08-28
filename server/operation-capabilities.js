import crypto from 'node:crypto';
import { CORE_VERSION, digest } from './core-registry.js';
import { githubOperationStatus, getRepositoryHead, createOperationCommit, deleteOperationBranch, createOperationPullRequest, getOperationPullRequest, findOperationPullRequest, dispatchCapabilityWorkflow, findCapabilityWorkflowRun, findOperationBranch, validateDeploymentRollbackTarget } from './github.js';
import { loadMancerArtifact } from './mancer-artifact-store.js';
import { createOperation, getOperation, listOperations, operationStoreStatus, updateOperation } from './operation-store.js';

export const OPERATION_CAPABILITY_FORMAT='anomancer-operation-capability/v1';
const clone=value=>JSON.parse(JSON.stringify(value));
const clean=value=>String(value??'').trim();
const CAPABILITIES=Object.freeze([
  {id:'repository.write',label:'Repository-write + operation commit',risk:'high',adapter:'github-git-data/v1',approval:'human-written-confirmation',effect:'Creates an isolated anomancer/op-* branch. Never updates the default branch.'},
  {id:'tests.run',label:'Test runner',risk:'medium',adapter:'github-actions/workflow-dispatch/v1',approval:'human-written-confirmation',effect:'Dispatches the pinned capability workflow for the exact operation branch.'},
  {id:'git.pull-request',label:'Git pull request',risk:'high',adapter:'github-pull-request/v1',approval:'human-written-confirmation',effect:'Creates a reviewable PR. Never auto-merges it.'},
  {id:'deploy.preview',label:'Vercel preview deploy',risk:'high',adapter:'github-actions/vercel-prebuilt/v1',approval:'human-written-confirmation',effect:'Rebuilds the approved branch and deploys a preview through CI secrets.'},
  {id:'deploy.production',label:'Vercel production deploy',risk:'critical',adapter:'github-actions/vercel-prebuilt/v1',approval:'human-written-confirmation',effect:'Allowed only after a merged PR and release approval; rebuilds and deploys through CI.'},
  {id:'repository.rollback',label:'Operation branch rollback',risk:'high',adapter:'github-ref-delete/v1',approval:'human-written-confirmation',effect:'Deletes only an unchanged unpublished operation branch.'},
  {id:'deploy.rollback',label:'Vercel deployment rollback',risk:'critical',adapter:'github-actions/vercel-rollback/v1',approval:'human-written-confirmation',effect:'Dispatches a separately approved rollback for an explicit deployment URL or id.'}
].map(item=>Object.freeze({format:OPERATION_CAPABILITY_FORMAT,coreVersion:CORE_VERSION,...item,capabilityHash:digest(item)})));
const CAPABILITY_MAP=new Map(CAPABILITIES.map(item=>[item.id,item]));
const MAX_FILES=20,MAX_FILE_BYTES=300_000,MAX_TOTAL_BYTES=1_000_000;
const DENIED_PATH=/(^|\/)(?:\.git|\.vercel|node_modules|\.anomancer-backups)(?:\/|$)|(^|\/)\.env(?:\.|$)|(^|\/)(?:id_rsa|id_ed25519|credentials?|secrets?)(?:\.|$)/i;
const SECRET_VALUE=/(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;

export function listOperationCapabilities(){return CAPABILITIES.map(clone);}
export function operationRuntimeStatus(workspaceId){return{format:'anomancer-operation-runtime-status/v1',coreVersion:CORE_VERSION,workspaceId,repository:githubOperationStatus(),store:operationStoreStatus(workspaceId),workflow:{requiredSecrets:['VERCEL_TOKEN','VERCEL_ORG_ID','VERCEL_PROJECT_ID'],secretsExposed:false,directShell:false,arbitraryCommandInput:false,workflowFile:process.env.ANOMANCER_CAPABILITY_WORKFLOW||'anomancer-capability-gate.yml'}};}
function fail(message,code,statusCode=400,extra={}){throw Object.assign(new Error(message),{code,statusCode,...extra});}
function operationId(){return`op-${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}`;}
function actorFor(session){return`admin-${digest({nonce:String(session?.nonce||'')}).slice(0,12)}`;}
function safePath(value){const path=clean(value).replace(/\\/g,'/').replace(/^\.\//,'');if(!path||path.length>500||path.startsWith('/')||path.includes('\0')||path.split('/').some(part=>!part||part==='.'||part==='..')||!/^[A-Za-z0-9._@+\/-]+$/.test(path)||DENIED_PATH.test(path))fail(`Repository-polku ei ole sallittu: ${path||'tyhjä'}.`,'OPERATION_PATH_DENIED');return path;}
function repositoryFiles(data={}){
  const source=Array.isArray(data.code)?data.code:[];if(!source.length)fail('Codemancerin Koodi-osiossa ei ole sovellettavia tiedostoja.','OPERATION_FILES_REQUIRED');if(source.length>MAX_FILES)fail(`Yksi operaatio hyväksyy enintään ${MAX_FILES} tiedostoa.`,'OPERATION_FILE_LIMIT',413);
  const seen=new Set(),files=[];let totalBytes=0;
  for(const item of source){const path=safePath(item?.path),content=String(item?.content??''),bytes=Buffer.byteLength(content,'utf8');if(seen.has(path))fail(`Sama polku on ehdotuksessa kahdesti: ${path}.`,'OPERATION_PATH_DUPLICATE');if(bytes>MAX_FILE_BYTES)fail(`Tiedosto ${path} ylittää ${MAX_FILE_BYTES} tavun rajan.`,'OPERATION_FILE_TOO_LARGE',413);if(SECRET_VALUE.test(content))fail(`Tiedosto ${path} näyttää sisältävän salaisuuden. Operation-portti ei siirrä avaimia repositoryyn.`,'OPERATION_SECRET_DETECTED',409);seen.add(path);totalBytes+=bytes;files.push({path,content,bytes,lines:content?content.split(/\r?\n/).length:0,contentHash:digest(content),notes:clean(item?.notes).slice(0,400)});}
  if(totalBytes>MAX_TOTAL_BYTES)fail(`Operation tiedostot ylittävät ${MAX_TOTAL_BYTES} tavun kokonaisrajan.`,'OPERATION_TOTAL_TOO_LARGE',413);
  return files;
}
function fileManifest(files){return files.map(({path,bytes,lines,contentHash,notes})=>({path,bytes,lines,contentHash,notes}));}
function planHash(plan){return digest(plan);}
function confirmationFor(id,kind){const verb=kind.includes('rollback')?'PALAUTA':'HYVÄKSYN';return`${verb} ${id.slice(-12).toUpperCase()}`;}
function appendAudit(operation,event,actor,detail={}){const previous=operation.audit?.at(-1)?.auditHash||'GENESIS',entry={sequence:(operation.audit?.length||0)+1,event,at:new Date().toISOString(),actor,detail,previousHash:previous};entry.auditHash=digest(entry);operation.audit=[...(operation.audit||[]),entry].slice(-120);return operation;}
function seal(operation){const copy=clone(operation);delete copy.operationHash;operation.operationHash=digest(copy);return operation;}
function baseOperation({workspaceId,kind,plan,risk,actor}){const id=operationId(),now=Date.now(),operation={id,workspaceId,kind,capabilityId:kind,risk,status:'planned',revision:0,createdAt:new Date(now).toISOString(),updatedAt:new Date(now).toISOString(),expiresAt:new Date(now+24*60*60*1000).toISOString(),confirmationPhrase:confirmationFor(id,kind),plan:{...plan,planHash:planHash(plan)},approval:{status:'pending'},execution:null,audit:[]};appendAudit(operation,'operation.planned',actor,{kind,planHash:operation.plan.planHash});return seal(operation);}
function ensureCapability(kind){const item=CAPABILITY_MAP.get(clean(kind));if(!item)fail('Tuntematon operation capability.','OPERATION_CAPABILITY_UNKNOWN');return item;}
function ensureFresh(operation){if(operation.expiresAt&&Date.parse(operation.expiresAt)<=Date.now())fail('Operation-suunnitelma on vanhentunut. Tee uusi suunnitelma.','OPERATION_EXPIRED',409);}
function requireSource(operation,kind,statuses){if(!operation)fail('Lähdeoperaatiota ei löytynyt.','OPERATION_SOURCE_NOT_FOUND',404);if(operation.kind!==kind)fail(`Lähdeoperaation pitää olla ${kind}.`,'OPERATION_SOURCE_KIND',409);if(!statuses.includes(operation.status))fail(`Lähdeoperaation tila ${operation.status} ei avaa seuraavaa porttia.`,'OPERATION_SOURCE_STATUS',409);return operation;}
async function artifactFor(workspace){return loadMancerArtifact({workspace,force:true});}

export async function planCapabilityOperation({kind,workspace,session,sourceOperationId='',rollbackTarget=''}={}){
  const capability=ensureCapability(kind),actor=actorFor(session),artifact=await artifactFor(workspace),data=artifact.data||{},review=data.review||{},release=data.release||{};let plan={};
  if(kind==='repository.write'){
    if(review.decision!=='approved')fail('Repository-write vaatii Tarkistus-osion ihmispäätöksen “Hyväksytty”.','OPERATION_REVIEW_REQUIRED',409);
    const files=repositoryFiles(data),head=await getRepositoryHead(),manifest=fileManifest(files),idPreview=workspace.id.toLowerCase().replace(/[^a-z0-9-]+/g,'-').slice(0,24)||'workspace';
    plan={artifactRevision:artifact.revision,artifactHash:digest(data),filesHash:digest(manifest),fileManifest:manifest,fileCount:manifest.length,totalBytes:manifest.reduce((sum,item)=>sum+item.bytes,0),repo:head.repo,baseBranch:head.branch,baseSha:head.sha,branchName:`anomancer/op-${idPreview}-${crypto.randomBytes(5).toString('hex')}`,reviewDecision:review.decision};
  }else if(kind==='tests.run'){
    const source=requireSource(await getOperation(sourceOperationId,{workspaceId:workspace.id,force:true}),'repository.write',['succeeded']);plan={sourceOperationId:source.id,repo:source.plan.repo,sourceBranch:source.execution.branch,sourceRef:source.execution.commitSha,commitSha:source.execution.commitSha,workflowMode:'tests'};
  }else if(kind==='git.pull-request'||kind==='deploy.preview'){
    const source=requireSource(await getOperation(sourceOperationId,{workspaceId:workspace.id,force:true}),'tests.run',['passed']);plan={sourceOperationId:source.id,repositoryOperationId:source.plan.sourceOperationId,repo:source.plan.repo,sourceBranch:source.plan.sourceBranch,sourceRef:kind==='deploy.preview'?source.plan.commitSha:source.plan.sourceBranch,commitSha:source.plan.commitSha,workflowMode:kind==='deploy.preview'?'preview':null};
  }else if(kind==='deploy.production'){
    const source=requireSource(await getOperation(sourceOperationId,{workspaceId:workspace.id,force:true}),'git.pull-request',['merged']);if(release.humanApproval!=='approved'||release.check!=='passing')fail('Production-deploy vaatii release-checkin “Vihreä” ja ihmisen julkaisupäätöksen “Hyväksytty”.','OPERATION_RELEASE_APPROVAL_REQUIRED',409);const mergeCommitSha=clean(source.execution.mergeCommitSha).toLowerCase();if(!/^[a-f0-9]{40}$/.test(mergeCommitSha))fail('Yhdistetyn PR:n merge commit SHA puuttuu. Production-portti pysyy kiinni.','OPERATION_MERGE_SHA_REQUIRED',409);plan={sourceOperationId:source.id,repo:source.plan.repo,sourceRef:mergeCommitSha,mergeCommitSha,workflowMode:'production',releaseVersion:clean(release.version).slice(0,80),releaseApproval:release.humanApproval};
  }else if(kind==='repository.rollback'){
    const source=requireSource(await getOperation(sourceOperationId,{workspaceId:workspace.id,force:true}),'repository.write',['succeeded']);const all=await listOperations({workspaceId:workspace.id,limit:80}),merged=all.operations.some(item=>item.kind==='git.pull-request'&&item.status==='merged'&&item.plan.repositoryOperationId===source.id);if(merged)fail('Operation-haara on jo yhdistetty. Branchin poisto ei ole merge-rollback; käytä uutta korjausoperaatiota.','OPERATION_ROLLBACK_MERGED',409);plan={sourceOperationId:source.id,repo:source.plan.repo,branchName:source.execution.branch,expectedHeadSha:source.execution.commitSha,restores:'unpublished-operation-branch-removed'};
  }else if(kind==='deploy.rollback'){
    const target=validateDeploymentRollbackTarget(rollbackTarget);plan={sourceOperationId:clean(sourceOperationId)||null,rollbackTarget:target,workflowMode:'rollback'};
  }
  const operation=baseOperation({workspaceId:workspace.id,kind,plan,risk:capability.risk,actor});return createOperation(operation,{workspaceId:workspace.id});
}

export async function decideCapabilityOperation({operationId,decision,confirmation,expectedRevision,workspace,session}={}){
  const actor=actorFor(session),selected=decision==='reject'?'rejected':'approved';
  return updateOperation(operationId,operation=>{if(operation.status!=='planned')fail('Vain suunniteltu operation voidaan hyväksyä tai hylätä.','OPERATION_DECISION_STATE',409);ensureFresh(operation);if(selected==='approved'&&clean(confirmation)!==operation.confirmationPhrase)fail('Kirjoitettu vahvistus ei vastaa operation-suunnitelmaa.','OPERATION_CONFIRMATION_MISMATCH',409);operation.status=selected;operation.approval={status:selected,actor,at:new Date().toISOString(),planHash:operation.plan.planHash};appendAudit(operation,`operation.${selected}`,actor,{planHash:operation.plan.planHash});return seal(operation);},{workspaceId:workspace.id,expectedRevision});
}

async function executeEffect(operation,workspace){
  if(operation.kind==='repository.write'){
    const artifact=await artifactFor(workspace),data=artifact.data||{},files=repositoryFiles(data),manifest=fileManifest(files);if(artifact.revision!==operation.plan.artifactRevision||digest(data)!==operation.plan.artifactHash||digest(manifest)!==operation.plan.filesHash)fail('Codemancer-artefakti muuttui hyväksytyn suunnitelman jälkeen. Tee uusi operation plan.','OPERATION_ARTIFACT_CHANGED',409);
    return createOperationCommit({branchName:operation.plan.branchName,baseSha:operation.plan.baseSha,files,message:`codemancer(${workspace.id}): approved operation ${operation.id}`});
  }
  if(operation.kind==='tests.run'||operation.kind==='deploy.preview'||operation.kind==='deploy.production'||operation.kind==='deploy.rollback')return dispatchCapabilityWorkflow({operationId:operation.id,mode:operation.plan.workflowMode,sourceRef:operation.plan.sourceRef,rollbackTarget:operation.plan.rollbackTarget});
  if(operation.kind==='git.pull-request'){
    const repositoryOperation=await getOperation(operation.plan.repositoryOperationId,{workspaceId:workspace.id,force:true});return createOperationPullRequest({branchName:operation.plan.sourceRef,title:`Codemancer: ${workspace.name} · ${operation.id}`,body:`Human-approved Anomancer operation.\n\n- Operation: ${operation.id}\n- Repository operation: ${repositoryOperation?.id||operation.plan.repositoryOperationId}\n- Commit: ${operation.plan.commitSha}\n- Tests: ${operation.plan.sourceOperationId}\n\nThis PR is not auto-merged.`});
  }
  if(operation.kind==='repository.rollback')return deleteOperationBranch({branchName:operation.plan.branchName,expectedHeadSha:operation.plan.expectedHeadSha});
  fail('Operation capabilityltä puuttuu execute-adapteri.','OPERATION_EXECUTOR_MISSING',501);
}
function successStatus(kind,result={}){if(kind==='repository.write')return result.defaultBranchUnchanged===false?'drifted':'succeeded';if(kind==='git.pull-request')return'open';if(kind==='repository.rollback'||kind==='deploy.rollback')return kind==='repository.rollback'?'rolled_back':'dispatched';return'dispatched';}
export async function executeCapabilityOperation({operationId,expectedRevision,workspace,session}={}){
  const actor=actorFor(session),operation=await getOperation(operationId,{workspaceId:workspace.id,force:true});if(!operation)fail('Operationia ei löytynyt.','OPERATION_NOT_FOUND',404);if(operation.status!=='approved')fail('Operation pitää hyväksyä ennen suorittamista.','OPERATION_EXECUTION_NOT_APPROVED',409);ensureFresh(operation);if(operation.approval?.planHash!==operation.plan.planHash)fail('Hyväksyntä ei vastaa operation-suunnitelmaa.','OPERATION_APPROVAL_BINDING',409);
  const executing=await updateOperation(operation.id,item=>{item.status='executing';item.execution={startedAt:new Date().toISOString(),actor};appendAudit(item,'operation.execution_started',actor,{kind:item.kind});return seal(item);},{workspaceId:workspace.id,expectedRevision});
  try{
    const result=await executeEffect(executing,workspace),completed=await updateOperation(executing.id,item=>{item.status=successStatus(item.kind,result);item.execution={...item.execution,...result,finishedAt:new Date().toISOString()};appendAudit(item,'operation.execution_completed',actor,{status:item.status,adapter:CAPABILITY_MAP.get(item.kind)?.adapter});return seal(item);},{workspaceId:workspace.id,expectedRevision:executing.revision});return completed;
  }catch(error){await updateOperation(executing.id,item=>{item.status='failed';item.execution={...item.execution,finishedAt:new Date().toISOString(),error:{code:clean(error.code||'OPERATION_EXECUTION_FAILED').slice(0,120),message:clean(error.message).slice(0,500)}};appendAudit(item,'operation.execution_failed',actor,{code:item.execution.error.code});return seal(item);},{workspaceId:workspace.id,expectedRevision:executing.revision}).catch(()=>{});throw error;}
}

export async function refreshCapabilityOperation({operationId,expectedRevision,workspace,session}={}){
  const actor=actorFor(session),operation=await getOperation(operationId,{workspaceId:workspace.id,force:true});if(!operation)fail('Operationia ei löytynyt.','OPERATION_NOT_FOUND',404);
  let result=null,status=operation.status;
  if(['tests.run','deploy.preview','deploy.production','deploy.rollback'].includes(operation.kind)){
    result=await findCapabilityWorkflowRun(operation.id,{mode:operation.plan.workflowMode,startedAt:operation.execution?.startedAt});if(!result)return operation;if(result.status==='completed'){const ok=result.conclusion==='success';if(operation.kind==='tests.run')status=ok?'passed':'failed';else if(operation.kind==='deploy.rollback')status=ok?'rolled_back':'failed';else status=ok?'succeeded':'failed';}else status='running';
  }else if(operation.kind==='git.pull-request'){
    result=operation.execution?.number?await getOperationPullRequest(operation.execution.number):await findOperationPullRequest(operation.plan.sourceRef);if(!result)return operation;if(result.headSha&&clean(result.headSha).toLowerCase()!==clean(operation.plan.commitSha).toLowerCase())fail('Pull requestin head SHA muuttui hyväksytyn testituloksen jälkeen. Production-portti pysyy kiinni.','OPERATION_PR_HEAD_DRIFT',409,{currentSha:result.headSha,plannedSha:operation.plan.commitSha});status=result.merged?'merged':result.state==='closed'?'closed':'open';
  }else if(operation.kind==='repository.write'&&['executing','failed','drifted'].includes(operation.status)){
    result=await findOperationBranch(operation.plan.branchName);if(!result)return operation;result={...result,commitSha:result.sha};status='succeeded';
  }else return operation;
  return updateOperation(operation.id,item=>{item.status=status;item.execution={...(item.execution||{}),...(result||{}),refreshedAt:new Date().toISOString()};appendAudit(item,'operation.refreshed',actor,{status});return seal(item);},{workspaceId:workspace.id,expectedRevision});
}
