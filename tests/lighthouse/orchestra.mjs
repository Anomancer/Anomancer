import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  createOrchestrationPlan,
  completeOrchestrationPlan
} from '../../core/orchestration/lighthouse-plan.js';

import {runIntent} from '../../core/intent/intent-service.js';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const js=fs.readFileSync('app/lighthouse/lab.js','utf8');
const css=fs.readFileSync('app/lighthouse/lab.css','utf8');

for(const id of [
  'orchestraDetails',
  'orchestraName',
  'orchestraStages',
  'orchestraCapabilities',
  'orchestraMancers',
  'orchestraRouterReason'
]){
  assert.match(html,new RegExp(`id="${id}"`),id);
}

assert.match(js,/renderOrchestration/);
assert.match(js,/orchestrationStatusLabel/);
assert.match(css,/LIGHTHOUSE D4 ORCHESTRA START/);

const plan=createOrchestrationPlan({
  history:[{role:'user',content:'aiempi'}],
  workspace:{
    id:'ws_test',
    title:'Työ',
    materials:[{title:'A',content:'B'}]
  }
});

assert.equal(plan.mode,'direct');
assert.equal(plan.router.mode,'fixed');
assert.equal(plan.capabilities[0].id,'llm.reasoning');
assert.equal(plan.mancers.length,0);
assert.equal(
  plan.stages.find(stage=>stage.id==='context').status,
  'completed'
);

const completed=completeOrchestrationPlan(plan,{
  result:{state:'completed'},
  responseMeta:{searchedWeb:false},
  durationMs:321
});

assert.equal(
  completed.stages.find(stage=>stage.id==='reasoning').status,
  'completed'
);
assert.equal(
  completed.stages.find(stage=>stage.id==='reasoning').durationMs,
  321
);
assert.match(
  completed.stages.find(stage=>stage.id==='trust').detail,
  /ettei ajossa käytetty ulkoisia runtime-lähteitä/
);

const reasoner=async()=>({
  result:{
    state:'completed',
    title:'Valmis',
    answer:'42',
    trust:{
      confidence:{level:'high',reason:'Testi'}
    }
  },
  meta:{
    provider:'fake',
    model:'fake-model',
    searchedWeb:false
  }
});

const run=await runIntent({
  text:'Testaa orkestrointi',
  workspace:{
    id:'ws_test',
    title:'Testi',
    materials:[]
  }
},{reasoner});

assert.equal(run.runtime.orchestration.format,'anomancer-orchestration/v1');
assert.equal(run.runtime.orchestration.mode,'direct');
assert.equal(run.runtime.orchestration.mancers.length,0);
assert.equal(
  run.runtime.orchestration.stages
    .find(stage=>stage.id==='reasoning')
    .status,
  'completed'
);

console.log('✓ Lighthouse D4 Orchestra');
