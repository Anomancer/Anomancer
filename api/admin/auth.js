import { json } from '../../server/http.js';
import loginHandler from '../../server/admin-routes/login.js';
import logoutHandler from '../../server/admin-routes/logout.js';
import sessionHandler from '../../server/admin-routes/session.js';
import statusHandler from '../../server/admin-routes/status.js';

const ROUTES=new Map([
  ['login',loginHandler],
  ['logout',logoutHandler],
  ['session',sessionHandler],
  ['status',statusHandler],
]);

function resourceOf(req){
  try{return new URL(req.url||'/api/admin/auth','http://anomancer.local').searchParams.get('resource')||'session';}
  catch{return 'session';}
}

export default async function handler(req,res){
  const resource=resourceOf(req);
  const route=ROUTES.get(resource);
  if(!route)return json(res,404,{ok:false,error:'ADMIN_RESOURCE_UNKNOWN'});
  return route(req,res);
}
