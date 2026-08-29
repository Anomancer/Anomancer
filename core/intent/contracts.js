export const INTENT_FORMAT='anomancer-intent/v1';
export const RESULT_FORMAT='anomancer-work-result/v1';
export function normalizeIntent(v={}){
  const text=String(v.text||'').trim().slice(0,12000);
  if(!text)throw Object.assign(new Error('Kerro mitä haluat saada aikaan.'),{statusCode:400,code:'LIGHTHOUSE_INTENT_EMPTY'});
  return {format:INTENT_FORMAT,text,locale:String(v.locale||'fi').slice(0,16)};
}
export function normalizeWorkResult(v={}){
  return {
    format:RESULT_FORMAT,
    title:String(v.title||'Tässä on olennaisin').trim().slice(0,180),
    answer:String(v.answer||'').trim().slice(0,30000),
    nextSteps:(Array.isArray(v.nextSteps)?v.nextSteps:[]).map(x=>String(x).trim().slice(0,500)).filter(Boolean).slice(0,5),
    uncertainty:String(v.uncertainty||'').trim().slice(0,1200)
  };
}
