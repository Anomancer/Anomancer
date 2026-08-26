import { getSession } from '../_lib/auth.js';
import { json } from '../_lib/http.js';
import { publicCoreSnapshot } from '../_lib/core-registry.js';
import { modelRouterStatus } from '../_lib/model-router.js';

export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{ok:false,error:'METHOD'});
  if(!getSession(req))return json(res,401,{ok:false,error:'AUTH'});
  return json(res,200,{ok:true,core:publicCoreSnapshot({modelRouter:modelRouterStatus()})});
}
