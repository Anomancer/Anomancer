import { getSession } from '../auth.js';
import { json } from '../http.js';
import { contentStoreStatus } from '../content-store.js';
import { githubPublicationStatus } from '../github-publication.js';
export default async function handler(req,res){
  if(req.method!=='GET') return json(res,405,{ok:false,error:'METHOD'});
  if(!getSession(req)) return json(res,401,{ok:false,error:'AUTH'});
  return json(res,200,{ok:true,storage:contentStoreStatus(),publication:githubPublicationStatus(),deployment:{provider:'vercel',gitIntegration:githubPublicationStatus().configured,directProduction:true}});
}
