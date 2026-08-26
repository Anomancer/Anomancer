import { getSession, requireCsrf } from '../_lib/auth.js';
import { json, readJson, sameOrigin } from '../_lib/http.js';
import { listAvailableOrchestras, upsertCustomOrchestra, deleteCustomOrchestra, orchestraStoreStatus } from '../_lib/orchestra-store.js';

function auth(req,res,mutating=false){
  const session=getSession(req);if(!session){json(res,401,{ok:false,error:'AUTH'});return null;}
  if(mutating&&(!sameOrigin(req)||!requireCsrf(req,session))){json(res,403,{ok:false,error:'CSRF'});return null;}
  return session;
}
function publicState(state){return {format:state.format,coreVersion:state.coreVersion,revision:state.revision,updatedAt:state.updatedAt,orchestras:state.orchestras};}
export default async function handler(req,res){
  if(req.method==='GET'){
    if(!auth(req,res))return;
    try{const data=await listAvailableOrchestras();return json(res,200,{ok:true,builtins:data.builtins,custom:data.custom,all:data.all,state:publicState(data.state),store:orchestraStoreStatus()});}
    catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'ORCHESTRA_STORE',message:error.message,store:orchestraStoreStatus()});}
  }
  if(req.method==='POST'||req.method==='PUT'){
    if(!auth(req,res,true))return;
    try{const body=await readJson(req,200_000);const result=await upsertCustomOrchestra(body.orchestra||body,{expectedRevision:body.expectedRevision});const data=await listAvailableOrchestras();return json(res,200,{ok:true,orchestra:result.orchestra,state:publicState(result.state),builtins:data.builtins,custom:data.custom,all:data.all,store:orchestraStoreStatus()});}
    catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'ORCHESTRA_SAVE',message:error.message,errors:error.errors||[]});}
  }
  if(req.method==='DELETE'){
    if(!auth(req,res,true))return;
    try{const body=await readJson(req,100_000);const result=await deleteCustomOrchestra(String(body.id||''),{expectedRevision:body.expectedRevision});const data=await listAvailableOrchestras();return json(res,200,{ok:true,state:publicState(result.state),builtins:data.builtins,custom:data.custom,all:data.all,store:orchestraStoreStatus()});}
    catch(error){return json(res,error.statusCode||500,{ok:false,error:error.code||'ORCHESTRA_DELETE',message:error.message});}
  }
  return json(res,405,{ok:false,error:'METHOD'});
}
