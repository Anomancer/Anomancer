import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { githubPublicationStatus, readStateFromGitHub, writeStateToGitHub, deleteStateFromGitHub } from './github-publication.js';

const ROOT=path.resolve(process.cwd());
const LOCAL_ROOT=path.resolve(ROOT,process.env.ANOMANCER_STATE_DIR||'.anomancer/state');
const browserLocalState=new Map();
const clean=v=>String(v??'').trim();
const sha=text=>crypto.createHash('sha256').update(String(text)).digest('hex');

function safeKey(key=''){
  const raw=clean(key).replace(/\\/g,'/').replace(/^\/+/, '');
  if(!raw||raw.includes('\0')||raw.split('/').some(part=>!part||part==='.'||part==='..'))throw Object.assign(new Error('State key ei kelpaa.'),{statusCode:400,code:'STATE_KEY'});
  return raw;
}
function statePath(key){const rel=safeKey(key);return `.anomancer/state/${rel.endsWith('.json')?rel:`${rel}.json`}`;}
function isBrowserLocalKey(key=''){return safeKey(key).split('/').some(part=>part.startsWith('local-'));}
function browserLocalRead(key,fallback){const rel=safeKey(key),row=browserLocalState.get(rel);return row?{value:structuredClone(row.value),version:row.version,exists:true,mode:'memory'}:{value:structuredClone(fallback),version:null,exists:false,mode:'memory'};}
function browserLocalWrite(key,value,{expectedVersion=null}={}){const rel=safeKey(key),current=browserLocalState.get(rel)||null;if(expectedVersion===null&&current)throw Object.assign(new Error('Paikallinen palvelintila syntyi toisessa pyynnössä.'),{statusCode:409,code:'STATE_WRITE_CONFLICT'});if(expectedVersion!==null&&current?.version!==expectedVersion)throw Object.assign(new Error('Paikallinen palvelintila muuttui toisessa pyynnössä.'),{statusCode:409,code:'STATE_WRITE_CONFLICT'});const text=`${JSON.stringify(value,null,2)}\n`,version=sha(text);browserLocalState.set(rel,{value:structuredClone(value),version});return{version,mode:'memory'};}
function localPath(key){const rel=safeKey(key),target=path.resolve(LOCAL_ROOT,rel),prefix=`${LOCAL_ROOT}${path.sep}`;if(target!==LOCAL_ROOT&&!target.startsWith(prefix))throw Object.assign(new Error('State-polku poistuu sallitulta alueelta.'),{statusCode:400,code:'STATE_PATH'});return target;}

export function stateBackendMode(envNames=[]){
  const names=Array.isArray(envNames)?envNames:[envNames];
  const forced=names.map(name=>clean(process.env[name]).toLowerCase()).find(Boolean)||clean(process.env.ANOMANCER_STATE_STORE).toLowerCase();
  if(forced==='memory')return'memory';
  if(['local','filesystem','fs'].includes(forced))return'local';
  if(['blob','vercel-blob','private-blob'].includes(forced))return githubPublicationStatus().configured?'github':'unconfigured';
  if(forced==='github')return githubPublicationStatus().configured?'github':'unconfigured';
  if(githubPublicationStatus().configured)return'github';
  if(process.env.VERCEL==='1')return'unconfigured';
  return'local';
}
export function stateBackendStatus(key,envNames=[]){
  if(isBrowserLocalKey(key))return{mode:'memory',durable:false,configured:true,serverAuthoritative:false,secretsExposed:false,path:safeKey(key),browserLocalWorkspace:true};
  const mode=stateBackendMode(envNames);return{mode,durable:mode==='github'||mode==='local',configured:mode!=='unconfigured',serverAuthoritative:true,secretsExposed:false,path:mode==='github'?statePath(key):mode==='local'?path.relative(ROOT,localPath(key)):safeKey(key)};
}

export async function readStateJson(key,fallback,envNames=[]){
  if(isBrowserLocalKey(key))return browserLocalRead(key,fallback);
  const mode=stateBackendMode(envNames);
  if(mode==='unconfigured')throw Object.assign(new Error('Pysyvä tallennus ei ole konfiguroitu. Määritä GitHub-julkaisuympäristö.'),{statusCode:503,code:'STATE_STORE_UNCONFIGURED'});
  if(mode==='memory')return{value:structuredClone(fallback),version:null,exists:false,mode};
  if(mode==='local'){
    const file=localPath(key);try{const text=await fs.readFile(file,'utf8');return{value:JSON.parse(text),version:sha(text),exists:true,mode};}catch(error){if(error?.code==='ENOENT')return{value:structuredClone(fallback),version:null,exists:false,mode};if(error instanceof SyntaxError)throw Object.assign(new Error(`State JSON on rikki: ${path.relative(ROOT,file)}`),{statusCode:500,code:'STATE_JSON_INVALID'});throw error;}
  }
  const meta=await readStateFromGitHub(statePath(key));
  if(!meta)return{value:structuredClone(fallback),version:null,exists:false,mode};
  try{return{value:JSON.parse(meta.content),version:meta.sha,exists:true,mode};}catch{throw Object.assign(new Error(`GitHub state JSON on rikki: ${statePath(key)}`),{statusCode:500,code:'STATE_JSON_INVALID'});}
}

export async function writeStateJson(key,value,{expectedVersion=null,envNames=[]}={}){
  if(isBrowserLocalKey(key))return browserLocalWrite(key,value,{expectedVersion});
  const mode=stateBackendMode(envNames),text=`${JSON.stringify(value,null,2)}\n`;
  if(mode==='unconfigured')throw Object.assign(new Error('Pysyvä tallennus ei ole konfiguroitu. Määritä GitHub-julkaisuympäristö.'),{statusCode:503,code:'STATE_STORE_UNCONFIGURED'});
  if(mode==='memory')return{version:sha(text),mode};
  if(mode==='local'){
    const file=localPath(key);await fs.mkdir(path.dirname(file),{recursive:true});let currentVersion=null;try{currentVersion=sha(await fs.readFile(file,'utf8'));}catch(error){if(error?.code!=='ENOENT')throw error;}if(expectedVersion!==null&&currentVersion!==expectedVersion)throw Object.assign(new Error('Tallennustila muuttui toisessa istunnossa.'),{statusCode:409,code:'STATE_WRITE_CONFLICT'});if(expectedVersion===null&&currentVersion!==null)throw Object.assign(new Error('Tallennustila syntyi toisessa istunnossa.'),{statusCode:409,code:'STATE_WRITE_CONFLICT'});const temp=`${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;await fs.writeFile(temp,text,{mode:0o600});await fs.rename(temp,file);return{version:sha(text),mode};
  }
  try{
    const existing=await readStateFromGitHub(statePath(key));
    if(expectedVersion===null&&existing)throw Object.assign(new Error('Tallennustila syntyi toisessa istunnossa.'),{statusCode:409,code:'STATE_WRITE_CONFLICT'});
    if(expectedVersion!==null&&(!existing||existing.sha!==expectedVersion))throw Object.assign(new Error('Tallennustila muuttui toisessa istunnossa.'),{statusCode:409,code:'STATE_WRITE_CONFLICT'});
    const result=await writeStateToGitHub(statePath(key),text,{sha:existing?.sha||'',message:`state: update ${safeKey(key)}`});
    return{version:result.sha,mode};
  }catch(error){if(error?.code==='CONTENT_REVISION_CONFLICT')throw Object.assign(new Error('Tallennustila muuttui toisessa istunnossa.'),{statusCode:409,code:'STATE_WRITE_CONFLICT',cause:error});throw error;}
}

export async function deleteState(key,{expectedVersion=null,envNames=[]}={}){
  if(isBrowserLocalKey(key)){const rel=safeKey(key),current=browserLocalState.get(rel)||null;if(expectedVersion!==null&&current?.version!==expectedVersion)throw Object.assign(new Error('Paikallinen palvelintila muuttui toisessa pyynnössä.'),{statusCode:409,code:'STATE_WRITE_CONFLICT'});return{deleted:browserLocalState.delete(rel),mode:'memory'};}
  const mode=stateBackendMode(envNames);if(mode==='unconfigured')throw Object.assign(new Error('Pysyvä tallennus ei ole konfiguroitu.'),{statusCode:503,code:'STATE_STORE_UNCONFIGURED'});if(mode==='memory')return{deleted:true,mode};
  if(mode==='local'){const file=localPath(key);if(expectedVersion!==null){let current=null;try{current=sha(await fs.readFile(file,'utf8'));}catch(error){if(error?.code!=='ENOENT')throw error;}if(current!==expectedVersion)throw Object.assign(new Error('Tallennustila muuttui toisessa istunnossa.'),{statusCode:409,code:'STATE_WRITE_CONFLICT'});}await fs.rm(file,{force:true});return{deleted:true,mode};}
  try{const result=await deleteStateFromGitHub(statePath(key),expectedVersion||'',{message:`state: delete ${safeKey(key)}`});return{deleted:Boolean(result.commitSha),mode};}catch(error){if(error?.code==='CONTENT_REVISION_CONFLICT')throw Object.assign(new Error('Tallennustila muuttui toisessa istunnossa.'),{statusCode:409,code:'STATE_WRITE_CONFLICT',cause:error});throw error;}
}
