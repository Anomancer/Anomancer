import { getSession, requireCsrf } from '../auth.js';
import { json, readJson, sameOrigin } from '../http.js';
import { listPosts, putFile, deleteFile } from '../content-store.js';
import { parseMarkdown, serializePost, validatePost, newPostPath } from '../content.js';
import { editorialQualityReport } from '../editorial-quality.js';
import { requireWorkspace, workspaceIdFromRequest } from '../workspace-store.js';
import { artifactBoundaryForWorkspace, requireArtifactCapability } from '../artifact-boundary.js';
import { githubPublicationStatus, publishToGitHub, deleteFromGitHub } from '../github-publication.js';

function auth(req,res,mutating=false){
  const session=getSession(req);
  if(!session){json(res,401,{ok:false,error:'AUTH'});return null;}
  if(mutating && (!sameOrigin(req)||!requireCsrf(req,session))){json(res,403,{ok:false,error:'CSRF'});return null;}
  return session;
}

function editorialIssuesForResponse(error){
  if(error?.code!=='EDITORIAL_QUALITY'||!Array.isArray(error?.issues))return [];
  return error.issues.slice(0,12).map(issue=>({
    code:String(issue?.code||'').slice(0,80),
    severity:issue?.severity==='warning'?'warning':'error',
    count:Number.isFinite(Number(issue?.count))?Math.max(0,Math.min(999,Number(issue.count))):0,
    message:String(issue?.message||'').slice(0,400),
    excerpt:String(issue?.excerpt||'').slice(0,160),
  }));
}

function routeKeys(post={}){
  return new Set([post.slug,...(post.aliases||[])].filter(Boolean).map(slug=>`${post.lang}:${slug}`));
}

function parseStoredPosts(files=[]){
  return files.flatMap(file=>{try{return [{...parseMarkdown(file.content,file.path),path:file.path,sha:file.sha}];}catch{return [];}});
}

function assertRouteIsAvailable(post,path,currentPath,files){
  const proposed=routeKeys(post);
  for(const stored of parseStoredPosts(files)){
    if(currentPath&&stored.path===path)continue;
    const conflict=[...routeKeys(stored)].find(key=>proposed.has(key));
    if(conflict)throw Object.assign(new Error(`Julkinen osoite on jo toisen lähetyksen käytössä: ${conflict.split(':').slice(1).join(':')}`),{statusCode:409,code:'PUBLIC_ROUTE_CONFLICT'});
  }
}

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function confirmStoredPost(path,expected){
  for(const delay of [0,40,120]){
    if(delay)await wait(delay);
    const file=(await listPosts()).find(item=>item.path===path);
    if(!file)continue;
    const stored=parseMarkdown(file.content,file.path);
    if(stored.lang===expected.lang&&stored.slug===expected.slug&&Boolean(stored.draft)===Boolean(expected.draft))return{file,stored};
  }
  throw Object.assign(new Error('Tallennus vastaanotettiin, mutta julkaistua tietuetta ei saatu varmennettua takaisin sisältösäilöstä.'),{statusCode:503,code:'CONTENT_PERSISTENCE_UNCONFIRMED'});
}

export default async function handler(req,res){
  if(req.method==='GET'){
    if(!auth(req,res,false)) return;
    try{
      const workspace=await requireWorkspace(workspaceIdFromRequest(req)),artifact=artifactBoundaryForWorkspace(workspace);
      if(!artifact.contentReadable)return json(res,200,{ok:true,workspace,artifact,posts:[]});
      const files=await listPosts({allowLocalFallback:true});
      const posts=files.map(f=>{
        try{return {...parseMarkdown(f.content,f.path),path:f.path,sha:f.sha,htmlUrl:f.htmlUrl};}
        catch(e){return {path:f.path,sha:f.sha,parseError:e.message,title:f.path,lang:f.path.includes('/en/')?'en':'fi',draft:true};}
      }).sort((a,b)=>Number(Boolean(b.pinned))-Number(Boolean(a.pinned))||String(b.date||'').localeCompare(String(a.date||''))||String(a.title).localeCompare(String(b.title)));
      return json(res,200,{ok:true,workspace,artifact,posts});
    }catch(e){return json(res,e.statusCode||500,{ok:false,error:e.code||'CONTENT_STORE',message:e.message});}
  }
  if(req.method==='POST'){
    if(!auth(req,res,true)) return;
    try{
      const workspace=await requireWorkspace(workspaceIdFromRequest(req));
      const body=await readJson(req);
      const post=validatePost(body.post||{});
      const artifact=requireArtifactCapability(workspace,'content.write');
      if(!post.draft)requireArtifactCapability(workspace,'publication.publish');
      const editorial=post.draft?null:editorialQualityReport(post);
      const currentPath=String(body.path||'').trim();
      const path=currentPath || newPostPath(post);
      if(!/^content\/(fi|en)\/[A-Za-z0-9._-]+\.md$/.test(path)) return json(res,400,{ok:false,error:'PATH'});
      const before=await listPosts();
      assertRouteIsAvailable(post,path,currentPath,before);
      const content=serializePost(post);
      let result,confirmed=null;
      if(!post.draft && githubPublicationStatus().configured){
        result=await publishToGitHub(path,content,{sha:body.sha||undefined,message:`content: publish ${post.title}`});
        confirmed={file:result,stored:post};
      }else{
        result=await putFile(path,content,{sha:body.sha||undefined,message:`content: save draft ${post.title}`});
        confirmed=await confirmStoredPost(path,post);
      }
      const publicPath=post.draft?'':`${post.lang==='en'?'/dispatches':'/lahetykset'}/${post.slug}`;
      return json(res,200,{ok:true,workspace,artifact,path,sha:confirmed.file.sha||result.sha,commitSha:result.commitSha,htmlUrl:result.htmlUrl,persisted:true,published:!confirmed.stored.draft,publication:result.backend==='github'?{backend:'github',repository:result.repository,branch:result.branch,deploymentTriggered:true}:null,post:{...post,path,sha:confirmed.file.sha||result.sha,htmlUrl:result.htmlUrl},publicPath,editorialWarnings:editorial?.issues?.filter(issue=>issue.severity==='warning')||[]});
    }catch(e){return json(res,e.statusCode||500,{ok:false,error:e.code||'SAVE',message:e.message,issues:editorialIssuesForResponse(e)});}
  }
  if(req.method==='DELETE'){
    if(!auth(req,res,true)) return;
    try{
      const workspace=await requireWorkspace(workspaceIdFromRequest(req)),artifact=requireArtifactCapability(workspace,'content.write');
      const body=await readJson(req,50_000); const path=String(body.path||''); const sha=String(body.sha||'');
      if(!/^content\/(fi|en)\/[A-Za-z0-9._-]+\.md$/.test(path)) return json(res,400,{ok:false,error:'PATH'});
      const result=githubPublicationStatus().configured&&!String(body.path||'').includes('/drafts/')
        ? await deleteFromGitHub(path,sha,{message:`content: delete ${path}`})
        : await deleteFile(path,sha,{message:`content: delete ${path}`});
      return json(res,200,{ok:true,workspace,artifact,commitSha:result.commitSha,publication:result.backend==='github'?{backend:'github',repository:result.repository,branch:result.branch,deploymentTriggered:true}:null});
    }catch(e){return json(res,e.statusCode||500,{ok:false,error:e.code||'DELETE',message:e.message});}
  }
  return json(res,405,{ok:false,error:'METHOD'});
}
