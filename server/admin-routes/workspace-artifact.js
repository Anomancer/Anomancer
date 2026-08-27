import { getSession, requireCsrf } from '../auth.js';
import { json, readJson, sameOrigin } from '../http.js';
import { requireWorkspace, workspaceIdFromRequest } from '../workspace-store.js';
import { requireArtifactCapability } from '../artifact-boundary.js';
import { loadPrivateArtifact, savePrivateArtifact, privateArtifactStoreStatus } from '../private-artifact-store.js';

function auth(req,res,mutating=false){
  const session=getSession(req);
  if(!session){json(res,401,{ok:false,error:'AUTH'});return null;}
  if(mutating&&(!sameOrigin(req)||!requireCsrf(req,session))){json(res,403,{ok:false,error:'CSRF'});return null;}
  return session;
}

export default async function handler(req,res){
  const workspaceId=workspaceIdFromRequest(req);
  if(req.method==='GET'){
    if(!auth(req,res,false))return;
    try{
      const workspace=await requireWorkspace(workspaceId),artifact=requireArtifactCapability(workspace,'artifact.private.read');
      const state=await loadPrivateArtifact({workspaceId:workspace.id});
      return json(res,200,{ok:true,workspace,artifact,state,store:privateArtifactStoreStatus(workspace.id),humanFinalAuthority:true,publicationEnabled:false});
    }catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'ARTIFACT_LOAD',message:error.message,store:privateArtifactStoreStatus(workspaceId)});}
  }
  if(req.method==='POST'||req.method==='PUT'){
    if(!auth(req,res,true))return;
    try{
      const workspace=await requireWorkspace(workspaceId),artifact=requireArtifactCapability(workspace,'artifact.private.write');
      const body=await readJson(req,1_800_000);
      const state=await savePrivateArtifact(body.project||{}, {workspaceId:workspace.id,expectedRevision:body.expectedRevision});
      return json(res,200,{ok:true,workspace,artifact,state,store:privateArtifactStoreStatus(workspace.id),saved:true,publicationEnabled:false,humanFinalAuthority:true});
    }catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'ARTIFACT_SAVE',message:error.message});}
  }
  return json(res,405,{ok:false,error:'METHOD'});
}
