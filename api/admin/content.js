import { json } from '../../server/http.js';
import postsHandler from '../../server/admin-routes/posts.js';
import mediaHandler from '../../server/admin-routes/media.js';
import workspaceArtifactHandler from '../../server/admin-routes/workspace-artifact.js';
import mancerArtifactHandler from '../../server/admin-routes/mancer-artifact.js';

const ROUTES=new Map([
  ['posts',postsHandler],
  ['media',mediaHandler],
  ['workspace-artifact',workspaceArtifactHandler],
  ['mancer-artifact',mancerArtifactHandler],
]);

function resourceOf(req){
  try{return new URL(req.url||'/api/admin/content','http://anomancer.local').searchParams.get('resource')||'posts';}
  catch{return 'posts';}
}

export default async function handler(req,res){
  const resource=resourceOf(req);
  const route=ROUTES.get(resource);
  if(!route)return json(res,404,{ok:false,error:'ADMIN_RESOURCE_UNKNOWN'});
  return route(req,res);
}
