export const INTENT_FORMAT='anomancer-intent/v1';
export const RESULT_FORMAT='anomancer-work-result/v1';

export const WORK_STATES=Object.freeze([
  'completed',
  'needs_input',
  'needs_approval',
  'blocked'
]);

function cleanTurn(turn={}){
  const role=turn?.role==='assistant'?'assistant':'user';
  const content=String(turn?.content||'').trim().slice(0,6000);
  return content?{role,content}:null;
}

export function normalizeIntent(v={}){
  const text=String(v.text||'').trim().slice(0,12000);
  if(!text)throw Object.assign(
    new Error('Kerro mitä haluat saada aikaan.'),
    {statusCode:400,code:'LIGHTHOUSE_INTENT_EMPTY'}
  );

  const history=(Array.isArray(v.history)?v.history:[])
    .map(cleanTurn)
    .filter(Boolean)
    .slice(-8);

  return {
    format:INTENT_FORMAT,
    text,
    locale:String(v.locale||'fi').slice(0,16),
    history
  };
}

export function normalizeWorkResult(v={}){
  const state=WORK_STATES.includes(String(v.state||''))
    ?String(v.state)
    :'completed';

  return {
    format:RESULT_FORMAT,
    state,
    title:String(v.title||'Tässä on olennaisin').trim().slice(0,180),
    answer:String(v.answer||'').trim().slice(0,30000),
    questions:(Array.isArray(v.questions)?v.questions:[])
      .map(x=>String(x).trim().slice(0,500))
      .filter(Boolean)
      .slice(0,5),
    nextSteps:(Array.isArray(v.nextSteps)?v.nextSteps:[])
      .map(x=>String(x).trim().slice(0,500))
      .filter(Boolean)
      .slice(0,5),
    uncertainty:String(v.uncertainty||'').trim().slice(0,1200)
  };
}
