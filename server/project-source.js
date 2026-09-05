import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT=path.resolve(process.cwd());
const SAFE_EXT=/\.(?:js|mjs|cjs|ts|tsx|jsx|json|md|css|html|yml|yaml|toml|txt|sh)$/i;
const DENIED=/(^|\/)(?:\.git|\.vercel|node_modules|public|\.anomancer|test-results|\.visual-regression)(?:\/|$)|(^|\/)\.env(?:\.|$)|(?:secret|credential|private[-_]?key|id_rsa|id_ed25519)/i;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');

function safePath(value=''){
  const rel=String(value||'').trim().replace(/\\/g,'/').replace(/^\.\//,'');
  if(!rel||rel.startsWith('/')||rel.includes('\0')||rel.split('/').some(part=>!part||part==='.'||part==='..')||DENIED.test(rel)||!SAFE_EXT.test(rel)){
    throw Object.assign(new Error(`Projektipolku ei ole sallittu: ${rel||'(tyhjä)'}`),{statusCode:400,code:'PROJECT_SOURCE_PATH'});
  }
  const target=path.resolve(ROOT,rel),prefix=`${ROOT}${path.sep}`;
  if(!target.startsWith(prefix))throw Object.assign(new Error('Projektipolku poistuu lähdepuusta.'),{statusCode:400,code:'PROJECT_SOURCE_PATH'});
  return {rel,target};
}

export function projectSourceStatus(env=process.env){
  const production=env.VERCEL==='1';
  return {configured:true,adapter:'local-project-files/v1',readable:true,writable:!production&&String(env.ANOMANCER_PROJECT_WRITE||'1')!=='0',productionImmutable:production,secretsExposed:false,root:'project'};
}

export async function getProjectFile(filePath){
  const {rel,target}=safePath(filePath);
  let content;
  try{content=await fs.readFile(target,'utf8');}catch(error){if(error?.code==='ENOENT')throw Object.assign(new Error(`Projektitiedostoa ei löytynyt: ${rel}`),{statusCode:404,code:'PROJECT_SOURCE_NOT_FOUND'});throw error;}
  return {path:rel,sha:digest(content),content,htmlUrl:'',ref:'local-project'};
}

export async function getProjectHead(){
  const chunks=[];
  for(const rel of ['package.json','vercel.json']){
    try{chunks.push(`${rel}\n${await fs.readFile(path.join(ROOT,rel),'utf8')}`);}catch{}
  }
  return {repo:'local-project',project:'Anomancer',branch:'local-project',ref:'local-project',sha:digest(chunks.join('\n---\n'))};
}

export async function writeProjectFiles({files=[]}={}){
  const status=projectSourceStatus();
  if(!status.writable)throw Object.assign(new Error('Projektitiedostojen kirjoitus on tuotantoruntimessa estetty.'),{statusCode:503,code:'PROJECT_SOURCE_READ_ONLY'});
  const items=(Array.isArray(files)?files:[]).map(item=>({...safePath(item?.path),content:String(item?.content??'')}));
  if(!items.length)throw Object.assign(new Error('Kirjoitettavia projektitiedostoja ei ole.'),{statusCode:400,code:'PROJECT_SOURCE_FILES'});
  for(const item of items){
    await fs.mkdir(path.dirname(item.target),{recursive:true});
    const tmp=`${item.target}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    await fs.writeFile(tmp,item.content,'utf8');
    await fs.rename(tmp,item.target);
  }
  const revision=digest(items.map(item=>`${item.rel}:${digest(item.content)}`).join('|'));
  return {project:'Anomancer',mode:'local-project',files:items.map(item=>item.rel),revision,written:true};
}
