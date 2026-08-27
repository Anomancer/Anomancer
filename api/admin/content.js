import { json } from '../../server/http.js';
import postsHandler from '../../server/admin-routes/posts.js';
import mediaHandler from '../../server/admin-routes/media.js';

const ROUTES=new Map([
  ['posts',postsHandler],
  ['media',mediaHandler],
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
