import {normalizeIntent,normalizeWorkResult} from './contracts.js';

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
  "uncertainty": "olennainen epävarmuus, muuten tyhjä"
}

Tilat:
- completed: pystyt antamaan hyödyllisen lopputuloksen nyt.
- needs_input: olennainen tieto puuttuu. Kysy mahdollisimman vähän ja mahdollisimman täsmällisesti.
- needs_approval: seuraava merkityksellinen toiminto tarvitsee ihmisen hyväksynnän.
- blocked: tehtävää ei voi jatkaa nykyisillä tiedoilla tai kyvykkyyksillä.

Säännöt:
- Älä kutsu keskeneräistä vastausta ratkaisuksi.
- Älä toista samaa asiaa answer-, questions- ja nextSteps-kentissä.
- needs_input-tilassa questions on ensisijainen ja nextSteps yleensä tyhjä.
- Älä keksi lähteitä.
- Älä väitä tehneesi työkalu- tai verkkohakuja, ellei niitä oikeasti ole tehty.
- Pidä epävarmuus näkyvänä mutta älä lisää sitä väkisin.`;

function historyText(history=[]){
  if(!history.length)return '';
  return history.map(turn=>`${turn.role==='assistant'?'ANOMANCER':'KÄYTTÄJÄ'}:\n${turn.content}`).join('\n\n');
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
  const user=[
    previous?`AIEMPI TYÖKONTEKSTI:\n${previous}`:'',
    `NYKYINEN KÄYTTÄJÄN VIESTI:\n${intent.text}`
  ].filter(Boolean).join('\n\n');

  const startedAt=Date.now();
  const response=await reasoner({
    system:SYSTEM,
    user,
    capability:'llm.reasoning'
  });

  return {
    intent,
    result:normalizeWorkResult(response?.result||response),
    runtime:{
      capability:'llm.reasoning',
      provider:String(response?.meta?.provider||'unknown'),
      model:String(response?.meta?.model||''),
      durationMs:Date.now()-startedAt
    }
  };
}
