import { getSession, requireCsrf } from '../auth.js';
import { json, readJson, sameOrigin } from '../http.js';
import { listCapabilityPlugins, getCapabilityPlugin } from '../capability-registry.js';
import { runNanomancer, nanomancerStatus } from '../nanomancer.js';
import { requireWorkspace, workspaceIdFromRequest } from '../workspace-store.js';

function auth(req,res,mut=false){const session=getSession(req);if(!session){json(res,401,{ok:false,error:'AUTH'});return null;}if(mut&&(!sameOrigin(req)||!requireCsrf(req,session))){json(res,403,{ok:false,error:'CSRF'});return null;}return session;}
export default async function handler(req,res){
  const workspaceId=workspaceIdFromRequest(req);
  if(req.method==='GET'){if(!auth(req,res))return;try{const workspace=await requireWorkspace(workspaceId,{allowArchived:true});return json(res,200,{ok:true,workspace,capabilities:listCapabilityPlugins(),nanomancer:nanomancerStatus(),humanApprovalForPersistence:true});}catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'CAPABILITY_REGISTRY',message:error.message});}}
  if(req.method==='POST'){if(!auth(req,res,true))return;try{const workspace=await requireWorkspace(workspaceId),body=await readJson(req,700_000),pluginId=String(body.pluginId||'nanomancer');if(pluginId!=='nanomancer'||!getCapabilityPlugin(pluginId))return json(res,400,{ok:false,error:'CAPABILITY_UNKNOWN'});const analysis=await runNanomancer({operation:body.operation,inputs:Array.isArray(body.inputs)?body.inputs:[],workspaceId:workspace.id,orchestraRunId:body.orchestraRunId,stageId:body.stageId,maxChanges:body.maxChanges});return json(res,200,{ok:true,workspace,analysis,humanApprovalRequiredForPersistence:true});}catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'CAPABILITY_FAILED',message:error.message,contextReceipt:error.contextReceipt||null});}}
  return json(res,405,{ok:false,error:'METHOD'});
}
