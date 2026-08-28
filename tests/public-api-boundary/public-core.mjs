import fs from 'node:fs';
import assert from 'node:assert/strict';
import { AGENT_REGISTRY, ORCHESTRA_REGISTRY, CORE_VERSION } from '../../server/core-registry.js';

let n=0;const test=(name,fn)=>{fn();n++;console.log(`✓ ${name}`)};
const html=fs.readFileSync('core.html','utf8');
const js=fs.readFileSync('core-public.js','utf8');
const renderer=fs.readFileSync('public-core-render.js','utf8');
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const build=fs.readFileSync('scripts/build-blog.mjs','utf8');
const publicBoundary=fs.readFileSync('server/public-core.js','utf8');

test('/core on julkinen staattinen sivu eikä admin-rewrite',()=>{
  assert.match(html,/class="core-public-page core-product-page"/);
  assert.match(html,/class="core-hero-wordmark"/);
  assert.doesNotMatch(html,/JULKINEN RAKENNENÄKYMÄ/);
  assert.ok(!(vercel.rewrites||[]).some(r=>r.source==='/core'));
  assert.ok(!vercel.headers.some(h=>h.source==='/core'&&JSON.stringify(h).includes('noindex')));
});
test('/admin pysyy yksityisenä',()=>{
  const admin=vercel.headers.find(h=>h.source==='/admin');
  assert.ok(admin);assert.match(JSON.stringify(admin),/noindex/);assert.match(JSON.stringify(admin),/no-store/);
});
test('julkinen Core ei kutsu admin-API:a',()=>{assert.doesNotMatch(js,/\/api\/admin\//);assert.doesNotMatch(renderer,/\/api\/admin\//);});
test('build tuottaa julkisen snapshotin eksplisiittisen allowlistin kautta',()=>{assert.match(build,/createPublicCoreView/);assert.match(build,/core-public\.json/);assert.match(publicBoundary,/mode:'explicit-allowlist'/);assert.match(publicBoundary,/containsRunHistory:false/);assert.match(publicBoundary,/containsRawPrompt:false/);});
test('Core Registry näyttää molemmat built-in-universumit ilman agenttien julkaisuoikeutta',()=>{assert.equal(CORE_VERSION,'1.18.5');assert.equal(AGENT_REGISTRY.length,18);assert.ok(AGENT_REGISTRY.some(a=>a.id==='visualization'));assert.ok(AGENT_REGISTRY.some(a=>a.id==='narrative-continuity'));assert.equal(ORCHESTRA_REGISTRY.length,2);assert.equal(ORCHESTRA_REGISTRY[0].steps.length,8);assert.equal(ORCHESTRA_REGISTRY[1].steps.length,9);});
test('julkinen Core näyttää built-in Orchestra Contractit mutta ei custom-orkestereita',()=>{for(const o of ORCHESTRA_REGISTRY){assert.equal(o.source,'built-in');assert.ok(Array.isArray(o.steps));}assert.match(renderer,/orchestras\.map/);assert.doesNotMatch(js,/api\/admin\/orchestras/);});
test('yhdelläkään agentilla ei ole julkaisuoikeutta',()=>{for(const a of AGENT_REGISTRY)assert.ok(a.authority.deny.includes('publish'));});
test('public Core kertoo julkisen ja yksityisen rajan',()=>{assert.match(html,/Lasiseinä ei ole avoin ovi/);assert.match(html,/href="\/admin"/);assert.match(html,/Oikeat ajot, kehotteet, mallikohteet, työtilojen sisältö ja ohjaus pysyvät yksityisinä/);});
test('Core on kolme lukua ja säilyttää yhdeksän rakenneankkuria',()=>{
  for(const id of ['chapter-what','chapter-flow','chapter-boundary'])assert.match(html,new RegExp(`id="${id}"`));
  for(const id of ['overview','agents','orchestras','runs','evidence','models','tools','usage','workspaces'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/Tutki rakennetta/);
});
test('ajo- ja käyttötiedot pysyvät julkisessa näkymässä rajattuina',()=>{assert.match(html,/04 · Ajot/);assert.match(html,/08 · Käyttö/);assert.match(html,/>YKSITYINEN</);assert.match(html,/Oikeiden ajojen sisältö, tokenkäyttö ja vaihekohtaiset tulokset jäävät yksityiseen Coreen/);assert.match(html,/Tarkat tokenrajat, palveluntarjoajakustannukset ja todellinen käyttö pysyvät yksityisinä/);});
test('Models, Tools, Workspaces ja fallback johdetaan yhteisestä julkisesta rendereristä',()=>{assert.match(js,/renderPublicCore\(core,lang\)/);assert.match(build,/renderPublicCore/);assert.match(renderer,/modelRoutes/);assert.match(renderer,/core\?\.tools/);assert.match(renderer,/workspaceControl/);assert.doesNotMatch(renderer,/maxOutputTokens|maxOutputTokensCeiling|allowedTargets|defaultTarget/);});
test('julkinen snapshot kertoo runtime-rajan olemassaolon mutta ei julkaise toteutusarvoja',()=>{assert.match(publicBoundary,/containsRuntimeProfiles:false/);assert.match(publicBoundary,/contractBudgets:'private'/);assert.match(publicBoundary,/targetDetails:'private'/);assert.doesNotMatch(publicBoundary,/maxOutputTokens|allowedTargets|defaultTarget|RUNTIME_KEY|localStorage/);assert.doesNotMatch(js,/agent-runtime|localStorage/);});
test('rakennehakemisto seuraa osioita ilman uutta API-pintaa',()=>{assert.match(js,/IntersectionObserver/);assert.match(html,/data-core-nav="overview"/);assert.doesNotMatch(js,/fetch\([^)]*api/);});
test('Core lisätään discoveryyn',()=>{assert.match(build,/\['\/core',null\]/);assert.match(build,/Core FI/);assert.match(build,/Core EN/);assert.match(build,/\['\/en\/core',null\]/);});
console.log(`\n${n}/${n} PUBLIC CORE -testiä läpi`);
