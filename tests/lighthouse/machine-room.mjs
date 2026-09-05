import assert from 'node:assert/strict';
import fs from 'node:fs';

import {createMachineSnapshot} from '../../core/runtime/lighthouse-machine.js';
import {runIntent} from '../../core/intent/intent-service.js';
import {readLighthouseCss} from '../../scripts/read-lighthouse-css.mjs';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const js=fs.readFileSync('app/lighthouse/lab.js','utf8');
const css=readLighthouseCss();

for(const id of [
  'machineDetails',
  'machineProvider',
  'machineModel',
  'machineCapability',
  'machineLatency',
  'machineUsage',
  'machineCost',
  'machinePermissions',
  'machineDataFlow',
  'machineReasoning',
  'machineReasoningCount',
  'machineReasoningPasses',
  'machineHands',
  'machineHandsCount',
  'machineTools'
]){
  assert.match(html,new RegExp(`id="${id}"`),id);
}

assert.match(js,/renderMachine/);
assert.match(js,/formatLatency/);
assert.match(css,/LIGHTHOUSE D5 MACHINE ROOM START/);

const snapshot=createMachineSnapshot({
  intent:{
    history:[
      {role:'user',content:'Aiempi kysymys'},
      {role:'assistant',content:'Aiempi vastaus'}
    ],
    workspace:{
      id:'ws_test',
      title:'Testityö',
      materials:[
        {title:'A',content:'B'},
        {title:'C',content:'D'}
      ]
    }
  },
  responseMeta:{
    provider:'deepseek',
    model:'deepseek-v4-flash',
    usage:{
      prompt_tokens:100,
      completion_tokens:50,
      total_tokens:150
    },
    searchedWeb:false,
    externalProvider:true,
    transport:'api',
    tools:[]
  },
  durationMs:2345,
  orchestration:{
    capabilities:[
      {id:'llm.reasoning'}
    ]
  }
});

assert.equal(snapshot.execution.provider,'deepseek');
assert.equal(snapshot.execution.model,'deepseek-v4-flash');
assert.equal(snapshot.execution.capability,'llm.reasoning');
assert.equal(snapshot.execution.latencyMs,2345);
assert.equal(snapshot.reasoning.strategy,'direct');
assert.equal(snapshot.reasoning.passCount,1);

assert.equal(snapshot.usage.available,true);
assert.equal(snapshot.usage.inputTokens,100);
assert.equal(snapshot.usage.outputTokens,50);
assert.equal(snapshot.usage.totalTokens,150);

assert.equal(snapshot.cost.available,false);
assert.equal(snapshot.connections.externalProvider,true);
assert.equal(snapshot.connections.webSearchUsed,false);

assert.equal(snapshot.dataFlow.workspaceContextSent,true);
assert.equal(snapshot.dataFlow.materialsSent,2);
assert.equal(snapshot.dataFlow.historyTurnsSent,2);
assert.equal(snapshot.dataFlow.destination,'deepseek');

assert.equal(snapshot.tools.length,0);
assert.match(snapshot.toolSummary,/ei kutsuttu/);

const reasoner=async()=>({
  result:{
    state:'completed',
    title:'Testi',
    answer:'Valmis',
    trust:{
      confidence:{level:'high',reason:'Testi'}
    }
  },
  meta:{
    provider:'fake-provider',
    model:'fake-model',
    usage:{
      input_tokens:10,
      output_tokens:5
    },
    searchedWeb:false,
    externalProvider:true,
    transport:'api',
    tools:[]
  }
});

const run=await runIntent({
  text:'Testaa konehuone',
  workspace:{
    id:'ws_machine',
    title:'Konehuonetesti',
    materials:[{title:'Muistio',content:'42'}]
  }
},{reasoner});

assert.equal(run.runtime.machine.format,'anomancer-machine-runtime/v1');
assert.equal(run.runtime.machine.execution.provider,'fake-provider');
assert.equal(run.runtime.machine.usage.totalTokens,15);
assert.equal(run.runtime.machine.dataFlow.materialsSent,1);
assert.equal(
  run.runtime.machine.permissions.find(item=>item.id==='provider-api').status,
  'used'
);
assert.equal(
  run.runtime.machine.permissions.find(item=>item.id==='web-search').status,
  'not-used'
);

console.log('✓ Lighthouse D5 Machine Room');
