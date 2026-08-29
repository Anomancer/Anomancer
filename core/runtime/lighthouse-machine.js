export const MACHINE_RUNTIME_FORMAT='anomancer-machine-runtime/v1';

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

    tools,
    toolSummary:tools.length
      ?`${tools.length} erillistä työkalua käytettiin.`
      :'Erillisiä työkaluja ei kutsuttu tässä ajossa.',

    connections:{
      externalProvider,
      providerApiUsed:externalProvider,
      webSearchUsed:searchedWeb
    },

    dataFlow:{
      workspaceContextSent:Boolean(workspace.id||workspace.title||materials.length),
      workspaceTitleSent:Boolean(workspace.title),
      materialsSent:materials.length,
      historyTurnsSent:history.length,
      destination:externalProvider
        ?String(responseMeta.provider||'ulkoinen provider')
        :'runtime'
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
