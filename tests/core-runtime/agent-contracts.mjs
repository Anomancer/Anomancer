import assert from 'node:assert/strict';
import { validateAgentResult } from '../../server/agent-validation.js';
import { promptFor } from '../../server/agent-prompts.js';

let ok=0;
const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`);};
const verified={title:'Verified',url:'https://example.com/verified',publisher:'Example',date:'2026',origin:'human',verification:'verified',verifiedBy:'human:test',verifiedAt:'2026-08-27T12:00:00.000Z',verificationMethod:'direct-open',verificationEvidence:'https://example.com/verified',verificationNotes:'Lähde avattiin ja tarkistettiin testissä.'};
const candidate={title:'Candidate',url:'https://example.com/candidate',publisher:'Example',date:'2026',origin:'source-agent',verification:'candidate'};
const post={lang:'fi',title:'Testi',category:'info-media',audience:['all'],audienceDepth:'general',sources:[verified,candidate],claims:[],body:'Teksti'};

test('source-agentin URL säilyy aina ehdokkaana provenance-tietoineen',()=>{
  const result=validateAgentResult('source',{summary:'ok',candidateSources:[{title:'A',url:'https://example.org/a',why:'w',supports:'s',challenges:'c'}]},post);
  assert.equal(result.candidateSources[0].origin,'source-agent');
  assert.equal(result.candidateSources[0].verification,'candidate');
  assert.ok(result.candidateSources[0].retrievedAt);
  assert.match(result.candidateSources[0].id,/^src-[a-z0-9]+$/);
});
test('candidate-lähde ei voi tehdä agenttiväitteestä tuettua',()=>{
  const result=validateAgentResult('claims',{claims:[{status:'supported',text:'Väite',evidence:[candidate.url],note:''}]},post);
  assert.equal(result.claims[0].status,'open');
  assert.match(result.claims[0].note,/ihmisen tarkistusta/);
});
test('verified-lähde sallii tuetun väitteen',()=>{
  const result=validateAgentResult('claims',{claims:[{status:'supported',text:'Väite',evidence:[verified.url],note:''}]},post);
  assert.equal(result.claims[0].status,'supported');
});
test('candidate voidaan kytkeä avoimeen väitteeseen provisionaaliseksi jäljeksi',()=>{
  const result=validateAgentResult('claims',{claims:[{status:'open',text:'Avoin väite',evidence:[candidate.url],note:'tarkista'}]},post);
  assert.equal(result.claims[0].status,'open');
  assert.deepEqual(result.claims[0].evidence,[candidate.url]);
});
test('julkaisupaketti ei saa kirjoittaa Evidence Layeria uusiksi tai pudottaa lähteitä',()=>{
  const sourcePost={...post,claims:[{status:'open',text:'Nykyinen väite',evidence:[candidate.url],note:'provisionaalinen'}]};
  const result=validateAgentResult('package',{title:'Uusi otsikko',sources:[],claims:[{status:'supported',text:'Keksitty väite',evidence:[verified.url]}]},sourcePost);
  assert.equal(result.title,'Uusi otsikko');
  assert.deepEqual(result.sources,sourcePost.sources);
  assert.deepEqual(result.claims,sourcePost.claims);
});
test('julkaisupaketti ei voi keksiä lähdettä tai taksonomiaa',()=>{
  const result=validateAgentResult('package',{category:'made-up',audience:['wizard'],sources:[verified,{title:'Fake',url:'https://fake.example/x'}],claims:[]},post);
  assert.equal(result.category,post.category);
  assert.deepEqual(result.audience,post.audience);
  assert.deepEqual(result.sources,post.sources);
});


await test('yleisöadapteri säilyttää epistemisen ytimen promptissa',()=>{const p={...post,audience:['investor'],audienceDepth:'professional'};const x=promptFor('audience',p);assert.match(x.system,/AUDIENCE ADAPTER/);assert.match(x.system,/investor/);assert.match(x.system,/professional/);assert.match(x.system,/must not strengthen certainty/);assert.match(x.user,/Do not return claims or sources/);});
await test('paketoija ei saa vaihtaa ihmisen valitsemaa audience-intentiota',()=>{const p={...post,audience:['teacher'],audienceDepth:'plain'};const x=promptFor('package',p);assert.match(x.system,/locked editorial intent/);assert.match(x.user,/Do not return rewritten claims, sources, audience or audienceDepth/);});
console.log(`\n${ok}/${ok} AGENT CONTRACT -testiä läpi`);
