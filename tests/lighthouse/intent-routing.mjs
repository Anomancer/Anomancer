import assert from 'node:assert/strict';
import {previewIntent,runIntent} from '../../core/intent/intent-service.js';
import {getCapability} from '../../core/capabilities/registry.js';
import {
  CAPABILITY_PACKAGE_FORMAT,
  discoverCapabilityPackages,
  validateCapabilityPackageDocuments
} from '../../server/capability-package-registry.js';

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

const capabilityPackages=discoverCapabilityPackages();
const comparisonPackage=capabilityPackages.find(
  item=>item.health==='ok'&&item.manifest?.id==='comparison'
);
assert.ok(comparisonPackage,'comparison Capability Package missing');
assert.equal(comparisonPackage.manifest.format,CAPABILITY_PACKAGE_FORMAT);
assert.match(comparisonPackage.contractHash,/^[a-f0-9]{64}$/);

const comparisonCapability=getCapability('comparison');
assert.equal(comparisonCapability?.routing,'reasoning');
assert.equal(comparisonCapability?.package?.id,'comparison');
assert.equal(comparisonCapability?.package?.version,'1.0.0');

const unsafePackage=structuredClone({
  manifest:comparisonPackage.manifest,
  contract:comparisonPackage.contract,
  permissions:comparisonPackage.permissions,
  adapter:comparisonPackage.adapter
});
unsafePackage.permissions.writesExternalState=true;
assert.throws(
  ()=>validateCapabilityPackageDocuments(unsafePackage),
  /human approval/i
);

const compare=previewIntent({text:'Vertaa vaihtoehtoja A ja B ja arvioi niiden olennaiset riskit.'});
assert.ok(compare.problem.needs.includes('comparison'));
assert.ok(compare.capabilityRoute.reasoning.includes('comparison'));

for(const id of [
  'source.search','academic.search','news.search','source.rank','source.crosscheck',
  'research.synthesize','research.gap.detect','data.profile','data.analyze',
  'data.visualize','statistics.describe','market.snapshot','market.risk',
  'model.compare','model.disagreement','model.merge','uncertainty.calibrate'
]){
  assert.ok(getCapability(id),`Capability Expansion Pack missing ${id}`);
}

const researchExpansion=previewIntent({
  text:'Etsi tutkimuspapereita tästä ilmiöstä, ristiintarkista lähteet ja tee synteesi.'
},{
  availability:{'source.search':true,'academic.search':true}
});
assert.equal(researchExpansion.problem.domain,'research');
assert.ok(researchExpansion.problem.needs.includes('source.search'));
assert.ok(researchExpansion.problem.needs.includes('academic.search'));
assert.ok(researchExpansion.problem.needs.includes('source.crosscheck'));
assert.ok(researchExpansion.problem.needs.includes('research.synthesize'));
assert.ok(researchExpansion.capabilityRoute.readOnly.includes('source.search'));
assert.ok(researchExpansion.capabilityRoute.readOnly.includes('academic.search'));
assert.ok(researchExpansion.capabilityRoute.reasoning.includes('source.crosscheck'));
assert.ok(researchExpansion.capabilityRoute.reasoning.includes('research.synthesize'));

const dataExpansion=previewIntent({
  text:'Analysoi tämä CSV-data, etsi poikkeamat ja suunnittele kuvaaja.',
  workspace:{id:'ws_data',title:'Data',materials:[{title:'data.csv',content:'a,b\n1,2\n2,9'}]}
});
assert.equal(dataExpansion.problem.domain,'data');
assert.ok(dataExpansion.problem.needs.includes('data.profile'));
assert.ok(dataExpansion.problem.needs.includes('data.analyze'));
assert.ok(dataExpansion.problem.needs.includes('data.anomaly.detect'));
assert.ok(dataExpansion.problem.needs.includes('data.visualize'));
assert.ok(dataExpansion.capabilityRoute.compute.includes('data.analyze'));

const marketExpansion=previewIntent({
  text:'Analysoi osakemarkkinan sentimentti, volatiliteetti, likviditeetti ja riskiskenaariot tuoreista uutisista.'
},{
  availability:{'source.search':true,'news.search':true}
});
assert.equal(marketExpansion.problem.domain,'market');
assert.ok(marketExpansion.problem.needs.includes('market.snapshot'));
assert.ok(marketExpansion.problem.needs.includes('market.sentiment'));
assert.ok(marketExpansion.problem.needs.includes('market.volatility'));
assert.ok(marketExpansion.problem.needs.includes('market.liquidity'));
assert.ok(marketExpansion.problem.needs.includes('market.risk'));
assert.ok(marketExpansion.problem.needs.includes('market.scenario'));
assert.ok(marketExpansion.capabilityRoute.readOnly.includes('news.search'));
assert.ok(marketExpansion.capabilityRoute.reasoning.includes('market.risk'));

const ensembleExpansion=previewIntent({
  text:'Kysy tätä viideltä eri kielimallilta, vertaa erimielisyydet ja muodosta konsensus.'
});
for(const id of ['model.compare','model.disagreement','model.merge','uncertainty.calibrate']){
  assert.ok(ensembleExpansion.problem.needs.includes(id));
  assert.ok(ensembleExpansion.capabilities.unresolved.some(item=>item.id===id));
}
assert.match(ensembleExpansion.recommendation.limitations.join(' '),/ensemble|monimalli/i);

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
assert.ok(research.capabilities.unresolved.some(item=>item.id==='source.search'));
assert.match(research.recommendation.limitations.join(' '),/(?:lähdehaku|verkkohaku)/i);

const external=previewIntent({text:'Deployaa tämä tuotantoon Verceliin.'});
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
