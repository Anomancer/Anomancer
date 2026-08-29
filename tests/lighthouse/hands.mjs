import assert from 'node:assert/strict';
import fs from 'node:fs';

import {previewIntent,runIntent} from '../../core/intent/intent-service.js';
import {capabilityAvailability,executeLighthouseHands} from '../../server/lighthouse-hands.js';
import {lighthouseRepositoryRef} from '../../server/github.js';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const js=fs.readFileSync('app/lighthouse/lab.js','utf8');

assert.equal(lighthouseRepositoryRef({
  ANOMANCER_LIGHTHOUSE_REPO_REF:'architecture/lighthouse-v1',
  VERCEL_GIT_COMMIT_REF:'preview/other',
  GITHUB_BRANCH:'main'
}),'architecture/lighthouse-v1');
assert.equal(lighthouseRepositoryRef({
  VERCEL_GIT_COMMIT_REF:'architecture/lighthouse-v1',
  GITHUB_BRANCH:'main'
}),'architecture/lighthouse-v1');
assert.equal(lighthouseRepositoryRef({GITHUB_BRANCH:'main'}),'main');

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
},{availability:{'source.search':false}});
assert.ok(researchLocked.capabilities.unresolved.some(item=>item.id==='source.search'));
assert.match(researchLocked.recommendation.limitations.join(' '),/(?:lähdehaku|verkkohaku)/i);

const researchReady=previewIntent({
  text:'Tutki uusimmat muutokset aiheesta ja varmista lähteistä.'
},{availability:{'source.search':true}});
assert.ok(researchReady.capabilities.matched.some(item=>item.id==='source.search'));
assert.ok(researchReady.capabilityRoute.readOnly.includes('source.search'));


const packageAvailability=capabilityAvailability({BRAVE_SEARCH_API_KEY:'test-key'});
assert.equal(packageAvailability['source.search'],true);
assert.equal(packageAvailability['academic.search'],true);
assert.equal(packageAvailability['news.search'],true);
assert.notEqual(packageAvailability['model.compare'],true);

const originalFetch=globalThis.fetch;
const originalBraveKey=process.env.BRAVE_SEARCH_API_KEY;
process.env.BRAVE_SEARCH_API_KEY='test-key';
globalThis.fetch=async(url,options={})=>{
  if(String(url).startsWith('https://api.search.brave.com/res/v1/web/search')){
    return new Response(JSON.stringify({
      web:{results:[
        {url:'https://example.test/source-a',title:'Source A',description:'Relevant evidence A'},
        {url:'https://example.test/source-b',title:'Source B',description:'Relevant evidence B'}
      ]}
    }),{
      status:200,
      headers:{'Content-Type':'application/json'}
    });
  }
  return originalFetch(url,options);
};

try{
  const packageSearchHands=await executeLighthouseHands({
    intent:{text:'Etsi lähteet tästä ilmiöstä',workspace:{materials:[]}},
    route:{problem:{domain:'research'},recommendation:{}},
    capabilityRoute:{readOnly:['source.search']}
  });
  assert.equal(packageSearchHands.searchedWeb,true);
  assert.ok(packageSearchHands.events.some(
    event=>event.id==='source.search'&&event.status==='completed'&&event.adapter==='search.web'
  ));
  assert.ok(packageSearchHands.sources.some(
    source=>source.capabilityId==='source.search'&&source.url==='https://example.test/source-a'
  ));
}finally{
  globalThis.fetch=originalFetch;
  if(originalBraveKey===undefined)delete process.env.BRAVE_SEARCH_API_KEY;
  else process.env.BRAVE_SEARCH_API_KEY=originalBraveKey;
}

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

const textCorrection=previewIntent({text:'Korjaa tämän tekstin kirjoitusvirheet.'});
assert.equal(textCorrection.authority.externalActionRequested,false);
assert.equal(textCorrection.problem.needs.includes('repository.write'),false);

const writeIntent=previewIntent({text:'Korjaa core/intent/intent-service.js ja push GitHubiin.'},{availability:{'repository.read':true,'repository.propose':true,'repository.write':true}});
assert.equal(writeIntent.authority.externalActionRequested,true);
assert.equal(writeIntent.authority.externalEffectsAllowed,false);
assert.ok(writeIntent.problem.needs.includes('repository.propose'));
assert.ok(writeIntent.problem.needs.includes('repository.write'));
assert.ok(writeIntent.capabilityRoute.proposals.includes('repository.propose'));
assert.ok(writeIntent.capabilityRoute.blocked.includes('repository.write'));

const realMancerHands=await executeLighthouseHands({
  intent:{text:'Auditoi koodi',workspace:{materials:[]}},
  route:{problem:software.problem,recommendation:software.recommendation},
  capabilityRoute:{readOnly:['mancer.activate']}
});
assert.equal(realMancerHands.mancers[0]?.id,'codemancer');
assert.equal(realMancerHands.mancers[0]?.humanFinalAuthority,true);
assert.equal(realMancerHands.mancers[0]?.orchestra?.executable,false);
assert.ok(realMancerHands.events.some(event=>event.id==='mancer.activate'&&event.status==='completed'));

const editorialPreview=previewIntent({text:'Kirjoita Anomanceriin artikkeli ja tarkista väitteet.'});
const editorialHands=await executeLighthouseHands({intent:{text:'Kirjoita artikkeli',workspace:{materials:[]}},route:{problem:editorialPreview.problem,recommendation:editorialPreview.recommendation},capabilityRoute:{readOnly:['mancer.activate']}});
assert.equal(editorialHands.mancers[0]?.id,'toimituskone');
assert.equal(editorialHands.mancers[0]?.orchestra?.id,'editorial-workflow');
assert.equal(editorialHands.mancers[0]?.humanFinalAuthority,true);

const romancerPreview=previewIntent({text:'Kirjoita Romanceriin seuraava luku.'});
const romancerHands=await executeLighthouseHands({intent:{text:'Kirjoita luku',workspace:{materials:[]}},route:{problem:romancerPreview.problem,recommendation:romancerPreview.recommendation},capabilityRoute:{readOnly:['mancer.activate']}});
assert.equal(romancerHands.mancers[0]?.id,'romancer');
assert.equal(romancerHands.mancers[0]?.orchestra?.id,'chapter-draft');
assert.equal(romancerHands.mancers[0]?.humanFinalAuthority,true);

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
  failures:[],searchedWeb:false,webFetchUsed:false,repositoryReadUsed:true,repositoryRef:'architecture/lighthouse-v1',repositoryRefSource:'explicit',externalReadUsed:true,durationMs:2
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
assert.equal(run.runtime.hands.repositoryRef,'architecture/lighthouse-v1');
assert.equal(run.runtime.machine.connections.mancerActivated,true);
assert.equal(run.runtime.machine.capabilityRuntime.events[0].id,'repository.read');
assert.equal(run.runtime.core.boundaries.repositoryReadUsed,true);
assert.equal(run.runtime.core.boundaries.mancerActivated,true);
assert.equal(run.runtime.core.authority.modelMayExecuteExternalSideEffects,false);
assert.ok(run.runtime.orchestration.stages.some(stage=>stage.id==='hands'&&stage.status==='completed'));

console.log('✓ Lighthouse Hands · read-only capability router, Mancer activation and D5/D6 audit trail');
