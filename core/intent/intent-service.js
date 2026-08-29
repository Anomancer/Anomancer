import {normalizeIntent,normalizeWorkResult} from './contracts.js';
import {
  createOrchestrationPlan,
  completeOrchestrationPlan
} from '../orchestration/lighthouse-plan.js';

const SYSTEM=`Olet Anomancer Lighthouse D0→D1 -työmoottori.

Käyttäjän ei tarvitse tietää agenteista, malleista, orkestereista tai järjestelmän sisäisestä rakenteesta.
Tavoite on auttaa heti, mutta älä teeskentele valmista lopputulosta jos tehtävän suorittamiseen puuttuu olennainen tieto.

Palauta JSON täsmälleen tällä rakenteella:
{
  "state": "completed | needs_input | needs_approval | blocked",
  "title": "lyhyt ja tilanteeseen sopiva otsikko",
  "answer": "varsinainen selkeä vastaus",
  "questions": ["vain jos tarvitset käyttäjältä lisätietoa"],
  "nextSteps": ["vain aidosti hyödylliset jatkoaskeleet"],
  "uncertainty": "olennainen epävarmuus, muuten tyhjä",
  "trust": {
    "basis": ["mihin vastaus sisällöllisesti perustuu"],
    "sources": ["vain oikeasti käytetyt ulkoiset lähteet"],
    "assumptions": ["vain olennaiset oletukset"],
    "confidence": {
      "level": "low | medium | high",
      "reason": "lyhyt perustelu luottamustasolle"
    }
  }
}

Tilat:
- completed: pystyt antamaan hyödyllisen lopputuloksen nyt.
- needs_input: olennainen tieto puuttuu. Kysy mahdollisimman vähän ja mahdollisimman täsmällisesti.
- needs_approval: seuraava merkityksellinen toiminto tarvitsee ihmisen hyväksynnän.
- blocked: tehtävää ei voi jatkaa nykyisillä tiedoilla tai kyvykkyyksillä.

Luottamuskerroksen säännöt:
- basis kuvaa mitä tietoa tai päättelyä vastaus käyttää.
- assumptions sisältää vain oletuksia, joilla on merkitystä lopputuloksen kannalta.
- confidence ei ole prosenttiluku vaan low / medium / high ja lyhyt syy.
- sources saa sisältää vain lähteitä, jotka järjestelmä todella antoi sinulle tässä ajossa.
- Älä koskaan keksi lähteitä, URL-osoitteita, tutkimuksia tai hakuja.

Muut säännöt:
- Älä kutsu keskeneräistä vastausta ratkaisuksi.
- Älä toista samaa asiaa answer-, questions- ja nextSteps-kentissä.
- needs_input-tilassa questions on ensisijainen ja nextSteps yleensä tyhjä.
- Älä väitä tehneesi työkalu- tai verkkohakuja, ellei niitä oikeasti ole tehty.
- Pidä epävarmuus näkyvänä mutta älä lisää sitä väkisin.`;

function historyText(history=[]){
  if(!history.length)return '';

  return history
    .map(turn=>`${turn.role==='assistant'?'ANOMANCER':'KÄYTTÄJÄ'}:\n${turn.content}`)
    .join('\n\n');
}

function workspaceText(workspace={}){
  const materials=Array.isArray(workspace.materials)?workspace.materials:[];
  if(!workspace.title&&!materials.length)return '';

  const parts=[];

  if(workspace.title){
    parts.push(`TYÖTILA: ${workspace.title}`);
  }

  if(materials.length){
    const rendered=materials.map((material,index)=>{
      const title=material.title||`Aineisto ${index+1}`;
      return `[${index+1}] ${title}\n${material.content||''}`;
    }).join('\n\n');

    parts.push(`TYÖTILAN AINEISTO:\n${rendered}`);
  }

  return parts.join('\n\n');
}

function runtimeGroundTrust(result,{intent,responseMeta}={}){
  const trust=result.trust||{
    basis:[],
    sources:[],
    assumptions:[],
    confidence:{level:'medium',reason:''}
  };

  const basis=['Käyttäjän antamat tiedot'];

  if(intent.history.length){
    basis.push('Aiempi työkonteksti');
  }

  basis.push('Mallin päättely');

  const searchedWeb=responseMeta?.searchedWeb===true;
  const runtimeSources=searchedWeb && Array.isArray(responseMeta?.sources)
    ?responseMeta.sources
        .map(source=>{
          if(typeof source==='string')return source;
          if(source&&typeof source==='object'){
            return String(source.title||source.label||source.url||'').trim();
          }
          return '';
        })
        .filter(Boolean)
        .slice(0,8)
    :[];

  return {
    ...result,
    trust:{
      ...trust,
      basis:[...new Set([...basis,...(trust.basis||[])])].slice(0,6),
      sources:runtimeSources,
      assumptions:trust.assumptions||[],
      confidence:trust.confidence||{level:'medium',reason:''},
      externalSourcesUsed:runtimeSources.length>0,
      searchedWeb
    }
  };
}

export async function runIntent(input,{reasoner}={}){
  const intent=normalizeIntent(input);

  if(typeof reasoner!=='function'){
    throw Object.assign(
      new Error('Reasoning capability puuttuu.'),
      {statusCode:503,code:'LIGHTHOUSE_REASONER_MISSING'}
    );
  }

  const previous=historyText(intent.history);
  const workspace=workspaceText(intent.workspace);
  const user=[
    workspace,
    previous?`AIEMPI TYÖKONTEKSTI:\n${previous}`:'',
    `NYKYINEN KÄYTTÄJÄN VIESTI:\n${intent.text}`
  ].filter(Boolean).join('\n\n');

  const startedAt=Date.now();
  const orchestration=createOrchestrationPlan(intent);

  const response=await reasoner({
    system:SYSTEM,
    user,
    capability:'llm.reasoning'
  });

  const normalized=normalizeWorkResult(response?.result||response);
  const result=runtimeGroundTrust(normalized,{
    intent,
    responseMeta:response?.meta||{}
  });

  const durationMs=Date.now()-startedAt;
  const completedOrchestration=completeOrchestrationPlan(orchestration,{
    result,
    responseMeta:response?.meta||{},
    durationMs
  });

  return {
    intent,
    result,
    runtime:{
      capability:'llm.reasoning',
      provider:String(response?.meta?.provider||'unknown'),
      model:String(response?.meta?.model||''),
      durationMs,
      searchedWeb:response?.meta?.searchedWeb===true,
      orchestration:completedOrchestration
    }
  };
}
