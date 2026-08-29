import { CORE_VERSION, digest } from './core-registry.js';
import { DEFAULT_WORKSPACE_ID, workspaceStorageScope } from './workspace-store.js';

export const OPERATION_STORE_FORMAT='anomancer-operation-store/v1';
export const OPERATION_FORMAT='anomancer-operation/v1';
const DEFAULT_TAG='anomancer-operation-state';
const DEFAULT_PATH='.anomancer/operation-history.json';
const HISTORY_LIMIT=80;
const CACHE_TTL_MS=3_000;
const clone=value=>JSON.parse(JSON.stringify(value));
const clean=value=>String(value??'').trim();
const caches=new Map(),memoryStates=new Map();

function workspaceKey(id){return clean(id)||DEFAULT_WORKSPACE_ID;}
function mode(){
  const forced=clean(process.env.ANOMANCER_OPERATION_STORE).toLowerCase();
  if(forced==='memory')return'memory';
  if(forced==='github-tag')return'github-tag';
  if(process.env.GITHUB_CONTENT_TOKEN&&process.env.GITHUB_REPO?.includes('/'))return'github-tag';
  return'unconfigured';
}
function cfg(workspaceId){
  const token=process.env.GITHUB_CONTENT_TOKEN,repo=process.env.GITHUB_REPO,branch=process.env.GITHUB_BRANCH||'master';
  if(!token||!repo?.includes('/'))throw Object.assign(new Error('Operation Store ei ole konfiguroitu.'),{statusCode:503,code:'OPERATION_STORE_UNCONFIGURED'});
  const scope=workspaceStorageScope(workspaceId,{baseTag:clean(process.env.ANOMANCER_OPERATION_TAG)||DEFAULT_TAG,basePath:clean(process.env.ANOMANCER_OPERATION_PATH)||DEFAULT_PATH});
  return{token,repo,branch,...scope};
}
export function operationStoreStatus(workspaceId=DEFAULT_WORKSPACE_ID){
  const id=workspaceKey(workspaceId),selected=mode(),base={format:OPERATION_STORE_FORMAT,coreVersion:CORE_VERSION,workspaceId:id,mode:selected,durable:selected==='github-tag',serverAuthoritative:true,publicBranchWrite:false,secretsExposed:false,historyLimit:HISTORY_LIMIT};
  if(selected==='github-tag'){const c=cfg(id);return{...base,configured:true,ref:`refs/tags/${c.tag}`,path:c.path};}
  return{...base,configured:selected==='memory'};
}
function defaultState(workspaceId){return{format:OPERATION_STORE_FORMAT,coreVersion:CORE_VERSION,workspaceId:workspaceKey(workspaceId),revision:0,updatedAt:'',chainHead:'GENESIS',operations:[]};}
function normalizeAudit(items=[]){return(Array.isArray(items)?items:[]).slice(-120).map((item,index)=>({sequence:index+1,event:clean(item?.event).slice(0,100),at:clean(item?.at),actor:clean(item?.actor).slice(0,80),detail:item?.detail&&typeof item.detail==='object'?clone(item.detail):{},previousHash:clean(item?.previousHash)||'GENESIS',auditHash:clean(item?.auditHash)}));}
function normalizeOperation(raw={},workspaceId){
  const operation={format:OPERATION_FORMAT,coreVersion:CORE_VERSION,workspaceId:workspaceKey(workspaceId),id:clean(raw.id).slice(0,120),kind:clean(raw.kind).slice(0,80),capabilityId:clean(raw.capabilityId).slice(0,120),risk:['low','medium','high','critical'].includes(raw.risk)?raw.risk:'high',status:clean(raw.status).slice(0,40)||'planned',revision:Math.max(0,Number(raw.revision)||0),createdAt:clean(raw.createdAt),updatedAt:clean(raw.updatedAt),expiresAt:clean(raw.expiresAt),confirmationPhrase:clean(raw.confirmationPhrase).slice(0,160),plan:raw.plan&&typeof raw.plan==='object'?clone(raw.plan):{},approval:raw.approval&&typeof raw.approval==='object'?clone(raw.approval):{status:'pending'},execution:raw.execution&&typeof raw.execution==='object'?clone(raw.execution):null,audit:normalizeAudit(raw.audit),operationHash:clean(raw.operationHash)};
  if(!operation.operationHash){const hashable=clone(operation);delete hashable.operationHash;operation.operationHash=digest(hashable);}
  return operation;
}
function normalizeState(raw={},workspaceId){
  const id=workspaceKey(workspaceId),operations=(Array.isArray(raw.operations)?raw.operations:[]).map(item=>normalizeOperation(item,id)).filter(item=>item.id).slice(-HISTORY_LIMIT);
  return{format:OPERATION_STORE_FORMAT,coreVersion:CORE_VERSION,workspaceId:id,revision:Math.max(0,Number(raw.revision)||0),updatedAt:clean(raw.updatedAt),chainHead:clean(raw.chainHead)||'GENESIS',operations};
}
async function gh(workspaceId,path,options={}){
  const{token}=cfg(workspaceId),response=await fetch(`https://api.github.com${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'anomancer-operation-store-v1.18.6',...(options.headers||{})}}),text=await response.text();
  let data=null;try{data=text?JSON.parse(text):null;}catch{data={message:text};}
  if(!response.ok)throw Object.assign(new Error(data?.message||`GitHub ${response.status}`),{statusCode:response.status===404?404:(response.status===409||response.status===422?409:502),code:`OPERATION_STORE_GITHUB_${response.status}`,githubStatus:response.status});
  return data;
}
async function tagRef(workspaceId){const{repo,tag}=cfg(workspaceId);try{return clean((await gh(workspaceId,`/repos/${repo}/git/ref/tags/${encodeURIComponent(tag)}`))?.object?.sha)||null;}catch(error){if(error.statusCode===404)return null;throw error;}}
async function readTag(workspaceId){const{repo,tag,path}=cfg(workspaceId);try{const data=await gh(workspaceId,`/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(tag)}`);return normalizeState(JSON.parse(Buffer.from(String(data?.content||'').replace(/\n/g,''),'base64').toString('utf8')),workspaceId);}catch(error){if(error.statusCode===404)return defaultState(workspaceId);throw error;}}
async function branchHead(workspaceId){const{repo,branch}=cfg(workspaceId);return clean((await gh(workspaceId,`/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`))?.object?.sha);}
async function commitTree(workspaceId,sha){const{repo}=cfg(workspaceId);return clean((await gh(workspaceId,`/repos/${repo}/git/commits/${sha}`))?.tree?.sha);}
async function writeState(workspaceId,state,{parentSha,create=false}={}){
  const{repo,tag,path}=cfg(workspaceId),baseTree=await commitTree(workspaceId,parentSha),blob=await gh(workspaceId,`/repos/${repo}/git/blobs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:`${JSON.stringify(state,null,2)}\n`,encoding:'utf-8'})}),tree=await gh(workspaceId,`/repos/${repo}/git/trees`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base_tree:baseTree,tree:[{path,mode:'100644',type:'blob',sha:blob.sha}]})}),commit=await gh(workspaceId,`/repos/${repo}/git/commits`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`operation audit (${workspaceKey(workspaceId)}): revision ${state.revision}`,tree:tree.sha,parents:[parentSha]})});
  if(create)await gh(workspaceId,`/repos/${repo}/git/refs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:`refs/tags/${tag}`,sha:commit.sha})});
  else await gh(workspaceId,`/repos/${repo}/git/refs/tags/${encodeURIComponent(tag)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:commit.sha,force:false})});
  return commit.sha;
}
export async function loadOperationState({force=false,workspaceId=DEFAULT_WORKSPACE_ID}={}){
  const id=workspaceKey(workspaceId),selected=mode();
  if(selected==='memory'){if(!memoryStates.has(id))memoryStates.set(id,defaultState(id));return clone(memoryStates.get(id));}
  if(selected==='unconfigured')throw Object.assign(new Error('Operation Store ei ole konfiguroitu.'),{statusCode:503,code:'OPERATION_STORE_UNCONFIGURED'});
  const cached=caches.get(id);if(!force&&cached&&cached.expiresAt>Date.now())return clone(cached.state);
  const ref=await tagRef(id),state=ref?await readTag(id):defaultState(id);caches.set(id,{state:normalizeState(state,id),refSha:ref,expiresAt:Date.now()+CACHE_TTL_MS});return clone(caches.get(id).state);
}
async function mutate(workspaceId,transform){
  const id=workspaceKey(workspaceId),selected=mode();
  if(selected==='memory'){const current=await loadOperationState({force:true,workspaceId:id}),next=normalizeState(transform(clone(current)),id);next.revision=current.revision+1;next.updatedAt=new Date().toISOString();memoryStates.set(id,next);return clone(next);}
  if(selected==='unconfigured')throw Object.assign(new Error('Operation Store ei ole konfiguroitu.'),{statusCode:503,code:'OPERATION_STORE_UNCONFIGURED'});
  for(let attempt=0;attempt<3;attempt++){
    caches.delete(id);const current=await loadOperationState({force:true,workspaceId:id}),ref=caches.get(id)?.refSha||await tagRef(id),next=normalizeState(transform(clone(current)),id);next.revision=current.revision+1;next.updatedAt=new Date().toISOString();
    try{const sha=await writeState(id,next,{parentSha:ref||await branchHead(id),create:!ref});caches.set(id,{state:next,refSha:sha,expiresAt:Date.now()+CACHE_TTL_MS});return clone(next);}catch(error){if(error.statusCode===409&&attempt<2)continue;throw error;}
  }
  throw Object.assign(new Error('Operation Storen rinnakkaisuuskonflikti.'),{statusCode:409,code:'OPERATION_STORE_WRITE_CONFLICT'});
}
export async function listOperations({workspaceId=DEFAULT_WORKSPACE_ID,limit=30}={}){const state=await loadOperationState({workspaceId});return{state:{format:state.format,coreVersion:state.coreVersion,workspaceId:state.workspaceId,revision:state.revision,updatedAt:state.updatedAt,chainHead:state.chainHead},operations:state.operations.slice(-Math.max(1,Math.min(80,Number(limit)||30))).reverse(),store:operationStoreStatus(workspaceId)};}
export async function getOperation(id,{workspaceId=DEFAULT_WORKSPACE_ID,force=false}={}){const state=await loadOperationState({workspaceId,force});return clone(state.operations.find(item=>item.id===clean(id))||null);}
export async function createOperation(operation,{workspaceId=DEFAULT_WORKSPACE_ID}={}){
  const id=workspaceKey(workspaceId),normalized=normalizeOperation(operation,id);if(!normalized.id)throw Object.assign(new Error('Operation id puuttuu.'),{statusCode:400,code:'OPERATION_ID_REQUIRED'});
  const state=await mutate(id,current=>{if(current.operations.some(item=>item.id===normalized.id))throw Object.assign(new Error('Operation on jo olemassa.'),{statusCode:409,code:'OPERATION_EXISTS'});current.operations.push(normalized);return current;});
  return clone(state.operations.find(item=>item.id===normalized.id));
}
export async function updateOperation(id,transform,{workspaceId=DEFAULT_WORKSPACE_ID,expectedRevision=null}={}){
  const key=clean(id),workspace=workspaceKey(workspaceId);let result=null;
  await mutate(workspace,current=>{const index=current.operations.findIndex(item=>item.id===key);if(index<0)throw Object.assign(new Error('Operationia ei löytynyt.'),{statusCode:404,code:'OPERATION_NOT_FOUND'});const existing=current.operations[index];if(expectedRevision!==null&&Number(expectedRevision)!==existing.revision)throw Object.assign(new Error('Operation muuttui toisessa istunnossa.'),{statusCode:409,code:'OPERATION_REVISION_CONFLICT'});const changed=transform(clone(existing));changed.revision=existing.revision+1;changed.updatedAt=new Date().toISOString();const normalized=normalizeOperation(changed,workspace);current.operations[index]=normalized;current.chainHead=normalized.audit.at(-1)?.auditHash||current.chainHead;result=normalized;return current;});
  return clone(result);
}
export function __resetOperationStoreForTests(){caches.clear();memoryStates.clear();}
