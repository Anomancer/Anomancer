import {previewIntent} from '../../core/intent/intent-service.js';
import {capabilityAvailability} from '../../server/lighthouse-hands.js';
import {
  lighthouseLabAllowed,
  lighthouseLabRequiresAuth
} from '../../core/authority/lab-policy.js';
import {
  getSession,
  requireCsrf
} from '../../server/auth.js';
import {
  json,
  readJson,
  sameOrigin
} from '../../server/http.js';

const MAX_BODY_BYTES=64_000;

function send(res,status,body){
  res.setHeader('X-Robots-Tag','noindex,nofollow,noarchive');
  res.setHeader('Cache-Control','private,no-store,max-age=0');
  return json(res,status,body);
}

export default async function handler(req,res){
  if(!lighthouseLabAllowed())return send(res,404,{ok:false,error:'Not found'});
  if(req.method!=='POST'){
    res.setHeader('Allow','POST');
    return send(res,405,{ok:false,error:'Method not allowed'});
  }
  if(!sameOrigin(req)){
    return send(res,403,{ok:false,error:'ORIGIN_DENIED',message:'Pyyntö ei tullut tästä Lighthousesta.'});
  }

  const contentType=String(req.headers?.['content-type']||'').toLowerCase();
  if(!contentType.startsWith('application/json')){
    return send(res,415,{ok:false,error:'CONTENT_TYPE',message:'Lighthouse hyväksyy vain JSON-pyynnöt.'});
  }

  const session=getSession(req);
  if(lighthouseLabRequiresAuth()){
    if(!session){
      return send(res,401,{ok:false,error:'AUTH',message:'Kirjaudu ensin Lighthouseen.'});
    }
    if(!requireCsrf(req,session)){
      return send(res,403,{ok:false,error:'CSRF',message:'Istunnon turvatunniste vanheni. Päivitä sivu ja yritä uudelleen.'});
    }
  }

  try{
    const body=await readJson(req,MAX_BODY_BYTES);
    return send(res,200,{ok:true,...previewIntent(body,{availability:capabilityAvailability(process.env)})});
  }catch(error){
    const status=Number(error.statusCode)||500;
    return send(res,status,{
      ok:false,
      code:String(error.code||'LIGHTHOUSE_PREVIEW_ERROR'),
      error:status>=500?'Tehtävän esikatselu epäonnistui.':String(error.message||'Pyyntö epäonnistui.')
    });
  }
}
