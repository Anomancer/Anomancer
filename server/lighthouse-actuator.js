import crypto from 'node:crypto';
import {createLighthouseOperationCommit,findOperationBranch,getLighthouseFile,getLighthouseRepositoryHead,githubOperationStatus,lighthouseGithubStatus} from './github.js';
import {safeEqual} from './auth.js';
import {MUTATION_PROPOSAL_FORMAT} from '../core/mutation/proposal.js';

export const MUTATION_APPROVAL_FORMAT='anomancer-mutation-approval/v1';
export const MUTATION_RECEIPT_FORMAT='anomancer-mutation-receipt/v1';

const MAX_FILES=4;
const MAX_FILE_BYTES=40_000;
const MAX_TOTAL_BYTES=120_000;
const TTL_MS=20*60*1000;
const SECRET_VALUE=/(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;
const DENIED_PATH=/(^|\/)(?:\.git|\.github|\.vercel|node_modules|scripts\/governance)(?:\/|$)|(^|\/)\.env(?:\.|$)|(^|\/)(?:id_rsa|id_ed25519|credentials?|secrets?)(?:\.|$)|^(?:vercel\.json|package\.json|package-lock\.json|server\/auth\.js|server\/github\.js|server\/lighthouse-actuator\.js|api\/lab\/mutation\.js|server\/operation-capabilities\.js|server\/operation-store\.js)$/i;

const clean=(value,max=1000)=>String(value??'').replace(/\u0000/g,'').trim().slice(0,max);
const b64=value=>Buffer.from(JSON.stringify(value),'utf8').toString('base64url');
const fromB64=value=>JSON.parse(Buffer.from(String(value),'base64url').toString('utf8'));
const sha=value=>crypto.createHash('sha256').update(typeof value==='string'?value:stable(value)).digest('hex');
function stable(value){
  if(Array.isArray(value))return`[${value.map(stable).join(',')}]`;
  if(value&&typeof value==='object')return`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function fail(message,code,statusCode=400,extra={}){throw Object.assign(new Error(message),{code,statusCode,...extra});}
function secret(){const value=String(process.env.ADMIN_SESSION_SECRET||'');if(value.length<32)fail('Mutation approval -allekirjoitus ei ole käytettävissä.','LIGHTHOUSE_MUTATION_SECRET',503);return value;}
function sessionHash(session){if(!session?.nonce)fail('Kirjautunut admin-istunto vaaditaan.','LIGHTHOUSE_MUTATION_AUTH',401);return sha(`session:${session.nonce}`);}
function sign(payload){const body=b64(payload),sig=crypto.createHmac('sha256',secret()).update(body).digest('base64url');return`${body}.${sig}`;}
function verify(token){
  const [body,sig]=String(token||'').split('.');
  if(!body||!sig)fail('Mutation approval token puuttuu.','LIGHTHOUSE_MUTATION_TOKEN',400);
  const expected=crypto.createHmac('sha256',secret()).update(body).digest('base64url');
  if(!safeEqual(sig,expected))fail('Mutation approval token ei kelpaa.','LIGHTHOUSE_MUTATION_TOKEN_INVALID',403);
  try{return fromB64(body);}catch{fail('Mutation approval token ei avaudu.','LIGHTHOUSE_MUTATION_TOKEN_INVALID',403);}
}
function safePath(value){
  const path=clean(value,500).replace(/\\/g,'/').replace(/^\.\//,'');
  if(!path||path.startsWith('/')||path.includes('..')||!/^[A-Za-z0-9._@+\/-]+$/.test(path)||DENIED_PATH.test(path))fail(`Mutation-polku ei ole sallittu: ${path||'tyhjä'}.`,'LIGHTHOUSE_MUTATION_PATH',409);
  return path;
}
function normalizeFiles(files=[]){
  if(!Array.isArray(files)||!files.length||files.length>MAX_FILES)fail(`Mutation tarvitsee 1–${MAX_FILES} tiedostoa.`,'LIGHTHOUSE_MUTATION_FILES');
  const out=[];let total=0;const seen=new Set();
  for(const item of files){
    const path=safePath(item?.path);if(seen.has(path))fail(`Sama tiedosto on ehdotuksessa kahdesti: ${path}.`,'LIGHTHOUSE_MUTATION_DUPLICATE');seen.add(path);
    const content=String(item?.content??'').replace(/\u0000/g,'');const bytes=Buffer.byteLength(content,'utf8');
    if(!content.trim())fail(`Mutation ei saa tyhjentää tiedostoa ${path}.`,'LIGHTHOUSE_MUTATION_DELETE_DENIED',409);
    if(bytes>MAX_FILE_BYTES)fail(`Tiedosto ${path} ylittää mutation-kokorajan.`,'LIGHTHOUSE_MUTATION_FILE_TOO_LARGE',413);
    if(SECRET_VALUE.test(content))fail(`Tiedosto ${path} näyttää sisältävän salaisuuden.`,'LIGHTHOUSE_MUTATION_SECRET_DETECTED',409);
    total+=bytes;if(total>MAX_TOTAL_BYTES)fail('Mutation ylittää kokonaiskokorajan.','LIGHTHOUSE_MUTATION_TOTAL_TOO_LARGE',413);
    out.push({path,content,bytes,rationale:clean(item?.rationale,1200)});
  }
  return out;
}
function diffPreview(before,after,path){
  const a=String(before??'').split(/\r?\n/),b=String(after??'').split(/\r?\n/);let prefix=0;
  while(prefix<a.length&&prefix<b.length&&a[prefix]===b[prefix])prefix++;
  let suffix=0;while(suffix<a.length-prefix&&suffix<b.length-prefix&&a[a.length-1-suffix]===b[b.length-1-suffix])suffix++;
  const aStart=Math.max(0,prefix-3),bStart=Math.max(0,prefix-3),aEnd=Math.min(a.length,a.length-suffix+3),bEnd=Math.min(b.length,b.length-suffix+3);
  const removed=a.slice(prefix,a.length-suffix),added=b.slice(prefix,b.length-suffix);
  const lines=[`--- a/${path}`,`+++ b/${path}`,`@@ -${aStart+1},${Math.max(1,aEnd-aStart)} +${bStart+1},${Math.max(1,bEnd-bStart)} @@`];
  for(const line of a.slice(aStart,prefix))lines.push(` ${line}`);
  for(const line of removed.slice(0,120))lines.push(`-${line}`);
  if(removed.length>120)lines.push(`-… ${removed.length-120} poistettua riviä rajattu esikatselusta …`);
  for(const line of added.slice(0,120))lines.push(`+${line}`);
  if(added.length>120)lines.push(`+… ${added.length-120} lisättyä riviä rajattu esikatselusta …`);
  const tailStart=Math.max(prefix,b.length-suffix);for(const line of b.slice(tailStart,Math.min(b.length,tailStart+3)))lines.push(` ${line}`);
  return {text:lines.join('\n').slice(0,24_000),additions:added.length,deletions:removed.length};
}
function approvalId(){return`mut-${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}`;}
function confirmationFor(id){return`HYVÄKSYN ${id.slice(-12).toUpperCase()}`;}

export function mutationRuntimeStatus(){
  const repository=githubOperationStatus(),lighthouse=lighthouseGithubStatus();
  return {format:'anomancer-mutation-runtime-status/v1',available:repository.configured&&repository.repoGuard?.allowed!==false&&String(process.env.ADMIN_SESSION_SECRET||'').length>=32,repository:{...repository,lighthouseRef:lighthouse.ref,lighthouseRefSource:lighthouse.refSource},defaultBranchWrite:false,operationBranchOnly:true,allowedBranchPattern:'anomancer/op-*'};
}

export async function sealLighthouseMutation(proposal,{session,adapters={}}={}){
  if(proposal?.format!==MUTATION_PROPOSAL_FORMAT)fail('Mutation proposal -formaatti ei kelpaa.','LIGHTHOUSE_MUTATION_FORMAT');
  const files=normalizeFiles(proposal.files);const sh=sessionHash(session);
  const head=await (adapters.getRepositoryHead||getLighthouseRepositoryHead)();
  const bound=[];
  for(const file of files){
    const current=await (adapters.getFile||getLighthouseFile)(file.path);
    if(!current?.sha)fail(`Tiedoston ${file.path} lähde-SHA puuttuu.`,'LIGHTHOUSE_MUTATION_SOURCE_SHA',409);
    const diff=diffPreview(current.content,file.content,file.path);
    if(!diff.additions&&!diff.deletions)continue;
    bound.push({...file,sourceSha:String(current.sha),beforeHash:sha(String(current.content||'')),afterHash:sha(file.content),diff:diff.text,additions:diff.additions,deletions:diff.deletions});
  }
  if(!bound.length)fail('Ehdotus ei muuta yhtään sallittua tiedostoa.','LIGHTHOUSE_MUTATION_NOOP',409);
  const id=approvalId(),branchName=`anomancer/op-lighthouse-${id.slice(-12).toLowerCase()}`;
  const normalized={format:MUTATION_PROPOSAL_FORMAT,summary:clean(proposal.summary,2400),risk:proposal.risk||'high',verification:Array.isArray(proposal.verification)?proposal.verification.slice(0,6):[],files:bound,totalBytes:bound.reduce((sum,item)=>sum+item.bytes,0),base:{repo:head.repo,branch:head.branch,ref:head.ref||head.branch,sha:head.sha},branchName};
  const proposalHash=sha(normalized),expiresAt=new Date(Date.now()+TTL_MS).toISOString();
  const payload={v:2,id,proposalHash,baseSha:head.sha,baseRef:normalized.base.ref,branchName,sessionHash:sh,exp:Date.now()+TTL_MS};
  return {proposal:normalized,approval:{format:MUTATION_APPROVAL_FORMAT,id,proposalHash,confirmationPhrase:confirmationFor(id),expiresAt,token:sign(payload),humanApprovalRequired:true,defaultBranchWrite:false,executionTarget:'isolated-operation-branch'}};
}

export async function executeLighthouseMutation({proposal,approval,confirmation,session,adapters={}}={}){
  const token=verify(approval?.token);const sh=sessionHash(session);
  if(token.v!==2)fail('Mutation approval on vanhaa ref-mallia. Tee uusi ehdotus.','LIGHTHOUSE_MUTATION_TOKEN_VERSION',409);
  if(token.sessionHash!==sh)fail('Hyväksyntä kuuluu eri istunnolle.','LIGHTHOUSE_MUTATION_SESSION',403);
  if(Number(token.exp)<=Date.now())fail('Mutation approval on vanhentunut. Tee uusi ehdotus.','LIGHTHOUSE_MUTATION_EXPIRED',409);
  if(clean(confirmation,200)!==clean(approval?.confirmationPhrase,200)||clean(confirmation,200)!==confirmationFor(token.id))fail('Kirjoitettu vahvistus ei vastaa mutation-ehdotusta.','LIGHTHOUSE_MUTATION_CONFIRMATION',409);
  const proposalHash=sha(proposal);
  if(proposalHash!==token.proposalHash||proposalHash!==approval?.proposalHash)fail('Mutation proposal muuttui hyväksynnän jälkeen.','LIGHTHOUSE_MUTATION_HASH_MISMATCH',409);
  const sourceByPath=new Map((Array.isArray(proposal?.files)?proposal.files:[]).map(item=>[String(item?.path||''),item]));
  const files=normalizeFiles(proposal?.files).map(file=>({...file,sourceSha:String(sourceByPath.get(file.path)?.sourceSha||'')}));
  if(token.baseSha!==proposal?.base?.sha||token.baseRef!==proposal?.base?.ref||token.branchName!==proposal?.branchName)fail('Mutation target muuttui hyväksynnän jälkeen.','LIGHTHOUSE_MUTATION_TARGET_MISMATCH',409);
  const head=await (adapters.getRepositoryHead||getLighthouseRepositoryHead)();
  if(head.sha!==proposal.base.sha)fail('Repositoryn pohjahaara muuttui ehdotuksen jälkeen. Tee uusi ehdotus.','LIGHTHOUSE_MUTATION_STALE_BASE',409,{currentSha:head.sha,plannedSha:proposal.base.sha});
  const existingBranch=await (adapters.findOperationBranch||findOperationBranch)(proposal.branchName);
  if(existingBranch)fail('Tämä hyväksyntä on jo käytetty tai operation-haara on jo olemassa.','LIGHTHOUSE_MUTATION_REPLAY',409);
  for(const file of files){
    const current=await (adapters.getFile||getLighthouseFile)(file.path);
    if(String(current?.sha||'')!==String(file.sourceSha||''))fail(`Tiedosto ${file.path} muuttui ehdotuksen jälkeen.`,'LIGHTHOUSE_MUTATION_SOURCE_CHANGED',409,{path:file.path});
  }
  const executedAt=new Date().toISOString();
  const execution=await (adapters.createOperationCommit||createLighthouseOperationCommit)({branchName:proposal.branchName,baseSha:proposal.base.sha,baseRef:proposal.base.ref,files:files.map(({path,content})=>({path,content})),message:`lighthouse: approved mutation ${token.id} ${proposalHash.slice(0,12)}`});
  if(execution.defaultBranchUnchanged!==true||execution.sourceBranchUnchanged===false)fail('Repository-ref invariantti ei varmistunut.','LIGHTHOUSE_MUTATION_DEFAULT_BRANCH_INVARIANT',500);
  const receipt={format:MUTATION_RECEIPT_FORMAT,id:token.id,proposalHash,approvedBy:sh.slice(0,16),executedAt,confirmationMatched:true,defaultBranchUnchanged:true,externalSideEffect:'operation-branch-created',execution:{repo:execution.repo,baseBranch:execution.baseBranch,baseRef:execution.baseRef||proposal.base.ref,baseSha:execution.baseSha,branch:execution.branch,commitSha:execution.commitSha,compareUrl:execution.compareUrl,branchUrl:execution.branchUrl}};
  return {...receipt,receiptHash:sha(receipt)};
}
