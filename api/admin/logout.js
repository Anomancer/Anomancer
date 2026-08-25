import { sessionCookie } from '../_lib/auth.js';
import { json, sameOrigin } from '../_lib/http.js';
export default async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{ok:false,error:'METHOD'});
  if(!sameOrigin(req)) return json(res,403,{ok:false,error:'ORIGIN'});
  res.setHeader('Set-Cookie',sessionCookie('',{clear:true}));
  return json(res,200,{ok:true});
}
