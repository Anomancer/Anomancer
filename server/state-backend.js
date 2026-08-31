import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT=path.resolve(process.cwd());
const LOCAL_ROOT=path.resolve(ROOT,process.env.ANOMANCER_STATE_DIR||'.anomancer/state');
const BLOB_PREFIX=String(process.env.ANOMANCER_BLOB_PREFIX||'anomancer-state').replace(/^\/+|\/+$/g,'');

const clean=v=>String(v??'').trim();
const sha=text=>crypto.createHash('sha256').update(String(text)).digest('hex');

function safeKey(key=''){
  const raw=clean(key).replace(/\\/g,'/').replace(/^\/+/, '');
  if(!raw||raw.includes('\0')||raw.split('/').some(part=>!part||part==='.'||part==='..'))throw Object.assign(new Error('State key ei kelpaa.'),{statusCode:400,code:'STATE_KEY'});
  return raw;
}
function localPath(key){const rel=safeKey(key),target=path.resolve(LOCAL_ROOT,rel),prefix=`${LOCAL_ROOT}${path.sep}`;if(target!==LOCAL_ROOT&&!target.startsWith(prefix))throw Object.assign(new Error('State-polku poistuu sallitulta alueelta.'),{statusCode:400,code:'STATE_PATH'});return target;}
function blobPath(key){return `${BLOB_PREFIX}/${safeKey(key)}`;}

export function stateBackendMode(envNames=[]){
  const names=Array.isArray(envNames)?envNames:[envNames];
  const forced=names.map(name=>clean(process.env[name]).toLowerCase()).find(Boolean)||clean(process.env.ANOMANCER_STATE_STORE).toLowerCase();
  if(forced==='memory')return'memory';
  if(['local','filesystem','fs'].includes(forced))return'local';
  if(['blob','vercel-blob','private-blob'].includes(forced))return process.env.BLOB_READ_WRITE_TOKEN?'blob':'unconfigured';
  if(process.env.BLOB_READ_WRITE_TOKEN)return'blob';
  if(process.env.VERCEL==='1')return'unconfigured';
  return'local';
}

export function stateBackendStatus(key,envNames=[]){
  const mode=stateBackendMode(envNames);
  return{mode,durable:mode==='blob'||mode==='local',configured:mode!=='unconfigured',serverAuthoritative:true,secretsExposed:false,path:mode==='blob'?blobPath(key):mode==='local'?path.relative(ROOT,localPath(key)):safeKey(key)};
}

async function blobApi(){
  try{return await import('@vercel/blob');}
  catch(error){throw Object.assign(new Error('Vercel Blob -kirjasto puuttuu. Aja npm install.'),{statusCode:503,code:'BLOB_PACKAGE_MISSING',cause:error});}
}
async function exactBlob(key){
  const pathname=blobPath(key),{list}=await blobApi();
  let cursor;
  do{
    const result=await list({prefix:pathname,limit:100,cursor});
    const hit=(result.blobs||[]).find(item=>item.pathname===pathname);
    if(hit)return hit;
    cursor=result.cursor;
  }while(cursor);
  return null;
}

export async function readStateJson(key,fallback,envNames=[]){
  const mode=stateBackendMode(envNames);
  if(mode==='unconfigured')throw Object.assign(new Error('Pysyvä Vercel-tallennus ei ole konfiguroitu. Liitä private Blob store projektiin.'),{statusCode:503,code:'STATE_STORE_UNCONFIGURED'});
  if(mode==='memory')return{value:structuredClone(fallback),version:null,exists:false,mode};
  if(mode==='local'){
    const file=localPath(key);
    try{const text=await fs.readFile(file,'utf8');return{value:JSON.parse(text),version:sha(text),exists:true,mode};}
    catch(error){if(error?.code==='ENOENT')return{value:structuredClone(fallback),version:null,exists:false,mode};if(error instanceof SyntaxError)throw Object.assign(new Error(`State JSON on rikki: ${path.relative(ROOT,file)}`),{statusCode:500,code:'STATE_JSON_INVALID'});throw error;}
  }
  const meta=await exactBlob(key);
  if(!meta)return{value:structuredClone(fallback),version:null,exists:false,mode};
  const {get}=await blobApi();
  const result=await get(meta.url,{access:'private'});
  if(!result)return{value:structuredClone(fallback),version:null,exists:false,mode};
  const text=await new Response(result.stream).text();
  try{return{value:JSON.parse(text),version:result.blob?.etag||meta.etag||sha(text),exists:true,mode};}
  catch{throw Object.assign(new Error(`Blob state JSON on rikki: ${blobPath(key)}`),{statusCode:500,code:'STATE_JSON_INVALID'});}
}

export async function writeStateJson(key,value,{expectedVersion=null,envNames=[]}={}){
  const mode=stateBackendMode(envNames),text=`${JSON.stringify(value,null,2)}\n`;
  if(mode==='unconfigured')throw Object.assign(new Error('Pysyvä Vercel-tallennus ei ole konfiguroitu. Liitä private Blob store projektiin.'),{statusCode:503,code:'STATE_STORE_UNCONFIGURED'});
  if(mode==='memory')return{version:sha(text),mode};
  if(mode==='local'){
    const file=localPath(key);await fs.mkdir(path.dirname(file),{recursive:true});
    let currentVersion=null;
    try{currentVersion=sha(await fs.readFile(file,'utf8'));}catch(error){if(error?.code!=='ENOENT')throw error;}
    if(expectedVersion!==null&&currentVersion!==expectedVersion)throw Object.assign(new Error('Tallennustila muuttui toisessa istunnossa.'),{statusCode:409,code:'STATE_WRITE_CONFLICT'});
    if(expectedVersion===null&&currentVersion!==null)throw Object.assign(new Error('Tallennustila syntyi toisessa istunnossa.'),{statusCode:409,code:'STATE_WRITE_CONFLICT'});
    const temp=`${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;await fs.writeFile(temp,text,{mode:0o600});await fs.rename(temp,file);return{version:sha(text),mode};
  }
  const {put}=await blobApi();
  try{
    const options={access:'private',addRandomSuffix:false,allowOverwrite:expectedVersion!==null};
    if(expectedVersion!==null)options.ifMatch=expectedVersion;
    const result=await put(blobPath(key),text,options);
    return{version:result?.etag||null,mode};
  }catch(error){
    if(error?.name==='BlobPreconditionFailedError'||/precondition|already exists|overwrite/i.test(String(error?.message||'')))throw Object.assign(new Error('Tallennustila muuttui toisessa istunnossa.'),{statusCode:409,code:'STATE_WRITE_CONFLICT',cause:error});
    throw error;
  }
}

export async function deleteState(key,{expectedVersion=null,envNames=[]}={}){
  const mode=stateBackendMode(envNames);
  if(mode==='unconfigured')throw Object.assign(new Error('Pysyvä Vercel-tallennus ei ole konfiguroitu.'),{statusCode:503,code:'STATE_STORE_UNCONFIGURED'});
  if(mode==='memory')return{deleted:true,mode};
  if(mode==='local'){
    const file=localPath(key);if(expectedVersion!==null){let current=null;try{current=sha(await fs.readFile(file,'utf8'));}catch(error){if(error?.code!=='ENOENT')throw error;}if(current!==expectedVersion)throw Object.assign(new Error('Tallennustila muuttui toisessa istunnossa.'),{statusCode:409,code:'STATE_WRITE_CONFLICT'});}await fs.rm(file,{force:true});return{deleted:true,mode};
  }
  const meta=await exactBlob(key);if(!meta)return{deleted:false,mode};
  const {del}=await blobApi();
  try{await del(meta.url,expectedVersion?{ifMatch:expectedVersion}:{ });return{deleted:true,mode};}
  catch(error){if(error?.name==='BlobPreconditionFailedError')throw Object.assign(new Error('Tallennustila muuttui toisessa istunnossa.'),{statusCode:409,code:'STATE_WRITE_CONFLICT'});throw error;}
}
