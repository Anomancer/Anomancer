import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  INTELLIGENCE_FORMAT,
  PLAN_FORMAT,
  profileIntent
} from '../../core/intelligence/lighthouse-intelligence.js';
import {runIntent} from '../../core/intent/intent-service.js';
import {readLighthouseCss} from '../../scripts/read-lighthouse-css.mjs';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const js=fs.readFileSync('app/lighthouse/lab.js','utf8');
const css=readLighthouseCss();

for(const id of [
  'orchestraTaskType',
  'orchestraComplexity',
  'orchestraStrategy',
  'orchestraPasses',
  'machineReasoning',
  'machineReasoningCount',
  'machineReasoningPasses'
]){
  assert.match(html,new RegExp(`id="${id}"`),id);
}
assert.match(js,/orchestraTaskType/);
assert.match(js,/machineReasoningPasses/);
assert.match(css,/LIGHTHOUSE ADAPTIVE INTELLIGENCE START/);

const direct=profileIntent({text:'Mitä tämä tarkoittaa?',history:[],workspace:{materials:[]}});
assert.equal(direct.format,INTELLIGENCE_FORMAT);
assert.equal(direct.strategy,'direct');
assert.equal(direct.planning,false);
assert.equal(direct.review,false);
assert.equal(direct.passes,1);

const complex=profileIntent({
  text:'Tee senior auditointi ja debuggaa tämä virhe. Selvitä syy, korjaus ja testaus. Sen jälkeen tarkista vielä regressiot.',
  history:Array.from({length:4},()=>({role:'user',content:'aiempi'})),
  workspace:{materials:[{},{},{}]}
});
assert.equal(complex.taskType,'debug');
assert.equal(complex.complexity,'high');
assert.equal(complex.strategy,'reviewed');
assert.equal(complex.planning,true);
assert.equal(complex.review,true);
assert.equal(complex.passes,3);

const phases=[];
const reasoner=async({phase})=>{
  phases.push(phase);
  if(phase==='plan'){
    return {
      result:{
        taskType:'debug',
        objective:'Paikanna virhe ja tee turvallinen korjaus.',
        deliverable:'Korjattu ja tarkistettu ratkaisu.',
        steps:['Rajaa vika','Muodosta korjaus','Tarkista regressiot'],
        constraints:['Älä väitä sivuvaikutuksia tehdyiksi.'],
        unknowns:[],
        verification:['Varmista että vastaus käsittelee syyn ja testauksen.']
      },
      meta:{provider:'fake',model:'planner',usage:{input_tokens:10,output_tokens:5},externalProvider:true,transport:'api'}
    };
  }
  if(phase==='review'){
    return {
      result:{
        verdict:'revise',
        issues:['Luonnoksesta puuttui regressiotarkistus.'],
        improvements:['Lisättiin regressiotarkistus.'],
        result:{
          state:'completed',
          title:'Tarkistettu ratkaisu',
          answer:'Syy, korjaus ja regressiotarkistus on eroteltu.',
          questions:[],
          nextSteps:['Aja regressiotestit.'],
          uncertainty:'',
          trust:{confidence:{level:'high',reason:'Tarkistuskierros vahvisti rakenteen.'}}
        }
      },
      meta:{provider:'fake',model:'reviewer',usage:{input_tokens:7,output_tokens:4},externalProvider:true,transport:'api'}
    };
  }
  return {
    result:{
      state:'completed',
      title:'Luonnos',
      answer:'Syy ja korjaus.',
      questions:[],
      nextSteps:[],
      uncertainty:'',
      trust:{confidence:{level:'medium',reason:'Ensimmäinen luonnos.'}}
    },
    meta:{provider:'fake',model:'worker',usage:{input_tokens:20,output_tokens:8},externalProvider:true,transport:'api'}
  };
};

const run=await runIntent({
  text:'Debuggaa tämä virhe ja tee auditointi. Tarkista arkkitehtuuri, korjaus, testit ja regressiot. Tämä on monivaiheinen tehtävä, jonka lopputulos pitää vielä tarkistaa.',
  history:Array.from({length:4},()=>({role:'user',content:'aiempi'})),
  workspace:{
    id:'ws_intelligence',
    title:'Älytesti',
    materials:[
      {title:'Virhe',content:'stack'},
      {title:'Koodi',content:'source'},
      {title:'Testit',content:'tests'}
    ]
  }
},{reasoner});

assert.deepEqual(phases,['plan','work','review']);
assert.equal(run.runtime.intelligence.profile.format,INTELLIGENCE_FORMAT);
assert.equal(run.runtime.intelligence.plan.format,PLAN_FORMAT);
assert.equal(run.runtime.intelligence.review.verdict,'revise');
assert.equal(run.result.title,'Tarkistettu ratkaisu');
assert.equal(run.runtime.orchestration.mode,'adaptive');
assert.equal(run.runtime.orchestration.intelligence.strategy,'reviewed');
assert.equal(run.runtime.machine.reasoning.passCount,3);
assert.equal(run.runtime.machine.reasoning.passes[0].phase,'plan');
assert.equal(run.runtime.machine.usage.totalTokens,54);
assert.equal(run.runtime.core.provenance.intelligenceRecorded,true);
assert.equal(run.runtime.core.provenance.traceCompleteness.intelligence,true);

const fallbackPhases=[];
const fallback=await runIntent({text:'Suunnittele tähän selkeä roadmap.'},{reasoner:async({phase})=>{
  fallbackPhases.push(phase);
  if(phase==='plan')throw Object.assign(new Error('planner down'),{code:'PLANNER_DOWN'});
  return {
    result:{state:'completed',title:'Roadmap',answer:'1. Tee perusta.',trust:{confidence:{level:'medium',reason:'Fallback toimii.'}}},
    meta:{provider:'fake',model:'worker',usage:{input_tokens:3,output_tokens:2},externalProvider:true,transport:'api'}
  };
}});
assert.deepEqual(fallbackPhases,['plan','work']);
assert.equal(fallback.runtime.intelligence.degraded,true);
assert.equal(fallback.result.title,'Roadmap');
assert.equal(fallback.runtime.orchestration.stages.find(stage=>stage.id==='plan').status,'failed');


const retryPhases=[];
const retryRun=await runIntent({text:'Tarkista tämä rajattu ohjelmistokysymys ja anna vastaus.'},{reasoner:async({phase})=>{
  retryPhases.push(phase);
  if(phase==='work')throw Object.assign(new Error('bad json'),{code:'DEEPSEEK_JSON',retryable:false});
  assert.equal(phase,'work-retry');
  return {
    result:{state:'completed',title:'Uusintayritys onnistui',answer:'Rajattu vastaus.',trust:{confidence:{level:'medium',reason:'Fallback.'}}},
    meta:{provider:'fake',model:'worker-retry',usage:{input_tokens:4,output_tokens:3},externalProvider:true,transport:'api'}
  };
}});
assert.deepEqual(retryPhases,['work','work-retry']);
assert.equal(retryRun.result.title,'Uusintayritys onnistui');
assert.equal(retryRun.runtime.intelligence.degraded,true);
assert.equal(retryRun.runtime.machine.reasoning.passCount,2);
assert.equal(retryRun.runtime.machine.reasoning.passes[0].status,'failed');
assert.equal(retryRun.runtime.machine.reasoning.passes[1].phase,'work-retry');

console.log('✓ Lighthouse Adaptive Intelligence · profile → plan → work → review + bounded work retry + graceful fallback');
