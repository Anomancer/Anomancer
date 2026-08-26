import fs from 'node:fs';
import assert from 'node:assert/strict';
import { AGENT_REGISTRY, ORCHESTRA_REGISTRY, CORE_VERSION } from '../api/_lib/core-registry.js';

let n=0;const test=(name,fn)=>{fn();n++;console.log(`✓ ${name}`)};
const html=fs.readFileSync('core.html','utf8');
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const build=fs.readFileSync('scripts/build-blog.mjs','utf8');

test('/core on julkinen staattinen sivu eikä admin-rewrite',()=>{
  assert.match(html,/PUBLIC ARCHITECTURE VIEW/);
  assert.ok(!(vercel.rewrites||[]).some(r=>r.source==='/core'));
  assert.ok(!vercel.headers.some(h=>h.source==='/core'&&JSON.stringify(h).includes('noindex')));
});
test('/admin pysyy yksityisenä',()=>{
  const admin=vercel.headers.find(h=>h.source==='/admin');
  assert.ok(admin);assert.match(JSON.stringify(admin),/noindex/);assert.match(JSON.stringify(admin),/no-store/);
});
test('julkinen Core ei kutsu admin-API:a',()=>{
  assert.doesNotMatch(fs.readFileSync('core-public.js','utf8'),/\/api\/admin\//);
});
test('build tuottaa julkisen snapshotin Agent Registrystä',()=>{
  assert.match(build,/AGENT_REGISTRY/);assert.match(build,/core-public\.json/);assert.match(build,/containsRunHistory:false/);
});
test('Core Registry on 15.1 ja agentteja on edelleen kahdeksan',()=>{
  assert.equal(CORE_VERSION,'15.1.0');assert.equal(AGENT_REGISTRY.length,8);assert.equal(ORCHESTRA_REGISTRY.length,1);
});
test('yhdelläkään agentilla ei ole julkaisuoikeutta',()=>{
  for(const a of AGENT_REGISTRY) assert.ok(a.authority.deny.includes('publish'));
});
test('public Core kertoo julkisen ja yksityisen rajan',()=>{
  assert.match(html,/Lasiseinä ei ole avoin ovi/);assert.match(html,/href="\/admin"/);assert.match(html,/Promptit, oikeat ajot, sessiot ja salaisuudet/);
});
test('Core lisätään discoveryyn',()=>{
  assert.match(build,/\['\/core',null\]/);assert.match(build,/\[Core\]/);
});
console.log(`\n${n}/${n} PUBLIC CORE -testiä läpi`);
