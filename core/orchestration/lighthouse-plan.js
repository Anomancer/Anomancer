export const ORCHESTRATION_FORMAT='anomancer-orchestration/v1';

function stage(id,label,status='pending',detail=''){
  return {id,label,status,detail};
}

export function createOrchestrationPlan(intent={}){
  const hasWorkspace=Boolean(intent?.workspace?.id);
  const hasMaterials=Boolean(intent?.workspace?.materials?.length);
  const hasHistory=Boolean(intent?.history?.length);

  return {
    format:ORCHESTRATION_FORMAT,
    mode:'direct',
    name:'Suora työpolku',
    summary:'Pyyntö käsitellään yhdellä reasoning-kyvykkyydellä ja tulos viedään luottamuskerroksen läpi.',
    router:{
      mode:'fixed',
      status:'construction-mode',
      reason:'Construction Mode käyttää tällä hetkellä kiinteää reasoning-polkuja. Automaattinen Mancer-valinta ei ole vielä käytössä.'
    },
    context:{
      workspace:hasWorkspace,
      materials:hasMaterials,
      history:hasHistory
    },
    capabilities:[
      {
        id:'llm.reasoning',
        label:'Päättely',
        purpose:'Muodostaa työn tämänhetkinen vastaus tai seuraava tarvittava askel.'
      }
    ],
    mancers:[],
    mancerNote:'Erillisiä Mancer-paketteja ei käynnistetty tässä ajossa.',
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
        'reasoning',
        'Päättely suoritettiin',
        'pending',
        'Pyydetään llm.reasoning-kyvykkyys.'
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
    durationMs=0
  }={}
){
  const stages=(plan?.stages||[]).map(item=>{
    if(item.id==='reasoning'){
      return {
        ...item,
        status:'completed',
        detail:`llm.reasoning palautti tilan ${String(result.state||'completed')}.`,
        durationMs:Number(durationMs)||0
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
      searchedWeb:responseMeta?.searchedWeb===true
    }
  };
}
