import assert from 'node:assert/strict';
import fs from 'node:fs';

import {previewIntent,runIntent} from '../../core/intent/intent-service.js';
import {executeLighthouseHands} from '../../server/lighthouse-hands.js';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const js=fs.readFileSync('app/lighthouse/lab.js','utf8');

for(const id of ['machineHands','machineHandsCount','machineNoHands']){
  assert.match(html,new RegExp(`id="${id}"`),id);
}
assert.match(js,/capabilityRuntime/);
assert.match(js,/machineHands/);

const urlPreview=previewIntent({
  text:'Tarkista tämä lähde https://example.com/spec ja kerro olennaisin.'
});
assert.ok(urlPreview.problem.needs.includes('web.fetch'));
assert.ok(urlPreview.capabilities.matched.some(item=>item.id==='web.fetch'));
assert.ok(urlPreview.capabilityRoute.readOnly.includes('web.fetch'));

const researchLocked=previewIntent({
  text:'Tutki uusimmat muutokset aiheesta ja varmista lähteistä.'
},{availability:{'research.search':false}});
assert.ok(researchLocked.capabilities.unresolved.some(item=>item.id==='research.search'));
assert.match(researchLocked.recommendation.limitations.join(' '),/verkkohaku/i);

const researchReady=previewIntent({
  text:'Tutki uusimmat muutokset aiheesta ja varmista lähteistä.'
},{availability:{'research.search':true}});
assert.ok(researchReady.capabilities.matched.some(item=>item.id==='research.search'));
assert.ok(researchReady.capabilityRoute.readOnly.includes('research.search'));

const software=previewIntent({
  text:'Auditoi core/intent/intent-service.js ja tarkista arkkitehtuurirajat.'
},{availability:{'repository.read':true}});
assert.equal(software.problem.domain,'software');
assert.ok(software.problem.needs.includes('repository.read'));
assert.equal(software.recommendation.workspace?.id,'codemancer');
assert.ok(software.capabilityRoute.readOnly.includes('repository.read'));
assert.ok(software.capabilityRoute.readOnly.includes('mancer.activate'));
assert.match(software.recommendation.dataNotice,/repository/i);
assert.equal(software.capabilityRoute.externalSideEffectsAllowed,false);

const writeIntent=previewIntent({text:'Deployaa tämä productioniin ja push GitHubiin.'});
assert.equal(writeIntent.authority.externalActionRequested,true);
assert.equal(writeIntent.authority.externalEffectsAllowed,false);
assert.ok(writeIntent.problem.needs.includes('external.execute'));
assert.ok(writeIntent.capabilityRoute.blocked.includes('external.execute'));

const realMancerHands=await executeLighthouseHands({
  intent:{text:'Auditoi koodi',workspace:{materials:[]}},
  route:{problem:software.problem,recommendation:software.recommendation},
  capabilityRoute:{readOnly:['mancer.activate']}
});
assert.equal(realMancerHands.mancers[0]?.id,'codemancer');
assert.equal(realMancerHands.mancers[0]?.humanFinalAuthority,true);
assert.equal(realMancerHands.mancers[0]?.orchestra?.executable,false);
assert.ok(realMancerHands.events.some(event=>event.id==='mancer.activate'&&event.status==='completed'));

const privateFetch=await executeLighthouseHands({
  intent:{text:'Lue https://127.0.0.1/private',workspace:{materials:[]}},
  route:{problem:{domain:'research'},recommendation:{}},
  capabilityRoute:{readOnly:['web.fetch']}
});
assert.equal(privateFetch.webFetchUsed,false);
assert.ok(privateFetch.events.some(event=>event.id==='web.fetch'&&event.status==='failed'));
assert.match(privateFetch.failures[0]?.error||'',/PRIVATE|public|julkiseen/i);

const prompts=[];
const reasoner=async payload=>{
  prompts.push(payload.user);
  return {
    result:{
      state:'completed',title:'Käsitesti',answer:'Valmis',questions:[],nextSteps:[],uncertainty:'',
      trust:{basis:[],sources:[],assumptions:[],confidence:{level:'medium',reason:'Testi'}}
    },
    meta:{provider:'fake',model:'fake',externalProvider:false,tools:[]}
  };
};

const fakeHands=async()=>({
  format:'anomancer-hands-execution/v1',
  events:[{id:'repository.read',status:'completed',adapter:'fake-read/v1',external:true,durationMs:2}],
  context:[{
    kind:'repository',label:'core/intent/intent-service.js',content:'export const proof=true;',
    meta:{path:'core/intent/intent-service.js',url:'https://example.test/repo-file',untrusted:true}
  }],
  sources:[{type:'repository-file',title:'core/intent/intent-service.js',url:'https://example.test/repo-file'}],
  tools:[{id:'repository.read',label:'repository.read',status:'used'}],
  mancers:[{id:'codemancer',name:'Codemancer',version:'1.3.0',orchestra:{id:'code-review',name:'Koodikatselmus'}}],
  failures:[],searchedWeb:false,webFetchUsed:false,repositoryReadUsed:true,externalReadUsed:true,durationMs:2
});

const run=await runIntent({
  text:'Auditoi core/intent/intent-service.js'
},{
  reasoner,
  availability:{'repository.read':true},
  capabilityExecutor:fakeHands
});

assert.ok(prompts.some(prompt=>prompt.includes('RUNTIME-AINEISTO JA MENETELMÄT')));
assert.ok(prompts.some(prompt=>prompt.includes('EPÄLUOTETTAVA LUETTU AINEISTO')));
assert.ok(prompts.some(prompt=>prompt.includes('export const proof=true')));
assert.ok(run.result.trust.sources.includes('core/intent/intent-service.js'));
assert.ok(run.runtime.hands.sources.some(source=>source.url==='https://example.test/repo-file'));
assert.equal(run.runtime.machine.connections.repositoryReadUsed,true);
assert.equal(run.runtime.machine.connections.mancerActivated,true);
assert.equal(run.runtime.machine.capabilityRuntime.events[0].id,'repository.read');
assert.equal(run.runtime.core.boundaries.repositoryReadUsed,true);
assert.equal(run.runtime.core.boundaries.mancerActivated,true);
assert.equal(run.runtime.core.authority.modelMayExecuteExternalSideEffects,false);
assert.ok(run.runtime.orchestration.stages.some(stage=>stage.id==='hands'&&stage.status==='completed'));

console.log('✓ Lighthouse Hands · read-only capability router, Mancer activation and D5/D6 audit trail');
