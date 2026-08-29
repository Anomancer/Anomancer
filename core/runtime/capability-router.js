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
  'llm.reasoning','llm.analysis','llm.writer','llm.critic','comparison','risk.analysis',
  'evidence.trace','evidence.validate','contradiction.check','code.inspect','architecture.analyze',
  'editorial.plan','editorial.write','editorial.edit','claims.inspect','evidence.map','publication.prepare',
  'story.plan','story.world','story.character','story.plot','story.draft','story.continuity','story.voice','story.canon'
]);

function unique(values){return [...new Set(values.filter(Boolean))];}

export function buildCapabilityRoute({problem={},resolution={},recommendation={}}={}){
  const matched=Array.isArray(resolution.matched)?resolution.matched:[];
  const readOnly=[];
  const reasoning=[];
  const blocked=[];
  const proposals=[];

  for(const capability of matched){
    const id=String(capability?.id||'');
    if(READ_ONLY.has(id))readOnly.push(id);
    else if(PROPOSAL_ONLY.has(id))proposals.push(id);
    else if(REASONING_PROXY.has(id))reasoning.push(id);
    else if(capability?.requiresApproval===true||id==='external.execute')blocked.push(id);
  }

  for(const capability of Array.isArray(resolution.unresolved)?resolution.unresolved:[]){
    if(capability?.id==='external.execute'||capability?.id==='tests.run')blocked.push(capability.id);
  }

  if(recommendation?.workspace?.id)readOnly.push('mancer.activate');

  return {
    format:CAPABILITY_ROUTE_FORMAT,
    mode:'read-before-reason',
    readOnly:unique(readOnly),
    reasoning:unique(reasoning.length?reasoning:['llm.reasoning']),
    proposals:unique(proposals),
    blocked:unique(blocked),
    externalSideEffectsAllowed:false,
    humanApprovalRequiredForWrites:true,
    problemDomain:String(problem.domain||'general')
  };
}
