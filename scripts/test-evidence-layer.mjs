import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { serializePost, parseMarkdown, validatePost } from '../server/content.js';

const ROOT=process.cwd();
const FIX=path.join(ROOT,'content','fi','9999-v1318-evidence-fixture.md');
const OUT=path.join(ROOT,'lahetykset','v1318-evidence-fixture.html');
const SITE='https://anomancer.com';
let ok=0;
const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`)};
const build=()=>{const r=spawnSync(process.execPath,['scripts/build-blog.mjs'],{cwd:ROOT,encoding:'utf8'});if(r.status!==0)throw new Error(`${r.stdout}\n${r.stderr}`);};

const sourceA={title:'Example Research',url:'https://example.org/research',publisher:'Example Institute',date:'2026-08-01'};
const sourceB={title:'Example Dataset',url:'https://example.net/data',publisher:'Example Lab',date:'2026'};
const fixture={
  lang:'fi',date:'2099-01-01',title:'V13.18 Evidence Fixture',category:'info-media',audience:['all'],
  description:'Testijulkaisu, jolla varmennetaan Anomancerin Evidence Layerin ydinvastaus, lähteet ja väite-evidenssirakenne.',
  slug:'v1318-evidence-fixture',translationKey:'v1318-evidence-fixture',coverImage:'',coverAlt:'',pinned:false,draft:false,
  answer:'Suora vastaus erotetaan varsinaisesta esseestä ja sidotaan eksplisiittisesti lähteisiin sekä väitteisiin.',
  sources:[sourceA,sourceB],
  claims:[
    {status:'supported',text:'Tuettu väite käyttää rekisteröityä lähdettä.',evidence:[sourceA.url],note:'Testihuomio.'},
    {status:'interpretation',text:'Tämä kohta on tulkinta, ei sama asia kuin lähteen suora väite.',evidence:[sourceB.url],note:''},
    {status:'open',text:'Tämä kysymys jätetään avoimeksi.',evidence:[],note:'Ei pakotettua varmuutta.'}
  ],
  body:'## Testi\n\nVarsinainen teksti pysyy erillään ydinvastauksesta ja evidenssistä.'
};

try{
  test('evidence metadata validoituu',()=>{const p=validatePost(fixture);assert.equal(p.sources.length,2);assert.equal(p.claims.length,3);assert.equal(p.answer,fixture.answer);});
  test('Markdown roundtrip säilyttää evidence-rakenteen ja tarkistustilan',()=>{const normalized=validatePost(fixture);const md=serializePost(fixture);const p=parseMarkdown(md,'fixture');assert.equal(p.answer,fixture.answer);assert.deepEqual(p.sources,normalized.sources);assert.deepEqual(p.claims,normalized.claims);assert.ok(p.sources.every(source=>source.verification==='verified'));});
  test('tuettu väite ilman lähdettä estetään',()=>{assert.throws(()=>validatePost({...fixture,claims:[{status:'supported',text:'Ei lähdettä',evidence:[],note:''}]}),/vähintään yksi lähde/);});
  test('evidence URL ei voi viitata lähderekisterin ulkopuolelle',()=>{const p=validatePost({...fixture,claims:[{status:'interpretation',text:'Tulkinta',evidence:['https://outside.example/test'],note:''}]});assert.deepEqual(p.claims[0].evidence,[]);});
  test('agenttiehdokas sallitaan luonnoksessa mutta estetään julkaisussa',()=>{const candidate={...sourceA,origin:'source-agent',verification:'candidate'};assert.equal(validatePost({...fixture,draft:true,sources:[candidate]},{forPublish:false}).sources[0].verification,'candidate');assert.throws(()=>validatePost({...fixture,sources:[candidate],claims:[]}),/ihmisen tarkistusta/);});

  fs.mkdirSync(path.dirname(FIX),{recursive:true});
  fs.writeFileSync(FIX,serializePost(fixture));
  build();
  const html=fs.readFileSync(OUT,'utf8');
  const contentManifest=JSON.parse(fs.readFileSync(path.join(ROOT,'content-manifest.json'),'utf8'));
  const evidenceManifest=JSON.parse(fs.readFileSync(path.join(ROOT,'evidence-manifest.json'),'utf8'));

  test('julkinen artikkeli näyttää ydinvastauksen',()=>{assert.match(html,/class="article-answer"/);assert.match(html,/Suora vastaus erotetaan/);});
  test('julkinen artikkeli näyttää väitteet statuksineen',()=>{assert.match(html,/data-status="supported"/);assert.match(html,/Tuettu väite/);assert.match(html,/Tulkinta/);assert.match(html,/Avoin/);});
  test('lähteet saavat pysyvät source-ankkurit',()=>{assert.match(html,/id="source-1"/);assert.match(html,/href="#source-1"/);assert.match(html,/https:\/\/example\.org\/research/);});
  test('BlogPosting JSON-LD sisältää abstract + citation',()=>{const m=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);assert.ok(m);const g=JSON.parse(m[1]);const article=g['@graph'].find(x=>x['@type']==='BlogPosting');assert.equal(article.abstract,fixture.answer);assert.deepEqual(article.citation,[sourceA.url,sourceB.url]);});
  test('content-manifest julkaisee evidence-yhteenvedon',()=>{const p=contentManifest.published.find(x=>x.slug===fixture.slug);assert.ok(p);assert.equal(p.answer,fixture.answer);assert.deepEqual(p.evidence,{sourceCount:2,claimCount:3,supported:1,interpretation:1,open:1});});
  test('evidence-manifest on erillinen koneellinen kerros',()=>{assert.equal(evidenceManifest.version,'anomancer.evidence/v1');const p=evidenceManifest.articles.find(x=>x.url===`${SITE}/lahetykset/${fixture.slug}`);assert.ok(p);assert.equal(p.sources.length,2);assert.equal(p.claims.length,3);});
  test('evidence-manifest stageataan publiciin',()=>{assert.ok(fs.existsSync(path.join(ROOT,'public','evidence-manifest.json')));});
} finally {
  if(fs.existsSync(FIX)) fs.unlinkSync(FIX);
  build();
  if(fs.existsSync(OUT)) fs.unlinkSync(OUT);
}

console.log(`\n${ok}/${ok} EVIDENCE LAYER -testiä läpi`);
