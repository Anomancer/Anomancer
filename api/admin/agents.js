import { getSession, requireCsrf } from '../_lib/auth.js';
import { json, readJson, sameOrigin } from '../_lib/http.js';
import { deepseekChatJson, deepseekWebSearchJson, deepseekConfigStatus } from '../_lib/deepseek.js';
import { promptFor, SOURCE_SCHEMA, CATEGORIES, AUDIENCES } from '../_lib/agent-prompts.js';

const AGENTS=new Set(['source','claims','structure','writer','critic','voice','package']);
const MAX_BODY_CHARS=60_000;
const MAX_CUSTOM_CHARS=2_000;
const windows=new Map();

function rateLimit(req,session){
  const key=`${session.nonce}:${String(req.headers?.['x-forwarded-for']||req.socket?.remoteAddress||'local').split(',')[0]}`;
  const now=Date.now(),windowMs=10*60*1000,limit=24;
  const arr=(windows.get(key)||[]).filter(t=>now-t<windowMs);
  if(arr.length>=limit) return false;
  arr.push(now);windows.set(key,arr);return true;
}
function cleanString(v,max=10000){return String(v||'').slice(0,max);}
function normalizePost(input={}){
  const sources=Array.isArray(input.sources)?input.sources.slice(0,30).map(s=>({title:cleanString(s?.title,220),url:cleanString(s?.url,2000),publisher:cleanString(s?.publisher,160),date:cleanString(s?.date,20)})):[];
  const claims=Array.isArray(input.claims)?input.claims.slice(0,40).map(c=>({status:['supported','interpretation','open'].includes(c?.status)?c.status:'open',text:cleanString(c?.text,600),evidence:Array.isArray(c?.evidence)?c.evidence.slice(0,12).map(x=>cleanString(x,2000)):[],note:cleanString(c?.note,800)})):[];
  const body=cleanString(input.body,MAX_BODY_CHARS+1);
  if(body.length>MAX_BODY_CHARS) throw Object.assign(new Error(`Agentille lähetettävä teksti on liian pitkä (max ${MAX_BODY_CHARS} merkkiä).`),{statusCode:413,code:'AGENT_BODY_TOO_LONG'});
  return {
    lang:input.lang==='en'?'en':'fi',
    title:cleanString(input.title,180),category:CATEGORIES.includes(input.category)?input.category:'info-media',
    audience:Array.isArray(input.audience)?input.audience.filter(x=>AUDIENCES.includes(x)).slice(0,8):['all'],
    description:cleanString(input.description,220),answer:cleanString(input.answer,1200),slug:cleanString(input.slug,100),
    sources,claims,body,
  };
}
function modelFor(agent){
  const cfg=deepseekConfigStatus();
  if(agent==='writer'||agent==='voice'||agent==='structure'||agent==='package') return cfg.writerModel;
  if(agent==='critic'||agent==='claims') return cfg.criticModel;
  return cfg.defaultModel;
}

export default async function handler(req,res){
  if(req.method==='GET'){
    if(!getSession(req)) return json(res,401,{ok:false,error:'AUTH'});
    return json(res,200,{ok:true,deepseek:deepseekConfigStatus(),agents:[...AGENTS],humanApprovalRequired:true});
  }
  if(req.method!=='POST') return json(res,405,{ok:false,error:'METHOD'});
  const session=getSession(req);
  if(!session) return json(res,401,{ok:false,error:'AUTH'});
  if(!sameOrigin(req)||!requireCsrf(req,session)) return json(res,403,{ok:false,error:'CSRF'});
  if(!rateLimit(req,session)) return json(res,429,{ok:false,error:'RATE_LIMITED',message:'Agenttiraja tuli hetkeksi vastaan. Odota ja yritä myöhemmin.'});
  try{
    const body=await readJson(req,700_000);
    const agent=String(body.agent||'');
    if(!AGENTS.has(agent)) return json(res,400,{ok:false,error:'AGENT_UNKNOWN'});
    const post=normalizePost(body.post||{});
    const custom=cleanString(body.instruction,MAX_CUSTOM_CHARS);
    const {system,user}=promptFor(agent,post,custom);
    const response=agent==='source'
      ? await deepseekWebSearchJson({system,user,schema:SOURCE_SCHEMA})
      : await deepseekChatJson({system,user,model:modelFor(agent),maxTokens:agent==='writer'||agent==='voice'?8000:5500,thinking:!['voice'].includes(agent)});
    return json(res,200,{ok:true,agent,result:response.result,meta:response.meta,humanApprovalRequired:true});
  }catch(e){
    return json(res,e.statusCode||500,{ok:false,error:e.code||'AGENT_FAILED',message:e.message});
  }
}
