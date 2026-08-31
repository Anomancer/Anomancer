import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT=path.resolve(process.cwd());
const PREFIX=String(process.env.ANOMANCER_CONTENT_BLOB_PREFIX||'anomancer-content').replace(/^\/+|\/+$/g,'');
const CONTENT_RX=/^content\/(fi|en)\/[A-Za-z0-9._-]+\.md$/;
const MEDIA_RX=/^media\/uploads\/\d{4}\/\d{2}\/[A-Za-z0-9._-]+$/;
const clean=v=>String(v??'').trim();
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');

export function contentStoreMode(){
  const forced=clean(process.env.ANOMANCER_CONTENT_STORE).toLowerCase();
  if(forced==='local')return'local';
  if(forced==='blob'||forced==='vercel-blob')return process.env.BLOB_READ_WRITE_TOKEN?'blob':'unconfigured';
  if(process.env.BLOB_READ_WRITE_TOKEN)return'blob';
  if(process.env.VERCEL==='1')return'unconfigured';
  return'local';
}
export function contentStoreStatus(){const mode=contentStoreMode();return{mode,configured:mode!=='unconfigured',durable:mode==='blob'||mode==='local',writable:mode==='blob'||mode==='local',sourceOfTruth:mode==='blob'?'vercel-private-blob':mode==='unconfigured'?'deployment-files-readonly':'local-project-files',publicReadFallback:mode==='unconfigured'?'deployment-files':null,publicBuild:'dynamic-renderer',secretsExposed:false};}
function assertContentPath(value){const p=clean(value).replace(/\\/g,'/');if(!CONTENT_RX.test(p))throw Object.assign(new Error('Sisältöpolku ei ole sallittu.'),{statusCode:400,code:'CONTENT_PATH'});return p;}
function assertMediaPath(value){const p=clean(value).replace(/\\/g,'/');if(!MEDIA_RX.test(p))throw Object.assign(new Error('Mediapolku ei ole sallittu.'),{statusCode:400,code:'MEDIA_PATH'});return p;}
function localFile(rel){const target=path.resolve(ROOT,rel),prefix=`${ROOT}${path.sep}`;if(!target.startsWith(prefix))throw Object.assign(new Error('Polku poistuu projektista.'),{statusCode:400,code:'CONTENT_PATH'});return target;}
function blobPath(rel){return `${PREFIX}/${rel}`;}
function tombstonePath(rel){return `${PREFIX}/tombstones/${Buffer.from(rel).toString('base64url')}.json`;}
async function blobApi(){try{return await import('@vercel/blob');}catch(error){throw Object.assign(new Error('Vercel Blob -kirjasto puuttuu. Aja npm install.'),{statusCode:503,code:'BLOB_PACKAGE_MISSING',cause:error});}}
async function listAll(prefix){const {list}=await blobApi();const rows=[];let cursor;do{const r=await list({prefix,limit:1000,cursor});rows.push(...(r.blobs||[]));cursor=r.cursor;}while(cursor);return rows;}
async function exactBlob(rel){const pathname=blobPath(rel),rows=await listAll(pathname);return rows.find(x=>x.pathname===pathname)||null;}
async function blobText(meta){const {get}=await blobApi(),r=await get(meta.url,{access:'private'});if(!r)return'';return new Response(r.stream).text();}
async function localPosts(){const out=[];for(const lang of ['fi','en']){const dir=localFile(`content/${lang}`);let names=[];try{names=await fs.readdir(dir);}catch(error){if(error?.code==='ENOENT')continue;throw error;}for(const name of names.filter(n=>/^[A-Za-z0-9._-]+\.md$/.test(n))){const rel=`content/${lang}/${name}`,content=await fs.readFile(localFile(rel),'utf8');out.push({path:rel,sha:digest(content),content,htmlUrl:'',backend:'local'});}}return out;}
async function tombstones(){if(contentStoreMode()!=='blob')return new Set();const rows=await listAll(`${PREFIX}/tombstones/`),set=new Set();for(const meta of rows){try{const data=JSON.parse(await blobText(meta));if(CONTENT_RX.test(data.path||''))set.add(data.path);}catch{}}return set;}

export async function listPosts(){
  const mode=contentStoreMode();
  const base=await localPosts();if(mode==='local'||mode==='unconfigured')return base;
  const merged=new Map(base.map(item=>[item.path,item])),deleted=await tombstones(),rows=await listAll(`${PREFIX}/content/`);
  for(const meta of rows){const rel=meta.pathname.slice(`${PREFIX}/`.length);if(!CONTENT_RX.test(rel))continue;const content=await blobText(meta);merged.set(rel,{path:rel,sha:meta.etag||digest(content),content,htmlUrl:'',backend:'blob'});}
  for(const rel of deleted)merged.delete(rel);
  return [...merged.values()];
}

export async function putFile(filePath,content,{sha='',message=''}={}){
  const rel=assertContentPath(filePath),text=String(content??''),mode=contentStoreMode();
  if(mode==='unconfigured')throw Object.assign(new Error('Vercel Blob ei ole konfiguroitu.'),{statusCode:503,code:'CONTENT_STORE_UNCONFIGURED'});
  if(mode==='local'){
    const file=localFile(rel);await fs.mkdir(path.dirname(file),{recursive:true});let current='';try{current=await fs.readFile(file,'utf8');}catch(error){if(error?.code!=='ENOENT')throw error;}
    if(sha&&current&&digest(current)!==sha)throw Object.assign(new Error('Sisältö muuttui toisessa istunnossa.'),{statusCode:409,code:'CONTENT_REVISION_CONFLICT'});
    await fs.writeFile(file,text,'utf8');const next=digest(text);return{sha:next,commitSha:next,htmlUrl:'',message,backend:'local'};
  }
  const meta=await exactBlob(rel);if(sha&&meta?.etag&&sha!==meta.etag)throw Object.assign(new Error('Sisältö muuttui toisessa istunnossa.'),{statusCode:409,code:'CONTENT_REVISION_CONFLICT'});
  const {put,del}=await blobApi();const options={access:'private',addRandomSuffix:false,allowOverwrite:Boolean(meta)};if(meta?.etag)options.ifMatch=meta.etag;
  const result=await put(blobPath(rel),text,options);
  const tomb=await listAll(tombstonePath(rel));const old=tomb.find(x=>x.pathname===tombstonePath(rel));if(old)await del(old.url);
  const next=result?.etag||digest(text);return{sha:next,commitSha:next,htmlUrl:'',message,backend:'blob'};
}

export async function deleteFile(filePath,sha='',{message=''}={}){
  const rel=assertContentPath(filePath),mode=contentStoreMode();if(mode==='unconfigured')throw Object.assign(new Error('Vercel Blob ei ole konfiguroitu.'),{statusCode:503,code:'CONTENT_STORE_UNCONFIGURED'});
  if(mode==='local'){const file=localFile(rel);if(sha){try{const current=await fs.readFile(file,'utf8');if(digest(current)!==sha)throw Object.assign(new Error('Sisältö muuttui toisessa istunnossa.'),{statusCode:409,code:'CONTENT_REVISION_CONFLICT'});}catch(error){if(error?.code!=='ENOENT')throw error;}}await fs.rm(file,{force:true});const id=digest(`${rel}:${Date.now()}`);return{commitSha:id,message,backend:'local'};}
  const meta=await exactBlob(rel);if(sha&&meta?.etag&&sha!==meta.etag)throw Object.assign(new Error('Sisältö muuttui toisessa istunnossa.'),{statusCode:409,code:'CONTENT_REVISION_CONFLICT'});
  const {del,put}=await blobApi();if(meta)await del(meta.url,meta.etag?{ifMatch:meta.etag}:{});const stamp={path:rel,deletedAt:new Date().toISOString()};await put(tombstonePath(rel),JSON.stringify(stamp),{access:'private',addRandomSuffix:false,allowOverwrite:true});const id=digest(JSON.stringify(stamp));return{commitSha:id,message,backend:'blob'};
}

export async function putBase64File(filePath,base64,{contentType='application/octet-stream',message=''}={}){
  const rel=assertMediaPath(filePath),bytes=Buffer.from(String(base64||''),'base64'),mode=contentStoreMode();if(mode==='unconfigured')throw Object.assign(new Error('Vercel Blob ei ole konfiguroitu.'),{statusCode:503,code:'CONTENT_STORE_UNCONFIGURED'});
  if(mode==='local'){const file=localFile(rel);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,bytes);const id=digest(bytes);return{sha:id,commitSha:id,htmlUrl:'',url:`/${rel}`,message,backend:'local'};}
  const {put}=await blobApi();const result=await put(blobPath(rel),bytes,{access:'private',contentType,addRandomSuffix:false,allowOverwrite:false});const id=result?.etag||digest(bytes);return{sha:id,commitSha:id,htmlUrl:'',url:`/${rel}`,message,backend:'blob'};
}

export async function readMedia(filePath){
  const rel=assertMediaPath(filePath),mode=contentStoreMode();
  if(mode==='local'||mode==='unconfigured'){try{const body=await fs.readFile(localFile(rel));return{body,contentType:rel.endsWith('.png')?'image/png':rel.endsWith('.webp')?'image/webp':'image/jpeg',etag:digest(body)};}catch(error){if(error?.code==='ENOENT')return null;throw error;}}
  const meta=await exactBlob(rel);if(!meta)return null;const {get}=await blobApi(),r=await get(meta.url,{access:'private'});if(!r)return null;return{stream:r.stream,contentType:r.blob?.contentType||meta.contentType||'application/octet-stream',etag:r.blob?.etag||meta.etag||''};
}
