import crypto from 'node:crypto';

const BASE_URL='https://api.deepseek.com';
const ALLOWED_MODELS=new Set(['deepseek-v4-flash','deepseek-v4-pro']);
const RAW_FALLBACK_MAX=30_000;
const SOURCE_DEFAULT_MAX_OUTPUT_TOKENS=24000;
const SOURCE_MIN_MAX_OUTPUT_TOKENS=3000;
const SOURCE_MAX_MAX_OUTPUT_TOKENS=32000;
const SOURCE_REASONING_EFFORTS=new Set(['low','medium','high']);

function configuredModel(name, fallback){
  const value=String(process.env[name]||fallback).trim();
  return ALLOWED_MODELS.has(value)?value:fallback;
}
function integerEnv(name,fallback,min,max){
  const n=Number.parseInt(String(process.env[name]||''),10);
  return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
}
function sourceReasoningEffort(){
  const value=String(process.env.DEEPSEEK_SOURCE_REASONING_EFFORT||'low').trim().toLowerCase();
  return SOURCE_REASONING_EFFORTS.has(value)?value:'low';
}
function sourceMaxOutputTokens(){
  return integerEnv('DEEPSEEK_SOURCE_MAX_OUTPUT_TOKENS',SOURCE_DEFAULT_MAX_OUTPUT_TOKENS,SOURCE_MIN_MAX_OUTPUT_TOKENS,SOURCE_MAX_MAX_OUTPUT_TOKENS);
}

export function deepseekConfigStatus(){
  return {
    configured:Boolean(process.env.DEEPSEEK_API_KEY),
    defaultModel:configuredModel('DEEPSEEK_MODEL','deepseek-v4-flash'),
    sourceModel:'deepseek-v4-flash',
    sourceMaxOutputTokens:sourceMaxOutputTokens(),
    sourceReasoningEffort:sourceReasoningEffort(),
    sourceReasoningEffective:sourceReasoningEffort()==='low'?'low':'high',
    writerModel:configuredModel('DEEPSEEK_WRITER_MODEL',configuredModel('DEEPSEEK_MODEL','deepseek-v4-flash')),
    criticModel:configuredModel('DEEPSEEK_CRITIC_MODEL',configuredModel('DEEPSEEK_MODEL','deepseek-v4-flash')),
  };
}

function key(){
  const value=String(process.env.DEEPSEEK_API_KEY||'').trim();
  if(!value) throw Object.assign(new Error('DeepSeek API ei ole konfiguroitu.'),{statusCode:503,code:'DEEPSEEK_NOT_CONFIGURED'});
  return value;
}

function stripOuterFence(text){
  const raw=String(text||'').trim();
  const m=raw.match(/^```(?:json|javascript|js)?\s*([\s\S]*?)\s*```$/i);
  return (m?m[1]:raw).trim();
}

function balancedJsonCandidates(text){
  const raw=String(text||'');
  const out=[];
  for(let start=0;start<raw.length;start++){
    const opening=raw[start];
    if(opening!=='{'&&opening!=='[') continue;
    const stack=[opening];
    let inString=false,escape=false;
    for(let i=start+1;i<raw.length;i++){
      const ch=raw[i];
      if(inString){
        if(escape){escape=false;continue;}
        if(ch==='\\'){escape=true;continue;}
        if(ch==='"')inString=false;
        continue;
      }
      if(ch==='"'){inString=true;continue;}
      if(ch==='{'||ch==='['){stack.push(ch);continue;}
      if(ch==='}'||ch===']'){
        const open=stack[stack.length-1];
        if((open==='{'&&ch!=='}')||(open==='['&&ch!==']')) break;
        stack.pop();
        if(!stack.length){out.push(raw.slice(start,i+1));start=i;break;}
      }
    }
  }
  return out;
}

function parseJsonText(text,{allowRawFallback=false}={}){
  const original=String(text||'').trim();
  const raw=stripOuterFence(original);
  if(!raw){
    if(allowRawFallback) return {ok:false,value:null,raw:'',warning:'DeepSeek palautti tyhjän näkyvän vastauksen.'};
    throw Object.assign(new Error('DeepSeek palautti tyhjän vastauksen.'),{statusCode:502,code:'DEEPSEEK_EMPTY'});
  }

  const tries=[raw];
  const fenced=[...original.matchAll(/```(?:json|javascript|js)?\s*([\s\S]*?)```/gi)].map(m=>m[1].trim()).filter(Boolean);
  tries.push(...fenced,...balancedJsonCandidates(raw));
  const seen=new Set();
  for(const candidate of tries){
    if(!candidate||seen.has(candidate))continue;
    seen.add(candidate);
    try{return {ok:true,value:JSON.parse(candidate),raw:original,warning:''};}catch{}
  }

  if(allowRawFallback){
    return {
      ok:false,
      value:null,
      raw:original.slice(0,RAW_FALLBACK_MAX),
      warning:'DeepSeek-vastaus ei ollut kelvollista JSONia. Raakavastaus säilytettiin tarkistettavaksi.',
    };
  }
  throw Object.assign(new Error('DeepSeek-vastaus ei ollut kelvollista JSONia.'),{statusCode:502,code:'DEEPSEEK_JSON'});
}

function retryAfterMs(response){
  const value=response.headers.get('retry-after');
  if(!value)return 0;
  const seconds=Number(value);
  if(Number.isFinite(seconds))return Math.max(0,Math.min(120_000,seconds*1000));
  const date=Date.parse(value);
  return Number.isFinite(date)?Math.max(0,Math.min(120_000,date-Date.now())):0;
}

async function dsFetch(path,payload,{signal}={}){
  const controller=new AbortController();
  let timedOut=false;
  const timeout=setTimeout(()=>{timedOut=true;controller.abort();},integerEnv('DEEPSEEK_TIMEOUT_MS',280_000,10_000,290_000));
  const externalAbort=()=>controller.abort();
  if(signal?.aborted)controller.abort();
  else signal?.addEventListener?.('abort',externalAbort,{once:true});
  let response;
  try{
    response=await fetch(`${BASE_URL}${path}`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${key()}`},
      body:JSON.stringify(payload),
      signal:controller.signal,
    });
  }catch(error){
    if(error?.name==='AbortError'&&!timedOut) throw Object.assign(new Error('DeepSeek-pyyntö peruttiin.'),{statusCode:499,code:'DEEPSEEK_CANCELLED',retryable:false});
    if(error?.name==='AbortError') throw Object.assign(new Error('DeepSeek-pyyntö aikakatkaistiin.'),{statusCode:504,code:'DEEPSEEK_TIMEOUT',retryable:true});
    throw Object.assign(new Error('DeepSeek-yhteys epäonnistui.'),{statusCode:502,code:'DEEPSEEK_NETWORK',retryable:true});
  }finally{clearTimeout(timeout);signal?.removeEventListener?.('abort',externalAbort);}
  const raw=await response.text();
  let data={};
  try{data=raw?JSON.parse(raw):{};}catch{data={message:raw.slice(0,500)};}
  if(!response.ok){
    const message=String(data?.error?.message||data?.message||`DeepSeek HTTP ${response.status}`).slice(0,500);
    const transient=response.status===408||response.status===409||response.status===425||response.status===429||response.status>=500;
    const localStatus=response.status===429?429:(response.status>=400&&response.status<500?502:502);
    throw Object.assign(new Error(message),{statusCode:localStatus,upstreamStatus:response.status,code:`DEEPSEEK_${response.status}`,retryable:transient,retryAfterMs:retryAfterMs(response)});
  }
  return data;
}

function cleanUrl(value){
  try{
    const u=new URL(String(value||''));
    return (u.protocol==='http:'||u.protocol==='https:')?u.href:'';
  }catch{return '';}
}

function normalizeCandidate(item){
  const url=cleanUrl(item?.url);
  if(!url)return null;
  return {
    title:String(item?.title||url).slice(0,300),
    url,
    publisher:String(item?.publisher||'').slice(0,180),
    date:String(item?.date||'').slice(0,32),
    why:String(item?.why||'').slice(0,280),
    supports:String(item?.supports||'').slice(0,420),
    challenges:String(item?.challenges||'').slice(0,420),
  };
}

function normalizeSourceResult(value){
  const input=(value&&typeof value==='object'&&!Array.isArray(value))?value:{};
  const seen=new Set();
  const candidates=[];
  for(const item of Array.isArray(input.candidateSources)?input.candidateSources:[]){
    const normalized=normalizeCandidate(item);
    if(!normalized||seen.has(normalized.url))continue;
    seen.add(normalized.url);
    candidates.push(normalized);
  }
  return {
    summary:String(input.summary||'').slice(0,900),
    searchQueries:(Array.isArray(input.searchQueries)?input.searchQueries:[]).map(x=>String(x).slice(0,240)).filter(Boolean).slice(0,6),
    candidateSources:candidates.slice(0,6),
    gaps:(Array.isArray(input.gaps)?input.gaps:[]).map(x=>String(x).slice(0,450)).filter(Boolean).slice(0,4),
    warnings:(Array.isArray(input.warnings)?input.warnings:[]).map(x=>String(x).slice(0,450)).filter(Boolean).slice(0,4),
  };
}

function extractArrayObjects(raw,key){
  const text=String(raw||'');
  const keyIndex=text.indexOf(`"${key}"`);
  if(keyIndex<0)return [];
  const arrayStart=text.indexOf('[',keyIndex);
  if(arrayStart<0)return [];
  const tail=text.slice(arrayStart+1);
  const values=[];
  for(const candidate of balancedJsonCandidates(tail)){
    if(!candidate.startsWith('{'))continue;
    try{
      const parsed=JSON.parse(candidate);
      if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))values.push(parsed);
    }catch{}
  }
  return values;
}

function salvagePartialSourceResult(raw){
  const seen=new Set();
  const candidates=[];
  for(const item of extractArrayObjects(raw,'candidateSources')){
    const normalized=normalizeCandidate(item);
    if(!normalized||seen.has(normalized.url))continue;
    seen.add(normalized.url);
    candidates.push(normalized);
    if(candidates.length>=6)break;
  }
  return {candidateSources:candidates};
}

function sourceRawFallback(raw,warning,status='completed',reason=''){
  const salvaged=salvagePartialSourceResult(raw);
  const reasonText=reason?`DeepSeek incomplete reason: ${reason}`:'';
  const recovered=salvaged.candidateSources.length;
  return {
    summary:recovered
      ? `DeepSeekin vastaus jäi kesken, mutta ${recovered} valmista lähde-ehdokasta saatiin talteen ihmisen tarkistettavaksi.`
      : 'Rakenteinen lähdevastaus ei onnistunut. DeepSeekin näkyvä raakavastaus säilytettiin alle ihmisen tarkistettavaksi.',
    searchQueries:[],
    candidateSources:salvaged.candidateSources,
    gaps:[],
    warnings:[warning,status!=='completed'?`DeepSeek Responses API status: ${status}`:'',reasonText].filter(Boolean).slice(0,4),
    rawResponse:String(raw||'').slice(0,RAW_FALLBACK_MAX),
  };
}

export async function deepseekChatJson({system,user,model,maxTokens=5000,thinking=true,signal}){
  const selected=ALLOWED_MODELS.has(model)?model:configuredModel('DEEPSEEK_MODEL','deepseek-v4-flash');
  const data=await dsFetch('/chat/completions',{
    model:selected,
    messages:[{role:'system',content:system},{role:'user',content:user}],
    response_format:{type:'json_object'},
    thinking:{type:thinking?'enabled':'disabled'},
    reasoning_effort:thinking?'high':'low',
    max_tokens:maxTokens,
    stream:false,
  },{signal});
  const finishReason=String(data?.choices?.[0]?.finish_reason||'');
  if(finishReason==='length') throw Object.assign(new Error('DeepSeek-vastaus katkesi tokenrajaan.'),{statusCode:502,code:'DEEPSEEK_LENGTH',retryable:true});
  if(finishReason==='content_filter') throw Object.assign(new Error('DeepSeek suodatti vastauksen.'),{statusCode:502,code:'DEEPSEEK_CONTENT_FILTER',retryable:false});
  const parsed=parseJsonText(data?.choices?.[0]?.message?.content);
  return {
    result:parsed.value,
    meta:{
      model:data?.model||selected,
      usage:data?.usage||null,
      searchedWeb:false,
      structured:true,
      finishReason,
      outputTokens:Number(data?.usage?.completion_tokens||0),
      reasoningTokens:Number(data?.usage?.completion_tokens_details?.reasoning_tokens||0),
      runId:data?.id||`local-${crypto.randomUUID()}`,
    },
  };
}

function responseOutputText(data){
  if(typeof data?.output_text==='string'&&data.output_text.trim()) return data.output_text.trim();
  const chunks=[];
  for(const item of Array.isArray(data?.output)?data.output:[]){
    if(item?.type!=='message') continue;
    if(typeof item?.text==='string'&&item.text.trim())chunks.push(item.text.trim());
    for(const part of Array.isArray(item?.content)?item.content:[]){
      if((part?.type==='output_text'||part?.type==='text')&&typeof part.text==='string'&&part.text.trim()) chunks.push(part.text.trim());
    }
  }
  return chunks.join('\n').trim();
}

export async function deepseekWebSearchJson({system,user,schema,maxTokens,signal}){
  const model='deepseek-v4-flash';
  const requestedTokens=Number.isFinite(Number(maxTokens))
    ? Math.min(SOURCE_MAX_MAX_OUTPUT_TOKENS,Math.max(SOURCE_MIN_MAX_OUTPUT_TOKENS,Number(maxTokens)))
    : sourceMaxOutputTokens();
  const effort=sourceReasoningEffort();
  const data=await dsFetch('/responses',{
    model,
    instructions:system,
    input:user,
    tools:[{type:'web_search'}],
    tool_choice:{type:'web_search'},
    reasoning:{effort},
    max_output_tokens:requestedTokens,
    text:{format:{type:'json_schema',name:'anomancer_source_agent',schema}},
    store:false,
  },{signal});
  const visible=responseOutputText(data);
  const parsed=parseJsonText(visible,{allowRawFallback:true});
  const responseStatus=String(data?.status||'completed');
  const incompleteReason=responseStatus==='incomplete'?String(data?.incomplete_details?.reason||'unknown'):'';
  const structured=parsed.ok&&responseStatus==='completed';
  const result=structured
    ? normalizeSourceResult(parsed.value)
    : sourceRawFallback(parsed.raw,parsed.warning||'DeepSeekin lähdevastaus jäi epätäydelliseksi.',responseStatus,incompleteReason);
  const reasoningTokens=Number(data?.usage?.output_tokens_details?.reasoning_tokens||0);
  return {
    result,
    meta:{
      model:data?.model||model,
      usage:data?.usage||null,
      searchedWeb:true,
      structured,
      responseStatus,
      incompleteReason,
      recoveredSourceCount:structured?0:(Array.isArray(result.candidateSources)?result.candidateSources.length:0),
      visibleOutputChars:visible.length,
      outputTokens:Number(data?.usage?.output_tokens||0),
      reasoningTokens,
      maxOutputTokens:requestedTokens,
      reasoningEffort:effort,
      runId:data?.id||`local-${crypto.randomUUID()}`,
    },
  };
}
