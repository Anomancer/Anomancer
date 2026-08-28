import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { editorialQualityReport } from '../../server/editorial-quality.js';
import { parseMarkdown, validatePost } from '../../server/content.js';
import { promptFor } from '../../server/agent-prompts.js';

let passed=0;
const test=(name,fn)=>{fn();passed++;console.log(`✓ editorial quality · ${name}`);};
const base={lang:'fi',title:'Selkeä otsikko',date:'2026-08-27',category:'info-media',audience:['all'],audienceDepth:'general',description:'Kuvaus',slug:'selkea-otsikko',sources:[],claims:[],draft:false,body:'Konkreettinen havainto johtaa perusteltuun päätelmään.'};

test('julkaisun metakieli ja sisäinen lähdevelka tunnistetaan',()=>{
  const report=editorialQualityReport({...base,body:'Tässä on absurdin tiukka testi. ETLA:n kandidaattilähde kertoo luvun.'});
  assert.equal(report.ok,false);assert.ok(report.issues.some(x=>x.code==='EDITORIAL_META_STRICTNESS'));assert.ok(report.issues.some(x=>x.code==='EDITORIAL_SOURCE_DEBT'));
});

test('rehellinen epävarmuuskieli varoittaa mutta ei estä julkaisua',()=>{
  const body='Aineisto on toistaiseksi varmistamaton, joten johtopäätös jätetään avoimeksi.';
  const report=editorialQualityReport({...base,body});
  assert.equal(report.ok,true);assert.ok(report.issues.some(x=>x.code==='EDITORIAL_EPISTEMIC_UNCERTAINTY'&&x.severity==='warning'));
  assert.doesNotThrow(()=>validatePost({...base,body},{forPublish:true}));
});

test('luonnoksen saa tallentaa mutta epäsiisti julkaisu pysähtyy',()=>{
  const dirty={...base,draft:true,body:'Tämä on tiukka argumentti.'};
  assert.equal(validatePost(dirty,{forPublish:false}).draft,true);
  assert.throws(()=>validatePost({...dirty,draft:false},{forPublish:true}),error=>error.code==='EDITORIAL_QUALITY');
});

test('toistuva vastakkainasettelu pysähtyy deterministisesti',()=>{
  const body=Array.from({length:8},(_,i)=>`Kohta ${i+1} ei ole ongelma vaan seuraus.`).join('\n\n');
  const report=editorialQualityReport({...base,body});assert.ok(report.issues.some(x=>x.code==='EDITORIAL_CONTRAST_CADENCE'&&x.severity==='error'));
});

test('puhdas julkaisu läpäisee portin',()=>assert.equal(validatePost(base,{forPublish:true}).title,base.title));

test('agenttipromptit käsittelevät ihmisohjeen tarkoituksena eivätkä julkaisutekstinä',()=>{
  const writer=promptFor('writer',base,'tee absurdin tiukaksi'),voice=promptFor('voice',base,'tee absurdin tiukaksi');
  assert.match(writer.system,/editorial intent, not as copy/i);assert.match(writer.system,/must not be mentioned in publishable prose/i);assert.match(voice.system,/internal evidence-status language/i);
});

test('kaikki julkaistut lähdetekstit läpäisevät saman portin',()=>{
  const roots=['content/fi','content/en'];let count=0,available=0;
  for(const root of roots){if(!fs.existsSync(root))continue;available++;for(const name of fs.readdirSync(root).filter(x=>x.endsWith('.md'))){const post=parseMarkdown(fs.readFileSync(path.join(root,name),'utf8'),path.join(root,name));if(post.draft)continue;validatePost(post,{forPublish:true});count++;}}
  if(available)assert.ok(count>=10);else assert.match(fs.readFileSync('INSTALL_TO_CURRENT.sh','utf8'),/--exclude='content\/'/);
});

console.log(`\n${passed}/${passed} EDITORIAL QUALITY -regressiota läpi`);
