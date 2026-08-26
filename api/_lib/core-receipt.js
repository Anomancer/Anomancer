import crypto from 'node:crypto';
import { CORE_VERSION, RUN_RECEIPT_FORMAT, digest } from './core-registry.js';
import { publicPolicyDecision } from './tool-broker.js';

function iso(value){const d=value instanceof Date?value:new Date(value||Date.now());return d.toISOString();}
function usage(meta={}){
  const raw=meta.usage||{};
  const inputTokens=Number(raw.prompt_tokens??raw.input_tokens??0)||0;
  const outputTokens=Number(meta.outputTokens??raw.completion_tokens??raw.output_tokens??0)||0;
  const totalTokens=Number(raw.total_tokens??(inputTokens+outputTokens))||inputTokens+outputTokens;
  return {inputTokens,outputTokens,totalTokens,reasoningTokens:Number(meta.reasoningTokens||0)||0,maxOutputTokens:Number(meta.maxOutputTokens||0)||0,costEuro:null};
}
export function createRunReceipt({contract,runtime=null,post,instruction='',result,meta={},toolPolicy=[],startedAt,finishedAt,orchestraRunId=null,stageIndex=null,status='completed'}){
  const start=iso(startedAt),finish=iso(finishedAt);
  const subject={agent:contract.id,contractHash:contract.contractHash,input:{post,instruction}};
  const inputHash=digest(subject);
  const outputHash=digest(result??null);
  const seed=`${contract.id}:${contract.contractHash}:${inputHash}:${outputHash}:${start}:${finish}`;
  const id=`run-${crypto.createHash('sha256').update(seed).digest('hex').slice(0,20)}`;
  return {
    format:RUN_RECEIPT_FORMAT,id,coreVersion:CORE_VERSION,orchestraRunId:orchestraRunId||null,stageIndex:Number.isInteger(stageIndex)?stageIndex:null,
    agent:{id:contract.id,label:contract.label,version:contract.version,contractHash:contract.contractHash,role:contract.role},
    model:{provider:'deepseek',model:String(meta.model||''),route:contract.modelRoute},
    authority:{write:[...(contract.authority?.write||[])],humanApproval:[...(contract.humanApproval||[])]},
    runtime:runtime?{active:runtime.active!==false,maxOutputTokens:Number(runtime.maxOutputTokens||0)||0}:null,
    usage:usage(meta),tools:(toolPolicy||[]).filter(item=>item?.outcome==='allow').map(item=>String(item.toolId||'')).filter(Boolean),toolPolicy:(toolPolicy||[]).map(publicPolicyDecision).filter(Boolean),status,
    inputHash,outputHash,startedAt:start,finishedAt:finish,durationMs:Math.max(0,new Date(finish)-new Date(start)),
    humanApprovalRequired:true
  };
}
