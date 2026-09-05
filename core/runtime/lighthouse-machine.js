export const MACHINE_RUNTIME_FORMAT='anomancer-machine-runtime/v1';
export const CAPABILITY_RUNTIME_FORMAT='anomancer-capability-runtime/v1';

function numberOrNull(value){
  const number=Number(value);
  return Number.isFinite(number)&&number>=0?number:null;
}

function usageValue(usage,...keys){
  for(const key of keys){
    if(usage&&usage[key]!==undefined){
      const value=numberOrNull(usage[key]);
      if(value!==null)return value;
    }
  }
  return null;
}

function normalizeUsage(usage={}){
  const inputTokens=usageValue(
    usage,
    'prompt_tokens',
    'input_tokens',
    'promptTokens',
    'inputTokens'
  );

  const outputTokens=usageValue(
    usage,
    'completion_tokens',
    'output_tokens',
    'completionTokens',
    'outputTokens'
  );

  let totalTokens=usageValue(
    usage,
    'total_tokens',
    'totalTokens'
  );

  if(totalTokens===null && inputTokens!==null && outputTokens!==null){
    totalTokens=inputTokens+outputTokens;
  }

  return {
    available:[inputTokens,outputTokens,totalTokens].some(value=>value!==null),
    inputTokens,
    outputTokens,
    totalTokens
  };
}

function normalizeCost(cost){
  if(!cost||typeof cost!=='object'){
    return {
      available:false,
      amount:null,
      currency:null,
      note:'Kustannusta ei laskettu tämän ajon runtime-metadatassa.'
    };
  }

  const amount=numberOrNull(cost.amount);
  const currency=String(cost.currency||'').trim().slice(0,12);

  if(amount===null||!currency){
    return {
      available:false,
      amount:null,
      currency:null,
      note:'Kustannusmetadata oli puutteellinen.'
    };
  }

  return {
    available:true,
    amount,
    currency,
    note:''
  };
}

function normalizeTools(tools){
  return (Array.isArray(tools)?tools:[])
    .map(tool=>{
      if(typeof tool==='string'){
        return {
          id:tool.slice(0,120),
          label:tool.slice(0,160),
          status:'used'
        };
      }

      if(!tool||typeof tool!=='object')return null;

      const id=String(tool.id||tool.name||'').trim().slice(0,120);
      const label=String(tool.label||tool.name||id).trim().slice(0,160);

      if(!id&&!label)return null;

      return {
        id:id||label,
        label:label||id,
        status:String(tool.status||'used').slice(0,40)
      };
    })
    .filter(Boolean)
    .slice(0,16);
}

export function createMachineSnapshot({
  intent={},
  responseMeta={},
  durationMs=0,
  orchestration={}
}={}){
  const workspace=intent.workspace||{};
  const materials=Array.isArray(workspace.materials)?workspace.materials:[];
  const history=Array.isArray(intent.history)?intent.history:[];

  const tools=normalizeTools(responseMeta.tools);
  const searchedWeb=responseMeta.searchedWeb===true;
  const externalProvider=responseMeta.externalProvider===true;
  const searchQuerySent=responseMeta.searchQuerySent===true;
  const webFetchUsed=responseMeta.webFetchUsed===true;
  const repositoryReadUsed=responseMeta.repositoryReadUsed===true;
  const mutationProposed=responseMeta.mutationProposed===true;
  const externalReadUsed=responseMeta.externalReadUsed===true;
  const mancers=Array.isArray(responseMeta.mancers)?responseMeta.mancers:[];
  const capabilityEvents=(Array.isArray(responseMeta.capabilityEvents)?responseMeta.capabilityEvents:[]).map(event=>({
    id:String(event?.id||''),
    status:String(event?.status||'unknown'),
    adapter:String(event?.adapter||''),
    external:event?.external===true,
    durationMs:numberOrNull(event?.durationMs)||0,
    error:String(event?.error||'').slice(0,180)
  })).slice(0,16);
  const reasoningPasses=(Array.isArray(responseMeta.reasoningPasses)?responseMeta.reasoningPasses:[])
    .map(pass=>({
      phase:String(pass?.phase||'work').slice(0,40),
      status:String(pass?.status||'completed').slice(0,40),
      durationMs:numberOrNull(pass?.durationMs)||0,
      provider:String(pass?.provider||'').slice(0,80),
      model:String(pass?.model||'').slice(0,120),
      error:String(pass?.error||'').slice(0,180)
    }))
    .slice(0,6);

  return {
    format:MACHINE_RUNTIME_FORMAT,

    execution:{
      capability:String(
        orchestration?.capabilities?.[0]?.id||
        responseMeta.capability||
        'llm.reasoning'
      ),
      provider:String(responseMeta.provider||'unknown'),
      model:String(responseMeta.model||''),
      latencyMs:numberOrNull(durationMs)||0,
      transport:String(responseMeta.transport||'').trim()||'unspecified'
    },

    usage:normalizeUsage(responseMeta.usage||{}),
    cost:normalizeCost(responseMeta.cost),

    reasoning:{
      strategy:String(orchestration?.intelligence?.strategy||'direct'),
      complexity:String(orchestration?.intelligence?.complexity||'low'),
      taskType:String(orchestration?.intelligence?.taskType||'general'),
      planned:orchestration?.intelligence?.planning===true,
      reviewed:orchestration?.intelligence?.review===true,
      passCount:reasoningPasses.length||1,
      passes:reasoningPasses
    },

    tools,
    toolSummary:tools.length
      ?`${tools.length} erillistä työkalua käytettiin.`
      :'Erillisiä työkaluja ei kutsuttu tässä ajossa.',

    connections:{
      externalProvider,
      providerApiUsed:externalProvider,
      webSearchUsed:searchedWeb,
      webFetchUsed,
      repositoryReadUsed,
      externalReadUsed,
      mancerActivated:mancers.length>0,
      mutationProposed,
      externalWriteUsed:false
    },

    dataFlow:{
      workspaceContextSent:Boolean(workspace.id||workspace.title||materials.length),
      workspaceTitleSent:Boolean(workspace.title),
      materialsSent:materials.length,
      historyTurnsSent:history.length,
      destination:externalProvider
        ?String(responseMeta.provider||'ulkoinen provider')
        :'runtime',
      externalSourcesRead:Array.isArray(responseMeta.sources)?responseMeta.sources.length:0,
      searchQuerySent,
      repositoryFilesRead:repositoryReadUsed?responseMeta.sources?.filter?.(source=>source?.type==='repository-file').length||0:0
    },

    capabilityRuntime:{
      format:CAPABILITY_RUNTIME_FORMAT,
      events:capabilityEvents,
      failures:capabilityEvents.filter(event=>event.status==='failed').length,
      mancers:mancers.map(mancer=>({id:mancer.id,name:mancer.name,version:mancer.version,orchestra:mancer.orchestra||null}))
    },

    permissions:[
      {
        id:'provider-api',
        label:'Mallipalvelun API',
        status:externalProvider?'used':'not-used',
        detail:externalProvider
          ?'Ajo käytti ulkoisen mallipalvelun API-yhteyttä.'
          :'Ulkoista mallipalvelun API-yhteyttä ei merkitty käytetyksi.'
      },
      {
        id:'web-search',
        label:'Verkkohaku',
        status:searchedWeb?'used':'not-used',
        detail:searchedWeb
          ?'Ajossa käytettiin runtime-vahvistettua verkkohakua.'
          :'Ajossa ei käytetty runtime-vahvistettua verkkohakua.'
      },
      {
        id:'web-read',
        label:'Julkisten verkkosivujen luku',
        status:webFetchUsed?'used':'not-used',
        detail:webFetchUsed
          ?'Ajossa luettiin käyttäjän eksplisiittisesti antamia julkisia HTTPS-lähteitä.'
          :'Ajossa ei luettu eksplisiittisiä verkkosivuja.'
      },
      {
        id:'repository-read',
        label:'Repository-luku',
        status:repositoryReadUsed?'used':'not-used',
        detail:repositoryReadUsed
          ?'Ajossa luettiin käyttäjän nimeämiä projektitiedostoja paikallisesta lähdepuusta.'
          :'Repository-tiedostoja ei luettu tässä ajossa.'
      },
      {
        id:'repository-mutation',
        label:'Repository-muutos',
        status:mutationProposed?'proposal-only':'not-used',
        detail:mutationProposed
          ?'Ajossa muodostettiin tarkistettava muutosluonnos. Repositoryyn ei vielä kirjoitettu mitään.'
          :'Repository-muutosta ei valmisteltu tässä ajossa.'
      },
      {
        id:'mancer-context',
        label:'Mancer-menetelmä',
        status:mancers.length?'used':'not-used',
        detail:mancers.length
          ?`${mancers.length} Mancer-pakettia aktivoitiin menetelmäkontekstiksi ilman write-valtuuksia.`
          :'Mancer-pakettia ei aktivoitu tässä ajossa.'
      },
      {
        id:'workspace-context',
        label:'Työtilan konteksti',
        status:workspace.id||workspace.title||materials.length?'used':'not-used',
        detail:materials.length
          ?`${materials.length} työtilan aineistoa sisällytettiin mallikontekstiin.`
          :workspace.id||workspace.title
            ?'Työtilan nimi tai metadata sisällytettiin mallikontekstiin.'
            :'Työtilan kontekstia ei sisällytetty tähän ajoon.'
      }
    ]
  };
}
