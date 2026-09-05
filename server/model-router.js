import crypto from 'node:crypto';
import { deepseekChatJson, deepseekWebSearchJson, deepseekConfigStatus } from './deepseek.js';
import { getModelRoute, MODEL_ROUTER_FORMAT } from './core-registry.js';

const PROVIDER_TIMEOUT_MS=120_000;
const clean=v=>String(v??'').trim();
const env=(name)=>clean(process.env[name]);
const clone=value=>JSON.parse(JSON.stringify(value));

export const MODEL_PROVIDER_REGISTRY=Object.freeze([
  {id:'deepseek',label:'DeepSeek',kind:'native',supports:['json','web_search'],keyEnv:'DEEPSEEK_API_KEY'},
  {id:'openai',label:'OpenAI',kind:'responses-api',supports:['json','web_search'],keyEnv:'OPENAI_API_KEY'},
  {id:'anthropic',label:'Anthropic',kind:'messages-api',supports:['json'],keyEnv:'ANTHROPIC_API_KEY'},
  {id:'gemini',label:'Google Gemini',kind:'generate-content',supports:['json','web_search'],keyEnv:'GEMINI_API_KEY'},
  {id:'qwen-local',label:'Qwen Local',kind:'openai-compatible-local',supports:['json'],keyEnv:null},
]);

const providerById=new Map(MODEL_PROVIDER_REGISTRY.map(item=>[item.id,item]));

function modelEnv(primary,fallback=''){return env(primary)||env(fallback);}
function targetDefinitions(){
  const ds=deepseekConfigStatus();
  return [
    {id:'deepseek.research',provider:'deepseek',route:'research',model:ds.sourceModel,capabilities:['json','web_search'],configured:ds.configured},
    {id:'deepseek.writer',provider:'deepseek',route:'writer',model:ds.writerModel,capabilities:['json'],configured:ds.configured},
    {id:'deepseek.critic',provider:'deepseek',route:'critic',model:ds.criticModel,capabilities:['json'],configured:ds.configured},
    {id:'openai.research',provider:'openai',route:'research',model:modelEnv('OPENAI_RESEARCH_MODEL','OPENAI_MODEL'),capabilities:['json','web_search'],configured:Boolean(env('OPENAI_API_KEY')&&modelEnv('OPENAI_RESEARCH_MODEL','OPENAI_MODEL'))},
    {id:'openai.writer',provider:'openai',route:'writer',model:modelEnv('OPENAI_WRITER_MODEL','OPENAI_MODEL'),capabilities:['json'],configured:Boolean(env('OPENAI_API_KEY')&&modelEnv('OPENAI_WRITER_MODEL','OPENAI_MODEL'))},
    {id:'openai.critic',provider:'openai',route:'critic',model:modelEnv('OPENAI_CRITIC_MODEL','OPENAI_MODEL'),capabilities:['json'],configured:Boolean(env('OPENAI_API_KEY')&&modelEnv('OPENAI_CRITIC_MODEL','OPENAI_MODEL'))},
    {id:'anthropic.writer',provider:'anthropic',route:'writer',model:modelEnv('ANTHROPIC_WRITER_MODEL','ANTHROPIC_MODEL'),capabilities:['json'],configured:Boolean(env('ANTHROPIC_API_KEY')&&modelEnv('ANTHROPIC_WRITER_MODEL','ANTHROPIC_MODEL'))},
    {id:'anthropic.critic',provider:'anthropic',route:'critic',model:modelEnv('ANTHROPIC_CRITIC_MODEL','ANTHROPIC_MODEL'),capabilities:['json'],configured:Boolean(env('ANTHROPIC_API_KEY')&&modelEnv('ANTHROPIC_CRITIC_MODEL','ANTHROPIC_MODEL'))},
    {id:'gemini.research',provider:'gemini',route:'research',model:modelEnv('GEMINI_RESEARCH_MODEL','GEMINI_MODEL'),capabilities:['json','web_search'],configured:Boolean(env('GEMINI_API_KEY')&&modelEnv('GEMINI_RESEARCH_MODEL','GEMINI_MODEL'))},
    {id:'gemini.writer',provider:'gemini',route:'writer',model:modelEnv('GEMINI_WRITER_MODEL','GEMINI_MODEL'),capabilities:['json'],configured:Boolean(env('GEMINI_API_KEY')&&modelEnv('GEMINI_WRITER_MODEL','GEMINI_MODEL'))},
    {id:'gemini.critic',provider:'gemini',route:'critic',model:modelEnv('GEMINI_CRITIC_MODEL','GEMINI_MODEL'),capabilities:['json'],configured:Boolean(env('GEMINI_API_KEY')&&modelEnv('GEMINI_CRITIC_MODEL','GEMINI_MODEL'))},
    {id:'qwen-local.research',provider:'qwen-local',route:'research',model:modelEnv('QWEN_LOCAL_RESEARCH_MODEL','QWEN_LOCAL_MODEL')||'qwen3',capabilities:['json'],configured:Boolean(env('QWEN_LOCAL_BASE_URL'))},
    {id:'qwen-local.writer',provider:'qwen-local',route:'writer',model:modelEnv('QWEN_LOCAL_WRITER_MODEL','QWEN_LOCAL_MODEL')||'qwen3',capabilities:['json'],configured:Boolean(env('QWEN_LOCAL_BASE_URL'))},
    {id:'qwen-local.critic',provider:'qwen-local',route:'critic',model:modelEnv('QWEN_LOCAL_CRITIC_MODEL','QWEN_LOCAL_MODEL')||'qwen3',capabilities:['json'],configured:Boolean(env('QWEN_LOCAL_BASE_URL'))},
  ].map(item=>Object.freeze(item));
}

function targetMap(){return new Map(targetDefinitions().map(item=>[item.id,item]));}
function providerStatus(provider){
  const configuredTargets=targetDefinitions().filter(t=>t.provider===provider.id&&t.configured).length;
  return {id:provider.id,label:provider.label,kind:provider.kind,supports:[...provider.supports],configured:configuredTargets>0,configuredTargets};
}
export function modelRouterStatus(){
  const targets=targetDefinitions().map(item=>({id:item.id,provider:item.provider,route:item.route,model:item.model||'',capabilities:[...item.capabilities],configured:Boolean(item.configured)}));
  return {format:MODEL_ROUTER_FORMAT,providers:MODEL_PROVIDER_REGISTRY.map(providerStatus),targets,routes:['research','writer','critic'].map(id=>getModelRoute(id)).filter(Boolean),fallbackPolicy:'configured-targets-only/transient-errors-only',secretsExposed:false};
}

function envPreferred(routeId){
  const key=`ANOMANCER_ROUTE_${String(routeId||'').toUpperCase()}_TARGET`;
  return env(key);
}

export function routeCandidates({contract,runtime={}}={}){
  const route=getModelRoute(contract?.modelRoute);
  if(!route)throw Object.assign(new Error('Agentin mallireittiä ei löydy.'),{statusCode:500,code:'MODEL_ROUTE_UNKNOWN'});
  const map=targetMap();
  const preferred=[clean(runtime?.modelTarget),envPreferred(route.id),route.defaultTarget].filter(Boolean);
  const ordered=[...new Set([...preferred,...route.allowedTargets])].filter(id=>route.allowedTargets.includes(id));
  return ordered.map(id=>map.get(id)).filter(Boolean);
}

function stripOuterFence(text){const raw=clean(text);const m=raw.match(/^```(?:json|javascript|js)?\s*([\s\S]*?)\s*```$/i);return clean(m?m[1]:raw);}
function balancedJsonCandidates(text){
  const raw=String(text||''),out=[];
  for(let start=0;start<raw.length;start++){
    if(raw[start]!=='{'&&raw[start]!=='[')continue;
    const stack=[raw[start]];let inString=false,escape=false;
    for(let i=start+1;i<raw.length;i++){
      const ch=raw[i];
      if(inString){if(escape){escape=false;continue;}if(ch==='\\'){escape=true;continue;}if(ch==='"')inString=false;continue;}
      if(ch==='"'){inString=true;continue;}if(ch==='{'||ch==='['){stack.push(ch);continue;}
      if(ch==='}'||ch===']'){const open=stack.at(-1);if((open==='{'&&ch!=='}')||(open==='['&&ch!==']'))break;stack.pop();if(!stack.length){out.push(raw.slice(start,i+1));start=i;break;}}
    }
  }
  return out;
}
function parseJsonText(text,{allowRawFallback=false}={}){
  const original=clean(text),raw=stripOuterFence(original),tries=[raw,...balancedJsonCandidates(raw)];
  for(const candidate of tries){if(!candidate)continue;try{return {ok:true,value:JSON.parse(candidate),raw:original,warning:''};}catch{}}
  if(allowRawFallback)return {ok:false,value:null,raw:original.slice(0,30_000),warning:'Mallivastaus ei ollut kelvollista JSONia. Raakavastaus säilytettiin tarkistettavaksi.'};
  throw Object.assign(new Error('Mallivastaus ei ollut kelvollista JSONia.'),{statusCode:502,code:'MODEL_JSON',retryable:false});
}
function sourceFallback(raw,warning){return {summary:'Rakenteinen lähdevastaus ei onnistunut. Näkyvä raakavastaus säilytettiin ihmisen tarkistettavaksi.',searchQueries:[],candidateSources:[],gaps:[],warnings:[warning].filter(Boolean),rawResponse:String(raw||'').slice(0,30_000)};}

async function apiFetch(url,{headers={},body,signal,provider}){
  const controller=new AbortController();let timedOut=false;
  const timeout=setTimeout(()=>{timedOut=true;controller.abort();},PROVIDER_TIMEOUT_MS);
  const external=()=>controller.abort();if(signal?.aborted)controller.abort();else signal?.addEventListener?.('abort',external,{once:true});
  let response;
  try{response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),signal:controller.signal});}
  catch(error){
    if(error?.name==='AbortError'&&!timedOut)throw Object.assign(new Error(`${provider} pyyntö peruttiin.`),{statusCode:499,code:'MODEL_CANCELLED',retryable:false});
    if(error?.name==='AbortError')throw Object.assign(new Error(`${provider} pyyntö aikakatkaistiin.`),{statusCode:504,code:'MODEL_TIMEOUT',retryable:true});
    throw Object.assign(new Error(`${provider} yhteys epäonnistui.`),{statusCode:502,code:'MODEL_NETWORK',retryable:true});
  }finally{clearTimeout(timeout);signal?.removeEventListener?.('abort',external);}
  const raw=await response.text();let data={};try{data=raw?JSON.parse(raw):{};}catch{data={message:raw.slice(0,500)}}
  if(!response.ok){const message=clean(data?.error?.message||data?.message||`${provider} HTTP ${response.status}`).slice(0,500);const retryable=response.status===408||response.status===409||response.status===425||response.status===429||response.status>=500;throw Object.assign(new Error(message),{statusCode:response.status===429?429:502,code:`MODEL_${provider.toUpperCase()}_${response.status}`,retryable});}
  return data;
}
function outputTextFromResponse(data){
  if(typeof data?.output_text==='string'&&data.output_text.trim())return data.output_text.trim();const chunks=[];
  for(const item of Array.isArray(data?.output)?data.output:[])for(const part of Array.isArray(item?.content)?item.content:[])if((part?.type==='output_text'||part?.type==='text')&&typeof part.text==='string')chunks.push(part.text);
  return chunks.join('\n').trim();
}

async function callOpenAI({target,system,user,maxTokens,schema,webSearch=false,signal}){
  const key=env('OPENAI_API_KEY');if(!key)throw Object.assign(new Error('OpenAI API ei ole konfiguroitu.'),{statusCode:503,code:'MODEL_PROVIDER_NOT_CONFIGURED',retryable:true});
  const body={model:target.model,instructions:system,input:user,max_output_tokens:maxTokens,store:false,text:{format:{type:'json_object'}}};
  if(webSearch){body.tools=[{type:'web_search'}];body.tool_choice='auto';}
  const data=await apiFetch('https://api.openai.com/v1/responses',{provider:'OpenAI',signal,headers:{Authorization:`Bearer ${key}`},body});
  if(data?.status==='incomplete')throw Object.assign(new Error(`OpenAI-vastaus jäi kesken: ${clean(data?.incomplete_details?.reason||'unknown')}`),{statusCode:502,code:'MODEL_LENGTH',retryable:true});
  const visible=outputTextFromResponse(data),parsed=parseJsonText(visible,{allowRawFallback:webSearch});
  const result=parsed.ok?parsed.value:sourceFallback(parsed.raw,parsed.warning);
  return {result,meta:{provider:'openai',model:data?.model||target.model,usage:data?.usage||null,searchedWeb:webSearch,structured:parsed.ok,outputTokens:Number(data?.usage?.output_tokens||0),reasoningTokens:Number(data?.usage?.output_tokens_details?.reasoning_tokens||0),maxOutputTokens:maxTokens,runId:data?.id||`openai-${crypto.randomUUID()}`}};
}

async function callAnthropic({target,system,user,maxTokens,signal}){
  const key=env('ANTHROPIC_API_KEY');if(!key)throw Object.assign(new Error('Anthropic API ei ole konfiguroitu.'),{statusCode:503,code:'MODEL_PROVIDER_NOT_CONFIGURED',retryable:true});
  const data=await apiFetch('https://api.anthropic.com/v1/messages',{provider:'Anthropic',signal,headers:{'x-api-key':key,'anthropic-version':'2023-06-01'},body:{model:target.model,max_tokens:maxTokens,system,messages:[{role:'user',content:user}]}});
  const finish=clean(data?.stop_reason);if(finish==='max_tokens')throw Object.assign(new Error('Anthropic-vastaus katkesi tokenrajaan.'),{statusCode:502,code:'MODEL_LENGTH',retryable:true});
  const visible=(Array.isArray(data?.content)?data.content:[]).filter(x=>x?.type==='text').map(x=>x.text||'').join('\n');
  const parsed=parseJsonText(visible);
  const usage={input_tokens:Number(data?.usage?.input_tokens||0),output_tokens:Number(data?.usage?.output_tokens||0),total_tokens:Number(data?.usage?.input_tokens||0)+Number(data?.usage?.output_tokens||0)};
  return {result:parsed.value,meta:{provider:'anthropic',model:data?.model||target.model,usage,searchedWeb:false,structured:true,outputTokens:usage.output_tokens,reasoningTokens:0,maxOutputTokens:maxTokens,finishReason:finish,runId:data?.id||`anthropic-${crypto.randomUUID()}`}};
}

async function callGemini({target,system,user,maxTokens,schema,webSearch=false,signal}){
  const key=env('GEMINI_API_KEY');if(!key)throw Object.assign(new Error('Gemini API ei ole konfiguroitu.'),{statusCode:503,code:'MODEL_PROVIDER_NOT_CONFIGURED',retryable:true});
  const generationConfig={responseMimeType:'application/json',maxOutputTokens:maxTokens};
  const body={system_instruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:user}]}],generationConfig};if(webSearch)body.tools=[{googleSearch:{}}];
  const geminiModel=String(target.model||'').replace(/^models\//,'');
  const data=await apiFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`,{provider:'Gemini',signal,headers:{'x-goog-api-key':key},body});
  const candidate=data?.candidates?.[0];const finish=clean(candidate?.finishReason||candidate?.finish_reason);if(/MAX_TOKENS/i.test(finish))throw Object.assign(new Error('Gemini-vastaus katkesi tokenrajaan.'),{statusCode:502,code:'MODEL_LENGTH',retryable:true});
  const visible=(candidate?.content?.parts||[]).map(x=>x?.text||'').join('\n');const parsed=parseJsonText(visible,{allowRawFallback:webSearch});const result=parsed.ok?parsed.value:sourceFallback(parsed.raw,parsed.warning);
  const raw=data?.usageMetadata||{};const usage={input_tokens:Number(raw.promptTokenCount||0),output_tokens:Number(raw.candidatesTokenCount||0),total_tokens:Number(raw.totalTokenCount||0)};
  return {result,meta:{provider:'gemini',model:data?.modelVersion||target.model,usage,searchedWeb:webSearch,structured:parsed.ok,outputTokens:usage.output_tokens,reasoningTokens:Number(raw.thoughtsTokenCount||0),maxOutputTokens:maxTokens,finishReason:finish,runId:data?.responseId||`gemini-${crypto.randomUUID()}`}};
}

async function callQwenLocal({target,system,user,maxTokens,signal}){
  const base=env('QWEN_LOCAL_BASE_URL')||'http://127.0.0.1:11434/v1';
  const body={model:target.model,messages:[{role:'system',content:system},{role:'user',content:user}],temperature:0.2,max_tokens:maxTokens,response_format:{type:'json_object'}};
  const data=await apiFetch(`${base.replace(/\/$/,'')}/chat/completions`,{provider:'Qwen Local',signal,body});
  const choice=data?.choices?.[0];
  const visible=clean(choice?.message?.content);
  const parsed=parseJsonText(visible);
  const usage=data?.usage||{};
  return {result:parsed.value,meta:{provider:'qwen-local',model:data?.model||target.model,usage,modelTarget:target.id,searchedWeb:false,structured:true,outputTokens:Number(usage.completion_tokens||0),reasoningTokens:Number(usage.completion_tokens_details?.reasoning_tokens||0),maxOutputTokens:maxTokens,finishReason:choice?.finish_reason||'',runId:data?.id||`qwen-local-${crypto.randomUUID()}`}};
}

async function callTarget(target,{system,user,schema,maxTokens,thinking=true,webSearch=false,signal}){
  if(target.provider==='deepseek')return webSearch?deepseekWebSearchJson({system,user,schema,maxTokens,signal}):deepseekChatJson({system,user,model:target.model,maxTokens,thinking,signal});
  if(target.provider==='openai')return callOpenAI({target,system,user,maxTokens,schema,webSearch,signal});
  if(target.provider==='anthropic'){if(webSearch)throw Object.assign(new Error('Anthropic-target ei tue tämän Coren web-search-reittiä.'),{statusCode:503,code:'MODEL_CAPABILITY_MISMATCH',retryable:true});return callAnthropic({target,system,user,maxTokens,signal});}
  if(target.provider==='gemini')return callGemini({target,system,user,maxTokens,schema,webSearch,signal});
  if(target.provider==='qwen-local'){if(webSearch)throw Object.assign(new Error('Qwen Local ei tue tämän reitin web-searchia.'),{statusCode:503,code:'MODEL_CAPABILITY_MISMATCH',retryable:true});return callQwenLocal({target,system,user,maxTokens,signal});}
  throw Object.assign(new Error('Tuntematon malliprovider.'),{statusCode:500,code:'MODEL_PROVIDER_UNKNOWN',retryable:false});
}

export async function routeAgentJson({contract,runtime={},system,user,schema=null,maxTokens,thinking=true,webSearch=false,signal}){
  const candidates=routeCandidates({contract,runtime});const attempts=[];let lastError=null;
  for(const target of candidates){
    if(!target.configured){attempts.push({targetId:target.id,provider:target.provider,model:target.model||'',status:'unconfigured'});continue;}
    if(webSearch&&!target.capabilities.includes('web_search')){attempts.push({targetId:target.id,provider:target.provider,model:target.model,status:'capability_mismatch'});continue;}
    try{
      const response=await callTarget(target,{system,user,schema,maxTokens,thinking,webSearch,signal});
      const routing={format:MODEL_ROUTER_FORMAT,route:contract.modelRoute,requestedTarget:runtime?.modelTarget||null,selectedTarget:target.id,provider:target.provider,model:response.meta?.model||target.model,fallbackUsed:attempts.length>0,attempts:[...attempts,{targetId:target.id,provider:target.provider,model:target.model,status:'ok'}]};
      response.meta={...(response.meta||{}),provider:target.provider,modelTarget:target.id,modelRoute:contract.modelRoute,routing};
      return response;
    }catch(error){lastError=error;attempts.push({targetId:target.id,provider:target.provider,model:target.model,status:'error',code:clean(error?.code||'MODEL_FAILED')});if(!error?.retryable)throw Object.assign(error,{routingAttempts:attempts});}
  }
  throw Object.assign(lastError||new Error('Yhtään konfiguroitua mallia ei löytynyt tälle reitille.'),{statusCode:lastError?.statusCode||503,code:lastError?.code||'MODEL_ROUTE_UNAVAILABLE',retryable:Boolean(lastError?.retryable),routingAttempts:attempts});
}

export function publicModelRouterSnapshot(){
  const status=modelRouterStatus();
  return {format:status.format,providers:status.providers.map(({id,label,kind,supports})=>({id,label,kind,supports})),targets:status.targets.map(({id,provider,route,capabilities})=>({id,provider,route,capabilities})),routes:status.routes.map(route=>({id:route.id,label:route.label,defaultTarget:route.defaultTarget,allowedTargets:[...route.allowedTargets],requires:[...route.requires],routeHash:route.routeHash})),fallbackPolicy:status.fallbackPolicy,secretsExposed:false};
}
