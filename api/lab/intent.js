import {runIntent} from '../../core/intent/intent-service.js';
import {deepseekReasoner} from '../../providers/deepseek/adapter.js';
import {capabilityAvailability,executeLighthouseHands} from '../../server/lighthouse-hands.js';
import {sealLighthouseMutation,mutationRuntimeStatus} from '../../server/lighthouse-actuator.js';
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
const RATE_WINDOW_MS=10*60*1000;
const RATE_MAX=30;
const rateStore=globalThis.__anomancerLighthouseRateStore||new Map();
globalThis.__anomancerLighthouseRateStore=rateStore;

function send(res,status,body){
  res.setHeader('X-Robots-Tag','noindex,nofollow,noarchive');
  return json(res,status,body);
}

function clientIdentity(req,session){
  if(session?.nonce)return `session:${String(session.nonce).slice(0,96)}`;
  const forwarded=String(req.headers?.['x-forwarded-for']||'').split(',')[0].trim();
  const direct=String(req.headers?.['x-real-ip']||'').trim();
  return `local:${(forwarded||direct||'unknown').slice(0,96)}`;
}

function rateAllowed(identity,now=Date.now()){
  const fresh=(rateStore.get(identity)||[])
    .filter(timestamp=>now-timestamp<RATE_WINDOW_MS);

  if(fresh.length>=RATE_MAX){
    rateStore.set(identity,fresh);
    return false;
  }

  fresh.push(now);
  rateStore.set(identity,fresh);

  if(rateStore.size>500){
    for(const [key,entries] of rateStore){
      const retained=entries.filter(timestamp=>now-timestamp<RATE_WINDOW_MS);
      if(retained.length)rateStore.set(key,retained);
      else rateStore.delete(key);
    }
  }

  return true;
}

export default async function handler(req,res){
  if(!lighthouseLabAllowed())return send(res,404,{ok:false,error:'Not found'});
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{ok:false,error:'Method not allowed'});}
  if(!sameOrigin(req))return send(res,403,{ok:false,error:'ORIGIN_DENIED',message:'Pyyntö ei tullut tästä Lighthouse Labista.'});

  const contentType=String(req.headers?.['content-type']||'').toLowerCase();
  if(!contentType.startsWith('application/json')){
    return send(res,415,{ok:false,error:'CONTENT_TYPE',message:'Lighthouse hyväksyy vain JSON-pyynnöt.'});
  }

  const session=getSession(req);
  if(lighthouseLabRequiresAuth()){
    if(!session){
      return send(res,401,{ok:false,error:'AUTH',message:'Kirjaudu ensin Lähetyskoneeseen.'});
    }
    if(!requireCsrf(req,session)){
      return send(res,403,{ok:false,error:'CSRF',message:'Istunnon turvatunniste vanheni. Päivitä sivu ja yritä uudelleen.'});
    }
  }

  if(!rateAllowed(clientIdentity(req,session))){
    res.setHeader('Retry-After',String(Math.ceil(RATE_WINDOW_MS/1000)));
    return send(res,429,{ok:false,error:'RATE_LIMITED',message:'Lighthouse-ajojen hetkellinen raja tuli vastaan. Odota ja yritä uudelleen.'});
  }

  try{
    const body=await readJson(req,MAX_BODY_BYTES);
    const run=await runIntent(body,{
      reasoner:deepseekReasoner,
      availability:capabilityAvailability(process.env),
      capabilityExecutor:executeLighthouseHands
    });
    if(run?.runtime?.mutation?.proposal){
      const mutationStatus=mutationRuntimeStatus();
      if(session&&mutationStatus.available){
        try{
          const sealed=await sealLighthouseMutation(run.runtime.mutation.proposal,{session});
          run.runtime.mutation={...run.runtime.mutation,...sealed,available:true,status:mutationStatus};
        }catch(error){
          run.runtime.mutation={...run.runtime.mutation,available:false,status:mutationStatus,error:String(error.code||error.message||'mutation sealing failed')};
        }
      }else{
        run.runtime.mutation={...run.runtime.mutation,available:false,status:mutationStatus,error:session?'mutation-runtime-unavailable':'admin-session-required'};
      }
    }
    return send(res,200,{ok:true,...run});
  }catch(e){
    const status=Number(e.statusCode)||500;
    return send(res,status,{
      ok:false,
      code:String(e.code||'LIGHTHOUSE_ERROR'),
      error:status>=500?'Lighthouse-ajo epäonnistui.':String(e.message||'Pyyntö epäonnistui.'),
      retryable:Boolean(e.retryable)
    });
  }
}
