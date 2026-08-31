import {executeLighthouseMutation,mutationRuntimeStatus} from '../../server/lighthouse-actuator.js';
import {lighthouseLabAllowed} from '../../core/authority/lab-policy.js';
import {getSession,requireCsrf} from '../../server/auth.js';
import {json,readJson,sameOrigin} from '../../server/http.js';

const MAX_BODY_BYTES=420_000;
function send(res,status,body){res.setHeader('X-Robots-Tag','noindex,nofollow,noarchive');return json(res,status,body);}

export default async function handler(req,res){
  if(!lighthouseLabAllowed())return send(res,404,{ok:false,error:'Not found'});
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{ok:false,error:'Method not allowed'});}
  if(!sameOrigin(req))return send(res,403,{ok:false,error:'ORIGIN_DENIED',message:'Pyyntö ei tullut tästä Lighthousesta.'});
  const contentType=String(req.headers?.['content-type']||'').toLowerCase();
  if(!contentType.startsWith('application/json'))return send(res,415,{ok:false,error:'CONTENT_TYPE',message:'Lighthouse hyväksyy vain JSON-pyynnöt.'});
  const session=getSession(req);
  if(!session)return send(res,401,{ok:false,error:'AUTH',message:'Kirjaudu ensin Lighthouseen.'});
  if(!requireCsrf(req,session))return send(res,403,{ok:false,error:'CSRF',message:'Istunnon turvatunniste vanheni. Päivitä sivu ja yritä uudelleen.'});
  const status=mutationRuntimeStatus();
  if(!status.available)return send(res,503,{ok:false,error:'MUTATION_RUNTIME_UNAVAILABLE',message:'Kirjoittava Lighthouse-runtime ei ole tässä ympäristössä käytettävissä.'});
  try{
    const body=await readJson(req,MAX_BODY_BYTES);
    const receipt=await executeLighthouseMutation({proposal:body?.proposal,approval:body?.approval,confirmation:body?.confirmation,session});
    return send(res,200,{ok:true,receipt});
  }catch(error){
    return send(res,Number(error.statusCode)||500,{ok:false,error:String(error.code||'LIGHTHOUSE_MUTATION_ERROR'),message:String(error.message||'Mutation epäonnistui.'),details:error.path?{path:error.path}:undefined});
  }
}
