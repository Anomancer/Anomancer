import crypto from 'node:crypto';

export const CORE_VERSION='15.2.0';
export const AGENT_CONTRACT_FORMAT='anomancer-agent/v1';
export const ORCHESTRA_FORMAT='anomancer-orchestra/v1';
export const RUN_RECEIPT_FORMAT='anomancer-run-receipt/v1';

const clone=value=>JSON.parse(JSON.stringify(value));
const stable=value=>{
  if(Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if(value&&typeof value==='object') return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
export const digest=value=>crypto.createHash('sha256').update(stable(value)).digest('hex');

const RAW_AGENTS=[
  {
    id:'source',label:'Lähdeagentti',version:'1.0.0',role:'research-source-scout',description:'Etsii verkosta lähde-ehdokkaita ja tutkimusaukkoja. Ei voi hyväksyä omaa evidenssiään.',
    modelRoute:'research',tools:['web.search'],capabilities:['source.propose'],
    authority:{read:['draft','sources','claims','audience'],write:['sourceCandidates','researchMemo'],deny:['source.verify','claims.promote','publish','github.write']},
    budget:{maxOutputTokens:16000,maxOutputTokensCeiling:32000,timeoutMs:180000},humanApproval:['source.verify','publish']
  },
  {
    id:'structure',label:'Rakenneagentti',version:'1.0.0',role:'editorial-structure',description:'Ehdottaa artikkelin rakennetta valitulle yleisölle muuttamatta evidenssin tilaa.',
    modelRoute:'writer',tools:[],capabilities:['draft.read','structure.propose'],
    authority:{read:['draft','sourceCandidates','audience'],write:['structure'],deny:['sources.write','claims.write','publish','github.write']},
    budget:{maxOutputTokens:12000,timeoutMs:180000},humanApproval:['publish']
  },
  {
    id:'writer',label:'Kirjoitusagentti',version:'1.0.0',role:'draft-writer',description:'Kirjoittaa ja järjestää luonnoksen, mutta ei saa nostaa lähde-ehdokasta varmennetuksi tiedoksi.',
    modelRoute:'writer',tools:[],capabilities:['draft.read','draft.propose'],
    authority:{read:['draft','structure','sources','audience'],write:['body','titleSuggestions','description','answer'],deny:['source.verify','claims.promote','publish','github.write']},
    budget:{maxOutputTokens:24000,timeoutMs:180000},humanApproval:['publish']
  },
  {
    id:'critic',label:'Kriitikko',version:'1.0.0',role:'adversarial-review',description:'Etsii heikot oletukset, ylivarmat väitteet, puuttuvan vastanäytön ja yleisöongelmat.',
    modelRoute:'critic',tools:[],capabilities:['draft.read','critique.propose'],
    authority:{read:['draft','sources','claims','audience'],write:['critique'],deny:['draft.commit','sources.write','claims.write','publish','github.write']},
    budget:{maxOutputTokens:12000,timeoutMs:180000},humanApproval:['publish']
  },
  {
    id:'audience',label:'Yleisöadapteri',version:'1.0.0',role:'audience-adapter',description:'Vaihtaa havaintoposition ja syvyystason muuttamatta tekstin epistemistä ydintä.',
    modelRoute:'writer',tools:[],capabilities:['draft.read','draft.propose','audience.adapt'],
    authority:{read:['draft','critic','audience','sources'],write:['body','adaptationSummary','audienceFit'],deny:['sources.write','claims.write','source.verify','publish','github.write']},
    budget:{maxOutputTokens:24000,timeoutMs:180000},humanApproval:['publish']
  },
  {
    id:'voice',label:'Äänieditori',version:'1.0.0',role:'voice-editor',description:'Poistaa geneeristä mallikieltä ja säilyttää kirjoittajan äänen sekä yleisösopimuksen.',
    modelRoute:'writer',tools:[],capabilities:['draft.read','draft.propose','voice.edit'],
    authority:{read:['draft','critic','audience'],write:['body','changes','warnings'],deny:['sources.write','claims.write','source.verify','publish','github.write']},
    budget:{maxOutputTokens:24000,timeoutMs:180000},humanApproval:['publish']
  },
  {
    id:'claims',label:'Väitevahti',version:'1.0.0',role:'claim-auditor',description:'Tarkistaa lopullisen proosan väitteet ja niiden evidenssikytkennät. Ei voi varmentaa lähteitä.',
    modelRoute:'critic',tools:[],capabilities:['draft.read','claims.audit'],
    authority:{read:['draft','sources','claims'],write:['claims','answer','warnings'],deny:['sources.write','source.verify','publish','github.write']},
    budget:{maxOutputTokens:16000,timeoutMs:180000},humanApproval:['source.verify','publish']
  },
  {
    id:'package',label:'Julkaisupaketti',version:'1.0.0',role:'publication-packager',description:'Valmistelee metadataa. Evidence Layer ja ihmisen Audience Contract ovat lukittuja.',
    modelRoute:'writer',tools:[],capabilities:['draft.read','package.propose'],
    authority:{read:['draft','claims','sources','audience'],write:['title','description','slug','answer','category','notes'],deny:['claims.write','sources.write','audience.write','source.verify','publish','github.write']},
    budget:{maxOutputTokens:12000,timeoutMs:180000},humanApproval:['publish']
  }
];

function finalizeAgent(input){
  const contract={format:AGENT_CONTRACT_FORMAT,coreVersion:CORE_VERSION,...clone(input)};
  contract.contractHash=digest(contract);
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
  for(const orchestra of ORCHESTRA_REGISTRY){
    if(!orchestra.stages.length)throw new Error(`Empty orchestra: ${orchestra.id}`);
    for(const stage of orchestra.stages)if(!AGENT_MAP.has(stage))throw new Error(`Unknown stage ${stage} in ${orchestra.id}`);
  }
}
validateRegistry();

export function getAgentContract(id){const item=AGENT_MAP.get(String(id||''));return item?clone(item):null;}
export function getOrchestra(id='editorial'){const item=ORCHESTRA_MAP.get(String(id||''));return item?clone(item):null;}
export function listAgentIds(){return AGENT_REGISTRY.map(item=>item.id);}
export function publicCoreSnapshot({deepseek=null}={}){
  return {
    format:'anomancer-core/v1',version:CORE_VERSION,
    agents:AGENT_REGISTRY.map(clone),orchestras:ORCHESTRA_REGISTRY.map(clone),
    runReceipt:{format:RUN_RECEIPT_FORMAT,persistence:'browser-local-hash-chain',containsRawPrompt:false,containsRawOutput:false},
    modelRoutes:deepseek?{research:{provider:'deepseek',model:deepseek.sourceModel},writer:{provider:'deepseek',model:deepseek.writerModel},critic:{provider:'deepseek',model:deepseek.criticModel}}:null,
    humanFinalAuthority:true
  };
}
