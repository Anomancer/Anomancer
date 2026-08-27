import { getSession, requireCsrf } from '../auth.js';
import { json, readJson, sameOrigin } from '../http.js';
import { requireWorkspace } from '../workspace-store.js';
import { archiveStoreStatus, createContextReceipt, getArchiveObject, grantArchiveAccess, putArchiveObject, removeArchiveObject, searchArchive } from '../archive-store.js';
import { archiveCuratorStatus, runArchiveCurator } from '../archive-curator.js';

function auth(req,res,mut=false){const session=getSession(req);if(!session){json(res,401,{ok:false,error:'AUTH'});return null;}if(mut&&(!sameOrigin(req)||!requireCsrf(req,session))){json(res,403,{ok:false,error:'CSRF'});return null;}return session;}
function urlOf(req){return new URL(req.url||'/api/admin/core?resource=archive','http://anomancer.local');}
function publicState(state){return{revision:state.revision,updatedAt:state.updatedAt};}

export default async function handler(req,res){
  if(req.method==='GET'){
    if(!auth(req,res))return;
    try{
      const url=urlOf(req),id=String(url.searchParams.get('id')||'');
      if(url.searchParams.get('curator')==='1'){const report=await runArchiveCurator({workspaceId:url.searchParams.get('workspace')||'',maxProposals:url.searchParams.get('maxProposals')||80});return json(res,200,{ok:true,report,curator:archiveCuratorStatus(),store:archiveStoreStatus()});}
      if(id){const object=await getArchiveObject(id,{humanView:true});return object?json(res,200,{ok:true,object,store:archiveStoreStatus()}):json(res,404,{ok:false,error:'ARCHIVE_OBJECT_NOT_FOUND'});}
      const data=await searchArchive({q:url.searchParams.get('q')||'',type:url.searchParams.get('type')||'',workspaceId:url.searchParams.get('workspace')||'',status:url.searchParams.get('status')||'',limit:url.searchParams.get('limit')||100,humanView:true});
      return json(res,200,{ok:true,...data});
    }catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'ARCHIVE_STORE',message:error.message,store:archiveStoreStatus()});}
  }
  if(req.method==='POST'){
    if(!auth(req,res,true))return;
    try{
      const body=await readJson(req,260_000),action=String(body.action||'put'),humanApproved=body.humanApproved===true;
      if(action==='put'){
        const workspaceId=String(body.object?.workspaceId||'default');await requireWorkspace(workspaceId,{allowArchived:true});
        const result=await putArchiveObject(body.object||{},{humanApproved,expectedRevision:body.expectedRevision});
        return json(res,200,{ok:true,object:result.object,state:publicState(result.state),store:archiveStoreStatus(),humanApproved:true});
      }
      if(action==='grant'){
        for(const workspaceId of Array.isArray(body.workspaceIds)?body.workspaceIds:[])await requireWorkspace(String(workspaceId),{allowArchived:true});
        const result=await grantArchiveAccess(String(body.objectId||''),body.workspaceIds||[],{humanApproved,expectedRevision:body.expectedRevision});
        return json(res,200,{ok:true,object:result.object,state:publicState(result.state),store:archiveStoreStatus(),humanApproved:true});
      }
      if(action==='context-receipt'){
        await requireWorkspace(String(body.workspaceId||'default'),{allowArchived:true});
        const result=await createContextReceipt({workspaceId:body.workspaceId,runId:body.runId,purpose:body.purpose,query:body.query,objectIds:body.objectIds||[]},{expectedRevision:body.expectedRevision});
        return json(res,200,{ok:true,receipt:result.receipt,context:{workspaceId:result.context.workspaceId,objects:result.context.objects,notAccessed:result.context.notAccessed},state:publicState(result.state),store:archiveStoreStatus()});
      }
      return json(res,400,{ok:false,error:'ARCHIVE_ACTION_UNKNOWN'});
    }catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'ARCHIVE_ACTION',message:error.message,store:archiveStoreStatus()});}
  }
  if(req.method==='DELETE'){
    if(!auth(req,res,true))return;
    try{const body=await readJson(req,80_000),result=await removeArchiveObject(String(body.objectId||body.id||''),{humanApproved:body.humanApproved===true,expectedRevision:body.expectedRevision,deletedBy:'human'});return json(res,200,{ok:true,tombstone:result.tombstone,state:publicState(result.state),store:archiveStoreStatus()});}
    catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'ARCHIVE_DELETE',message:error.message,store:archiveStoreStatus()});}
  }
  return json(res,405,{ok:false,error:'METHOD'});
}
