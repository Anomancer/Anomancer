const clean=v=>String(v??'').trim();
const OWNER_RX=/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/;
const REPO_RX=/^[A-Za-z0-9._-]{1,100}$/;
const BRANCH_RX=/^[A-Za-z0-9._\/-]{1,255}$/;
const CONTENT_PATH_RX=/^content\/(fi|en)\/[A-Za-z0-9._-]+\.md$/;
const MEDIA_PATH_RX=/^media\/uploads\/\d{4}\/\d{2}\/[A-Za-z0-9._-]+$/;
const STATE_PATH_RX=/^\.anomancer\/state\/[A-Za-z0-9._\/-]+\.json$/;
const apiBase='https://api.github.com';

function config(){
  const token=clean(process.env.GITHUB_TOKEN);
  const owner=clean(process.env.GITHUB_OWNER||process.env.GITHUB_REPOSITORY_OWNER);
  const repo=clean(process.env.GITHUB_REPO||process.env.GITHUB_REPOSITORY?.split('/')[1]);
  const branch=clean(process.env.GITHUB_BRANCH||'master');
  const configured=Boolean(token&&owner&&repo&&branch&&OWNER_RX.test(owner)&&REPO_RX.test(repo)&&BRANCH_RX.test(branch));
  return{token,owner,repo,branch,configured};
}

export function githubPublicationStatus(){
  const c=config();
  return{configured:c.configured,backend:'github',repository:c.configured?`${c.owner}/${c.repo}`:'',branch:c.configured?c.branch:'',secretsExposed:false,automaticVercelDeploy:c.configured};
}

function assertConfigured(){
  const c=config();
  if(!c.configured)throw Object.assign(new Error('GitHub-julkaisua ei ole konfiguroitu. Aseta GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO ja GITHUB_BRANCH.'),{statusCode:503,code:'GITHUB_PUBLICATION_UNCONFIGURED'});
  return c;
}
function assertPath(filePath,rx){const p=clean(filePath).replace(/\\/g,'/');if(!rx.test(p))throw Object.assign(new Error('GitHub-polku ei ole sallittu.'),{statusCode:400,code:'CONTENT_PATH'});return p;}
function headers(token){return{'Accept':'application/vnd.github+json','Authorization':`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json','User-Agent':'Anomancer-Lighthouse'};}
function endpoint(c,p){return`${apiBase}/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${p.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(c.branch)}`;}
async function request(c,url,options={}){
  const response=await fetch(url,{...options,headers:{...headers(c.token),...(options.headers||{})}});
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{};}catch{data={message:text};}
  if(!response.ok){const message=data?.message||`GitHub API palautti HTTP ${response.status}`;throw Object.assign(new Error(message),{statusCode:response.status===404?404:502,code:response.status===404?'GITHUB_NOT_FOUND':'GITHUB_API_ERROR',githubStatus:response.status});}
  return data;
}

async function readGitHubPath(filePath,rx){
  const c=assertConfigured(),rel=assertPath(filePath,rx);
  try{
    const data=await request(c,endpoint(c,rel));
    const encoded=String(data?.content||'').replace(/\s/g,'');
    return{path:rel,sha:data?.sha||'',content:Buffer.from(encoded,'base64').toString('utf8'),htmlUrl:data?.html_url||'',backend:'github'};
  }catch(error){if(error.code==='GITHUB_NOT_FOUND')return null;throw error;}
}

async function writeGitHubPath(filePath,content,{sha='',message='',rx=CONTENT_PATH_RX}={}){
  const c=assertConfigured(),rel=assertPath(filePath,rx),text=String(content??'');
  let existing=null;
  try{existing=await request(c,endpoint(c,rel));}catch(error){if(error.code!=='GITHUB_NOT_FOUND')throw error;}
  if(sha&&existing?.sha&&sha!==existing.sha)throw Object.assign(new Error('GitHub-sisältö muuttui toisessa istunnossa.'),{statusCode:409,code:'CONTENT_REVISION_CONFLICT'});
  const body={message:clean(message)||`content: publish ${rel}`,content:Buffer.from(text,'utf8').toString('base64'),branch:c.branch};
  if(existing?.sha)body.sha=existing.sha;
  const data=await request(c,endpoint(c,rel),{method:'PUT',body:JSON.stringify(body)});
  return{sha:data?.content?.sha||existing?.sha||'',commitSha:data?.commit?.sha||'',htmlUrl:data?.content?.html_url||data?.commit?.html_url||'',message:body.message,backend:'github',repository:`${c.owner}/${c.repo}`,branch:c.branch};
}

async function writeGitHubBytes(filePath,bytes,{sha='',message='',contentType='application/octet-stream'}={}){
  const result=await writeGitHubPath(filePath,Buffer.from(bytes).toString('utf8'),{sha,message,rx:MEDIA_PATH_RX});
  return{...result,contentType};
}

async function deleteGitHubPath(filePath,sha='',{message='',rx=CONTENT_PATH_RX}={}){
  const c=assertConfigured(),rel=assertPath(filePath,rx);
  let existing=null;
  try{existing=await request(c,endpoint(c,rel));}catch(error){if(error.code==='GITHUB_NOT_FOUND')return{commitSha:'',backend:'github',repository:`${c.owner}/${c.repo}`,branch:c.branch};throw error;}
  if(sha&&existing?.sha&&sha!==existing.sha)throw Object.assign(new Error('GitHub-sisältö muuttui toisessa istunnossa.'),{statusCode:409,code:'CONTENT_REVISION_CONFLICT'});
  const body={message:clean(message)||`content: delete ${rel}`,sha:existing.sha,branch:c.branch};
  const data=await request(c,endpoint(c,rel),{method:'DELETE',body:JSON.stringify(body)});
  return{commitSha:data?.commit?.sha||'',backend:'github',repository:`${c.owner}/${c.repo}`,branch:c.branch};
}

export async function publishToGitHub(filePath,content,options={}){return writeGitHubPath(filePath,content,{...options,rx:CONTENT_PATH_RX});}
export async function deleteFromGitHub(filePath,sha='',options={}){return deleteGitHubPath(filePath,sha,{...options,rx:CONTENT_PATH_RX});}
export async function readFromGitHub(filePath){return readGitHubPath(filePath,CONTENT_PATH_RX);}
export async function publishMediaToGitHub(filePath,bytes,options={}){
  const c=assertConfigured(),rel=assertPath(filePath,MEDIA_PATH_RX),payload=Buffer.from(bytes);
  let existing=null;
  try{existing=await request(c,endpoint(c,rel));}catch(error){if(error.code!=='GITHUB_NOT_FOUND')throw error;}
  if(options.sha&&existing?.sha&&options.sha!==existing.sha)throw Object.assign(new Error('GitHub-media muuttui toisessa istunnossa.'),{statusCode:409,code:'CONTENT_REVISION_CONFLICT'});
  const body={message:clean(options.message)||`media: publish ${rel}`,content:payload.toString('base64'),branch:c.branch};
  if(existing?.sha)body.sha=existing.sha;
  const data=await request(c,endpoint(c,rel),{method:'PUT',body:JSON.stringify(body)});
  return{sha:data?.content?.sha||existing?.sha||'',commitSha:data?.commit?.sha||'',htmlUrl:data?.content?.html_url||'',url:`/${rel}`,contentType:options.contentType||'application/octet-stream',message:body.message,backend:'github',repository:`${c.owner}/${c.repo}`,branch:c.branch};
}
export async function readMediaFromGitHub(filePath){
  const c=assertConfigured(),rel=assertPath(filePath,MEDIA_PATH_RX);
  try{
    const data=await request(c,endpoint(c,rel));
    const encoded=String(data?.content||'').replace(/\s/g,'');
    return{body:Buffer.from(encoded,'base64'),contentType:'application/octet-stream',etag:data?.sha||'',htmlUrl:data?.html_url||''};
  }catch(error){if(error.code==='GITHUB_NOT_FOUND')return null;throw error;}
}
export async function readStateFromGitHub(filePath){return readGitHubPath(filePath,STATE_PATH_RX);}
export async function writeStateToGitHub(filePath,content,options={}){return writeGitHubPath(filePath,content,{...options,rx:STATE_PATH_RX});}
export async function deleteStateFromGitHub(filePath,sha='',options={}){return deleteGitHubPath(filePath,sha,{...options,rx:STATE_PATH_RX});}
export async function listFromGitHub(prefix='content/'){
  const c=assertConfigured(),rel=clean(prefix).replace(/^\/+|\/+$/g,'');
  if(!rel)throw Object.assign(new Error('GitHub-listan polku puuttuu.'),{statusCode:400,code:'CONTENT_PATH'});
  const data=await request(c,`${apiBase}/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${rel.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(c.branch)}`);
  return(Array.isArray(data)?data:[]).filter(item=>item?.type==='file').map(item=>({path:item.path,sha:item.sha,htmlUrl:item.html_url||'',backend:'github'}));
}
