import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createPublicCoreView,PUBLIC_CORE_FORMAT} from '../../server/public-core.js';
import {renderPublicCoreV3} from '../../public-core-v3-render.js';

const core=createPublicCoreView();

assert.equal(PUBLIC_CORE_FORMAT,'anomancer-core-public/v3');
assert.equal(core.format,'anomancer-core-public/v3');
assert.equal(core.architecture?.format,'anomancer-public-architecture/v1');
assert.ok(core.architecture.capabilityPackages.count>=30);
assert.equal(core.architecture.capabilityPackages.packages.length,core.architecture.capabilityPackages.count);

const packages=core.architecture.capabilityPackages.packages;

const dataAnalyze=packages.find(item=>item.id==='data.analyze');
assert.ok(dataAnalyze);
assert.equal(dataAnalyze.routing,'compute');
assert.equal(dataAnalyze.runtimeAdapter,'compute.tabular.v1');
assert.equal(dataAnalyze.dataEgress,'none');

const sourceSearch=packages.find(item=>item.id==='source.search');
assert.ok(sourceSearch);
assert.equal(sourceSearch.routing,'read-only');
assert.equal(sourceSearch.availability,'runtime');

const ensemble=packages.find(item=>item.id==='model.compare');
assert.ok(ensemble);
assert.equal(ensemble.availability,'disabled');
assert.equal(core.architecture.ensemble.status,'declared-not-executable');

assert.equal(core.architecture.compute.installed,true);
assert.equal(core.architecture.compute.deterministic,true);
assert.equal(core.architecture.compute.externalSideEffects,false);
assert.equal(core.architecture.compute.dataEgress,'none');
assert.equal(core.architecture.compute.networkAccess,false);
assert.equal(core.architecture.compute.executesUserCode,false);

assert.equal(core.architecture.taskGraph.installed,true);
assert.equal(core.architecture.taskGraph.dependencyAware,true);
assert.ok(core.architecture.taskGraph.routings.includes('compute'));
assert.ok(core.architecture.taskGraph.routings.includes('approval'));
assert.equal(core.architecture.taskGraph.finalAuthority,'human');

const exposedPackageJson=JSON.stringify(packages);
for(const forbidden of ['contractHash','executionCapability','permissions','contract.json','keyEnv','allowedTargets','defaultTarget']){
  assert.equal(exposedPackageJson.includes(forbidden),false,`public capability package leaked ${forbidden}`);
}

for(const lang of ['fi','en']){
  const view=renderPublicCoreV3(core,lang);
  assert.ok(view.capabilityCount>=30);
  assert.match(view.architectureHtml,/ProblemModel/);
  assert.match(view.architectureHtml,/compute\.tabular\.v1/);
  assert.match(view.capabilitiesHtml,/data\.analyze/);
  assert.match(view.capabilitiesHtml,/model\.compare/);
}

for(const rel of ['site/pages/core.html','site/pages/core-en.html']){
  const html=fs.readFileSync(rel,'utf8');
  assert.match(html,/id="corePublicArchitecture"/);
  assert.match(html,/id="corePublicCapabilities"/);
  assert.match(html,/CORE_FALLBACK:ARCHITECTURE:START/);
  assert.match(html,/CORE_FALLBACK:CAPABILITIES:START/);
}

const client=fs.readFileSync('core-public.js','utf8');
assert.match(client,/renderPublicCoreV3/);
assert.match(client,/corePublicArchitecture/);
assert.match(client,/corePublicCapabilities/);

const build=fs.readFileSync('scripts/build-blog.mjs','utf8');
assert.match(build,/renderPublicCoreV3/);
assert.match(build,/ARCHITECTURE:v3\.architectureHtml/);
assert.match(build,/CAPABILITIES:v3\.capabilitiesHtml/);
assert.match(build,/public-core-v3-render\.js/);

const publicBoundary=fs.readFileSync('server/public-core.js','utf8');
assert.match(publicBoundary,/createPublicArchitectureView/);
assert.match(publicBoundary,/mode:'explicit-allowlist'/);
assert.doesNotMatch(publicBoundary,/OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|DEEPSEEK_API_KEY/);

console.log('✓ Public Core v3 · Capability Packages, Compute Runtime, Task Graph and public boundary');
