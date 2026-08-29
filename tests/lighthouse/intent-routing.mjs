import assert from 'node:assert/strict';
import {previewIntent,runIntent} from '../../core/intent/intent-service.js';

const preview=previewIntent({
  text:'Selvitä miksi tämä JavaScript-projekti jumittaa ja tarkista regressiot.',
  workspace:{
    id:'ws_route',
    title:'Projektin tarkistus',
    materials:[{title:'Virhe',content:'TypeError testissä'}]
  }
});

assert.equal(preview.problem.format,'anomancer-problem-model/v1');
assert.equal(preview.problem.taskType,'debug');
assert.equal(preview.problem.domain,'software');
assert.ok(preview.problem.needs.includes('code.inspect'));
assert.equal(preview.capabilities.format,'anomancer-capability-resolution/v1');
assert.ok(preview.capabilities.execution.includes('llm.reasoning'));
assert.equal(preview.recommendation.workspace.id,'codemancer');
assert.equal(preview.authority.finalAuthority,'human');
assert.equal(preview.authority.startRequiresHuman,true);
assert.equal(preview.authority.externalEffectsAllowed,false);

const editorial=previewIntent({text:'Kirjoita Anomanceriin artikkeli ja tarkista väitteet sekä evidenssi.'});
assert.equal(editorial.problem.domain,'editorial');
assert.equal(editorial.recommendation.workspace?.id,'toimituskone');
assert.ok(editorial.problem.needs.includes('editorial.write'));
assert.ok(editorial.capabilityRoute.reasoning.includes('editorial.write'));
assert.ok(editorial.capabilityRoute.readOnly.includes('mancer.activate'));

const publication=previewIntent({text:'Julkaise tämä Anomancerin lähetys.'});
assert.equal(publication.problem.domain,'editorial');
assert.equal(publication.authority.externalActionRequested,true);
assert.ok(publication.problem.needs.includes('publication.publish'));
assert.ok(publication.capabilityRoute.blocked.includes('publication.publish'));
assert.equal(publication.capabilityRoute.externalSideEffectsAllowed,false);

const narrative=previewIntent({text:'Kirjoita Romanceriin seuraava luku ja tarkista jatkuvuus.'});
assert.equal(narrative.problem.domain,'narrative');
assert.equal(narrative.recommendation.workspace?.id,'romancer');
assert.ok(narrative.problem.needs.includes('story.draft'));
assert.ok(narrative.problem.needs.includes('story.continuity'));
assert.ok(narrative.capabilityRoute.reasoning.includes('story.draft'));
assert.ok(narrative.capabilityRoute.readOnly.includes('mancer.activate'));

const research=previewIntent({text:'Selvitä uusimmat lähteet tästä ilmiöstä.'});
assert.ok(research.capabilities.unresolved.some(item=>item.id==='research.search'));
assert.match(research.recommendation.limitations.join(' '),/Verkkohaku/);

const external=previewIntent({text:'Deployaa tämä tuotantoon ja puske GitHubiin.'});
assert.equal(external.authority.externalActionRequested,true);
assert.equal(external.recommendation.requiresApproval,true);
assert.equal(external.authority.modelMayExecuteExternalSideEffects,false);

const phases=[];
const run=await runIntent({text:'Debuggaa tämä CSS-bugi ja tarkista regressiot.'},{reasoner:async({phase})=>{
  phases.push(phase);
  if(phase==='plan')return {result:{steps:['Rajaa','Korjaa','Tarkista']},meta:{provider:'fake',model:'planner'}};
  if(phase==='review')return {result:{verdict:'accept'},meta:{provider:'fake',model:'critic'}};
  return {result:{state:'completed',title:'Korjaus',answer:'Valmis',trust:{confidence:{level:'medium',reason:'Testi'}}},meta:{provider:'fake',model:'worker'}};
}});

assert.deepEqual(phases,['plan','work','review']);
assert.equal(run.runtime.route.problem.domain,'software');
assert.equal(run.runtime.route.recommendation.workspace.id,'codemancer');
assert.ok(run.runtime.orchestration.mancers.some(item=>item.id==='codemancer'));
assert.equal(run.runtime.core.provenance.problemModelRecorded,true);
assert.equal(run.runtime.core.provenance.authorityRecorded,true);

console.log('✓ Lighthouse intent → ProblemModel → capabilities → recommendation → human authority');
