import {normalizeIntent,normalizeWorkResult} from './contracts.js';
const SYSTEM=`Olet Anomancer Lighthouse D0→D1 -työmoottori.
Käyttäjän ei tarvitse tietää agenteista, malleista tai orkestereista.
Anna heti hyödyllinen, selkeä vastaus. Älä keksi lähteitä tai väitä käyttäneesi työkaluja joita et käyttänyt.
Palauta JSON: {"title":"","answer":"","nextSteps":[],"uncertainty":""}.`;
export async function runIntent(input,{reasoner}={}){
  const intent=normalizeIntent(input);
  if(typeof reasoner!=='function')throw Object.assign(new Error('Reasoning capability puuttuu.'),{statusCode:503});
  const t=Date.now();
  const r=await reasoner({system:SYSTEM,user:`Käyttäjän tavoite:\n\n${intent.text}`,capability:'llm.reasoning'});
  return {intent,result:normalizeWorkResult(r.result||r),runtime:{capability:'llm.reasoning',provider:String(r.meta?.provider||'unknown'),model:String(r.meta?.model||''),durationMs:Date.now()-t}};
}
