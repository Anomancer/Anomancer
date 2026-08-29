import {runIntent} from '../../core/intent/intent-service.js';
import {deepseekReasoner} from '../../providers/deepseek/adapter.js';
import {lighthouseLabAllowed} from '../../core/authority/lab-policy.js';
function send(res,status,x){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex,nofollow,noarchive');res.end(JSON.stringify(x));}
export default async function handler(req,res){
  if(!lighthouseLabAllowed())return send(res,404,{ok:false,error:'Not found'});
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{ok:false,error:'Method not allowed'});}
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    return send(res,200,{ok:true,...await runIntent(body,{reasoner:deepseekReasoner})});
  }catch(e){
    const status=Number(e.statusCode)||500;
    return send(res,status,{ok:false,code:String(e.code||'LIGHTHOUSE_ERROR'),error:status>=500?'Lighthouse-ajo epäonnistui.':String(e.message||'Pyyntö epäonnistui.'),retryable:Boolean(e.retryable)});
  }
}
