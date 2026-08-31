import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  CORE_SNAPSHOT_FORMAT,
  createCoreSnapshot
} from '../../core/system/lighthouse-core.js';

import {runIntent} from '../../core/intent/intent-service.js';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const js=fs.readFileSync('app/lighthouse/lab.js','utf8');
const css=fs.readFileSync('app/lighthouse/lab.css','utf8');

for(const id of [
  'coreDetails',
  'coreAuthorityBadge',
  'coreEnvironment',
  'corePolicy',
  'coreStorage',
  'coreContracts',
  'coreBoundaries',
  'coreProvenance'
]){
  assert.match(html,new RegExp(`id="${id}"`),id);
}

assert.match(js,/renderCore/);
assert.match(js,/JSON\.stringify\(runtime,null,2\)/);
assert.match(css,/LIGHTHOUSE D6 CORE START/);

const locked=createCoreSnapshot({
  environment:{
    VERCEL_ENV:'production'
  },
  intent:{
    workspace:{
      id:'ws_test',
      title:'Työ',
      materials:[
        {title:'A',content:'B'}
      ]
    }
  },
  result:{
    state:'completed',
    trust:{
      confidence:{
        level:'high',
        reason:'Testi'
      }
    }
  },
  machine:{
    format:'anomancer-machine-runtime/v1',
    connections:{
      externalProvider:true,
      webSearchUsed:false
    },
    dataFlow:{
      workspaceContextSent:true,
      materialsSent:1,
      destination:'deepseek'
    }
  },
  orchestration:{
    format:'anomancer-orchestration/v1'
  }
});

assert.equal(locked.format,CORE_SNAPSHOT_FORMAT);
assert.equal(locked.authority.finalAuthority,'human');
assert.equal(locked.authority.humanFinalAuthority,true);
assert.equal(locked.authority.modelMayPublish,false);
assert.equal(locked.authority.modelMayExecuteExternalSideEffects,false);

assert.equal(locked.policy.environment.name,'production');
assert.equal(locked.policy.environment.appAllowed,true);
assert.equal(locked.policy.environment.labAllowed,true);
assert.equal(locked.policy.environment.authRequired,true);
assert.equal(locked.policy.environment.productionDefaultLocked,false);

assert.equal(locked.policy.automaticModelMemory,false);
assert.equal(locked.policy.automaticPublication,false);
assert.equal(locked.storage.workspaceStore,'browser-localStorage');
assert.equal(locked.storage.synchronized,false);
assert.equal(locked.storage.limits.workspaces,12);

assert.ok(
  locked.contracts.some(
    contract=>contract.format==='anomancer-intent/v1'
  )
);
assert.ok(
  locked.contracts.some(
    contract=>contract.format==='anomancer-core-snapshot/v1'
  )
);
assert.ok(
  locked.contracts.some(
    contract=>contract.format==='anomancer-lighthouse-intelligence/v1'
  )
);

assert.equal(locked.boundaries.externalProviderUsed,true);
assert.equal(locked.boundaries.webSearchUsed,false);
assert.equal(locked.boundaries.materialsSent,1);

assert.equal(locked.provenance.traceCompleteness.trust,true);
assert.equal(locked.provenance.traceCompleteness.workspace,true);
assert.equal(locked.provenance.traceCompleteness.orchestration,true);
assert.equal(locked.provenance.traceCompleteness.machine,true);

const overridden=createCoreSnapshot({
  environment:{
    VERCEL_ENV:'production',
    ANOMANCER_LIGHTHOUSE_LAB:'1'
  }
});

assert.equal(overridden.policy.environment.appAllowed,true);
assert.equal(overridden.policy.environment.labAllowed,true);
assert.equal(overridden.policy.environment.productionDefaultLocked,false);

const disabled=createCoreSnapshot({
  environment:{
    VERCEL_ENV:'production',
    ANOMANCER_LIGHTHOUSE_APP:'0'
  }
});
assert.equal(disabled.policy.environment.appAllowed,false);
assert.equal(disabled.policy.environment.productionDefaultLocked,true);
assert.equal(disabled.policy.environment.authRequired,true);

const reasoner=async()=>({
  result:{
    state:'completed',
    title:'Core-testi',
    answer:'Valmis',
    trust:{
      confidence:{
        level:'high',
        reason:'Testi'
      }
    }
  },
  meta:{
    provider:'fake-provider',
    model:'fake-model',
    usage:{
      input_tokens:8,
      output_tokens:4
    },
    searchedWeb:false,
    externalProvider:true,
    transport:'api',
    tools:[]
  }
});

const run=await runIntent({
  text:'Testaa D6',
  workspace:{
    id:'ws_core',
    title:'Core',
    materials:[]
  }
},{reasoner});

assert.equal(
  run.runtime.core.format,
  'anomancer-core-snapshot/v1'
);
assert.equal(
  run.runtime.core.authority.humanFinalAuthority,
  true
);
assert.equal(
  run.runtime.core.provenance.traceCompleteness.machine,
  true
);
assert.equal(
  run.runtime.core.provenance.traceCompleteness.orchestration,
  true
);

console.log('✓ Lighthouse D6 Core');
