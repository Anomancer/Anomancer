import { getSession, requireCsrf } from '../auth.js';
import { json, readJson, sameOrigin } from '../http.js';
import { getMancerPackageByTemplateId } from '../mancer-registry.js';
import { getOperation, listOperations } from '../operation-store.js';
import { decideCapabilityOperation, executeCapabilityOperation, listOperationCapabilities, operationRuntimeStatus, planCapabilityOperation, refreshCapabilityOperation } from '../operation-capabilities.js';
import { requireWorkspace, workspaceIdFromRequest } from '../workspace-store.js';

function auth(req,res,mutating=false){const session=getSession(req);if(!session){json(res,401,{ok:false,error:'AUTH'});return null;}if(mutating&&(!sameOrigin(req)||!requireCsrf(req,session))){json(res,403,{ok:false,error:'CSRF'});return null;}return session;}
async function context(req){const workspace=await requireWorkspace(workspaceIdFromRequest(req)),pkg=getMancerPackageByTemplateId(workspace.templateId);if(pkg?.manifest?.id!=='codemancer')throw Object.assign(new Error('Operation capabilityt kuuluvat vain Codemancer-työtilalle.'),{statusCode:409,code:'OPERATION_CODEMANCER_REQUIRED'});return{workspace,pkg};}

export default async function handler(req,res){
  if(req.method==='GET'){
    if(!auth(req,res))return;
    try{const{workspace}=await context(req),url=new URL(req.url||'/api/admin/core','http://anomancer.local'),operationId=String(url.searchParams.get('operationId')||'');if(operationId){const operation=await getOperation(operationId,{workspaceId:workspace.id,force:true});if(!operation)return json(res,404,{ok:false,error:'OPERATION_NOT_FOUND'});return json(res,200,{ok:true,workspace,operation,capabilities:listOperationCapabilities(),runtime:operationRuntimeStatus(workspace.id)});}const data=await listOperations({workspaceId:workspace.id,limit:url.searchParams.get('limit')||30});return json(res,200,{ok:true,workspace,...data,capabilities:listOperationCapabilities(),runtime:operationRuntimeStatus(workspace.id)});}catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'OPERATION_LIST',message:error.message});}
  }
  if(req.method==='POST'){
    const session=auth(req,res,true);if(!session)return;
    try{
      const{workspace}=await context(req),body=await readJson(req,60_000),action=String(body.action||''),common={workspace,session};let operation=null;
      if(action==='plan')operation=await planCapabilityOperation({kind:body.kind,sourceOperationId:body.sourceOperationId,rollbackTarget:body.rollbackTarget,...common});
      else if(action==='decide')operation=await decideCapabilityOperation({operationId:body.operationId,decision:body.decision,confirmation:body.confirmation,expectedRevision:body.expectedRevision,...common});
      else if(action==='execute')operation=await executeCapabilityOperation({operationId:body.operationId,expectedRevision:body.expectedRevision,...common});
      else if(action==='refresh')operation=await refreshCapabilityOperation({operationId:body.operationId,expectedRevision:body.expectedRevision,...common});
      else return json(res,400,{ok:false,error:'OPERATION_ACTION_UNKNOWN'});
      return json(res,200,{ok:true,workspace,operation,capabilities:listOperationCapabilities(),runtime:operationRuntimeStatus(workspace.id)});
    }catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'OPERATION_ACTION',message:error.message,currentSha:error.currentSha||undefined,plannedSha:error.plannedSha||undefined});}
  }
  return json(res,405,{ok:false,error:'METHOD'});
}
