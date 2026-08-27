import crypto from 'node:crypto';
import { CORE_VERSION, digest } from './core-registry.js';
import { DEFAULT_WORKSPACE_ID } from './workspace-store.js';

export const ARCHIVE_STORE_FORMAT='anomancer-archive-store/v1';
export const ARCHIVE_OBJECT_FORMAT='anomancer-archive-object/v1';
export const CONTEXT_RECEIPT_FORMAT='anomancer-context-receipt/v1';
export const ARCHIVE_TOMBSTONE_FORMAT='anomancer-archive-tombstone/v1';

const DEFAULT_TAG='anomancer-archive-state';
const DEFAULT_PATH='.anomancer/archive.json';
const CACHE_TTL_MS=3_000;
const MAX_OBJECTS=1_000;
const MAX_RECEIPTS=500;
const MAX_TOMBSTONES=500;
const MAX_CONTENT_CHARS=200_000;
const TYPES=new Set(['project','artifact','run','source','dataset','decision','note','snapshot','report','context-receipt']);
const STATUSES=new Set(['approved','historical','superseded']);
const RETENTION=new Set(['keep','review','temporary']);
const clone=v=>JSON.parse(JSON.stringify(v));
const clean=v=>String(v??'').trim();
let cache=null,memoryState=null;

function safeId(v=''){return clean(v).toLowerCase().replace(/[^a-z0-9._:-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);}
function safeWorkspace(v=''){return safeId(v)||DEFAULT_WORKSPACE_ID;}
function uniqueStrings(items=[],max=64){return [...new Set((Array.isArray(items)?items:[]).map(clean).filter(Boolean))].slice(0,max);}
function now(){return new Date().toISOString();}
function objectId(type='artifact'){return `arc-${safeId(type)||'object'}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;}
function receiptId(){return `ctx-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;}
function tombstoneId(){return `del-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;}
function normalizeRelations(items=[]){
  const out=[];
  for(const raw of Array.isArray(items)?items:[]){
    const targetId=safeId(typeof raw==='string'?raw:raw?.targetId);
    if(!targetId)continue;
    out.push({targetId,type:safeId(raw?.type||'related').slice(0,40)||'related',label:clean(raw?.label).slice(0,120)});
  }
  return out.slice(0,128);
}
function normalizeContent(input={}){
  const raw=input&&typeof input==='object'?input:{text:String(input??'')};
  const text=clean(raw.text).slice(0,MAX_CONTENT_CHARS);
  let jsonValue=null;
  if(raw.json!==undefined){
    try{
      const encoded=JSON.stringify(raw.json);
      if(encoded.length>MAX_CONTENT_CHARS)throw new Error('Archive JSON liian suuri.');
      jsonValue=JSON.parse(encoded);
    }catch(error){if(error?.message==='Archive JSON liian suuri.')throw error;}
  }
  return {text,json:jsonValue};
}
function normalizeVisibility(raw={},workspaceId=DEFAULT_WORKSPACE_ID){
  const owner=safeWorkspace(workspaceId);
  const requested=uniqueStrings(raw?.workspaceIds).map(safeWorkspace).filter(Boolean);
  const workspaceIds=[...new Set([owner,...requested])].slice(0,64);
  return {scope:workspaceIds.length>1?'granted':'workspace',workspaceIds};
}
function normalizeProvenance(raw={}){
  return {
    createdBy:clean(raw.createdBy||'human').slice(0,80)||'human',
    sourceRunId:safeId(raw.sourceRunId),
    agentId:safeId(raw.agentId),
    model:clean(raw.model).slice(0,160),
    artifactId:safeId(raw.artifactId),
    sourceObjectId:safeId(raw.sourceObjectId),
    importedFrom:clean(raw.importedFrom).slice(0,300)
  };
}
function normalizeRetention(raw={}){const policy=RETENTION.has(raw?.policy)?raw.policy:'keep';return{policy,reviewAfter:clean(raw?.reviewAfter).slice(0,40)};}
function hashableObject(object){const copy=clone(object);delete copy.coreVersion;delete copy.updatedAt;delete copy.integrity;return copy;}
export function normalizeArchiveObject(input={},previous=null){
  const type=TYPES.has(clean(input.type))?clean(input.type):(previous?.type||'artifact');
  const workspaceId=safeWorkspace(input.workspaceId||previous?.workspaceId);
  const content=normalizeContent(input.content??previous?.content??{});
  const createdAt=clean(previous?.createdAt||input.createdAt)||now();
  const object={
    format:ARCHIVE_OBJECT_FORMAT,coreVersion:CORE_VERSION,id:safeId(input.id||previous?.id)||objectId(type),type,
    title:clean(input.title||previous?.title).slice(0,180)||'Nimetön arkisto-objekti',
    summary:clean(input.summary??previous?.summary).slice(0,1200),workspaceId,
    projectId:safeId(input.projectId??previous?.projectId),status:STATUSES.has(input.status)?input.status:(previous?.status||'approved'),
    source:{kind:safeId((input.source?.kind??previous?.source?.kind)||'manual').slice(0,40)||'manual',id:safeId(input.source?.id??previous?.source?.id),label:clean(input.source?.label??previous?.source?.label).slice(0,180),url:clean(input.source?.url??previous?.source?.url).slice(0,500)},
    provenance:normalizeProvenance(input.provenance??previous?.provenance??{}),
    tags:uniqueStrings(input.tags??previous?.tags,64).map(x=>x.slice(0,80)),relations:normalizeRelations(input.relations??previous?.relations),
    retention:normalizeRetention(input.retention??previous?.retention),visibility:normalizeVisibility(input.visibility??previous?.visibility,workspaceId),
    content,createdAt,updatedAt:clean(input.updatedAt||previous?.updatedAt)||now(),
    integrity:{algorithm:'sha256',contentHash:digest(content),objectHash:''}
  };
  object.integrity.objectHash=digest(hashableObject(object));
  return object;
}
function normalizeReceipt(raw={}){
  const workspaceId=safeWorkspace(raw.workspaceId);
  const used=(Array.isArray(raw.used)?raw.used:[]).map(item=>({id:safeId(item.id),title:clean(item.title).slice(0,180),type:safeId(item.type),objectHash:clean(item.objectHash).slice(0,64)})).filter(x=>x.id).slice(0,200);
  const notAccessed=(Array.isArray(raw.notAccessed)?raw.notAccessed:[]).map(item=>({id:safeId(item.id),reason:safeId(item.reason||'not-used').slice(0,40)})).filter(x=>x.id).slice(0,200);
  const receipt={format:CONTEXT_RECEIPT_FORMAT,coreVersion:CORE_VERSION,id:safeId(raw.id)||receiptId(),workspaceId,runId:safeId(raw.runId),purpose:clean(raw.purpose).slice(0,500),query:clean(raw.query).slice(0,500),used,notAccessed,createdAt:clean(raw.createdAt)||now(),integrity:{algorithm:'sha256',receiptHash:''}};
  const h=clone(receipt);delete h.coreVersion;delete h.integrity;receipt.integrity.receiptHash=digest(h);return receipt;
}
function normalizeTombstone(raw={}){const t={format:ARCHIVE_TOMBSTONE_FORMAT,coreVersion:CORE_VERSION,id:safeId(raw.id)||tombstoneId(),objectId:safeId(raw.objectId),workspaceId:safeWorkspace(raw.workspaceId),title:clean(raw.title).slice(0,180),objectHash:clean(raw.objectHash).slice(0,64),deletedAt:clean(raw.deletedAt)||now(),deletedBy:clean(raw.deletedBy||'human').slice(0,80)};return t;}
function defaultState(){return{format:ARCHIVE_STORE_FORMAT,coreVersion:CORE_VERSION,revision:0,updatedAt:'',objects:[],receipts:[],tombstones:[]};}
function normalizeState(raw={}){
  const seen=new Set(),objects=[];
  for(const item of Array.isArray(raw.objects)?raw.objects:[]){const normalized=normalizeArchiveObject(item,item);if(!normalized.id||seen.has(normalized.id))continue;seen.add(normalized.id);objects.push(normalized);}
  return {format:ARCHIVE_STORE_FORMAT,coreVersion:CORE_VERSION,revision:Math.max(0,Number(raw.revision)||0),updatedAt:clean(raw.updatedAt),objects:objects.slice(-MAX_OBJECTS),receipts:(Array.isArray(raw.receipts)?raw.receipts:[]).map(normalizeReceipt).slice(-MAX_RECEIPTS),tombstones:(Array.isArray(raw.tombstones)?raw.tombstones:[]).map(normalizeTombstone).slice(-MAX_TOMBSTONES)};
}
function mode(){const forced=clean(process.env.ANOMANCER_ARCHIVE_STORE).toLowerCase();if(forced==='memory')return'memory';if(forced==='github-tag')return'github-tag';if(process.env.GITHUB_CONTENT_TOKEN&&process.env.GITHUB_REPO?.includes('/'))return'github-tag';return'unconfigured';}
function cfg(){const token=process.env.GITHUB_CONTENT_TOKEN,repo=process.env.GITHUB_REPO,branch=process.env.GITHUB_BRANCH||'master';if(!token||!repo?.includes('/'))throw Object.assign(new Error('Archive Store ei ole konfiguroitu.'),{statusCode:503,code:'ARCHIVE_STORE_UNCONFIGURED'});return{token,repo,branch,tag:clean(process.env.ANOMANCER_ARCHIVE_TAG)||DEFAULT_TAG,path:clean(process.env.ANOMANCER_ARCHIVE_PATH)||DEFAULT_PATH};}
export function archiveStoreStatus(){const m=mode(),base={format:ARCHIVE_STORE_FORMAT,coreVersion:CORE_VERSION,mode:m,durable:m==='github-tag',serverAuthoritative:true,secretsExposed:false,maxObjects:MAX_OBJECTS,maxReceipts:MAX_RECEIPTS,automaticModelMemory:false,requiresContextGrant:true};if(m==='github-tag'){const c=cfg();return{...base,configured:true,ref:`refs/tags/${c.tag}`,path:c.path};}return{...base,configured:m==='memory'};}
async function gh(path,options={}){const{token}=cfg();const response=await fetch(`https://api.github.com${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'anomancer-archive-core-v1.17.1',...(options.headers||{})}});const text=await response.text();let data=null;try{data=text?JSON.parse(text):null;}catch{data={message:text};}if(!response.ok)throw Object.assign(new Error(data?.message||`GitHub ${response.status}`),{statusCode:response.status===404?404:(response.status===409||response.status===422?409:502),code:`ARCHIVE_GITHUB_${response.status}`,githubStatus:response.status,details:data});return data;}
async function tagRef(){const{repo,tag}=cfg();try{return clean((await gh(`/repos/${repo}/git/ref/tags/${encodeURIComponent(tag)}`))?.object?.sha)||null;}catch(error){if(error.statusCode===404)return null;throw error;}}
async function readTag(){const{repo,tag,path}=cfg();try{const data=await gh(`/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(tag)}`);return normalizeState(JSON.parse(Buffer.from(String(data?.content||'').replace(/\n/g,''),'base64').toString('utf8')));}catch(error){if(error.statusCode===404)return defaultState();throw error;}}
async function branchHead(){const{repo,branch}=cfg();return clean((await gh(`/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`))?.object?.sha);}
async function commitTree(sha){const{repo}=cfg();return clean((await gh(`/repos/${repo}/git/commits/${sha}`))?.tree?.sha);}
async function writeState(state,{parentSha,create=false}={}){const{repo,tag,path}=cfg(),base=await commitTree(parentSha);const blob=await gh(`/repos/${repo}/git/blobs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:`${JSON.stringify(state,null,2)}\n`,encoding:'utf-8'})});const tree=await gh(`/repos/${repo}/git/trees`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base_tree:base,tree:[{path,mode:'100644',type:'blob',sha:blob.sha}]})});const commit=await gh(`/repos/${repo}/git/commits`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`archive core: revision ${state.revision}`,tree:tree.sha,parents:[parentSha]})});if(create)await gh(`/repos/${repo}/git/refs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:`refs/tags/${tag}`,sha:commit.sha})});else await gh(`/repos/${repo}/git/refs/tags/${encodeURIComponent(tag)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:commit.sha,force:false})});return commit.sha;}
export async function loadArchiveState({force=false}={}){const m=mode();if(m==='memory'){if(!memoryState)memoryState=defaultState();return clone(memoryState);}if(m==='unconfigured')throw Object.assign(new Error('Archive Store ei ole konfiguroitu.'),{statusCode:503,code:'ARCHIVE_STORE_UNCONFIGURED'});if(!force&&cache&&cache.expiresAt>Date.now())return clone(cache.state);const ref=await tagRef(),state=ref?await readTag():defaultState();cache={state:normalizeState(state),refSha:ref,expiresAt:Date.now()+CACHE_TTL_MS};return clone(cache.state);}
async function mutate(fn,{expectedRevision=null}={}){const m=mode();if(m==='memory'){const current=await loadArchiveState({force:true});if(expectedRevision!==null&&Number(expectedRevision)!==current.revision)throw Object.assign(new Error('Arkisto muuttui toisessa istunnossa.'),{statusCode:409,code:'ARCHIVE_REVISION_CONFLICT'});const draft=normalizeState(await fn(clone(current))||current);draft.revision=current.revision+1;draft.updatedAt=now();memoryState=draft;return clone(draft);}if(m==='unconfigured')throw Object.assign(new Error('Archive Store ei ole konfiguroitu.'),{statusCode:503,code:'ARCHIVE_STORE_UNCONFIGURED'});for(let attempt=0;attempt<3;attempt++){cache=null;const current=await loadArchiveState({force:true}),ref=cache?.refSha||await tagRef();if(expectedRevision!==null&&Number(expectedRevision)!==current.revision)throw Object.assign(new Error('Arkisto muuttui toisessa istunnossa.'),{statusCode:409,code:'ARCHIVE_REVISION_CONFLICT'});const draft=normalizeState(await fn(clone(current))||current);draft.revision=current.revision+1;draft.updatedAt=now();try{await writeState(draft,{parentSha:ref||await branchHead(),create:!ref});cache={state:draft,refSha:null,expiresAt:Date.now()+CACHE_TTL_MS};return clone(draft);}catch(error){if(error.statusCode===409&&attempt<2)continue;throw error;}}throw Object.assign(new Error('Archive Storen rinnakkaisuuskonflikti.'),{statusCode:409,code:'ARCHIVE_WRITE_CONFLICT'});}
export function canWorkspaceReadArchiveObject(object,workspaceId){const id=safeWorkspace(workspaceId);return Boolean(object&&Array.isArray(object.visibility?.workspaceIds)&&object.visibility.workspaceIds.includes(id));}
export async function putArchiveObject(input={},options={}){if(options.humanApproved!==true)throw Object.assign(new Error('Arkistointi vaatii ihmisen hyväksynnän.'),{statusCode:409,code:'ARCHIVE_HUMAN_APPROVAL_REQUIRED'});let saved=null;const state=await mutate(current=>{const requested=safeId(input.id),index=requested?current.objects.findIndex(x=>x.id===requested):-1,previous=index>=0?current.objects[index]:null;if(previous&&previous.workspaceId!==safeWorkspace(input.workspaceId||previous.workspaceId))throw Object.assign(new Error('Archive Objectin omistavaa työtilaa ei voi vaihtaa.'),{statusCode:409,code:'ARCHIVE_WORKSPACE_IMMUTABLE'});saved=normalizeArchiveObject({...input,updatedAt:now()},previous);if(index>=0)current.objects[index]=saved;else{if(current.objects.length>=MAX_OBJECTS)throw Object.assign(new Error('Arkiston objektiraja tuli vastaan.'),{statusCode:409,code:'ARCHIVE_LIMIT'});current.objects.push(saved);}return current;},{expectedRevision:options.expectedRevision??null});return{object:clone(saved),state};}
export async function grantArchiveAccess(objectId,workspaceIds=[],options={}){if(options.humanApproved!==true)throw Object.assign(new Error('Arkiston käyttöoikeuden laajennus vaatii ihmisen hyväksynnän.'),{statusCode:409,code:'ARCHIVE_GRANT_APPROVAL_REQUIRED'});let saved=null;const state=await mutate(current=>{const index=current.objects.findIndex(x=>x.id===safeId(objectId));if(index<0)throw Object.assign(new Error('Archive Objectia ei löytynyt.'),{statusCode:404,code:'ARCHIVE_OBJECT_NOT_FOUND'});const existing=current.objects[index],visibility=normalizeVisibility({workspaceIds:[...existing.visibility.workspaceIds,...workspaceIds]},existing.workspaceId);saved=normalizeArchiveObject({...existing,visibility,updatedAt:now()},existing);current.objects[index]=saved;return current;},{expectedRevision:options.expectedRevision??null});return{object:clone(saved),state};}
export async function removeArchiveObject(objectId,options={}){if(options.humanApproved!==true)throw Object.assign(new Error('Arkisto-objektin poisto vaatii ihmisen hyväksynnän.'),{statusCode:409,code:'ARCHIVE_DELETE_APPROVAL_REQUIRED'});let removed=null,tombstone=null;const state=await mutate(current=>{const index=current.objects.findIndex(x=>x.id===safeId(objectId));if(index<0)throw Object.assign(new Error('Archive Objectia ei löytynyt.'),{statusCode:404,code:'ARCHIVE_OBJECT_NOT_FOUND'});removed=current.objects[index];current.objects.splice(index,1);tombstone=normalizeTombstone({objectId:removed.id,workspaceId:removed.workspaceId,title:removed.title,objectHash:removed.integrity?.objectHash,deletedBy:options.deletedBy||'human'});current.tombstones.push(tombstone);return current;},{expectedRevision:options.expectedRevision??null});return{removed:clone(removed),tombstone:clone(tombstone),state};}
export async function getArchiveObject(id,{humanView=false,workspaceId=DEFAULT_WORKSPACE_ID}={}){const state=await loadArchiveState(),object=state.objects.find(x=>x.id===safeId(id));if(!object)return null;if(!humanView&&!canWorkspaceReadArchiveObject(object,workspaceId))return null;return clone(object);}
export async function searchArchive({q='',type='',workspaceId='',status='',limit=100,humanView=false,requesterWorkspaceId=DEFAULT_WORKSPACE_ID}={}){const state=await loadArchiveState(),needle=clean(q).toLowerCase(),wantedType=clean(type),wantedWorkspace=safeId(workspaceId),wantedStatus=clean(status);let rows=[...state.objects].reverse();if(!humanView)rows=rows.filter(x=>canWorkspaceReadArchiveObject(x,requesterWorkspaceId));if(wantedType)rows=rows.filter(x=>x.type===wantedType);if(wantedWorkspace)rows=rows.filter(x=>x.workspaceId===wantedWorkspace);if(wantedStatus)rows=rows.filter(x=>x.status===wantedStatus);if(needle)rows=rows.filter(x=>[x.title,x.summary,x.workspaceId,x.projectId,x.type,...(x.tags||[]),x.content?.text].some(v=>String(v||'').toLowerCase().includes(needle)));return{revision:state.revision,updatedAt:state.updatedAt,total:rows.length,objects:rows.slice(0,Math.max(1,Math.min(250,Number(limit)||100))).map(clone),receipts:humanView?state.receipts.slice(-100).reverse().map(clone):[],tombstoneCount:state.tombstones.length,store:archiveStoreStatus()};}
export async function queryArchiveContext({workspaceId=DEFAULT_WORKSPACE_ID,q='',objectIds=[],limit=24}={}){const wid=safeWorkspace(workspaceId),state=await loadArchiveState(),requested=new Set(uniqueStrings(objectIds,200).map(safeId)),needle=clean(q).toLowerCase();let candidates=state.objects.filter(x=>canWorkspaceReadArchiveObject(x,wid));if(requested.size)candidates=candidates.filter(x=>requested.has(x.id));if(needle)candidates=candidates.filter(x=>[x.title,x.summary,x.type,x.projectId,...(x.tags||[]),x.content?.text].some(v=>String(v||'').toLowerCase().includes(needle)));const selected=candidates.slice(0,Math.max(1,Math.min(100,Number(limit)||24))).map(clone),usedIds=new Set(selected.map(x=>x.id)),notAccessed=[...requested].filter(id=>!usedIds.has(id)).map(id=>({id,reason:state.objects.some(x=>x.id===id)?'not-granted':'not-found'}));return{workspaceId:wid,query:clean(q),objects:selected,notAccessed};}
export async function createContextReceipt({workspaceId=DEFAULT_WORKSPACE_ID,runId='',purpose='',query='',objectIds=[]}={},options={}){const context=await queryArchiveContext({workspaceId,q:query,objectIds,limit:Math.max(1,objectIds.length||24)});const receipt=normalizeReceipt({workspaceId,runId,purpose,query,used:context.objects.map(x=>({id:x.id,title:x.title,type:x.type,objectHash:x.integrity?.objectHash})),notAccessed:context.notAccessed});let saved=null;const state=await mutate(current=>{saved=receipt;current.receipts.push(saved);return current;},{expectedRevision:options.expectedRevision??null});return{receipt:clone(saved),context,state};}
export function verifyArchiveObjectIntegrity(object){if(!object?.integrity?.objectHash)return false;const normalized=normalizeArchiveObject(object,object);return normalized.integrity.contentHash===object.integrity.contentHash&&normalized.integrity.objectHash===object.integrity.objectHash;}
export function __resetArchiveStoreForTests(){cache=null;memoryState=null;}
