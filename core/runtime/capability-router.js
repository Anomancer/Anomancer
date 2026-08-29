export const CAPABILITY_ROUTE_FORMAT='anomancer-capability-route/v1';

const READ_ONLY=new Set([
  'document.read',
  'web.fetch',
  'research.search',
  'repository.read',
  'mancer.activate'
]);

const PROPOSAL_ONLY=new Set(['repository.propose']);

const REASONING_PROXY=new Set([
  'llm.reasoning','llm.analysis','llm.writer','llm.critic','risk.analysis',
  'evidence.trace','evidence.validate','contradiction.check','code.inspect','architecture.analyze',
  'editorial.plan','editorial.write','editorial.edit','claims.inspect','evidence.map','publication.prepare',
  'story.plan','story.world','story.character','story.plot','story.draft','story.continuity','story.voice','story.canon'
]);

function unique(values){return [...new Set(values.filter(Boolean))];}

function routingFor(capability,id){
  const declared=String(capability?.routing||'');
  if(['read-only','compute','reasoning','proposal','approval'].includes(declared))return declared;
  if(READ_ONLY.has(id))return 'read-only';
  if(PROPOSAL_ONLY.has(id))return 'proposal';
  if(REASONING_PROXY.has(id))return 'reasoning';
  if(capability?.requiresApproval===true||id==='external.execute')return 'approval';
  return 'unrouted';
}

export function buildCapabilityRoute({problem={},resolution={},recommendation={}}={}){
  const matched=Array.isArray(resolution.matched)?resolution.matched:[];
  const readOnly=[];
  const compute=[];
  const reasoning=[];
  const blocked=[];
  const proposals=[];

  for(const capability of matched){
    const id=String(capability?.id||'');
    const routing=routingFor(capability,id);
    if(routing==='read-only')readOnly.push(id);
    else if(routing==='compute')compute.push(id);
    else if(routing==='proposal')proposals.push(id);
    else if(routing==='reasoning')reasoning.push(id);
    else if(routing==='approval')blocked.push(id);
  }

  for(const capability of Array.isArray(resolution.unresolved)?resolution.unresolved:[]){
    if(capability?.id==='external.execute'||capability?.id==='tests.run')blocked.push(capability.id);
  }

  if(recommendation?.workspace?.id)readOnly.push('mancer.activate');

  return {
    format:CAPABILITY_ROUTE_FORMAT,
    mode:'read-before-reason',
    readOnly:unique(readOnly),
    compute:unique(compute),
    reasoning:unique(reasoning.length?reasoning:['llm.reasoning']),
    proposals:unique(proposals),
    blocked:unique(blocked),
    externalSideEffectsAllowed:false,
    humanApprovalRequiredForWrites:true,
    problemDomain:String(problem.domain||'general')
  };
}
