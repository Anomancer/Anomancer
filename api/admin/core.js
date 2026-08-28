import { json } from '../../server/http.js';
import coreHandler from '../../server/admin-routes/core.js';
import agentsHandler from '../../server/admin-routes/agents.js';
import orchestrasHandler from '../../server/admin-routes/orchestras.js';
import runsHandler from '../../server/admin-routes/runs.js';
import runtimeHandler from '../../server/admin-routes/runtime.js';
import archiveHandler from '../../server/admin-routes/archive.js';
import capabilitiesHandler from '../../server/admin-routes/capabilities.js';
import operationsHandler from '../../server/admin-routes/operations.js';

const ROUTES=new Map([
  ['core',coreHandler],
  ['workspaces',coreHandler],
  ['agents',agentsHandler],
  ['orchestras',orchestrasHandler],
  ['runs',runsHandler],
  ['runtime',runtimeHandler],
  ['archive',archiveHandler],
  ['capabilities',capabilitiesHandler],
  ['operations',operationsHandler],
]);

function resourceOf(req){
  try{return new URL(req.url||'/api/admin/core','http://anomancer.local').searchParams.get('resource')||'core';}
  catch{return 'core';}
}

export default async function handler(req,res){
  const resource=resourceOf(req);
  const route=ROUTES.get(resource);
  if(!route)return json(res,404,{ok:false,error:'ADMIN_RESOURCE_UNKNOWN'});
  return route(req,res);
}
