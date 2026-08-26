import crypto from 'node:crypto';

const BASE_URL='https://api.deepseek.com';
const ALLOWED_MODELS=new Set(['deepseek-v4-flash','deepseek-v4-pro']);

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

function parseJsonText(text){
  const raw=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
  if(!raw) throw Object.assign(new Error('DeepSeek palautti tyhjän vastauksen.'),{statusCode:502,code:'DEEPSEEK_EMPTY'});
  try{return JSON.parse(raw);}catch{
    const start=raw.indexOf('{'),end=raw.lastIndexOf('}');
    if(start>=0&&end>start){try{return JSON.parse(raw.slice(start,end+1));}catch{}}
    throw Object.assign(new Error('DeepSeek-vastaus ei ollut kelvollista JSONia.'),{statusCode:502,code:'DEEPSEEK_JSON'});
  }
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
  const text=data?.choices?.[0]?.message?.content;
  return {
    result:parseJsonText(text),
    meta:{
      model:data?.model||selected,
      usage:data?.usage||null,
      searchedWeb:false,
      runId:data?.id||`local-${crypto.randomUUID()}`,
    },
  };
}

function responseOutputText(data){
  for(const item of Array.isArray(data?.output)?data.output:[]){
    if(item?.type!=='message') continue;
    for(const part of Array.isArray(item.content)?item.content:[]){
      if(part?.type==='output_text'&&part.text) return part.text;
    }
  }
  return '';
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
  return {
    result:parseJsonText(responseOutputText(data)),
    meta:{
      model:data?.model||model,
      usage:data?.usage||null,
      searchedWeb:true,
      runId:data?.id||`local-${crypto.randomUUID()}`,
    },
  };
}
