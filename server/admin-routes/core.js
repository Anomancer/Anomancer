import { getSession, requireCsrf } from '../auth.js';
import { json, readJson, sameOrigin } from '../http.js';
import { publicCoreSnapshot } from '../core-registry.js';
import { modelRouterStatus } from '../model-router.js';
import { listWorkspaces, upsertWorkspace, archiveWorkspace, workspaceStoreStatus } from '../workspace-store.js';

function auth(req,res,mut=false){
  const session=getSession(req);
  if(!session){json(res,401,{ok:false,error:'AUTH'});return null;}
  if(mut&&(!sameOrigin(req)||!requireCsrf(req,session))){json(res,403,{ok:false,error:'CSRF'});return null;}
  return session;
}
function resourceOf(req){
  try{return new URL(req.url||'/api/admin/core','http://anomancer.local').searchParams.get('resource')||'core';}
  catch{return 'core';}
}
function publicWorkspaceState(state){return{format:state.format,coreVersion:state.coreVersion,revision:state.revision,updatedAt:state.updatedAt};}

async function workspaceHandler(req,res){
  if(req.method==='GET'){
    if(!auth(req,res))return;
    try{
      const data=await listWorkspaces({includeArchived:true});
      return json(res,200,{ok:true,builtins:data.builtins,custom:data.custom,all:data.all,state:publicWorkspaceState(data.state),store:workspaceStoreStatus()});
    }catch(e){return json(res,e.statusCode||500,{ok:false,error:e.code||'WORKSPACE_STORE',message:e.message,store:workspaceStoreStatus()});}
  }
  if(req.method==='POST'||req.method==='PUT'){
    if(!auth(req,res,true))return;
    try{
      const body=await readJson(req,100_000);
      const result=await upsertWorkspace(body.workspace||body,{expectedRevision:body.expectedRevision});
      const data=await listWorkspaces({includeArchived:true});
      return json(res,200,{ok:true,workspace:result.workspace,builtins:data.builtins,custom:data.custom,all:data.all,state:publicWorkspaceState(result.state),store:workspaceStoreStatus()});
    }catch(e){return json(res,e.statusCode||500,{ok:false,error:e.code||'WORKSPACE_SAVE',message:e.message});}
  }
  if(req.method==='DELETE'){
    if(!auth(req,res,true))return;
    try{
      const body=await readJson(req,100_000);
      const result=await archiveWorkspace(String(body.id||''),{expectedRevision:body.expectedRevision,archived:body.archived!==false});
      const data=await listWorkspaces({includeArchived:true});
      return json(res,200,{ok:true,workspace:result.workspace,builtins:data.builtins,custom:data.custom,all:data.all,state:publicWorkspaceState(result.state),store:workspaceStoreStatus()});
    }catch(e){return json(res,e.statusCode||500,{ok:false,error:e.code||'WORKSPACE_ARCHIVE',message:e.message});}
  }
  return json(res,405,{ok:false,error:'METHOD'});
}

export default async function handler(req,res){
  if(resourceOf(req)==='workspaces')return workspaceHandler(req,res);
  if(req.method!=='GET')return json(res,405,{ok:false,error:'METHOD'});
  if(!getSession(req))return json(res,401,{ok:false,error:'AUTH'});
  return json(res,200,{ok:true,core:publicCoreSnapshot({modelRouter:modelRouterStatus()})});
}
