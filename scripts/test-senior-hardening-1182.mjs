import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readJson, sameOrigin } from '../server/http.js';
import { hashPassword, verifyPassword } from '../server/auth.js';
import { createPublicCoreView } from '../server/public-core.js';

let ok=0;
const test=async(name,fn)=>{await fn();ok++;console.log(`✓ ${name}`)};

await test('esiparsittu JSON ei ohita body-kokorajaa',async()=>{
  const req={body:{payload:'x'.repeat(2048)}};
  await assert.rejects(()=>readJson(req,256),err=>err?.statusCode===413);
});

await test('mutatoiva origin-raja on fail-closed',()=>{
  assert.equal(sameOrigin({headers:{host:'anomancer.com','x-forwarded-proto':'https'}}),false);
  assert.equal(sameOrigin({headers:{origin:'https://anomancer.com',host:'anomancer.com','x-forwarded-proto':'https'}}),true);
  assert.equal(sameOrigin({headers:{origin:'https://evil.example',host:'anomancer.com','x-forwarded-proto':'https'}}),false);
  assert.equal(sameOrigin({headers:{origin:'https://anomancer.com',host:'anomancer.com evil.example','x-forwarded-proto':'https'}}),false);
});

await test('scrypt-verifiointi rajaa hyökkääjän parametrit ennen laskentaa',()=>{
  const encoded=hashPassword('pitka-testisalasana-123');
  assert.equal(verifyPassword('pitka-testisalasana-123',encoded),true);
  assert.equal(verifyPassword('pitka-testisalasana-123','scrypt$1073741824$8$1$abcd$'+'00'.repeat(64)),false);
  assert.equal(verifyPassword('pitka-testisalasana-123','scrypt$16384$999$1$abcd$'+'00'.repeat(64)),false);
});

await test('julkinen Core kertoo 1.18.x alustakerrokset ilman yksityisiä package-sopimuksia',()=>{
  const core=createPublicCoreView();
  assert.equal(core.platform.mancerRuntime.installedPackages.some(x=>x.id==='codemancer'),true);
  assert.equal(core.platform.capabilityRegistry.some(x=>x.id==='nanomancer'&&x.modelAccess==='none'),true);
  assert.equal(core.platform.archive.curator,'Arkistonhoitaja');
  const raw=JSON.stringify(core.platform);
  for(const privateKey of ['packageDir','constitution','agentBindings','permissions','archivePolicy','approvalModel','toolPolicy']) assert.doesNotMatch(raw,new RegExp(`"${privateKey}"`,'i'));
});

await test('roadmap on semanttinen, natiivisti avattava ja oletuksena suljettu molemmilla kielillä',()=>{
  for(const file of ['core.html','core-en.html']){
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,/<details class="core-roadmap-details">/);
    assert.doesNotMatch(html,/<details class="core-roadmap-details"[^>]*\sopen(?:\s|=|>)/i);
    assert.match(html,/<summary><span><small>ROADMAP/);
    assert.match(html,/class="core-roadmap-toggle" aria-hidden="true">\+<\/span>/);
    for(const version of ['1.18.3','1.18.4','1.19','1.20','1.21','1.22','1.23','1.24','1.25','1.26','1.27','1.28','1.29','1.30','1.31','1.32','1.33','1.34','1.35','1.4x','2.0']) assert.match(html,new RegExp(version.replace('.','\\.')));
  }
});

await test('Core-reiteillä on oma CSP ja API-pinnat ovat same-origin resource -rajattuja',()=>{
  const cfg=JSON.parse(fs.readFileSync('vercel.json','utf8'));
  const bySource=new Map(cfg.headers.map(x=>[x.source,x.headers]));
  const value=(source,key)=>bySource.get(source)?.find(x=>x.key===key)?.value||'';
  for(const route of ['/core','/en/core']){
    const csp=value(route,'Content-Security-Policy');
    assert.match(csp,/default-src 'self'/);
    assert.match(csp,/object-src 'none'/);
    assert.match(csp,/frame-ancestors 'none'/);
    assert.match(csp,/base-uri 'none'/);
  }
  assert.equal(value('/api/admin/(.*)','Cross-Origin-Resource-Policy'),'same-origin');
  assert.equal(value('/api/contact','Cross-Origin-Resource-Policy'),'same-origin');
});

await test('uudet välilehdet eivät saa opener-kahvaa',()=>{
  for(const file of ['admin.html','admin.js','admin-shell.js']){
    const text=fs.readFileSync(file,'utf8');
    assert.doesNotMatch(text,/target="_blank"\s+rel="noreferrer"/);
  }
});

console.log(`\n${ok}/${ok} SENIOR HARDENING 1.18.3 -testiä läpi`);
