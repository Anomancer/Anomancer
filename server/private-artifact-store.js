import { CORE_VERSION } from './core-registry.js';
import { DEFAULT_WORKSPACE_ID } from './workspace-store.js';
import { stateBackendMode, stateBackendStatus, readStateJson, writeStateJson } from './state-backend.js';
import { NARRAMANCER_ARTIFACT_STATE_FORMAT, emptyNarramancerProject, normalizeNarramancerProject } from './narramancer-project.js';

const CACHE_TTL_MS=3000;
const clone=v=>JSON.parse(JSON.stringify(v));
const clean=v=>String(v??'').trim();
const caches=new Map(),memoryStates=new Map();
const STORE_ENV=['ANOMANCER_ARTIFACT_STORE'];
function workspaceKey(id){return clean(id)||DEFAULT_WORKSPACE_ID;}
function keyFor(id){return `artifacts/narramancer/${workspaceKey(id)}.json`;}
function mode(){return stateBackendMode(STORE_ENV);}
export function privateArtifactStoreStatus(workspaceId){const id=workspaceKey(workspaceId),backend=stateBackendStatus(keyFor(id),STORE_ENV);return{format:NARRAMANCER_ARTIFACT_STATE_FORMAT,coreVersion:CORE_VERSION,workspaceId:id,...backend,publicBranchWrite:false};}
function defaultState(workspaceId){const id=workspaceKey(workspaceId);return{format:NARRAMANCER_ARTIFACT_STATE_FORMAT,coreVersion:CORE_VERSION,workspaceId:id,revision:0,updatedAt:'',project:emptyNarramancerProject(id)};}
function normalizeState(raw={},workspaceId){const id=workspaceKey(workspaceId);return{format:NARRAMANCER_ARTIFACT_STATE_FORMAT,coreVersion:CORE_VERSION,workspaceId:id,revision:Math.max(0,Number(raw.revision)||0),updatedAt:clean(raw.updatedAt),project:normalizeNarramancerProject(raw.project||{},id)};}
export async function loadPrivateArtifact({force=false,workspaceId}={}){const id=workspaceKey(workspaceId),m=mode();if(m==='memory'){if(!memoryStates.has(id))memoryStates.set(id,defaultState(id));return clone(memoryStates.get(id));}const cached=caches.get(id);if(!force&&cached&&cached.expiresAt>Date.now())return clone(cached.state);const stored=await readStateJson(keyFor(id),defaultState(id),STORE_ENV),state=normalizeState(stored.value,id);caches.set(id,{state,version:stored.version,expiresAt:Date.now()+CACHE_TTL_MS});return clone(state);}
export async function savePrivateArtifact(project,{expectedRevision=null,workspaceId}={}){const id=workspaceKey(workspaceId),m=mode();if(m==='memory'){const current=await loadPrivateArtifact({force:true,workspaceId:id});if(expectedRevision!==null&&Number(expectedRevision)!==current.revision)throw Object.assign(new Error('Romancer-projekti muuttui toisessa istunnossa.'),{statusCode:409,code:'ARTIFACT_REVISION_CONFLICT'});const next=normalizeState({revision:current.revision+1,updatedAt:new Date().toISOString(),project},id);memoryStates.set(id,next);return clone(next);}caches.delete(id);const current=await loadPrivateArtifact({force:true,workspaceId:id}),version=caches.get(id)?.version??null;if(expectedRevision!==null&&Number(expectedRevision)!==current.revision)throw Object.assign(new Error('Romancer-projekti muuttui toisessa istunnossa.'),{statusCode:409,code:'ARTIFACT_REVISION_CONFLICT'});const next=normalizeState({revision:current.revision+1,updatedAt:new Date().toISOString(),project},id);try{const written=await writeStateJson(keyFor(id),next,{expectedVersion:version,envNames:STORE_ENV});caches.set(id,{state:next,version:written.version,expiresAt:Date.now()+CACHE_TTL_MS});return clone(next);}catch(error){if(error?.code==='STATE_WRITE_CONFLICT')throw Object.assign(new Error('Private Artifact Storen rinnakkaisuuskonflikti.'),{statusCode:409,code:'ARTIFACT_WRITE_CONFLICT'});throw error;}}
export function __resetPrivateArtifactStoreForTests(){caches.clear();memoryStates.clear();}
