import {profileIntent} from '../intelligence/lighthouse-intelligence.js';

export const ORCHESTRATION_FORMAT='anomancer-orchestration/v1';

function stage(id,label,status='pending',detail=''){
  return {id,label,status,detail};
}

export function createOrchestrationPlan(intent={},intelligence=profileIntent(intent),route={}){
  const hasWorkspace=Boolean(intent?.workspace?.id);
  const hasMaterials=Boolean(intent?.workspace?.materials?.length);
  const hasHistory=Boolean(intent?.history?.length);
  const planned=intelligence?.planning===true;
  const reviewed=intelligence?.review===true;
  const hands=route.hands||{};
  const handEvents=Array.isArray(hands.events)?hands.events:[];
  const activatedMancers=Array.isArray(hands.mancers)?hands.mancers:[];

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
    problem:route.problem||null,
    recommendation:route.recommendation||null,
    authority:route.authority||null,
    capabilities:Array.isArray(route.capabilities?.matched)&&route.capabilities.matched.length
      ?route.capabilities.matched.map(capability=>({
          id:capability.id,
          label:capability.id,
          purpose:capability.mode==='local-context'
            ?'Käyttää käyttäjän antamaa työtilakontekstia.'
            :capability.mode==='runtime-trace'
              ?'Tallentaa työn perusteluihin jäljitettävän runtime-jäljen.'
              :capability.mode==='public-web-read'
                ?'Lukee käyttäjän eksplisiittisesti antaman julkisen HTTPS-lähteen.'
                :capability.mode==='runtime-search'
                  ?'Tekee ajantasaisen read-only verkkohakukyselyn.'
                  :capability.mode==='github-content-read'
                    ?'Lukee nimettyjä repository-tiedostoja read-only GitHub-yhteydellä.'
                    :capability.mode==='package-context'
                      ?'Aktivoi sopivan Mancer-paketin menetelmäkontekstiksi ilman write-valtuuksia.'
                      :'Toteutetaan reasoning-kyvykkyyden kautta.'
        }))
      :[{
          id:'llm.reasoning',
          label:'Päättely',
          purpose:'Ratkaisee työn rajatun reasoning-kyvykkyyden sisällä.'
        }],
    unresolvedCapabilities:Array.isArray(route.capabilities?.unresolved)
      ?route.capabilities.unresolved
      :[],
    mancers:activatedMancers.length
      ?activatedMancers.map(mancer=>({
          id:mancer.id,
          label:mancer.name||mancer.id,
          version:mancer.version||'',
          orchestra:mancer.orchestra||null,
          activated:true
        }))
      :route.recommendation?.workspace
        ?[{id:route.recommendation.workspace.id,label:route.recommendation.workspace.label,activated:false}]
        :[],
    mancerNote:activatedMancers.length
      ?'Sopiva Mancer-paketti aktivoitiin read-only menetelmäkontekstiksi. Sen kirjoitus- ja julkaisuvaltuudet pysyvät erillisten hyväksymisporttien takana.'
      :route.recommendation?.workspace
        ?'Työlle tunnistettiin sopiva workspace-Mancer, mutta pakettia ei aktivoitu tässä ympäristössä.'
        :'Erillistä workspace-Manceria ei tarvittu tähän ajoon.',
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
        [
          `${String(intelligence?.taskType||'general')} · ${String(intelligence?.complexity||'low')} · ${String(intelligence?.strategy||'direct')}`,
          route.problem?.domain?`domain=${route.problem.domain}`:'',
          route.recommendation?.workspace?.id?`workspace=${route.recommendation.workspace.id}`:''
        ].filter(Boolean).join(' · ')
      ),
      stage(
        'hands',
        'Kyvykkyydet kutsuttiin',
        handEvents.length?'pending':'skipped',
        handEvents.length
          ?`${handEvents.length} read-only kyvykkyystapahtumaa valmisteltiin ennen päättelyä.`
          :'Erillisiä read-only työkaluja ei tarvittu tähän ajoon.'
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
    if(item.id==='hands'&&item.status!=='skipped'){
      const events=Array.isArray(responseMeta?.capabilityEvents)?responseMeta.capabilityEvents:[];
      const failed=events.filter(event=>event.status==='failed');
      const completed=events.filter(event=>event.status==='completed');
      return {
        ...item,
        status:failed.length&&completed.length===0?'failed':failed.length?'completed':'completed',
        detail:failed.length
          ?`${completed.length} kyvykkyyttä onnistui ja ${failed.length} jäi vajaaksi. Päättely jatkoi käytettävissä olevalla aineistolla.`
          :`${completed.length} read-only kyvykkyyttä suoritettiin ennen päättelyä.`,
        durationMs:Number(responseMeta?.handsDurationMs)||0
      };
    }

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
        detail:Array.isArray(responseMeta?.sources)&&responseMeta.sources.length
          ?'Luottamuskerros tarkisti ajon runtime-lähteet ja liitti ne D2-jälkeen.'
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
      externalReadUsed:responseMeta?.externalReadUsed===true,
      handsUsed:Array.isArray(responseMeta?.capabilityEvents)?responseMeta.capabilityEvents.filter(event=>event.status==='completed').length:0,
      passes:Number(responseMeta?.reasoningPasses?.length)||1,
      degraded:Boolean(intelligenceRun.planFailed||intelligenceRun.reviewFailed||responseMeta?.capabilityFailures?.length)
    }
  };
}
