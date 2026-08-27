import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPublicCoreView, PUBLIC_CORE_FORMAT } from '../server/public-core.js';
import { createReleaseProvenance } from '../server/release-provenance.js';

let ok=0;const test=async(name,fn)=>{await fn();ok++;console.log(`✓ ${name}`)};
const core=createPublicCoreView();
const forbiddenKeys=new Set(['authority','budget','runtimePolicy','defaultTarget','allowedTargets','providers','targets','modelTarget','privateKey','apiKey','secret','env','prompt','systemPrompt','instruction','rawInput','rawOutput','workspaceId','profiles']);
function walk(value,path='root'){
  if(Array.isArray(value)){value.forEach((x,i)=>walk(x,`${path}[${i}]`));return;}
  if(!value||typeof value!=='object')return;
  for(const [key,val] of Object.entries(value)){
    assert.equal(forbiddenKeys.has(key),false,`private key leaked at ${path}.${key}`);
    walk(val,`${path}.${key}`);
  }
}

await test('Public Core käyttää erillistä v2 allowlist-formaattia',()=>{assert.equal(core.format,PUBLIC_CORE_FORMAT);assert.equal(core.boundary.mode,'explicit-allowlist');assert.equal(core.boundary.privateByDefault,true);});
await test('Public Core ei sisällä private control plane -kenttiä',()=>walk(core));
await test('julkinen agenttikortti on eksplisiittisesti rajattu',()=>{const allowed=['id','label','version','role','description','modelRoute','tools','humanApprovalRequired','publishAuthority','contractHash'].sort();for(const agent of core.agents)assert.deepEqual(Object.keys(agent).sort(),allowed);});
await test('julkinen mallireitti ei paljasta provider-targetteja tai fallback-järjestystä',()=>{for(const route of core.modelRoutes){assert.deepEqual(Object.keys(route).sort(),['id','label','requires','routeHash'].sort());}assert.equal(core.modelRouter.providerDetails,'private');assert.equal(core.modelRouter.targetDetails,'private');assert.equal(core.modelRouter.fallbackDetails,'private');});
await test('julkinen snapshot ei sisällä tunnettuja salaisuusnimiä tai tarkkoja tokenkattoja',()=>{const raw=JSON.stringify(core);for(const marker of ['ADMIN_SESSION_SECRET','DEEPSEEK_API_KEY','GITHUB_CONTENT_TOKEN','RESEND_API_KEY','24000','48000'])assert.doesNotMatch(raw,new RegExp(marker));});
await test('julkinen Core-selain ei kutsu admin-API:a eikä renderöi runtime-budjetteja',()=>{const js=fs.readFileSync('core-public.js','utf8'),renderer=fs.readFileSync('public-core-render.js','utf8');for(const src of [js,renderer]){assert.doesNotMatch(src,/\/api\/admin\//);assert.doesNotMatch(src,/maxOutputTokens|allowedTargets|defaultTarget/);}assert.match(renderer,/providerPrivate/);});
await test('Core-sivu sanoo eksplisiittisesti julkisen ja yksityisen rajan ja linkittää julkaisukuitin',()=>{const fi=fs.readFileSync('core.html','utf8'),en=fs.readFileSync('core-en.html','utf8');assert.match(fi,/Oikeat ajot, promptit, mallikohteet, työtilat ja ohjaus pysyvät yksityisinä/i);assert.match(en,/Real runs, prompts, model targets, workspaces and control stay private/i);for(const html of [fi,en]){assert.match(html,/release-provenance\.json/);assert.doesNotMatch(html,/16[ ,.]?000 (?:tulostokenia|output tokens)/i);}});
await test('release provenance sisältää vain turvallisen hash-jäljen ja disclosure-booleanit',()=>{const p=createReleaseProvenance({publicCore:core,apiFunctionCount:4,builtAt:'2026-08-27T00:00:00.000Z'});assert.equal(p.apiSurface.functionCount,4);assert.match(p.publicSchemaHash,/^[a-f0-9]{64}$/);assert.match(p.registryHashes.agents,/^[a-f0-9]{64}$/);assert.equal(p.disclosureBoundary.rawPrompts,false);assert.equal(p.disclosureBoundary.rawOutputs,false);assert.equal(p.disclosureBoundary.runtimeProfiles,false);const raw=JSON.stringify(p);for(const marker of ['ADMIN_SESSION_SECRET','DEEPSEEK_API_KEY','GITHUB_CONTENT_TOKEN','RESEND_API_KEY'])assert.doesNotMatch(raw,new RegExp(marker,'i'));});
await test('public disclosure -politiikka on repo-dokumenttina mutta private IP lineage ei ole',()=>{assert.equal(fs.existsSync('PUBLIC_DISCLOSURE_BOUNDARY.md'),true);assert.equal(fs.existsSync('ANOMANCER_IP_PRIVATE.md'),false);});
console.log(`\n${ok}/${ok} PUBLIC DISCLOSURE BOUNDARY -testiä läpi`);
