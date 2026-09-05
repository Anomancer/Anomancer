import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { githubPublicationStatus, publishToGitHub, deleteFromGitHub, readFromGitHub, publishMediaToGitHub, readMediaFromGitHub, listFromGitHub } from './github-publication.js';

const ROOT=path.resolve(process.cwd());
const CONTENT_RX=/^content\/(fi|en)\/[A-Za-z0-9._-]+\.md$/;
const MEDIA_RX=/^media\/uploads\/\d{4}\/\d{2}\/[A-Za-z0-9._-]+$/;
const clean=v=>String(v??'').trim();
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');

export function contentStoreMode(){
  const forced=clean(process.env.ANOMANCER_CONTENT_STORE).toLowerCase();
  if(forced==='local')return'local';
  if(forced==='github')return githubPublicationStatus().configured?'github':'unconfigured';
  if(forced==='blob'||forced==='vercel-blob')return githubPublicationStatus().configured?'github':'unconfigured';
  if(githubPublicationStatus().configured)return'github';
  if(process.env.VERCEL==='1')return'unconfigured';
  return'local';
}
export function contentStoreStatus(){const mode=contentStoreMode();return{mode,configured:mode!=='unconfigured',durable:mode==='github'||mode==='local',writable:mode==='github'||mode==='local',sourceOfTruth:mode==='github'?'github':mode==='unconfigured'?'deployment-files-readonly':'local-project-files',publicReadFallback:mode==='unconfigured'?'deployment-files':null,publicBuild:'dynamic-renderer',secretsExposed:false};}
function assertContentPath(value){const p=clean(value).replace(/\\/g,'/');if(!CONTENT_RX.test(p))throw Object.assign(new Error('Sisältöpolku ei ole sallittu.'),{statusCode:400,code:'CONTENT_PATH'});return p;}
function assertMediaPath(value){const p=clean(value).replace(/\\/g,'/');if(!MEDIA_RX.test(p))throw Object.assign(new Error('Mediapolku ei ole sallittu.'),{statusCode:400,code:'MEDIA_PATH'});return p;}
function localFile(rel){const target=path.resolve(ROOT,rel),prefix=`${ROOT}${path.sep}`;if(!target.startsWith(prefix))throw Object.assign(new Error('Polku poistuu projektista.'),{statusCode:400,code:'CONTENT_PATH'});return target;}
async function localPosts(){const out=[];for(const lang of ['fi','en']){const dir=localFile(`content/${lang}`);let names=[];try{names=await fs.readdir(dir);}catch(error){if(error?.code==='ENOENT')continue;throw error;}for(const name of names.filter(n=>/^[A-Za-z0-9._-]+\.md$/.test(n))){const rel=`content/${lang}/${name}`,content=await fs.readFile(localFile(rel),'utf8');out.push({path:rel,sha:digest(content),content,htmlUrl:'',backend:'local'});}}return out;}

export async function listPosts({allowLocalFallback=false}={}){
  const mode=contentStoreMode();
  if(mode==='local'||mode==='unconfigured')return localPosts();
  try{
    const entries=(await Promise.all(['fi','en'].map(lang=>listFromGitHub(`content/${lang}`)))).flat();
    const files=[];
    for(const entry of entries){
      if(!CONTENT_RX.test(entry.path))continue;
      const file=await readFromGitHub(entry.path);
      if(file)files.push(file);
    }
    return files;
  }catch(error){
    if(!allowLocalFallback)throw error;
    console.error('GitHub content read degraded; serving deployment fallback',error);
    return localPosts();
  }
}

export async function putFile(filePath,content,{sha='',message=''}={}){
  const rel=assertContentPath(filePath),text=String(content??''),mode=contentStoreMode();
  if(mode==='unconfigured')throw Object.assign(new Error('GitHub-julkaisua ei ole konfiguroitu.'),{statusCode:503,code:'CONTENT_STORE_UNCONFIGURED'});
  if(mode==='github')return publishToGitHub(rel,text,{sha,message});
  const file=localFile(rel);await fs.mkdir(path.dirname(file),{recursive:true});let current='';try{current=await fs.readFile(file,'utf8');}catch(error){if(error?.code!=='ENOENT')throw error;}
  if(sha&&current&&digest(current)!==sha)throw Object.assign(new Error('Sisältö muuttui toisessa istunnossa.'),{statusCode:409,code:'CONTENT_REVISION_CONFLICT'});
  await fs.writeFile(file,text,'utf8');const next=digest(text);return{sha:next,commitSha:next,htmlUrl:'',message,backend:'local'};
}

export async function deleteFile(filePath,sha='',{message=''}={}){
  const rel=assertContentPath(filePath),mode=contentStoreMode();
  if(mode==='unconfigured')throw Object.assign(new Error('GitHub-julkaisua ei ole konfiguroitu.'),{statusCode:503,code:'CONTENT_STORE_UNCONFIGURED'});
  if(mode==='github')return deleteFromGitHub(rel,sha,{message});
  const file=localFile(rel);if(sha){try{const current=await fs.readFile(file,'utf8');if(digest(current)!==sha)throw Object.assign(new Error('Sisältö muuttui toisessa istunnossa.'),{statusCode:409,code:'CONTENT_REVISION_CONFLICT'});}catch(error){if(error?.code!=='ENOENT')throw error;}}
  await fs.rm(file,{force:true});const id=digest(`${rel}:${Date.now()}`);return{commitSha:id,message,backend:'local'};
}

export async function putBase64File(filePath,base64,{contentType='application/octet-stream',message=''}={}){
  const rel=assertMediaPath(filePath),bytes=Buffer.from(String(base64||''),'base64'),mode=contentStoreMode();
  if(mode==='unconfigured')throw Object.assign(new Error('GitHub-julkaisua ei ole konfiguroitu.'),{statusCode:503,code:'CONTENT_STORE_UNCONFIGURED'});
  if(mode==='github')return publishMediaToGitHub(rel,bytes,{contentType,message});
  const file=localFile(rel);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,bytes);const id=digest(bytes);return{sha:id,commitSha:id,htmlUrl:'',url:`/${rel}`,message,backend:'local'};
}

export async function readMedia(filePath){
  const rel=assertMediaPath(filePath),mode=contentStoreMode();
  if(mode==='github')return readMediaFromGitHub(rel);
  try{const body=await fs.readFile(localFile(rel));return{body,contentType:rel.endsWith('.png')?'image/png':rel.endsWith('.webp')?'image/webp':'image/jpeg',etag:digest(body)};}catch(error){if(error?.code==='ENOENT')return null;throw error;}
}
