import {normalizeWorkspaceContext} from '../workspace/contracts.js';

export const INTENT_FORMAT='anomancer-intent/v1';
export const RESULT_FORMAT='anomancer-work-result/v1';

export const WORK_STATES=Object.freeze([
  'completed',
  'needs_input',
  'needs_approval',
  'blocked'
]);

export const CONFIDENCE_LEVELS=Object.freeze([
  'low',
  'medium',
  'high'
]);

function cleanTurn(turn={}){
  const role=turn?.role==='assistant'?'assistant':'user';
  const content=String(turn?.content||'').trim().slice(0,6000);
  return content?{role,content}:null;
}

function cleanArray(value,{maxItems=8,maxLength=600}={}){
  return (Array.isArray(value)?value:[])
    .map(item=>String(item||'').trim().slice(0,maxLength))
    .filter(Boolean)
    .slice(0,maxItems);
}

export function normalizeIntent(v={}){
  const text=String(v.text||'').trim().slice(0,12000);

  if(!text){
    throw Object.assign(
      new Error('Kerro mitä haluat saada aikaan.'),
      {statusCode:400,code:'LIGHTHOUSE_INTENT_EMPTY'}
    );
  }

  const history=(Array.isArray(v.history)?v.history:[])
    .map(cleanTurn)
    .filter(Boolean)
    .slice(-8);

  return {
    format:INTENT_FORMAT,
    text,
    locale:String(v.locale||'fi').slice(0,16),
    history,
    workspace:normalizeWorkspaceContext(v.workspace||{})
  };
}

export function normalizeTrust(v={}){
  const rawConfidence=v?.confidence||{};
  const level=CONFIDENCE_LEVELS.includes(String(rawConfidence.level||''))
    ?String(rawConfidence.level)
    :'medium';

  return {
    basis:cleanArray(v.basis,{maxItems:6,maxLength:400}),
    sources:cleanArray(v.sources,{maxItems:8,maxLength:800}),
    assumptions:cleanArray(v.assumptions,{maxItems:8,maxLength:600}),
    confidence:{
      level,
      reason:String(rawConfidence.reason||'').trim().slice(0,1200)
    }
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
    questions:cleanArray(v.questions,{maxItems:5,maxLength:500}),
    nextSteps:cleanArray(v.nextSteps,{maxItems:5,maxLength:500}),
    uncertainty:String(v.uncertainty||'').trim().slice(0,1200),
    trust:normalizeTrust(v.trust||{})
  };
}
