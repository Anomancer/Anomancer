export const PRODUCTION_HARDENING_FORMAT='anomancer-production-hardening/v1';

const MAX_AUDIT_BYTES=64*1024;
const MAX_EVENTS=512;

export function classifyRuntimeFailure(error={}){
  const code=String(error?.code||'').toUpperCase();
  const status=Number(error?.status);
  if(error?.cancelled===true||code==='ABORT_ERR'||code==='CANCELLED')return {class:'cancelled',retryable:false,code:code||'CANCELLED'};
  if(['TASK_TIMEOUT','ETIMEDOUT','ECONNRESET','ECONNREFUSED','EAI_AGAIN','429','RATE_LIMITED','5XX'].includes(code)||status===408||status===429||status>=500)return {class:'transient',retryable:true,code:code||String(status)};
  return {class:'permanent',retryable:false,code:code||'RUNTIME_FAILURE'};
}

export function createIdempotencyKey(runId,taskId,attempt=1){
  return `anomancer:${String(runId||'run').slice(0,80)}:${String(taskId||'task').slice(0,80)}:${Math.max(1,Number(attempt)||1)}`;
}

export function createCheckpoint({runId,state='working',completed=[],outputs={},metas={},failedStage=null}={}){
  return Object.freeze({
    format:PRODUCTION_HARDENING_FORMAT,
    version:1,
    runId:String(runId||'').slice(0,160),
    state:String(state||'working').slice(0,40),
    completed:Array.isArray(completed)?completed.map(String).slice(-256):[],
    outputs:outputs&&typeof outputs==='object'?outputs:{},
    metas:metas&&typeof metas==='object'?metas:{},
    failedStage:failedStage?String(failedStage).slice(0,160):null,
    savedAt:new Date().toISOString()
  });
}

export function buildRecoveryPlan(checkpoint,errors=[]){
  const failure=Array.isArray(errors)&&errors.length?classifyRuntimeFailure(errors.at(-1)):null;
  const failedStage=checkpoint?.failedStage||null;
  if(!checkpoint||String(checkpoint.format)!==PRODUCTION_HARDENING_FORMAT){
    return {format:PRODUCTION_HARDENING_FORMAT,status:'unavailable',action:'restart',failedStage:null,failure};
  }
  if(failure?.class==='cancelled')return {format:PRODUCTION_HARDENING_FORMAT,status:'cancelled',action:'resume',failedStage,checkpointRunId:checkpoint.runId,failure};
  if(failure?.retryable)return {format:PRODUCTION_HARDENING_FORMAT,status:'recoverable',action:'retry-or-resume',failedStage,checkpointRunId:checkpoint.runId,failure};
  if(failedStage)return {format:PRODUCTION_HARDENING_FORMAT,status:'blocked',action:'human-review',failedStage,checkpointRunId:checkpoint.runId,failure};
  return {format:PRODUCTION_HARDENING_FORMAT,status:'ready',action:'resume',failedStage:null,checkpointRunId:checkpoint.runId,failure};
}

function canonical(value){
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export function hashAuditPayload(value){
  let hash=2166136261;
  for(const char of canonical(value)){
    hash^=char.charCodeAt(0);
    hash=Math.imul(hash,16777619);
  }
  return (hash>>>0).toString(16).padStart(8,'0');
}

export function appendAuditEvent(chain,event={}){
  const previous=Array.isArray(chain)?chain.at(-1):null;
  const entry={
    sequence:Array.isArray(chain)?chain.length:0,
    at:new Date().toISOString(),
    type:String(event.type||'runtime.event').slice(0,80),
    runId:String(event.runId||'').slice(0,160),
    taskId:event.taskId?String(event.taskId).slice(0,160):null,
    status:event.status?String(event.status).slice(0,40):null,
    idempotencyKey:event.idempotencyKey?String(event.idempotencyKey).slice(0,220):null,
    detail:event.detail?String(event.detail).slice(0,500):null,
    previousHash:previous?.hash||'GENESIS'
  };
  entry.hash=hashAuditPayload(entry);
  const next=[...(Array.isArray(chain)?chain:[]),entry].slice(-MAX_EVENTS);
  return next;
}

export function verifyAuditChain(chain){
  if(!Array.isArray(chain))return {valid:false,checked:0,reason:'not-array'};
  let previous='GENESIS';
  for(let i=0;i<chain.length;i++){
    const entry=chain[i];
    if(entry.previousHash!==previous)return {valid:false,checked:i,reason:'previous-hash-mismatch'};
    const {hash,...payload}=entry;
    if(hash!==hashAuditPayload(payload))return {valid:false,checked:i,reason:'hash-mismatch'};
    previous=hash;
  }
  return {valid:true,checked:chain.length,reason:'ok'};
}

export function auditEnvelope({runId,events=[],publicationApproved=false}={}){
  const chain=[];
  for(const event of Array.isArray(events)?events.slice(0,MAX_EVENTS):[])chain.splice(0,chain.length,...appendAuditEvent(chain,{...event,runId}));
  const envelope={format:PRODUCTION_HARDENING_FORMAT,runId:String(runId||'').slice(0,160),publicationApproved:publicationApproved===true,audit:chain,integrity:verifyAuditChain(chain)};
  return JSON.stringify(envelope).slice(0,MAX_AUDIT_BYTES);
}
