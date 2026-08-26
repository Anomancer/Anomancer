import { getSession, requireCsrf } from '../_lib/auth.js';
import { json, readJson, sameOrigin } from '../_lib/http.js';
import { loadRuntimeState, updateRuntimeProfile, resetRuntimeProfile, createRuntimeSnapshot, runtimeStoreStatus } from '../_lib/runtime-store.js';

function auth(req,res,mutating=false){
  const session=getSession(req);if(!session){json(res,401,{ok:false,error:'AUTH'});return null;}
  if(mutating&&(!sameOrigin(req)||!requireCsrf(req,session))){json(res,403,{ok:false,error:'CSRF'});return null;}
  return session;
}
function publicState(state){return {format:state.format,coreVersion:state.coreVersion,revision:state.revision,updatedAt:state.updatedAt,profiles:state.profiles};}
export default async function handler(req,res){
  if(req.method==='GET'){
    if(!auth(req,res,false))return;
    try{const state=await loadRuntimeState();return json(res,200,{ok:true,runtime:publicState(state),store:runtimeStoreStatus()});}
    catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'RUNTIME_STORE',message:error.message,store:runtimeStoreStatus()});}
  }
  if(req.method==='POST'){
    if(!auth(req,res,true))return;
    try{const body=await readJson(req,100_000);if(body.action!=='snapshot')return json(res,400,{ok:false,error:'RUNTIME_ACTION'});const snapshot=await createRuntimeSnapshot(String(body.orchestraRunId||''),String(body.orchestraId||'editorial'));return json(res,200,{ok:true,snapshotToken:snapshot.token,snapshotId:snapshot.snapshotId,revision:snapshot.payload.revision,expiresAt:new Date(snapshot.payload.exp*1000).toISOString(),profiles:snapshot.payload.profiles,orchestra:snapshot.payload.orchestra});}
    catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'RUNTIME_SNAPSHOT',message:error.message});}
  }
  if(req.method==='PUT'){
    if(!auth(req,res,true))return;
    try{const body=await readJson(req,100_000);const result=await updateRuntimeProfile(String(body.agentId||''),body.profile||{},{expectedRevision:body.expectedRevision});return json(res,200,{ok:true,runtime:publicState(result.state),profile:result.profile,store:runtimeStoreStatus()});}
    catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'RUNTIME_SAVE',message:error.message});}
  }
  if(req.method==='DELETE'){
    if(!auth(req,res,true))return;
    try{const body=await readJson(req,100_000);const result=await resetRuntimeProfile(String(body.agentId||''),{expectedRevision:body.expectedRevision});return json(res,200,{ok:true,runtime:publicState(result.state),profile:result.profile,store:runtimeStoreStatus()});}
    catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'RUNTIME_RESET',message:error.message});}
  }
  return json(res,405,{ok:false,error:'METHOD'});
}
