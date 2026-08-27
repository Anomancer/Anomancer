import fs from 'node:fs';
import assert from 'node:assert/strict';
import { AGENT_REGISTRY, ORCHESTRA_REGISTRY, CORE_VERSION } from '../server/core-registry.js';

let n=0;const test=(name,fn)=>{fn();n++;console.log(`✓ ${name}`)};
const html=fs.readFileSync('core.html','utf8');
const js=fs.readFileSync('core-public.js','utf8');
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const build=fs.readFileSync('scripts/build-blog.mjs','utf8');
const publicBoundary=fs.readFileSync('server/public-core.js','utf8');

test('/core on julkinen staattinen sivu eikä admin-rewrite',()=>{
  assert.match(html,/JULKINEN RAKENNENÄKYMÄ/);
  assert.ok(!(vercel.rewrites||[]).some(r=>r.source==='/core'));
  assert.ok(!vercel.headers.some(h=>h.source==='/core'&&JSON.stringify(h).includes('noindex')));
});
test('/admin pysyy yksityisenä',()=>{
  const admin=vercel.headers.find(h=>h.source==='/admin');
  assert.ok(admin);assert.match(JSON.stringify(admin),/noindex/);assert.match(JSON.stringify(admin),/no-store/);
});
test('julkinen Core ei kutsu admin-API:a',()=>{assert.doesNotMatch(js,/\/api\/admin\//);});
test('build tuottaa julkisen snapshotin eksplisiittisen allowlistin kautta',()=>{assert.match(build,/createPublicCoreView/);assert.match(build,/core-public\.json/);assert.match(publicBoundary,/mode:'explicit-allowlist'/);assert.match(publicBoundary,/containsRunHistory:false/);assert.match(publicBoundary,/containsRawPrompt:false/);});
test('Core Registry on 16.2, agenttisopimuksia on yhdeksän ja Visualisointivahti on valinnainen',()=>{assert.equal(CORE_VERSION,'16.2.0');assert.equal(AGENT_REGISTRY.length,9);assert.ok(AGENT_REGISTRY.some(a=>a.id==='visualization'));assert.equal(ORCHESTRA_REGISTRY.length,1);assert.equal(ORCHESTRA_REGISTRY[0].steps.length,8);assert.equal(ORCHESTRA_REGISTRY[0].stages.includes('visualization'),false);});
test('julkinen Core näyttää vain built-in Orchestra Contractin mutta tukee step-rakennetta',()=>{const o=ORCHESTRA_REGISTRY[0];assert.equal(o.source,'built-in');assert.ok(Array.isArray(o.steps));assert.equal(o.steps.length,8);assert.doesNotMatch(js,/api\/admin\/orchestras/);});
test('yhdelläkään agentilla ei ole julkaisuoikeutta',()=>{for(const a of AGENT_REGISTRY) assert.ok(a.authority.deny.includes('publish'));});
test('public Core kertoo julkisen ja yksityisen rajan',()=>{assert.match(html,/Lasiseinä ei ole avoin ovi/);assert.match(html,/href="\/admin"/);assert.match(html,/Ajot, promptit, ajoprofiilit, mallikohteet ja yksityinen ohjaamo eivät/);});
test('Corella on yhdeksän alueen tuoterakenne',()=>{
  for(const id of ['overview','agents','orchestras','runs','evidence','models','tools','usage','workspaces']) assert.match(html,new RegExp(`id="${id}"`));
  for(const label of ['Yleiskuva','Agenttijoukko','Orkesterit','Ajot','Evidenssi','Mallit','Työkalut','Käyttö','Työtilat']) assert.match(html,new RegExp(`>${label}<`));
});
test('julkinen Core kertoo ajojen tarkastelun ja käyttömittauksen olevan käytössä mutta pitää oikean datan yksityisenä',()=>{assert.match(html,/04 · Ajot/);assert.match(html,/08 · Käyttö/);assert.match(html,/>YKSITYINEN</);assert.match(html,/Oikea ajojen tarkastelu kuuluu yksityiseen Coreen/);assert.match(html,/Tarkat tokenrajat, palveluntarjoajakustannukset ja todellinen käyttö kuuluvat yksityiseen ohjaustasoon/);});
test('Models, Tools ja Usage johdetaan julkisesta allowlist-snapshotista',()=>{assert.match(js,/renderModels\(core\)/);assert.match(js,/renderTools\(core\)/);assert.match(js,/renderUsage\(core\)/);assert.match(js,/renderWorkspaces\(core\)/);assert.match(js,/a\.tools/);assert.doesNotMatch(js,/maxOutputTokens|maxOutputTokensCeiling|allowedTargets|defaultTarget/);});
test('julkinen snapshot kertoo runtime-rajan olemassaolon mutta ei julkaise toteutusarvoja',()=>{assert.match(publicBoundary,/containsRuntimeProfiles:false/);assert.match(publicBoundary,/contractBudgets:'private'/);assert.match(publicBoundary,/targetDetails:'private'/);assert.doesNotMatch(publicBoundary,/maxOutputTokens|allowedTargets|defaultTarget|RUNTIME_KEY|localStorage/);assert.doesNotMatch(js,/agent-runtime|localStorage/);});
test('Core-tuotenavigaatio seuraa osioita ilman uutta API-pintaa',()=>{assert.match(js,/IntersectionObserver/);assert.match(html,/data-core-nav="overview"/);assert.doesNotMatch(js,/fetch\([^)]*api/);});
test('Core lisätään discoveryyn',()=>{assert.match(build,/\['\/core',null\]/);assert.match(build,/Core FI/);assert.match(build,/Core EN/);assert.match(build,/\['\/en\/core',null\]/);});
console.log(`\n${n}/${n} PUBLIC CORE -testiä läpi`);
