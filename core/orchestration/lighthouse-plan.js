import {profileIntent} from '../intelligence/lighthouse-intelligence.js';

export const ORCHESTRATION_FORMAT='anomancer-orchestration/v1';

function stage(id,label,status='pending',detail=''){
  return {id,label,status,detail};
}

export function createOrchestrationPlan(intent={},intelligence=profileIntent(intent)){
  const hasWorkspace=Boolean(intent?.workspace?.id);
  const hasMaterials=Boolean(intent?.workspace?.materials?.length);
  const hasHistory=Boolean(intent?.history?.length);
  const planned=intelligence?.planning===true;
  const reviewed=intelligence?.review===true;

  return {
    format:ORCHESTRATION_FORMAT,
    mode:intelligence?.strategy==='direct'?'direct':'adaptive',
    name:reviewed?'Tarkistettu työpolku':planned?'Suunniteltu työpolku':'Suora työpolku',
    summary:reviewed
      ?'Pyyntö profiloidaan, suunnitellaan, ratkaistaan ja tarkistetaan ennen luottamuskerrosta.'
      :planned
        ?'Pyyntö profiloidaan ja sille muodostetaan kevyt työsuunnitelma ennen varsinaista päättelyä.'
        :'Pyyntö käsitellään yhdellä reasoning-kutsulla ja tulos viedään luottamuskerroksen läpi.',
    router:{
      mode:'adaptive',
      status:'active',
      reason:(intelligence?.rationale||[]).join(' ')
    },
    intelligence,
    context:{
      workspace:hasWorkspace,
      materials:hasMaterials,
      history:hasHistory
    },
    capabilities:[
      {
        id:'llm.reasoning',
        label:'Päättely',
        purpose:'Suunnittelee, ratkaisee ja tarvittaessa tarkistaa työn saman rajatun reasoning-kyvykkyyden sisällä.'
      }
    ],
    mancers:[],
    mancerNote:'Erillisiä Mancer-paketteja ei käynnistetty tässä ajossa. Älykkyyspolku toimii Core-orkestroinnin sisällä.',
    stages:[
      stage(
        'intent',
        'Pyyntö jäsennettiin',
        'completed',
        'Käyttäjän nykyinen tavoite muutettiin Lighthouse-työpyynnöksi.'
      ),
      stage(
        'context',
        'Työkonteksti koottiin',
        hasWorkspace||hasHistory?'completed':'skipped',
        hasMaterials
          ?'Työtilan aineistot ja aiempi konteksti otettiin mukaan.'
          :hasHistory
            ?'Aiempi työkonteksti otettiin mukaan.'
            :'Erillistä työtilakontekstia ei ollut käytettävissä.'
      ),
      stage(
        'route',
        'Älyprofiili valittiin',
        'completed',
        `${String(intelligence?.taskType||'general')} · ${String(intelligence?.complexity||'low')} · ${String(intelligence?.strategy||'direct')}`
      ),
      stage(
        'plan',
        'Työsuunnitelma muodostettiin',
        planned?'pending':'skipped',
        planned?'Muodostetaan näkyvä tehtäväsuunnitelma ennen vastausta.':'Suora tehtävä ei tarvitse erillistä suunnittelukierrosta.'
      ),
      stage(
        'reasoning',
        'Päättely suoritettiin',
        'pending',
        'Pyydetään llm.reasoning-kyvykkyys.'
      ),
      stage(
        'review',
        'Vastaus tarkistettiin',
        reviewed?'pending':'skipped',
        reviewed?'Toinen reasoning-kierros tarkistaa luonnoksen olennaiset virheet ja puutteet.':'Erillistä tarkistuskierrosta ei arvioitu tarpeelliseksi.'
      ),
      stage(
        'trust',
        'Luottamuskerros muodostettiin',
        'pending',
        'Vastaus ankkuroidaan runtime-tietoon ennen D2-esitystä.'
      )
    ]
  };
}

export function completeOrchestrationPlan(
  plan,
  {
    result={},
    responseMeta={},
    durationMs=0,
    intelligenceRun={}
  }={}
){
  const stages=(plan?.stages||[]).map(item=>{
    if(item.id==='plan'&&item.status!=='skipped'){
      return {
        ...item,
        status:intelligenceRun.planFailed?'failed':'completed',
        detail:intelligenceRun.planFailed
          ?'Suunnittelukierros epäonnistui, joten työ jatkoi turvallisesti ilman erillistä suunnitelmaa.'
          :`Työsuunnitelma muodostettiin ${Number(intelligenceRun.planDurationMs)||0} ms:ssa.`,
        durationMs:Number(intelligenceRun.planDurationMs)||0
      };
    }

    if(item.id==='reasoning'){
      return {
        ...item,
        status:'completed',
        detail:`llm.reasoning palautti tilan ${String(result.state||'completed')}.`,
        durationMs:Number(intelligenceRun.workDurationMs)||Number(durationMs)||0
      };
    }

    if(item.id==='review'&&item.status!=='skipped'){
      if(intelligenceRun.reviewSkipped){
        return {
          ...item,
          status:'skipped',
          detail:'Tarkistuskierros ohitettiin, koska ensimmäinen vastaus ei ollut completed-tilassa.',
          durationMs:0
        };
      }
      return {
        ...item,
        status:intelligenceRun.reviewFailed?'failed':'completed',
        detail:intelligenceRun.reviewFailed
          ?'Tarkistuskierros epäonnistui. Käyttäjälle palautettiin ensimmäinen käyttökelpoinen luonnos.'
          :intelligenceRun.reviewVerdict==='revise'
            ?'Tarkistus löysi korjattavaa ja palautti tarkistetun version.'
            :'Tarkistus hyväksyi luonnoksen ilman olennaista korjaustarvetta.',
        durationMs:Number(intelligenceRun.reviewDurationMs)||0
      };
    }

    if(item.id==='trust'){
      return {
        ...item,
        status:'completed',
        detail:responseMeta?.searchedWeb===true
          ?'Luottamuskerros tarkisti ajon runtime-lähteet.'
          :'Luottamuskerros vahvisti, ettei ajossa käytetty ulkoisia runtime-lähteitä.'
      };
    }

    return item;
  });

  return {
    ...plan,
    stages,
    outcome:{
      state:String(result.state||'completed'),
      searchedWeb:responseMeta?.searchedWeb===true,
      passes:Number(responseMeta?.reasoningPasses?.length)||1,
      degraded:Boolean(intelligenceRun.planFailed||intelligenceRun.reviewFailed)
    }
  };
}
