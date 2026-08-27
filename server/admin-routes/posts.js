import { getSession, requireCsrf } from '../auth.js';
import { json, readJson, sameOrigin } from '../http.js';
import { listPosts, putFile, deleteFile } from '../github.js';
import { parseMarkdown, serializePost, validatePost, newPostPath } from '../content.js';

function auth(req,res,mutating=false){
  const session=getSession(req);
  if(!session){json(res,401,{ok:false,error:'AUTH'});return null;}
  if(mutating && (!sameOrigin(req)||!requireCsrf(req,session))){json(res,403,{ok:false,error:'CSRF'});return null;}
  return session;
}

export default async function handler(req,res){
  if(req.method==='GET'){
    if(!auth(req,res,false)) return;
    try{
      const files=await listPosts();
      const posts=files.map(f=>{
        try{return {...parseMarkdown(f.content,f.path),path:f.path,sha:f.sha,htmlUrl:f.htmlUrl};}
        catch(e){return {path:f.path,sha:f.sha,parseError:e.message,title:f.path,lang:f.path.includes('/en/')?'en':'fi',draft:true};}
      }).sort((a,b)=>Number(Boolean(b.pinned))-Number(Boolean(a.pinned))||String(b.date||'').localeCompare(String(a.date||''))||String(a.title).localeCompare(String(b.title)));
      return json(res,200,{ok:true,posts});
    }catch(e){return json(res,e.statusCode||500,{ok:false,error:e.code||'GITHUB',message:e.message});}
  }
  if(req.method==='POST'){
    if(!auth(req,res,true)) return;
    try{
      const body=await readJson(req);
      const post=validatePost(body.post||{});
      const path=String(body.path||'').trim() || newPostPath(post);
      if(!/^content\/(fi|en)\/[A-Za-z0-9._-]+\.md$/.test(path)) return json(res,400,{ok:false,error:'PATH'});
      const content=serializePost(post);
      const result=await putFile(path,content,{sha:body.sha||undefined,message:`content: ${post.draft?'save draft':'publish'} ${post.title}`});
      return json(res,200,{ok:true,path,sha:result.sha,commitSha:result.commitSha,htmlUrl:result.htmlUrl,published:!post.draft});
    }catch(e){return json(res,e.statusCode||500,{ok:false,error:e.code||'SAVE',message:e.message});}
  }
  if(req.method==='DELETE'){
    if(!auth(req,res,true)) return;
    try{
      const body=await readJson(req,50_000); const path=String(body.path||''); const sha=String(body.sha||'');
      if(!/^content\/(fi|en)\/[A-Za-z0-9._-]+\.md$/.test(path)) return json(res,400,{ok:false,error:'PATH'});
      const result=await deleteFile(path,sha,{message:`content: delete ${path}`});
      return json(res,200,{ok:true,commitSha:result.commitSha});
    }catch(e){return json(res,e.statusCode||500,{ok:false,error:e.code||'DELETE',message:e.message});}
  }
  return json(res,405,{ok:false,error:'METHOD'});
}
