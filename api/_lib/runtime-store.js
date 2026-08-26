import crypto from 'node:crypto';
import { AGENT_RUNTIME_FORMAT, CORE_VERSION, normalizeAgentRuntime, normalizeAgentRuntimeMap, listAgentIds, validateOrchestraDefinition, getOrchestra } from './core-registry.js';
import { getAvailableOrchestra } from './orchestra-store.js';

export const RUNTIME_STORE_FORMAT='anomancer-runtime-store/v2';
export const RUNTIME_SNAPSHOT_FORMAT='anomancer-runtime-snapshot/v2';
const DEFAULT_TAG='anomancer-runtime-state';
const DEFAULT_PATH='.anomancer/runtime-profiles.json';
const CACHE_TTL_MS=5_000;
const SNAPSHOT_TTL_SECONDS=60*60*12;
const clone=value=>JSON.parse(JSON.stringify(value));
const clean=value=>String(value??'').trim();
let cache=null;
let memoryState=null;

function b64url(input){return Buffer.from(input).toString('base64url');}
function fromB64url(input){return Buffer.from(String(input),'base64url').toString('utf8');}
function safeEqual(a,b){const aa=Buffer.from(String(a)),bb=Buffer.from(String(b));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}

function configuredMode(){
  const forced=clean(process.env.ANOMANCER_RUNTIME_STORE).toLowerCase();
  if(forced==='memory')return 'memory';
  if(forced==='github-tag')return 'github-tag';
  if(process.env.GITHUB_CONTENT_TOKEN&&process.env.GITHUB_REPO?.includes('/'))return 'github-tag';
  return 'unconfigured';
}
function githubConfig(){
  const token=process.env.GITHUB_CONTENT_TOKEN,repo=process.env.GITHUB_REPO,branch=process.env.GITHUB_BRANCH||'master';
  if(!token||!repo?.includes('/'))throw Object.assign(new Error('Server-side Runtime Profile -tallennus ei ole konfiguroitu.'),{statusCode:503,code:'RUNTIME_STORE_UNCONFIGURED'});
  return {token,repo,branch,tag:clean(process.env.ANOMANCER_RUNTIME_TAG)||DEFAULT_TAG,path:clean(process.env.ANOMANCER_RUNTIME_PATH)||DEFAULT_PATH};
}
export function runtimeStoreStatus(){
  const mode=configuredMode();
  const base={format:RUNTIME_STORE_FORMAT,coreVersion:CORE_VERSION,mode,durable:mode==='github-tag',serverAuthoritative:true,secretsExposed:false};
  if(mode==='github-tag'){const tag=clean(process.env.ANOMANCER_RUNTIME_TAG)||DEFAULT_TAG,path=clean(process.env.ANOMANCER_RUNTIME_PATH)||DEFAULT_PATH;return {...base,configured:Boolean(process.env.GITHUB_CONTENT_TOKEN&&process.env.GITHUB_REPO?.includes('/')),ref:`refs/tags/${tag}`,path};}
  return {...base,configured:mode==='memory'};
}

function defaultProfiles(){return normalizeAgentRuntimeMap({});}
function strictProfiles(input={}){const source=input&&typeof input==='object'?input:{};return Object.fromEntries(listAgentIds().map(id=>{const fallback=normalizeAgentRuntime(id,{}),raw=source[id]||{};return [id,raw.contractHash===fallback.contractHash?normalizeAgentRuntime(id,raw):fallback];}));}
function defaultState(){return {format:RUNTIME_STORE_FORMAT,coreVersion:CORE_VERSION,revision:0,updatedAt:'',profiles:defaultProfiles()};}
function normalizeState(input={}){
  return {format:RUNTIME_STORE_FORMAT,coreVersion:CORE_VERSION,revision:Math.max(0,Number(input.revision)||0),updatedAt:clean(input.updatedAt),profiles:strictProfiles(input.profiles||{})};
}

async function gh(path,options={}){
  const {token}=githubConfig();
  const response=await fetch(`https://api.github.com${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'anomancer-core-runtime-v15.8',...(options.headers||{})}});
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null;}catch{data={message:text};}
  if(!response.ok){const error=Object.assign(new Error(data?.message||`GitHub ${response.status}`),{statusCode:response.status===404?404:(response.status===409||response.status===422?409:502),code:`RUNTIME_GITHUB_${response.status}`,githubStatus:response.status,details:data});throw error;}
  return data;
}
async function readTagRef(){
  const {repo,tag}=githubConfig();
  try{const data=await gh(`/repos/${repo}/git/ref/tags/${encodeURIComponent(tag)}`);return clean(data?.object?.sha)||null;}
  catch(error){if(error.statusCode===404)return null;throw error;}
}
async function readStateAtTag(){
  const {repo,tag,path}=githubConfig();
  try{
    const data=await gh(`/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(tag)}`);
    const raw=Buffer.from(String(data?.content||'').replace(/\n/g,''),'base64').toString('utf8');
    return normalizeState(JSON.parse(raw));
  }catch(error){if(error.statusCode===404)return defaultState();throw error;}
}
async function branchHead(){const {repo,branch}=githubConfig();const data=await gh(`/repos/${repo}/git/ref/heads/${encodeURI(branch)}`);return clean(data?.object?.sha);}
async function commitTree(commitSha){const {repo}=githubConfig();const data=await gh(`/repos/${repo}/git/commits/${commitSha}`);return clean(data?.tree?.sha);}
async function writeStateCommit(state,{parentSha,createRef=false}={}){
  const {repo,tag,path}=githubConfig();
  const treeBase=await commitTree(parentSha);
  const blob=await gh(`/repos/${repo}/git/blobs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:`${JSON.stringify(state,null,2)}\n`,encoding:'utf-8'})});
  const tree=await gh(`/repos/${repo}/git/trees`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base_tree:treeBase,tree:[{path,mode:'100644',type:'blob',sha:blob.sha}]})});
  const commit=await gh(`/repos/${repo}/git/commits`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`core runtime: revision ${state.revision}`,tree:tree.sha,parents:[parentSha]})});
  if(createRef){await gh(`/repos/${repo}/git/refs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:`refs/tags/${tag}`,sha:commit.sha})});}
  else{await gh(`/repos/${repo}/git/refs/tags/${encodeURIComponent(tag)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:commit.sha,force:false})});}
  return commit.sha;
}

export async function loadRuntimeState({force=false}={}){
  const mode=configuredMode();
  if(mode==='memory'){
    if(!memoryState)memoryState=defaultState();return clone(memoryState);
  }
  if(mode==='unconfigured')throw Object.assign(new Error('Server-side Runtime Profile -tallennus ei ole konfiguroitu.'),{statusCode:503,code:'RUNTIME_STORE_UNCONFIGURED'});
  if(!force&&cache&&cache.expiresAt>Date.now())return clone(cache.state);
  const refSha=await readTagRef();
  const state=refSha?await readStateAtTag():defaultState();
  cache={state:normalizeState(state),refSha,expiresAt:Date.now()+CACHE_TTL_MS};
  return clone(cache.state);
}

export async function saveRuntimeState(input,{expectedRevision=null}={}){
  const mode=configuredMode();
  if(mode==='memory'){
    const current=await loadRuntimeState({force:true});
    if(expectedRevision!==null&&Number(expectedRevision)!==current.revision)throw Object.assign(new Error('Runtime Profile muuttui toisessa istunnossa. Päivitä näkymä ja yritä uudelleen.'),{statusCode:409,code:'RUNTIME_REVISION_CONFLICT'});
    memoryState=normalizeState({...input,revision:current.revision+1,updatedAt:new Date().toISOString()});return clone(memoryState);
  }
  if(mode==='unconfigured')throw Object.assign(new Error('Server-side Runtime Profile -tallennus ei ole konfiguroitu.'),{statusCode:503,code:'RUNTIME_STORE_UNCONFIGURED'});
  for(let attempt=0;attempt<2;attempt++){
    cache=null;const current=await loadRuntimeState({force:true});const refSha=cache?.refSha||await readTagRef();
    if(expectedRevision!==null&&Number(expectedRevision)!==current.revision)throw Object.assign(new Error('Runtime Profile muuttui toisessa istunnossa. Päivitä näkymä ja yritä uudelleen.'),{statusCode:409,code:'RUNTIME_REVISION_CONFLICT'});
    const next=normalizeState({...input,revision:current.revision+1,updatedAt:new Date().toISOString()});
    try{
      if(refSha)await writeStateCommit(next,{parentSha:refSha,createRef:false});
      else await writeStateCommit(next,{parentSha:await branchHead(),createRef:true});
      cache={state:next,refSha:null,expiresAt:Date.now()+CACHE_TTL_MS};return clone(next);
    }catch(error){if(error.statusCode===409&&attempt===0){cache=null;continue;}throw error;}
  }
  throw Object.assign(new Error('Runtime Profile -tallennuksen rinnakkaisuuskonflikti.'),{statusCode:409,code:'RUNTIME_WRITE_CONFLICT'});
}

export async function getRuntimeProfiles(){return (await loadRuntimeState()).profiles;}
export async function getRuntimeProfile(agentId){const state=await loadRuntimeState();return state.profiles?.[agentId]||normalizeAgentRuntime(agentId,{});}
export async function updateRuntimeProfile(agentId,patch={},options={}){
  if(!listAgentIds().includes(agentId))throw Object.assign(new Error('Tuntematon agentti.'),{statusCode:400,code:'AGENT_UNKNOWN'});
  const current=await loadRuntimeState({force:true});
  const base=current.profiles?.[agentId]||{};
  const profile=normalizeAgentRuntime(agentId,{...base,...patch,contractHash:base.contractHash});
  const profiles={...current.profiles,[agentId]:profile};
  const state=await saveRuntimeState({...current,profiles},{expectedRevision:options.expectedRevision??current.revision});
  return {state,profile:state.profiles[agentId]};
}
export async function resetRuntimeProfile(agentId,{expectedRevision=null}={}){
  const current=await loadRuntimeState({force:true});
  const profiles={...current.profiles};
  if(agentId){if(!listAgentIds().includes(agentId))throw Object.assign(new Error('Tuntematon agentti.'),{statusCode:400,code:'AGENT_UNKNOWN'});profiles[agentId]=normalizeAgentRuntime(agentId,{});}
  else for(const id of listAgentIds())profiles[id]=normalizeAgentRuntime(id,{});
  const state=await saveRuntimeState({...current,profiles},{expectedRevision:expectedRevision??current.revision});
  return {state,profile:agentId?state.profiles[agentId]:null};
}

function snapshotSecret(){const secret=process.env.ADMIN_SESSION_SECRET;if(!secret||String(secret).length<32)throw Object.assign(new Error('Runtime snapshot -allekirjoitusavain puuttuu.'),{statusCode:503,code:'RUNTIME_SNAPSHOT_SECRET'});return String(secret);}
function minimalProfiles(profiles={}){return Object.fromEntries(listAgentIds().map(id=>{const p=normalizeAgentRuntime(id,profiles[id]||{});return [id,{format:AGENT_RUNTIME_FORMAT,agentId:id,contractHash:p.contractHash,active:p.active!==false,maxOutputTokens:p.maxOutputTokens,modelTarget:p.modelTarget}];}));}
export function signRuntimeSnapshot({orchestraRunId,profiles,revision=0,orchestra=null,now=Date.now(),ttlSeconds=SNAPSHOT_TTL_SECONDS}={}){
  const runId=clean(orchestraRunId).slice(0,120);if(!runId)throw Object.assign(new Error('orchestraRunId puuttuu runtime snapshotista.'),{statusCode:400,code:'RUNTIME_SNAPSHOT_RUN'});
  const selected=orchestra||getOrchestra('editorial');const checked=validateOrchestraDefinition(selected||{});if(!checked.ok)throw Object.assign(new Error('Orkesterin määrittely ei ole kelvollinen Runtime Snapshotiin.'),{statusCode:400,code:'RUNTIME_SNAPSHOT_ORCHESTRA'});
  const orchestraView={id:checked.orchestra.id,name:checked.orchestra.name,version:checked.orchestra.version,description:checked.orchestra.description,steps:checked.orchestra.steps,stages:checked.orchestra.stages,humanFinalAuthority:true,orchestraHash:checked.orchestra.orchestraHash,source:checked.orchestra.source};
  const payload={format:RUNTIME_SNAPSHOT_FORMAT,coreVersion:CORE_VERSION,orchestraRunId:runId,revision:Number(revision)||0,iat:Math.floor(now/1000),exp:Math.floor(now/1000)+ttlSeconds,profiles:minimalProfiles(profiles),orchestra:orchestraView};
  const body=b64url(JSON.stringify(payload));const sig=crypto.createHmac('sha256',snapshotSecret()).update(body).digest('base64url');
  const snapshotId=`rts-${crypto.createHash('sha256').update(body).digest('hex').slice(0,20)}`;
  return {token:`${body}.${sig}`,snapshotId,payload};
}
export function verifyRuntimeSnapshot(token,{orchestraRunId,now=Date.now()}={}){
  try{
    const [body,sig]=String(token||'').split('.');if(!body||!sig)throw new Error('missing');
    const expected=crypto.createHmac('sha256',snapshotSecret()).update(body).digest('base64url');if(!safeEqual(sig,expected))throw new Error('signature');
    const payload=JSON.parse(fromB64url(body));if(payload.format!==RUNTIME_SNAPSHOT_FORMAT||payload.coreVersion!==CORE_VERSION)throw new Error('format');
    if(payload.exp<=Math.floor(now/1000))throw Object.assign(new Error('Runtime snapshot vanheni.'),{statusCode:409,code:'RUNTIME_SNAPSHOT_EXPIRED'});
    if(orchestraRunId&&payload.orchestraRunId!==clean(orchestraRunId).slice(0,120))throw Object.assign(new Error('Runtime snapshot ei kuulu tähän orkesteriajoon.'),{statusCode:409,code:'RUNTIME_SNAPSHOT_RUN_MISMATCH'});
    for(const id of listAgentIds()){const expected=normalizeAgentRuntime(id,{}).contractHash;if(payload.profiles?.[id]?.contractHash!==expected)throw Object.assign(new Error(`Runtime snapshotin Agent Contract vanheni: ${id}.`),{statusCode:409,code:'RUNTIME_SNAPSHOT_STALE'});}
    const checked=validateOrchestraDefinition(payload.orchestra||{});if(!checked.ok||checked.orchestra.orchestraHash!==payload.orchestra?.orchestraHash)throw Object.assign(new Error('Runtime snapshotin Orchestra Contract ei ole kelvollinen.'),{statusCode:409,code:'RUNTIME_SNAPSHOT_ORCHESTRA_STALE'});
    const profiles=minimalProfiles(payload.profiles||{});return {...payload,profiles,orchestra:{...payload.orchestra,steps:checked.orchestra.steps,stages:checked.orchestra.stages}};
  }catch(error){if(error?.code)throw error;throw Object.assign(new Error('Runtime snapshot ei ole kelvollinen.'),{statusCode:409,code:'RUNTIME_SNAPSHOT_INVALID'});}
}
export async function createRuntimeSnapshot(orchestraRunId,orchestraId='editorial'){const state=await loadRuntimeState({force:true});const orchestra=await getAvailableOrchestra(orchestraId);if(!orchestra)throw Object.assign(new Error('Valittua orkesteria ei löytynyt.'),{statusCode:404,code:'ORCHESTRA_NOT_FOUND'});const signed=signRuntimeSnapshot({orchestraRunId,profiles:state.profiles,revision:state.revision,orchestra});return {...signed,state,orchestra:signed.payload.orchestra};}

export function __resetRuntimeStoreForTests(){cache=null;memoryState=null;}
