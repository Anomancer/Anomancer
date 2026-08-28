import assert from 'node:assert/strict';
import fs from 'node:fs';
import { editorialQualityReport } from '../../server/editorial-quality.js';
import { validatePost } from '../../server/content.js';
import { readAdminCss } from '../../scripts/read-admin-css.mjs';

let passed=0;
const test=(name,fn)=>{fn();passed++;console.log(`✓ editorial gate 16.3.4 · ${name}`);};
const base={lang:'fi',title:'Selkeä otsikko',date:'2026-08-27',category:'info-media',audience:['all'],audienceDepth:'general',description:'Kuvaus',slug:'selkea-otsikko',sources:[],claims:[],draft:false,body:'Konkreettinen havainto johtaa perusteltuun päätelmään.'};

test('sisäinen lähdestatus on edelleen hard block',()=>{
  const report=editorialQualityReport({...base,body:'Lähdestatus: kandidaattilähde. Tätä ei ole vielä hyväksytty.'});
  const issue=report.issues.find(x=>x.code==='EDITORIAL_SOURCE_DEBT');
  assert.equal(report.ok,false);
  assert.equal(issue?.severity,'error');
  assert.match(issue?.excerpt||'',/kandidaattilähde/i);
});

test('rehellinen epävarmuuskieli on warning eikä julkaisueste',()=>{
  const body='Aineisto on toistaiseksi varmistamaton, joten johtopäätös jätetään avoimeksi.';
  const report=editorialQualityReport({...base,body});
  const issue=report.issues.find(x=>x.code==='EDITORIAL_EPISTEMIC_UNCERTAINTY');
  assert.equal(report.ok,true);
  assert.equal(issue?.severity,'warning');
  assert.doesNotThrow(()=>validatePost({...base,body},{forPublish:true}));
});

test('myös vahvistamatta jääminen voidaan sanoa julkisesti',()=>{
  const body='Väitettä ei ole tässä yhteydessä pystytty vahvistamaan käytettävissä olevasta aineistosta.';
  const report=editorialQualityReport({...base,body});
  assert.equal(report.ok,true);
  assert.ok(report.issues.some(x=>x.code==='EDITORIAL_EPISTEMIC_UNCERTAINTY'&&x.severity==='warning'));
});

test('POST-reitti palauttaa editorial-issues osumineen ja warningit onnistuneessa julkaisussa',()=>{
  const route=fs.readFileSync('server/admin-routes/posts.js','utf8');
  assert.match(route,/editorialQualityReport/);
  assert.match(route,/editorialWarnings/);
  assert.match(route,/editorialIssuesForResponse/);
  assert.match(route,/issues:editorialIssuesForResponse\(e\)/);
});

test('admin näyttää portin tarkan osuman eikä vain geneeristä viestiä',()=>{
  const js=fs.readFileSync('admin.js','utf8');
  const css=readAdminCss();
  assert.match(js,/function formatEditorialIssues\(/);
  assert.match(js,/osuma:/);
  assert.match(js,/formatEditorialWarnings/);
  assert.match(css,/\.status\{white-space:pre-line\}/);
});

console.log(`\n${passed}/${passed} EDITORIAL GATE CALIBRATION 16.3.4 -testiä läpi`);
