import assert from 'node:assert/strict';
import fs from 'node:fs';

import {runIntent} from '../../core/intent/intent-service.js';
import {normalizeTrust} from '../../core/intent/contracts.js';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const js=fs.readFileSync('app/lighthouse/lab.js','utf8');
const css=fs.readFileSync('app/lighthouse/lab.css','utf8');

for(const id of [
  'trustDetails',
  'trustBasis',
  'trustSources',
  'trustNoSources',
  'trustAssumptions',
  'trustConfidenceLevel',
  'trustConfidenceReason'
]){
  assert.match(html,new RegExp(`id="${id}"`),id);
}

assert.match(js,/renderTrust/);
assert.match(js,/confidenceLabel/);
assert.match(css,/LIGHTHOUSE 1\.20\.0 D2 TRUST SURFACE START/);

const normalized=normalizeTrust({
  basis:['Käyttäjän tieto'],
  sources:['https://example.invalid/fake'],
  assumptions:['Oletus A'],
  confidence:{level:'high',reason:'Selkeä laskutehtävä.'}
});

assert.equal(normalized.confidence.level,'high');
assert.equal(normalized.assumptions[0],'Oletus A');

const noWebReasoner=async()=>({
  result:{
    state:'completed',
    title:'Vastaus',
    answer:'25',
    trust:{
      basis:['Matemaattinen päättely'],
      sources:['Keksitty lähde jota ei saa näyttää'],
      assumptions:[],
      confidence:{level:'high',reason:'Yksinkertainen lasku.'}
    }
  },
  meta:{
    provider:'fake',
    model:'fake-model',
    searchedWeb:false
  }
});

const noWeb=await runIntent({text:'Paljonko on 5x5?'},{reasoner:noWebReasoner});

assert.equal(noWeb.result.trust.sources.length,0);
assert.equal(noWeb.result.trust.searchedWeb,false);
assert.ok(noWeb.result.trust.basis.includes('Käyttäjän antamat tiedot'));
assert.ok(noWeb.result.trust.basis.includes('Mallin päättely'));

const webReasoner=async()=>({
  result:{
    state:'completed',
    title:'Vastaus',
    answer:'Testi',
    trust:{
      assumptions:[],
      confidence:{level:'medium',reason:'Testi.'}
    }
  },
  meta:{
    provider:'fake',
    model:'fake-model',
    searchedWeb:true,
    sources:[
      {title:'Todellinen runtime-lähde',url:'https://example.com'}
    ]
  }
});

const withWeb=await runIntent({text:'Testaa lähde'},{reasoner:webReasoner});
assert.deepEqual(withWeb.result.trust.sources,['Todellinen runtime-lähde']);

console.log('✓ Lighthouse 1.20.0 D2 Trust Surface');
