import { getSession, requireCsrf } from '../_lib/auth.js';
import { json, readJson, sameOrigin } from '../_lib/http.js';
import { deepseekConfigStatus } from '../_lib/deepseek.js';
import { routeAgentJson, modelRouterStatus } from '../_lib/model-router.js';
import { promptFor, SOURCE_SCHEMA, CATEGORIES, AUDIENCES, AUDIENCE_DEPTHS } from '../_lib/agent-prompts.js';
import { normalizeClaims, normalizeSources } from '../_lib/content.js';
import { validateAgentResult } from '../_lib/agent-validation.js';
import { getAgentContract, listAgentIds, CORE_VERSION } from '../_lib/core-registry.js';
import { createRunReceipt } from '../_lib/core-receipt.js';
import { authorizeAgentTools } from '../_lib/tool-broker.js';
import { getRuntimeProfile, verifyRuntimeSnapshot } from '../_lib/runtime-store.js';

const AGENTS=new Set(listAgentIds());
const MAX_BODY_CHARS=60_000;
const MAX_CUSTOM_CHARS=12_000;
const windows=new Map();

function rateLimit(req,session){
  const key=`${session.nonce}:${String(req.headers?.['x-forwarded-for']||req.socket?.remoteAddress||'local').split(',')[0]}`;
  const now=Date.now(),windowMs=10*60*1000,limit=24;
  const arr=(windows.get(key)||[]).filter(t=>now-t<windowMs);
  if(arr.length>=limit) return false;
  arr.push(now);windows.set(key,arr);
  if(windows.size>500){for(const [id,hits] of windows){if(!hits.some(t=>now-t<windowMs))windows.delete(id);}}
  return true;
}
function cleanString(v,max=10000){return String(v||'').slice(0,max);}
function normalizeAudienceInput(value){const picked=Array.isArray(value)?[...new Set(value.filter(x=>AUDIENCES.includes(x)))]:[];if(!picked.length||picked.includes('all'))return ['all'];return picked.slice(0,8);}
function normalizePost(input={}){
  const sources=normalizeSources(input.sources).slice(0,30);
  const claims=normalizeClaims(input.claims,sources).slice(0,40);
  const body=cleanString(input.body,MAX_BODY_CHARS+1);
  if(body.length>MAX_BODY_CHARS) throw Object.assign(new Error(`Agentille lähetettävä teksti on liian pitkä (max ${MAX_BODY_CHARS} merkkiä).`),{statusCode:413,code:'AGENT_BODY_TOO_LONG'});
  return {
    lang:input.lang==='en'?'en':'fi',
    title:cleanString(input.title,180),category:CATEGORIES.includes(input.category)?input.category:'info-media',
    audience:normalizeAudienceInput(input.audience),
    audienceDepth:AUDIENCE_DEPTHS.includes(input.audienceDepth)?input.audienceDepth:'general',
    description:cleanString(input.description,220),answer:cleanString(input.answer,1200),slug:cleanString(input.slug,100),
    sources,claims,body,
  };
}

export default async function handler(req,res){
  if(req.method==='GET'){
    if(!getSession(req)) return json(res,401,{ok:false,error:'AUTH'});
    return json(res,200,{ok:true,coreVersion:CORE_VERSION,deepseek:deepseekConfigStatus(),modelRouter:modelRouterStatus(),agents:[...AGENTS].map(id=>getAgentContract(id)),humanApprovalRequired:true});
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
    const contract=getAgentContract(agent);
    if(!contract) return json(res,400,{ok:false,error:'AGENT_UNKNOWN'});
    const orchestraRunId=cleanString(body.orchestraRunId,120)||null;
    let runtime,snapshotOrchestra=null;
    if(orchestraRunId){
      if(!body.runtimeSnapshotToken) return json(res,409,{ok:false,error:'RUNTIME_SNAPSHOT_REQUIRED',message:'Orkesteriajo vaatii serverin allekirjoittaman Runtime Snapshotin.'});
      const snapshot=verifyRuntimeSnapshot(body.runtimeSnapshotToken,{orchestraRunId});
      snapshotOrchestra=snapshot.orchestra||null;
      const stepIndex=Number.isInteger(body.stageIndex)?body.stageIndex:null;
      const allowedAgents=stepIndex!==null?snapshotOrchestra?.steps?.[stepIndex]?.agents||[]:[];
      if(stepIndex===null||!allowedAgents.includes(agent)) return json(res,409,{ok:false,error:'ORCHESTRA_STAGE_MISMATCH',message:'Agentti ei kuulu allekirjoitetun Orchestra Contractin tähän vaiheeseen.'});
      runtime=snapshot.profiles?.[agent];
      if(!runtime) return json(res,409,{ok:false,error:'RUNTIME_SNAPSHOT_AGENT',message:'Agentin Runtime Profile puuttuu orkesterin snapshotista.'});
    }else runtime=await getRuntimeProfile(agent);
    if(!runtime?.active) return json(res,409,{ok:false,error:'AGENT_DISABLED',message:`${contract.label} on poistettu käytöstä Core Runtime Profilessa.`});
    const post=normalizePost(body.post||{});
    const custom=cleanString(body.instruction,MAX_CUSTOM_CHARS);
    const {system,user}=promptFor(agent,post,custom);
    const startedAt=new Date();
    const toolPolicy=authorizeAgentTools({contract,toolIds:contract.tools||[],context:{orchestraRunId,orchestraId:snapshotOrchestra?.id||null,orchestraHash:snapshotOrchestra?.orchestraHash||null,stageIndex:Number.isInteger(body.stageIndex)?body.stageIndex:null}});
    const abortController=new AbortController();
    const abort=()=>abortController.abort();
    req.once?.('aborted',abort);
    const response=await routeAgentJson({
      contract,runtime,system,user,schema:agent==='source'?SOURCE_SCHEMA:null,
      maxTokens:runtime.maxOutputTokens,thinking:!['voice'].includes(agent),webSearch:agent==='source',signal:abortController.signal
    });
    req.removeListener?.('aborted',abort);
    const result=validateAgentResult(agent,response.result,post);
    const receipt=createRunReceipt({contract,runtime,post,instruction:custom,result,meta:response.meta,toolPolicy,startedAt,finishedAt:new Date(),orchestraRunId,orchestra:snapshotOrchestra,stageIndex:Number.isInteger(body.stageIndex)?body.stageIndex:null});
    return json(res,200,{ok:true,coreVersion:CORE_VERSION,agent,contract:{id:contract.id,version:contract.version,contractHash:contract.contractHash,role:contract.role,authority:contract.authority,budget:contract.budget,runtimePolicy:contract.runtimePolicy},runtime,toolPolicy,result,meta:response.meta,receipt,humanApprovalRequired:true});
  }catch(e){
    return json(res,e.statusCode||500,{ok:false,error:e.code||'AGENT_FAILED',message:e.message,retryable:Boolean(e.retryable),retryAfterMs:Number(e.retryAfterMs||0),policyDecision:e.policyDecision||null});
  }
}
