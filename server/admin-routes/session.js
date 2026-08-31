import { getSession, csrfForSession } from '../auth.js';
import { contentStoreStatus } from '../content-store.js';
import { json } from '../http.js';
export default async function handler(req,res){
  if(req.method!=='GET') return json(res,405,{ok:false,error:'METHOD'});
  const session=getSession(req);
  if(!session) return json(res,200,{ok:true,authenticated:false});
  return json(res,200,{ok:true,authenticated:true,csrf:csrfForSession(process.env.ADMIN_SESSION_SECRET,session),storage:contentStoreStatus()});
}
