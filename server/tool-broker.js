import crypto from 'node:crypto';
import { CORE_VERSION, TOOL_POLICY_FORMAT, getAgentContract, getToolContract, digest } from './core-registry.js';

const clone=value=>JSON.parse(JSON.stringify(value));
const iso=value=>(value instanceof Date?value:new Date(value||Date.now())).toISOString();

function decisionBase({contract,tool,toolId,actor='agent',context={},now}){
  return {
    format:TOOL_POLICY_FORMAT,
    coreVersion:CORE_VERSION,
    agentId:contract?.id||String(context.agentId||''),
    contractHash:contract?.contractHash||null,
    toolId:String(tool?.id||toolId||''),
    toolHash:tool?.toolHash||null,
    actor:String(actor||'agent'),
    risk:tool?.risk||'unknown',
    kind:tool?.kind||'unknown',
    requestContext:{workspaceId:String(context.workspaceId||'default'),orchestraRunId:String(context.orchestraRunId||'')||null,stageIndex:Number.isInteger(context.stageIndex)?context.stageIndex:null},
    decidedAt:iso(now)
  };
}
function finish(base,outcome,reason){
  const payload={...base,outcome,reason};
  const seed=digest(payload);
  return {...payload,decisionId:`policy-${crypto.createHash('sha256').update(seed).digest('hex').slice(0,20)}`,policyHash:seed};
}
function authorityDenied(contract,tool){
  const deny=new Set(contract?.authority?.deny||[]);
  const keys=new Set([tool?.id,...(tool?.authorityKeys||[])].filter(Boolean));
  return [...keys].some(key=>deny.has(key));
}
function humanGateApplies(contract,tool){
  if(tool?.actor==='human'||tool?.humanApproval===true)return true;
  const gates=new Set(contract?.humanApproval||[]);
  return [tool?.id,...(tool?.authorityKeys||[])].filter(Boolean).some(key=>gates.has(key));
}

export function evaluateToolPolicy({agentId,toolId,actor='agent',context={},now=new Date()}={}){
  const contract=getAgentContract(agentId),tool=getToolContract(toolId);
  const base=decisionBase({contract,tool,toolId,actor,context:{...context,agentId},now});
  if(!contract)return finish(base,'deny','AGENT_UNKNOWN');
  if(!tool)return finish(base,'deny','TOOL_UNKNOWN');
  if(actor!=='agent')return finish(base,'deny','ACTOR_UNSUPPORTED');
  if(tool.actor==='human')return finish(base,'human_required','HUMAN_ONLY');
  if(!(contract.tools||[]).includes(tool.id))return finish(base,'deny','TOOL_NOT_IN_CONTRACT');
  if(tool.requiredCapability&&!(contract.capabilities||[]).includes(tool.requiredCapability))return finish(base,'deny','CAPABILITY_MISSING');
  if(authorityDenied(contract,tool))return finish(base,'deny','AUTHORITY_DENY');
  if(humanGateApplies(contract,tool))return finish(base,'human_required','HUMAN_APPROVAL_REQUIRED');
  return finish(base,'allow','CONTRACT_ALLOW');
}

export function authorizeAgentTools({contract,toolIds=[],context={}}={}){
  const ids=[...new Set((toolIds||[]).map(String).filter(Boolean))];
  const decisions=ids.map(toolId=>evaluateToolPolicy({agentId:contract?.id,toolId,actor:'agent',context}));
  const blocked=decisions.find(item=>item.outcome!=='allow');
  if(blocked){
    const human=blocked.outcome==='human_required';
    const error=Object.assign(new Error(human?`Työkalu ${blocked.toolId} vaatii ihmisen hyväksynnän.`:`Tool Broker esti työkalun ${blocked.toolId}: ${blocked.reason}.`),{
      statusCode:human?409:403,
      code:human?'TOOL_HUMAN_APPROVAL_REQUIRED':'TOOL403',
      retryable:false,
      policyDecision:clone(blocked),
      policyLog:clone(decisions)
    });
    throw error;
  }
  return decisions;
}

export function publicPolicyDecision(value){
  if(!value||typeof value!=='object')return null;
  return {
    format:value.format||TOOL_POLICY_FORMAT,decisionId:String(value.decisionId||''),policyHash:String(value.policyHash||''),
    agentId:String(value.agentId||''),toolId:String(value.toolId||''),outcome:String(value.outcome||''),reason:String(value.reason||''),risk:String(value.risk||''),kind:String(value.kind||''),
    decidedAt:String(value.decidedAt||''),requestContext:value.requestContext&&typeof value.requestContext==='object'?clone(value.requestContext):{workspaceId:'default',orchestraRunId:null,stageIndex:null}
  };
}
