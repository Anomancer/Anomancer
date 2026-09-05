export const TASK_GRAPH_FORMAT='anomancer-task-graph/v1';
const unique=v=>[...new Set((v||[]).filter(Boolean))];
function entries(route={}){const out=[],add=(routing,ids,blocked=false)=>unique(ids).forEach(id=>out.push({id:String(id),routing,blocked}));add('read-only',route.readOnly);add('compute',route.compute);add('reasoning',route.reasoning);add('proposal',route.proposals);add('approval',route.blocked,true);return out;}
const present=(ids,list)=>list.filter(id=>ids.has(id));
function deps(id,routing,ids){
  const out=[];
  if(routing==='compute'&&id!=='data.profile'&&ids.has('data.profile'))out.push('data.profile');
  if(id==='data.analyze'&&ids.has('statistics.describe'))out.push('statistics.describe');
  if(id==='data.visualize')out.push(...present(ids,['data.analyze','data.profile']).slice(0,1));
  const searches=present(ids,['source.search','academic.search','news.search','research.search','web.fetch']);
  if(['source.rank','source.crosscheck','source.primary.find','source.recency.check','source.bias.inspect'].includes(id))out.push(...searches);
  if(id==='research.synthesize')out.push(...present(ids,['source.rank','source.crosscheck','research.method.inspect']));
  if(id==='research.gap.detect')out.push(...present(ids,['research.synthesize','source.crosscheck']));
  if(id.startsWith('market.')){out.push(...searches);if(id!=='market.snapshot'&&ids.has('market.snapshot'))out.push('market.snapshot');}
  if(id==='market.risk')out.push(...present(ids,['market.volatility','market.liquidity','market.sentiment']));
  if(id==='market.scenario')out.push(...present(ids,['market.risk']));
  if(id==='model.disagreement'&&ids.has('model.compare'))out.push('model.compare');
  if(id==='model.merge')out.push(...present(ids,['model.compare','model.disagreement']));
  if(id==='uncertainty.calibrate')out.push(...present(ids,['model.merge','evidence.validate']));
  return unique(out).filter(dep=>dep!==id);
}
function makeStages(nodes){
  const remaining=new Map(nodes.filter(n=>!n.blocked).map(n=>[n.id,n])),done=new Set(),out=[];let guard=0;
  while(remaining.size&&guard++<100){const ready=[...remaining.values()].filter(n=>n.dependsOn.every(dep=>done.has(dep)||!remaining.has(dep)));if(!ready.length)throw Object.assign(new Error(`Task Graph dependency cycle: ${[...remaining.keys()].join(', ')}`),{code:'TASK_GRAPH_CYCLE'});out.push({index:out.length,parallel:ready.length>1,capabilityIds:ready.map(n=>n.id)});ready.forEach(n=>{remaining.delete(n.id);done.add(n.id);});}
  return out;
}
export function buildTaskGraph({problem={},capabilityRoute={}}={}){const raw=entries(capabilityRoute),ids=new Set(raw.map(x=>x.id)),nodes=raw.map(x=>Object.freeze({...x,dependsOn:deps(x.id,x.routing,ids)})),plan=makeStages(nodes),maxWidth=plan.reduce((m,s)=>Math.max(m,s.capabilityIds.length),0);return Object.freeze({format:TASK_GRAPH_FORMAT,mode:'dependency-graph',problemDomain:String(problem.domain||'general'),nodes,stages:plan,executionOrder:plan.flatMap(s=>s.capabilityIds),blocked:nodes.filter(n=>n.blocked).map(n=>n.id),summary:Object.freeze({nodes:nodes.length,runnable:nodes.filter(n=>!n.blocked).length,blocked:nodes.filter(n=>n.blocked).length,stages:plan.length,parallelStages:plan.filter(s=>s.parallel).length,maxWidth,concurrencyHint:Math.min(4,Math.max(1,maxWidth))})});}


export function taskGraphPublicProfile(){
  return Object.freeze({
    format:TASK_GRAPH_FORMAT,
    installed:true,
    dependencyAware:true,
    topologicalStages:true,
    parallelStageHints:true,
    schedulerMode:'bounded-hint',
    routings:['read-only','compute','reasoning','proposal','approval'],
    externalSideEffectsAllowed:false,
    finalAuthority:'human'
  });
}
