import assert from 'node:assert/strict';
import fs from 'node:fs';

import {runIntent} from '../../core/intent/intent-service.js';
import {normalizeWorkResult} from '../../core/intent/contracts.js';
import {lighthouseLabAllowed} from '../../core/authority/lab-policy.js';

let receivedUser='';

const reasoner=async({user})=>{
  receivedUser=user;
  return {
    result:{
      state:'needs_input',
      title:'Tarvitsen tehtävänannon',
      answer:'Lähetä varsinainen tehtävä, niin jatkan siitä.',
      questions:['Mikä on tehtävänanto?'],
      nextSteps:[],
      uncertainty:''
    },
    meta:{provider:'fake',model:'test'}
  };
};

const first=await runIntent({text:'Ratkaise koulutehtävä'},{reasoner});

assert.equal(first.result.state,'needs_input');
assert.equal(first.result.questions[0],'Mikä on tehtävänanto?');
assert.equal(first.runtime.provider,'fake');

const second=await runIntent({
  text:'Tehtävä on 2 + 2.',
  history:[
    {role:'user',content:'Ratkaise koulutehtävä'},
    {role:'assistant',content:'Tarvitsen tehtävänannon'}
  ]
},{reasoner});

assert.match(receivedUser,/AIEMPI TYÖKONTEKSTI/);
assert.match(receivedUser,/Tehtävä on 2 \+ 2/);

const fallback=normalizeWorkResult({state:'totally-unknown',answer:'x'});
assert.equal(fallback.state,'completed');

assert.equal(lighthouseLabAllowed({VERCEL_ENV:'production'}),true);
assert.equal(lighthouseLabAllowed({VERCEL_ENV:'preview'}),true);
assert.equal(lighthouseLabAllowed({VERCEL_ENV:'development'}),true);
assert.equal(
  lighthouseLabAllowed({VERCEL_ENV:'production',ANOMANCER_LIGHTHOUSE_APP:'0'}),
  false
);

for(const file of [
  'app/lighthouse/lab.html',
  'app/lighthouse/lab.js',
  'app/lighthouse/lab.css',
  'api/lab/intent.js',
  'providers/deepseek/adapter.js'
]){
  assert.ok(fs.existsSync(file),file);
}

console.log('✓ Lighthouse D0→D1 states + continuation contracts');
