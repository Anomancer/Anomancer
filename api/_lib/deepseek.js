import crypto from 'node:crypto';

const BASE_URL='https://api.deepseek.com';
const ALLOWED_MODELS=new Set(['deepseek-v4-flash','deepseek-v4-pro']);
const RAW_FALLBACK_MAX=30_000;

function configuredModel(name, fallback){
  const value=String(process.env[name]||fallback).trim();
  return ALLOWED_MODELS.has(value)?value:fallback;
}

export function deepseekConfigStatus(){
  return {
    configured:Boolean(process.env.DEEPSEEK_API_KEY),
    defaultModel:configuredModel('DEEPSEEK_MODEL','deepseek-v4-flash'),
    sourceModel:'deepseek-v4-flash',
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

async function dsFetch(path,payload){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),Number(process.env.DEEPSEEK_TIMEOUT_MS||75_000));
  let response;
  try{
    response=await fetch(`${BASE_URL}${path}`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${key()}`},
      body:JSON.stringify(payload),
      signal:controller.signal,
    });
  }catch(error){
    if(error?.name==='AbortError') throw Object.assign(new Error('DeepSeek-pyyntö aikakatkaistiin.'),{statusCode:504,code:'DEEPSEEK_TIMEOUT'});
    throw Object.assign(new Error('DeepSeek-yhteys epäonnistui.'),{statusCode:502,code:'DEEPSEEK_NETWORK'});
  }finally{clearTimeout(timeout);}
  const raw=await response.text();
  let data={};
  try{data=raw?JSON.parse(raw):{};}catch{data={message:raw.slice(0,500)};}
  if(!response.ok){
    const message=String(data?.error?.message||data?.message||`DeepSeek HTTP ${response.status}`).slice(0,500);
    throw Object.assign(new Error(message),{statusCode:response.status===429?429:502,code:`DEEPSEEK_${response.status}`});
  }
  return data;
}

function cleanUrl(value){
  try{
    const u=new URL(String(value||''));
    return (u.protocol==='http:'||u.protocol==='https:')?u.href:'';
  }catch{return '';}
}

function normalizeSourceResult(value){
  const input=(value&&typeof value==='object'&&!Array.isArray(value))?value:{};
  const seen=new Set();
  const candidates=[];
  for(const item of Array.isArray(input.candidateSources)?input.candidateSources:[]){
    const url=cleanUrl(item?.url);
    if(!url||seen.has(url))continue;
    seen.add(url);
    candidates.push({
      title:String(item?.title||url).slice(0,400),
      url,
      publisher:String(item?.publisher||'').slice(0,240),
      date:String(item?.date||'').slice(0,40),
      why:String(item?.why||'').slice(0,1200),
      supports:String(item?.supports||'').slice(0,1200),
      challenges:String(item?.challenges||'').slice(0,1200),
    });
  }
  return {
    summary:String(input.summary||'').slice(0,5000),
    searchQueries:(Array.isArray(input.searchQueries)?input.searchQueries:[]).map(x=>String(x).slice(0,500)).filter(Boolean).slice(0,8),
    candidateSources:candidates.slice(0,12),
    gaps:(Array.isArray(input.gaps)?input.gaps:[]).map(x=>String(x).slice(0,1000)).filter(Boolean).slice(0,10),
    warnings:(Array.isArray(input.warnings)?input.warnings:[]).map(x=>String(x).slice(0,1000)).filter(Boolean).slice(0,10),
  };
}

function sourceRawFallback(raw,warning,status='completed'){
  return {
    summary:'Rakenteinen lähdevastaus ei onnistunut. DeepSeekin näkyvä raakavastaus säilytettiin alle ihmisen tarkistettavaksi.',
    searchQueries:[],
    candidateSources:[],
    gaps:[],
    warnings:[warning,status!=='completed'?`DeepSeek Responses API status: ${status}`:''].filter(Boolean),
    rawResponse:String(raw||'').slice(0,RAW_FALLBACK_MAX),
  };
}

export async function deepseekChatJson({system,user,model,maxTokens=5000,thinking=true}){
  const selected=ALLOWED_MODELS.has(model)?model:configuredModel('DEEPSEEK_MODEL','deepseek-v4-flash');
  const data=await dsFetch('/chat/completions',{
    model:selected,
    messages:[{role:'system',content:system},{role:'user',content:user}],
    response_format:{type:'json_object'},
    thinking:{type:thinking?'enabled':'disabled'},
    reasoning_effort:thinking?'high':'low',
    max_tokens:maxTokens,
    stream:false,
  });
  const parsed=parseJsonText(data?.choices?.[0]?.message?.content);
  return {
    result:parsed.value,
    meta:{
      model:data?.model||selected,
      usage:data?.usage||null,
      searchedWeb:false,
      structured:true,
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

export async function deepseekWebSearchJson({system,user,schema,maxTokens=7000}){
  const model='deepseek-v4-flash';
  const data=await dsFetch('/responses',{
    model,
    instructions:system,
    input:user,
    tools:[{type:'web_search'}],
    tool_choice:{type:'web_search'},
    reasoning:{effort:'high'},
    max_output_tokens:maxTokens,
    text:{format:{type:'json_schema',name:'anomancer_source_agent',schema}},
    store:false,
  });
  const visible=responseOutputText(data);
  const parsed=parseJsonText(visible,{allowRawFallback:true});
  const complete=data?.status||'completed';
  const structured=parsed.ok&&complete==='completed';
  const result=structured
    ? normalizeSourceResult(parsed.value)
    : sourceRawFallback(parsed.raw,parsed.warning||'DeepSeekin lähdevastaus jäi epätäydelliseksi.',complete);
  return {
    result,
    meta:{
      model:data?.model||model,
      usage:data?.usage||null,
      searchedWeb:true,
      structured,
      responseStatus:complete,
      runId:data?.id||`local-${crypto.randomUUID()}`,
    },
  };
}
