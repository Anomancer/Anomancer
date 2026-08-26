import crypto from 'node:crypto';
import { CORE_VERSION, ORCHESTRA_REGISTRY, normalizeOrchestraDefinition, validateOrchestraDefinition } from './core-registry.js';

export const ORCHESTRA_STORE_FORMAT='anomancer-orchestra-store/v1';
const DEFAULT_TAG='anomancer-orchestra-state';
const DEFAULT_PATH='.anomancer/custom-orchestras.json';
const CACHE_TTL_MS=5_000;
const clone=value=>JSON.parse(JSON.stringify(value));
const clean=value=>String(value??'').trim();
let cache=null,memoryState=null;

function configuredMode(){
  const forced=clean(process.env.ANOMANCER_ORCHESTRA_STORE).toLowerCase();
  if(forced==='memory')return 'memory';
  if(forced==='github-tag')return 'github-tag';
  if(process.env.GITHUB_CONTENT_TOKEN&&process.env.GITHUB_REPO?.includes('/'))return 'github-tag';
  return 'unconfigured';
}
function githubConfig(){
  const token=process.env.GITHUB_CONTENT_TOKEN,repo=process.env.GITHUB_REPO,branch=process.env.GITHUB_BRANCH||'master';
  if(!token||!repo?.includes('/'))throw Object.assign(new Error('Custom Orchestra -tallennus ei ole konfiguroitu.'),{statusCode:503,code:'ORCHESTRA_STORE_UNCONFIGURED'});
  return {token,repo,branch,tag:clean(process.env.ANOMANCER_ORCHESTRA_TAG)||DEFAULT_TAG,path:clean(process.env.ANOMANCER_ORCHESTRA_PATH)||DEFAULT_PATH};
}
export function orchestraStoreStatus(){
  const mode=configuredMode(),base={format:ORCHESTRA_STORE_FORMAT,coreVersion:CORE_VERSION,mode,durable:mode==='github-tag',serverAuthoritative:true,secretsExposed:false};
  if(mode==='github-tag'){const {tag,path}=githubConfig();return {...base,configured:true,ref:`refs/tags/${tag}`,path};}
  return {...base,configured:mode==='memory'};
}
function normalizeCustomList(items=[]){
  const out=[];const ids=new Set();
  for(const raw of Array.isArray(items)?items:[]){
    const checked=validateOrchestraDefinition({...raw,source:'custom'});if(!checked.ok)continue;
    const o=checked.orchestra;if(ids.has(o.id)||ORCHESTRA_REGISTRY.some(item=>item.id===o.id))continue;ids.add(o.id);
    out.push({...o,createdAt:clean(raw.createdAt),updatedAt:clean(raw.updatedAt)});
  }
  return out.slice(0,50);
}
function defaultState(){return {format:ORCHESTRA_STORE_FORMAT,coreVersion:CORE_VERSION,revision:0,updatedAt:'',orchestras:[]};}
function normalizeState(input={}){return {format:ORCHESTRA_STORE_FORMAT,coreVersion:CORE_VERSION,revision:Math.max(0,Number(input.revision)||0),updatedAt:clean(input.updatedAt),orchestras:normalizeCustomList(input.orchestras)};}

async function gh(path,options={}){
  const {token}=githubConfig();
  const response=await fetch(`https://api.github.com${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'anomancer-core-orchestras-v15.8',...(options.headers||{})}});
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null;}catch{data={message:text};}
  if(!response.ok)throw Object.assign(new Error(data?.message||`GitHub ${response.status}`),{statusCode:response.status===404?404:(response.status===409||response.status===422?409:502),code:`ORCHESTRA_GITHUB_${response.status}`,githubStatus:response.status,details:data});
  return data;
}
async function readTagRef(){const {repo,tag}=githubConfig();try{const d=await gh(`/repos/${repo}/git/ref/tags/${encodeURIComponent(tag)}`);return clean(d?.object?.sha)||null;}catch(e){if(e.statusCode===404)return null;throw e;}}
async function readStateAtTag(){const {repo,tag,path}=githubConfig();try{const d=await gh(`/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(tag)}`);const raw=Buffer.from(String(d?.content||'').replace(/\n/g,''),'base64').toString('utf8');return normalizeState(JSON.parse(raw));}catch(e){if(e.statusCode===404)return defaultState();throw e;}}
async function branchHead(){const {repo,branch}=githubConfig();const d=await gh(`/repos/${repo}/git/ref/heads/${encodeURI(branch)}`);return clean(d?.object?.sha);}
async function commitTree(commitSha){const {repo}=githubConfig();const d=await gh(`/repos/${repo}/git/commits/${commitSha}`);return clean(d?.tree?.sha);}
async function writeStateCommit(state,{parentSha,createRef=false}={}){
  const {repo,tag,path}=githubConfig(),treeBase=await commitTree(parentSha);
  const blob=await gh(`/repos/${repo}/git/blobs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:`${JSON.stringify(state,null,2)}\n`,encoding:'utf-8'})});
  const tree=await gh(`/repos/${repo}/git/trees`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base_tree:treeBase,tree:[{path,mode:'100644',type:'blob',sha:blob.sha}]})});
  const commit=await gh(`/repos/${repo}/git/commits`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`core orchestras: revision ${state.revision}`,tree:tree.sha,parents:[parentSha]})});
  if(createRef)await gh(`/repos/${repo}/git/refs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:`refs/tags/${tag}`,sha:commit.sha})});
  else await gh(`/repos/${repo}/git/refs/tags/${encodeURIComponent(tag)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:commit.sha,force:false})});
  return commit.sha;
}
export async function loadOrchestraState({force=false}={}){
  const mode=configuredMode();
  if(mode==='memory'){if(!memoryState)memoryState=defaultState();return clone(memoryState);}
  if(mode==='unconfigured')throw Object.assign(new Error('Custom Orchestra -tallennus ei ole konfiguroitu.'),{statusCode:503,code:'ORCHESTRA_STORE_UNCONFIGURED'});
  if(!force&&cache&&cache.expiresAt>Date.now())return clone(cache.state);
  const refSha=await readTagRef(),state=refSha?await readStateAtTag():defaultState();cache={state:normalizeState(state),refSha,expiresAt:Date.now()+CACHE_TTL_MS};return clone(cache.state);
}
export async function saveOrchestraState(input,{expectedRevision=null}={}){
  const mode=configuredMode();
  if(mode==='memory'){
    const current=await loadOrchestraState({force:true});if(expectedRevision!==null&&Number(expectedRevision)!==current.revision)throw Object.assign(new Error('Orkesterirekisteri muuttui toisessa istunnossa.'),{statusCode:409,code:'ORCHESTRA_REVISION_CONFLICT'});
    memoryState=normalizeState({...input,revision:current.revision+1,updatedAt:new Date().toISOString()});return clone(memoryState);
  }
  if(mode==='unconfigured')throw Object.assign(new Error('Custom Orchestra -tallennus ei ole konfiguroitu.'),{statusCode:503,code:'ORCHESTRA_STORE_UNCONFIGURED'});
  for(let attempt=0;attempt<2;attempt++){
    cache=null;const current=await loadOrchestraState({force:true}),refSha=cache?.refSha||await readTagRef();if(expectedRevision!==null&&Number(expectedRevision)!==current.revision)throw Object.assign(new Error('Orkesterirekisteri muuttui toisessa istunnossa.'),{statusCode:409,code:'ORCHESTRA_REVISION_CONFLICT'});
    const next=normalizeState({...input,revision:current.revision+1,updatedAt:new Date().toISOString()});
    try{if(refSha)await writeStateCommit(next,{parentSha:refSha});else await writeStateCommit(next,{parentSha:await branchHead(),createRef:true});cache={state:next,refSha:null,expiresAt:Date.now()+CACHE_TTL_MS};return clone(next);}catch(e){if(e.statusCode===409&&attempt===0){cache=null;continue;}throw e;}
  }
  throw Object.assign(new Error('Orkesterirekisterin rinnakkaisuuskonflikti.'),{statusCode:409,code:'ORCHESTRA_WRITE_CONFLICT'});
}
function makeId(name='orchestra'){const slug=String(name).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,36)||'orchestra';return `custom-${slug}-${crypto.randomBytes(3).toString('hex')}`;}
export async function listAvailableOrchestras(){const state=await loadOrchestraState();return {state,builtins:ORCHESTRA_REGISTRY.map(clone),custom:state.orchestras.map(clone),all:[...ORCHESTRA_REGISTRY.map(clone),...state.orchestras.map(clone)]};}
export async function getAvailableOrchestra(id='editorial'){const key=String(id||'');const builtin=ORCHESTRA_REGISTRY.find(x=>x.id===key);if(builtin)return clone(builtin);const state=await loadOrchestraState();return clone(state.orchestras.find(x=>x.id===key)||null);}
export async function upsertCustomOrchestra(input={},options={}){
  const current=await loadOrchestraState({force:true});const existingId=String(input.id||'').trim();const existing=current.orchestras.find(x=>x.id===existingId);const id=existing?.id||makeId(input.name);
  const checked=validateOrchestraDefinition({...input,id,source:'custom'});if(!checked.ok)throw Object.assign(new Error(checked.errors.map(x=>x.message).join(' ')),{statusCode:400,code:checked.errors[0]?.code||'ORCHESTRA_INVALID',errors:checked.errors});
  const now=new Date().toISOString(),next={...checked.orchestra,createdAt:existing?.createdAt||now,updatedAt:now};
  const orchestras=existing?current.orchestras.map(x=>x.id===id?next:x):[...current.orchestras,next];
  const state=await saveOrchestraState({...current,orchestras},{expectedRevision:options.expectedRevision??current.revision});return {state,orchestra:state.orchestras.find(x=>x.id===id)};
}
export async function deleteCustomOrchestra(id,{expectedRevision=null}={}){
  const current=await loadOrchestraState({force:true});const key=String(id||'');if(ORCHESTRA_REGISTRY.some(x=>x.id===key))throw Object.assign(new Error('Sisäänrakennettua orkesteria ei voi poistaa.'),{statusCode:400,code:'ORCHESTRA_BUILTIN'});
  if(!current.orchestras.some(x=>x.id===key))throw Object.assign(new Error('Orkesteria ei löytynyt.'),{statusCode:404,code:'ORCHESTRA_NOT_FOUND'});
  const state=await saveOrchestraState({...current,orchestras:current.orchestras.filter(x=>x.id!==key)},{expectedRevision:expectedRevision??current.revision});return {state};
}
export function __resetOrchestraStoreForTests(){cache=null;memoryState=null;}
