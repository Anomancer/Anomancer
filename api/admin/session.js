import { getSession, csrfForSession } from '../../server/auth.js';
import { githubConfigStatus } from '../../server/github.js';
import { json } from '../../server/http.js';
export default async function handler(req,res){
  if(req.method!=='GET') return json(res,405,{ok:false,error:'METHOD'});
  const session=getSession(req);
  if(!session) return json(res,200,{ok:true,authenticated:false});
  return json(res,200,{ok:true,authenticated:true,csrf:csrfForSession(process.env.ADMIN_SESSION_SECRET,session),github:githubConfigStatus()});
}
