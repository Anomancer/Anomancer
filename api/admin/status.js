import { getSession } from '../_lib/auth.js';
import { json } from '../_lib/http.js';
import { repoInfo, githubConfigStatus } from '../_lib/github.js';
export default async function handler(req,res){
  if(req.method!=='GET') return json(res,405,{ok:false,error:'METHOD'});
  if(!getSession(req)) return json(res,401,{ok:false,error:'AUTH'});
  const cfg=githubConfigStatus();
  if(!cfg.configured) return json(res,200,{ok:true,github:cfg});
  try{return json(res,200,{ok:true,github:{...cfg,...await repoInfo()}});}
  catch(e){return json(res,e.statusCode||500,{ok:false,error:e.code||'GITHUB',message:e.message,github:cfg});}
}
