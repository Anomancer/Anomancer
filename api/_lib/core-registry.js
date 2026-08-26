import crypto from 'node:crypto';

export const CORE_VERSION='15.6.0';
export const AGENT_CONTRACT_FORMAT='anomancer-agent/v1';
export const ORCHESTRA_FORMAT='anomancer-orchestra/v1';
export const RUN_RECEIPT_FORMAT='anomancer-run-receipt/v1';
export const AGENT_RUNTIME_FORMAT='anomancer-agent-runtime/v1';
export const TOOL_POLICY_FORMAT='anomancer-tool-policy/v1';
export const MODEL_ROUTER_FORMAT='anomancer-model-router/v1';
export const MODEL_ROUTE_FORMAT='anomancer-model-route/v1';

const clone=value=>JSON.parse(JSON.stringify(value));
const stable=value=>{
  if(Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if(value&&typeof value==='object') return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
export const digest=value=>crypto.createHash('sha256').update(stable(value)).digest('hex');


const RAW_MODEL_ROUTES=[
  {id:'research',label:'Research route',defaultTarget:'deepseek.research',allowedTargets:['deepseek.research','openai.research','gemini.research'],requires:['json','web_search']},
  {id:'writer',label:'Writer route',defaultTarget:'deepseek.writer',allowedTargets:['deepseek.writer','openai.writer','anthropic.writer','gemini.writer'],requires:['json']},
  {id:'critic',label:'Critic route',defaultTarget:'deepseek.critic',allowedTargets:['deepseek.critic','openai.critic','anthropic.critic','gemini.critic'],requires:['json']}
];
function finalizeModelRoute(input){const route={format:MODEL_ROUTE_FORMAT,coreVersion:CORE_VERSION,...clone(input)};route.routeHash=digest(route);return Object.freeze(route);}
export const MODEL_ROUTE_REGISTRY=Object.freeze(RAW_MODEL_ROUTES.map(finalizeModelRoute));
const MODEL_ROUTE_MAP=new Map(MODEL_ROUTE_REGISTRY.map(route=>[route.id,route]));

const RAW_AGENTS=[
  {
    id:'source',label:'Lähdeagentti',version:'1.0.0',role:'research-source-scout',description:'Etsii verkosta lähde-ehdokkaita ja tutkimusaukkoja. Ei voi hyväksyä omaa evidenssiään.',
    modelRoute:'research',tools:['web.search'],capabilities:['web.search','source.propose'],
    authority:{read:['draft','sources','claims','audience'],write:['sourceCandidates','researchMemo'],deny:['source.verify','claims.promote','publish','github.write']},
    budget:{maxOutputTokens:16000,maxOutputTokensCeiling:32000,timeoutMs:180000},humanApproval:['source.verify','publish']
  },
  {
    id:'structure',label:'Rakenneagentti',version:'1.0.0',role:'editorial-structure',description:'Ehdottaa artikkelin rakennetta valitulle yleisölle muuttamatta evidenssin tilaa.',
    modelRoute:'writer',tools:[],capabilities:['draft.read','structure.propose'],
    authority:{read:['draft','sourceCandidates','audience'],write:['structure'],deny:['sources.write','claims.write','publish','github.write']},
    budget:{maxOutputTokens:12000,maxOutputTokensCeiling:24000,timeoutMs:180000},humanApproval:['publish']
  },
  {
    id:'writer',label:'Kirjoitusagentti',version:'1.0.0',role:'draft-writer',description:'Kirjoittaa ja järjestää luonnoksen, mutta ei saa nostaa lähde-ehdokasta varmennetuksi tiedoksi.',
    modelRoute:'writer',tools:[],capabilities:['draft.read','draft.propose'],
    authority:{read:['draft','structure','sources','audience'],write:['body','titleSuggestions','description','answer'],deny:['source.verify','claims.promote','publish','github.write']},
    budget:{maxOutputTokens:24000,maxOutputTokensCeiling:48000,timeoutMs:180000},humanApproval:['publish']
  },
  {
    id:'critic',label:'Kriitikko',version:'1.0.0',role:'adversarial-review',description:'Etsii heikot oletukset, ylivarmat väitteet, puuttuvan vastanäytön ja yleisöongelmat.',
    modelRoute:'critic',tools:[],capabilities:['draft.read','critique.propose'],
    authority:{read:['draft','sources','claims','audience'],write:['critique'],deny:['draft.commit','sources.write','claims.write','publish','github.write']},
    budget:{maxOutputTokens:12000,maxOutputTokensCeiling:24000,timeoutMs:180000},humanApproval:['publish']
  },
  {
    id:'audience',label:'Yleisöadapteri',version:'1.0.0',role:'audience-adapter',description:'Vaihtaa havaintoposition ja syvyystason muuttamatta tekstin epistemistä ydintä.',
    modelRoute:'writer',tools:[],capabilities:['draft.read','draft.propose','audience.adapt'],
    authority:{read:['draft','critic','audience','sources'],write:['body','adaptationSummary','audienceFit'],deny:['sources.write','claims.write','source.verify','publish','github.write']},
    budget:{maxOutputTokens:24000,maxOutputTokensCeiling:48000,timeoutMs:180000},humanApproval:['publish']
  },
  {
    id:'voice',label:'Äänieditori',version:'1.0.0',role:'voice-editor',description:'Poistaa geneeristä mallikieltä ja säilyttää kirjoittajan äänen sekä yleisösopimuksen.',
    modelRoute:'writer',tools:[],capabilities:['draft.read','draft.propose','voice.edit'],
    authority:{read:['draft','critic','audience'],write:['body','changes','warnings'],deny:['sources.write','claims.write','source.verify','publish','github.write']},
    budget:{maxOutputTokens:24000,maxOutputTokensCeiling:48000,timeoutMs:180000},humanApproval:['publish']
  },
  {
    id:'claims',label:'Väitevahti',version:'1.0.0',role:'claim-auditor',description:'Tarkistaa lopullisen proosan väitteet ja niiden evidenssikytkennät. Ei voi varmentaa lähteitä.',
    modelRoute:'critic',tools:[],capabilities:['draft.read','claims.audit'],
    authority:{read:['draft','sources','claims'],write:['claims','answer','warnings'],deny:['sources.write','source.verify','publish','github.write']},
    budget:{maxOutputTokens:16000,maxOutputTokensCeiling:32000,timeoutMs:180000},humanApproval:['source.verify','publish']
  },
  {
    id:'package',label:'Julkaisupaketti',version:'1.0.0',role:'publication-packager',description:'Valmistelee metadataa. Evidence Layer ja ihmisen Audience Contract ovat lukittuja.',
    modelRoute:'writer',tools:[],capabilities:['draft.read','package.propose'],
    authority:{read:['draft','claims','sources','audience'],write:['title','description','slug','answer','category','notes'],deny:['claims.write','sources.write','audience.write','source.verify','publish','github.write']},
    budget:{maxOutputTokens:12000,maxOutputTokensCeiling:24000,timeoutMs:180000},humanApproval:['publish']
  }
];



const RAW_TOOLS=[
  {
    id:'web.search',label:'Web Search',version:'1.0.0',kind:'external-read',description:'Hakee julkisesta verkosta lähde-ehdokkaita Source Agentin käyttöön.',
    risk:'medium',requiredCapability:'web.search',authorityKeys:['web.search'],actor:'agent',humanApproval:false,sideEffects:false,recordsPolicy:true
  },
  {
    id:'source.verify',label:'Verify Source',version:'1.0.0',kind:'evidence-authority',description:'Muuttaa lähde-ehdokkaan varmennetuksi evidenssiksi.',
    risk:'high',requiredCapability:null,authorityKeys:['source.verify'],actor:'human',humanApproval:true,sideEffects:true,recordsPolicy:true
  },
  {
    id:'publication.publish',label:'Publish',version:'1.0.0',kind:'publication-write',description:'Tekee julkaisupäätöksen ja siirtää sisällön julkiseksi.',
    risk:'critical',requiredCapability:null,authorityKeys:['publish'],actor:'human',humanApproval:true,sideEffects:true,recordsPolicy:true
  },
  {
    id:'github.write',label:'GitHub Write',version:'1.0.0',kind:'repository-write',description:'Kirjoittaa sisältöä tai metadataa GitHub-repositorioon.',
    risk:'critical',requiredCapability:null,authorityKeys:['github.write'],actor:'human',humanApproval:true,sideEffects:true,recordsPolicy:true
  }
];
function finalizeTool(input){
  const tool={format:'anomancer-tool/v1',coreVersion:CORE_VERSION,...clone(input)};
  tool.toolHash=digest(tool);
  return Object.freeze(tool);
}
export const TOOL_REGISTRY=Object.freeze(RAW_TOOLS.map(finalizeTool));
const TOOL_MAP=new Map(TOOL_REGISTRY.map(tool=>[tool.id,tool]));

function finalizeAgent(input){
  const contract={format:AGENT_CONTRACT_FORMAT,coreVersion:CORE_VERSION,...clone(input)};
  const defaultTokens=Number(contract.budget?.maxOutputTokens||0);
  const ceiling=Math.max(defaultTokens,Number(contract.budget?.maxOutputTokensCeiling||defaultTokens));
  const runtimeFloor=contract.id==='source'?8000:1000;
  contract.runtimePolicy={
    format:AGENT_RUNTIME_FORMAT,
    defaultActive:true,
    canDisable:true,
    minOutputTokens:runtimeFloor,
    maxOutputTokens:ceiling,
    mutable:['active','maxOutputTokens','modelTarget'],
    immutable:['contractHash','modelRoute','tools','capabilities','authority','humanApproval']
  };
  const hashable=clone(contract);delete hashable.coreVersion;delete hashable.contractHash;
  contract.contractHash=digest(hashable);
  return Object.freeze(contract);
}
export const AGENT_REGISTRY=Object.freeze(RAW_AGENTS.map(finalizeAgent));
const AGENT_MAP=new Map(AGENT_REGISTRY.map(agent=>[agent.id,agent]));

const RAW_ORCHESTRAS=[{
  id:'editorial',name:'Anomancer Editorial',version:'1.0.0',description:'Nykyinen Lähetyskone natiivina Core-orkesterina.',mode:'sequential',
  stages:['source','structure','writer','critic','audience','voice','claims','package'],
  humanFinalAuthority:true,evidencePolicy:'candidate-never-equals-verified',audiencePolicy:'adapt-then-recheck-claims'
}];
function finalizeOrchestra(input){
  const orchestra={format:ORCHESTRA_FORMAT,coreVersion:CORE_VERSION,...clone(input)};
  orchestra.orchestraHash=digest(orchestra);
  return Object.freeze(orchestra);
}
export const ORCHESTRA_REGISTRY=Object.freeze(RAW_ORCHESTRAS.map(finalizeOrchestra));
const ORCHESTRA_MAP=new Map(ORCHESTRA_REGISTRY.map(item=>[item.id,item]));

function validateRegistry(){
  const ids=new Set();
  for(const agent of AGENT_REGISTRY){
    if(ids.has(agent.id))throw new Error(`Duplicate Core agent: ${agent.id}`);ids.add(agent.id);
    if(!agent.contractHash||!agent.authority||!agent.budget?.maxOutputTokens)throw new Error(`Invalid Core agent contract: ${agent.id}`);
    if(agent.authority.write?.some(field=>agent.authority.deny?.includes(`${field}.write`)))throw new Error(`Conflicting authority in ${agent.id}`);
  }
  for(const route of MODEL_ROUTE_REGISTRY){
    if(!route.allowedTargets?.length||!route.allowedTargets.includes(route.defaultTarget))throw new Error(`Invalid model route: ${route.id}`);
  }
  for(const agent of AGENT_REGISTRY)if(!MODEL_ROUTE_MAP.has(agent.modelRoute))throw new Error(`Unknown model route ${agent.modelRoute} in ${agent.id}`);
  const toolIds=new Set();
  for(const tool of TOOL_REGISTRY){
    if(toolIds.has(tool.id))throw new Error(`Duplicate Core tool: ${tool.id}`);toolIds.add(tool.id);
    if(!tool.toolHash||!tool.kind||!tool.risk)throw new Error(`Invalid Core tool: ${tool.id}`);
  }
  for(const agent of AGENT_REGISTRY){
    for(const toolId of agent.tools||[])if(!TOOL_MAP.has(toolId))throw new Error(`Unknown tool ${toolId} in ${agent.id}`);
  }
  for(const orchestra of ORCHESTRA_REGISTRY){
    if(!orchestra.stages.length)throw new Error(`Empty orchestra: ${orchestra.id}`);
    for(const stage of orchestra.stages)if(!AGENT_MAP.has(stage))throw new Error(`Unknown stage ${stage} in ${orchestra.id}`);
  }
}
validateRegistry();

export function getAgentContract(id){const item=AGENT_MAP.get(String(id||''));return item?clone(item):null;}
export function getToolContract(id){const item=TOOL_MAP.get(String(id||''));return item?clone(item):null;}
export function listToolIds(){return TOOL_REGISTRY.map(item=>item.id);}
export function getModelRoute(id){const item=MODEL_ROUTE_MAP.get(String(id||''));return item?clone(item):null;}
export function listModelRoutes(){return MODEL_ROUTE_REGISTRY.map(clone);}
export function getOrchestra(id='editorial'){const item=ORCHESTRA_MAP.get(String(id||''));return item?clone(item):null;}
export function listAgentIds(){return AGENT_REGISTRY.map(item=>item.id);}
export function normalizeAgentRuntime(id,input={}){
  const contract=getAgentContract(id);
  if(!contract)return null;
  const policy=contract.runtimePolicy||{};
  const min=Math.max(1,Number(policy.minOutputTokens||1000));
  const max=Math.max(min,Number(policy.maxOutputTokens||contract.budget.maxOutputTokens||min));
  const requested=Number(input?.maxOutputTokens);
  const maxOutputTokens=Number.isFinite(requested)?Math.min(max,Math.max(min,Math.round(requested))):Number(contract.budget.maxOutputTokens||min);
  const route=getModelRoute(contract.modelRoute);
  const requestedTarget=String(input?.modelTarget||'').trim();
  const modelTarget=route?.allowedTargets?.includes(requestedTarget)?requestedTarget:(route?.defaultTarget||'');
  return {
    format:AGENT_RUNTIME_FORMAT,
    agentId:contract.id,
    contractHash:contract.contractHash,
    active:input?.active!==false,
    maxOutputTokens,
    modelTarget,
    limits:{minOutputTokens:min,maxOutputTokens:max,modelTargets:[...(route?.allowedTargets||[])]}
  };
}
export function normalizeAgentRuntimeMap(input={}){
  const source=input&&typeof input==='object'?input:{};
  return Object.fromEntries(AGENT_REGISTRY.map(agent=>[agent.id,normalizeAgentRuntime(agent.id,source[agent.id]||{})]));
}
export function publicCoreSnapshot({modelRouter=null}={}){
  return {
    format:'anomancer-core/v1',version:CORE_VERSION,
    agents:AGENT_REGISTRY.map(clone),orchestras:ORCHESTRA_REGISTRY.map(clone),tools:TOOL_REGISTRY.map(clone),
    runReceipt:{format:RUN_RECEIPT_FORMAT,persistence:'browser-local-hash-chain',containsRawPrompt:false,containsRawOutput:false,containsToolPolicy:true},
    modelRoutes:MODEL_ROUTE_REGISTRY.map(clone),modelRouter:modelRouter?clone(modelRouter):null,
    humanFinalAuthority:true,
    runtimeControl:{format:AGENT_RUNTIME_FORMAT,persistence:'server-side-durable',mutable:['active','maxOutputTokens','modelTarget'],contractAuthorityImmutable:true,snapshot:'signed-per-orchestra-run'},
    toolBroker:{format:TOOL_POLICY_FORMAT,enforcement:'server-side-fail-closed',implicitTools:false,humanApprovalClientSpoofable:false,policyLogInRunReceipt:true}
  };
}
