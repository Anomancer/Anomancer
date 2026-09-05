import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {isSourceVerified,parseMarkdown,sourceVerificationIssues} from '../../server/content.js';

let ok=0;
const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`);};
const files=['fi','en'].flatMap(lang=>fs.readdirSync(path.join('content',lang)).filter(file=>file.endsWith('.md')).map(file=>path.join('content',lang,file)));
const posts=files.map(file=>parseMarkdown(fs.readFileSync(file,'utf8'),file)).filter(post=>!post.draft);
const numericClaim=/(?:\b\d+(?:[.,]\d+)?\s*%|\b\d+(?:[.,]\d+)?\s*(?:miljoona|miljardi|euro)|\b(?:19|20)\d{2}\b)/iu;

await test('verified vaatii täydellisen jäljitettävän varmennuskuitin',()=>{
  const issues=sourceVerificationIssues({verification:'verified',verificationMethod:'direct-open',verifiedBy:'',verifiedAt:'',verificationEvidence:'',verificationNotes:''});
  assert.ok(issues.length>=4);
});

await test('uusi ihmisen avausvahvistus voi ohittaa lähteen vanhan saatavuushuomion',()=>{
  const source={verification:'verified',verificationMethod:'direct-open',verifiedBy:'human:qa',verifiedAt:'2026-08-28T12:00:00.000Z',verificationEvidence:'https://example.com',verificationNotes:'Sisältö tarkistettu.',challenges:'Sivua ei saatu avattua 403-eston vuoksi.'};
  assert.equal(isSourceVerified(source),true);
  assert.deepEqual(sourceVerificationIssues(source),[]);
});

await test('dokumentoitu vaihtoehtoinen varmennus voi ratkaista suoran avauksen esteen',()=>{
  const source={verification:'verified',verificationMethod:'cached-copy',verifiedBy:'human:qa',verifiedAt:'2026-08-28T12:00:00.000Z',verificationEvidence:'sha256:0123456789abcdef',verificationNotes:'Arkistokopio ja julkaisijan metadata täsmäävät.',challenges:'Alkuperäinen sivu palautti 403-eston.'};
  assert.equal(isSourceVerified(source),true);
});

await test('koko julkaistu korpus ei sisällä perusteettomia verified-tiloja',()=>{
  for(const post of posts)for(const source of post.sources){
    assert.deepEqual(sourceVerificationIssues(source),[],`${post.path}: ${source.title}`);
    if(source.verification==='verified')assert.equal(isSourceVerified(source),true,`${post.path}: ${source.title}`);
  }
});

await test('jokainen julkaistu lähde on sidottu rakenteiseen väitteeseen',()=>{
  for(const post of posts){
    const evidence=new Set(post.claims.flatMap(claim=>claim.evidence));
    for(const source of post.sources)assert.ok(evidence.has(source.url),`${post.path}: lähde ilman claim-sidosta: ${source.url}`);
  }
});

await test('jokainen ulkoinen inline-viite löytyy lähderekisteristä',()=>{
  for(const post of posts){
    const registered=new Set(post.sources.map(source=>source.url));
    for(const match of post.body.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g))assert.ok(registered.has(match[1]),`${post.path}: rekisteröimätön viite ${match[1]}`);
  }
});

await test('numeerisia empiirisiä väitteitä sisältävillä julkaisuilla on claim–source-sidos',()=>{
  for(const post of posts.filter(item=>numericClaim.test(item.body))){
    assert.ok(post.sources.length,`${post.path}: numeerinen väite ilman lähdettä`);
    assert.ok(post.claims.some(claim=>claim.evidence.length),`${post.path}: numeerinen väite ilman rakenteista sidosta`);
  }
});

await test('julkinen projektio erottaa lähde-ehdokkaat varmennetusta evidenssistä',()=>{
  const manifest=JSON.parse(fs.readFileSync('public/evidence-manifest.json','utf8'));
  assert.equal(manifest.version,'anomancer.evidence/v2');
  assert.ok(manifest.articles.some(article=>article.sources.some(source=>source.verification==='candidate')));
  assert.equal(manifest.articles.flatMap(article=>article.sources).some(source=>source.verification==='verified'&&!isSourceVerified(source)),false);
});

const sourceCount=posts.reduce((sum,post)=>sum+post.sources.length,0);
const claimCount=posts.reduce((sum,post)=>sum+post.claims.length,0);
console.log(`\n${ok}/${ok} EVIDENSSIN TOTUUSRAJA · ${posts.length} julkaisua · ${sourceCount} lähdettä · ${claimCount} väitettä`);
