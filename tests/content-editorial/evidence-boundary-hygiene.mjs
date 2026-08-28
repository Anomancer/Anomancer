import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateAgentResult } from '../../server/agent-validation.js';
import { editorialQualityReport } from '../../server/editorial-quality.js';

let n=0;const test=(name,fn)=>{fn();n++;console.log(`✓ ${name}`)};
const post={lang:'fi',title:'Testi',category:'info-media',audience:['all'],audienceDepth:'general',description:'x',answer:'',slug:'testi',sources:[],claims:[],body:'Alkuperäinen teksti.'};

test('writerin workflow-lähdestatus neutraloidaan ennen body-rajaa',()=>{
  const r=validateAgentResult('writer',{body:'Lähde-ehdokas kertoo asiasta. Toinen kandidaattilähde rajaa väitettä.',notes:[]},post);
  assert.equal(r.body,'Lähde kertoo asiasta. Toinen lähde rajaa väitettä.');
  assert.ok(r.notes.some(x=>/evidenssikerrokseen/i.test(x)));
  assert.equal(editorialQualityReport({...post,body:r.body}).issues.some(x=>x.code==='EDITORIAL_SOURCE_DEBT'),false);
});

test('audience- ja voice-rajat käyttävät samaa neutralointia',()=>{
  assert.equal(validateAgentResult('audience',{body:'Kandidaattilähde on tässä rajattu.',warnings:[]},post).body,'Lähde on tässä rajattu.');
  assert.equal(validateAgentResult('voice',{body:'Tämä lähde-ehdokas ei vielä ratkaise asiaa.',warnings:[]},post).body,'Tämä lähde ei vielä ratkaise asiaa.');
});

test('englannin workflow-status neutraloidaan ilman evidenssin promootiota',()=>{
  const en={...post,lang:'en'};
  assert.equal(validateAgentResult('voice',{body:'This source candidate does not settle the claim.',warnings:[]},en).body,'This source does not settle the claim.');
});

test('source-agentin candidate-status säilyy evidenssimetadatassa',()=>{
  const r=validateAgentResult('source',{candidateSources:[{title:'Example',url:'https://example.com/a'}]},post);
  assert.equal(r.candidateSources[0].verification,'candidate');
  assert.equal(r.candidateSources[0].origin,'source-agent');
});

test('julkaisuportti blokkaa edelleen käsin bodyyn jääneen workflow-leiman',()=>{
  const report=editorialQualityReport({...post,body:'Lähde-ehdokas jäi näkyviin.'});
  assert.equal(report.ok,false);assert.ok(report.issues.some(x=>x.code==='EDITORIAL_SOURCE_DEBT'&&x.severity==='error'));
});

test('admin tarjoaa nykyiselle saastuneelle luonnokselle hallitun korjauksen',()=>{
  const js=fs.readFileSync(new URL('../../admin.js',import.meta.url),'utf8');
  assert.match(js,/function repairEditorialSourceDebt\(/);
  assert.match(js,/Julkaisua EI tehdä automaattisesti/);
  assert.match(js,/selectEditorView\('write'\)/);
});

test('agenttipromptti kieltää täsmälliset workflow-leimat bodyssa',()=>{
  const prompts=fs.readFileSync(new URL('../../server/agent-prompts.js',import.meta.url),'utf8');
  assert.match(prompts,/lähde-ehdokas/);assert.match(prompts,/verification state in evidence metadata/i);
});
console.log(`\n${n}/7 EVIDENCE BOUNDARY HYGIENE 16.3.5 -testiä läpi`);
