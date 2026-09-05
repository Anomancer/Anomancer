import crypto from 'node:crypto';
import { CORE_VERSION, digest } from './core-registry.js';
import { stateBackendMode, stateBackendStatus, readStateJson, writeStateJson } from './state-backend.js';
import { ANOMANCER_TEMPLATE_ID, BLANK_PRIVATE_TEMPLATE_ID, defaultTemplateIdFor, getWorkspaceTemplate, requireWorkspaceTemplate, workspaceTemplateBinding, listWorkspaceTemplates } from './workspace-templates.js';

export const WORKSPACE_STORE_FORMAT='anomancer-workspace-store/v2';
export const WORKSPACE_FORMAT='anomancer-workspace/v2';
export const DEFAULT_WORKSPACE_ID='default';
const CACHE_TTL_MS=5_000;
const MAX_WORKSPACES=24;
const clone=v=>JSON.parse(JSON.stringify(v));
const clean=v=>String(v??'').trim();
let cache=null,memoryState=null;

function safeId(v=''){return clean(v).toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);}
function workspaceView(input={},source='custom'){
  const id=source==='built-in'?DEFAULT_WORKSPACE_ID:safeId(input.id);
  const requested=source==='built-in'?ANOMANCER_TEMPLATE_ID:clean(input.templateId);
  const resolved=getWorkspaceTemplate(requested);
  const templateId=resolved?.id||(source==='built-in'?ANOMANCER_TEMPLATE_ID:(requested||defaultTemplateIdFor(source)));
  const binding=resolved?workspaceTemplateBinding(templateId):{templateId,templateHash:'',constitutionId:'core/blank-private-constitution/1.0.0',constitutionHash:'',enabledOrchestraIds:[],defaultOrchestraId:'',artifactStoreId:'workspace/private-isolated/v1',contentAdapterId:'workspace/unbound-private/v1',outputAdapterId:'workspace/no-publication/v1',uiProfileId:'workspace/missing-package-ui/v1'};
  const base={format:WORKSPACE_FORMAT,coreVersion:CORE_VERSION,id,name:clean(input.name).slice(0,80)||resolved?.name||'Unavailable Workspace',description:clean(input.description).slice(0,400),status:input.status==='archived'?'archived':'active',source,...binding,createdAt:clean(input.createdAt),updatedAt:clean(input.updatedAt)};
  const hashable={...base};delete hashable.coreVersion;delete hashable.workspaceHash;delete hashable.updatedAt;base.workspaceHash=digest(hashable);return base;
}
export const DEFAULT_WORKSPACE=Object.freeze(workspaceView({id:DEFAULT_WORKSPACE_ID,name:'Anomancer',description:'Anomancerin toimitustyö, julkaisut sekä runtime-, orkesteri- ja ajohistoria samassa Vercel/local state -rajassa.',status:'active'},'built-in'));

function localTemplateForWorkspaceId(id=''){
  const key=safeId(id);if(!key.startsWith('local-'))return null;
  const token=key.slice(6).split('--')[0];if(!token)return null;
  return listWorkspaceTemplates().find(template=>template.instancePolicy==='multiple'&&(safeId(template.mancerPackage?.id||'')===token||safeId(template.id.split('/')[0])===token||safeId(template.kind)===token))||null;
}
export function isBrowserLocalWorkspaceId(id=''){return Boolean(localTemplateForWorkspaceId(id));}
function browserLocalWorkspace(id=''){
  const key=safeId(id),template=localTemplateForWorkspaceId(key);if(!template)return null;
  const now='';return workspaceView({id:key,name:`${template.name} · paikallinen`,description:'Selaimeen luotu eristetty työtila. Palvelin validoi työtilatyypin, mutta rekisterimerkintä ei vaadi Vercel Blob -tallennusta.',templateId:template.id,status:'active',createdAt:now,updatedAt:now},'browser-local');
}

const STORE_KEY='workspaces.json';
const STORE_ENV=['ANOMANCER_WORKSPACE_STORE'];
function mode(){return stateBackendMode(STORE_ENV);}
export function workspaceStoreStatus(){const backend=stateBackendStatus(STORE_KEY,STORE_ENV);return{format:WORKSPACE_STORE_FORMAT,coreVersion:CORE_VERSION,...backend,maxWorkspaces:MAX_WORKSPACES};}
function normalizeCustom(items=[]){const out=[],ids=new Set();for(const raw of Array.isArray(items)?items:[]){const id=safeId(raw.id);if(!id||id===DEFAULT_WORKSPACE_ID||ids.has(id))continue;ids.add(id);out.push(workspaceView({...raw,id},'custom'));}return out.slice(0,MAX_WORKSPACES-1);}
function defaultState(){return{format:WORKSPACE_STORE_FORMAT,coreVersion:CORE_VERSION,revision:0,updatedAt:'',workspaces:[]};}
function normalizeState(raw={}){return{format:WORKSPACE_STORE_FORMAT,coreVersion:CORE_VERSION,revision:Math.max(0,Number(raw.revision)||0),updatedAt:clean(raw.updatedAt),workspaces:normalizeCustom(raw.workspaces)};}
export async function loadWorkspaceState({force=false}={}){const m=mode();if(m==='memory'){if(!memoryState)memoryState=defaultState();return clone(memoryState);}if(!force&&cache&&cache.expiresAt>Date.now())return clone(cache.state);const stored=await readStateJson(STORE_KEY,defaultState(),STORE_ENV);cache={state:normalizeState(stored.value),version:stored.version,expiresAt:Date.now()+CACHE_TTL_MS};return clone(cache.state);}
async function saveState(input,{expectedRevision=null}={}){const m=mode();if(m==='memory'){const current=await loadWorkspaceState({force:true});if(expectedRevision!==null&&Number(expectedRevision)!==current.revision)throw Object.assign(new Error('Workspace-rekisteri muuttui toisessa istunnossa.'),{statusCode:409,code:'WORKSPACE_REVISION_CONFLICT'});memoryState=normalizeState({...input,revision:current.revision+1,updatedAt:new Date().toISOString()});return clone(memoryState);}cache=null;const current=await loadWorkspaceState({force:true}),version=cache?.version??null;if(expectedRevision!==null&&Number(expectedRevision)!==current.revision)throw Object.assign(new Error('Workspace-rekisteri muuttui toisessa istunnossa.'),{statusCode:409,code:'WORKSPACE_REVISION_CONFLICT'});const next=normalizeState({...input,revision:current.revision+1,updatedAt:new Date().toISOString()});try{const written=await writeStateJson(STORE_KEY,next,{expectedVersion:version,envNames:STORE_ENV});cache={state:next,version:written.version,expiresAt:Date.now()+CACHE_TTL_MS};return clone(next);}catch(error){if(error?.code==='STATE_WRITE_CONFLICT')throw Object.assign(new Error('Workspace Storen rinnakkaisuuskonflikti.'),{statusCode:409,code:'WORKSPACE_WRITE_CONFLICT'});throw error;}}
function makeId(name='workspace'){const slug=safeId(name).slice(0,32)||'workspace';return `ws-${slug}-${crypto.randomBytes(3).toString('hex')}`;}
export async function listWorkspaces({includeArchived=true}={}){const state=await loadWorkspaceState();const custom=includeArchived?state.workspaces:state.workspaces.filter(w=>w.status!=='archived');return{state,builtins:[clone(DEFAULT_WORKSPACE)],custom:custom.map(clone),all:[clone(DEFAULT_WORKSPACE),...custom.map(clone)]};}
export async function getWorkspace(id=DEFAULT_WORKSPACE_ID){const key=safeId(id)||DEFAULT_WORKSPACE_ID;if(key===DEFAULT_WORKSPACE_ID)return clone(DEFAULT_WORKSPACE);const local=browserLocalWorkspace(key);if(local)return clone(local);const state=await loadWorkspaceState();return clone(state.workspaces.find(w=>w.id===key)||null);}
export async function requireWorkspace(id=DEFAULT_WORKSPACE_ID,{allowArchived=false}={}){const workspace=await getWorkspace(id);if(!workspace)throw Object.assign(new Error('Workspacea ei löytynyt.'),{statusCode:404,code:'WORKSPACE_NOT_FOUND'});if(workspace.status==='archived'&&!allowArchived)throw Object.assign(new Error('Workspace on arkistoitu.'),{statusCode:409,code:'WORKSPACE_ARCHIVED'});return workspace;}
export async function upsertWorkspace(input={},options={}){const current=await loadWorkspaceState({force:true});const requested=safeId(input.id);if(requested===DEFAULT_WORKSPACE_ID)throw Object.assign(new Error('Sisäänrakennettua Anomancer-työtilaa ei muokata.'),{statusCode:400,code:'WORKSPACE_BUILTIN'});const existing=current.workspaces.find(w=>w.id===requested);if(!existing&&current.workspaces.length>=MAX_WORKSPACES-1)throw Object.assign(new Error('Workspace-raja tuli vastaan.'),{statusCode:409,code:'WORKSPACE_LIMIT'});const requestedTemplate=clean(input.templateId)||existing?.templateId||BLANK_PRIVATE_TEMPLATE_ID,template=requireWorkspaceTemplate(requestedTemplate);if(template.instancePolicy==='singleton-default')throw Object.assign(new Error('Anomancer-template kuuluu vain legacy default -työtilalle.'),{statusCode:400,code:'WORKSPACE_TEMPLATE_SINGLETON'});if(existing&&clean(input.templateId)&&input.templateId!==existing.templateId)throw Object.assign(new Error('Työtilatyyppiä ei voi vaihtaa luonnin jälkeen.'),{statusCode:409,code:'WORKSPACE_TEMPLATE_IMMUTABLE'});const id=existing?.id||makeId(input.name);const now=new Date().toISOString();const next=workspaceView({...input,templateId:template.id,id,status:existing?.status||'active',createdAt:existing?.createdAt||now,updatedAt:now},'custom');const workspaces=existing?current.workspaces.map(w=>w.id===id?next:w):[...current.workspaces,next];const state=await saveState({...current,workspaces},{expectedRevision:options.expectedRevision??current.revision});return{state,workspace:state.workspaces.find(w=>w.id===id)};}
export async function archiveWorkspace(id,{expectedRevision=null,archived=true}={}){const key=safeId(id);if(!key||key===DEFAULT_WORKSPACE_ID)throw Object.assign(new Error('Default-workspacea ei voi arkistoida.'),{statusCode:400,code:'WORKSPACE_BUILTIN'});const current=await loadWorkspaceState({force:true});const existing=current.workspaces.find(w=>w.id===key);if(!existing)throw Object.assign(new Error('Workspacea ei löytynyt.'),{statusCode:404,code:'WORKSPACE_NOT_FOUND'});const next=workspaceView({...existing,status:archived?'archived':'active',updatedAt:new Date().toISOString()},'custom');const state=await saveState({...current,workspaces:current.workspaces.map(w=>w.id===key?next:w)},{expectedRevision:expectedRevision??current.revision});return{state,workspace:state.workspaces.find(w=>w.id===key)};}
export function workspaceIdFromRequest(req){return safeId(req?.headers?.['x-anomancer-workspace']||DEFAULT_WORKSPACE_ID)||DEFAULT_WORKSPACE_ID;}
export function __resetWorkspaceStoreForTests(){cache=null;memoryState=null;}
