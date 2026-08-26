import assert from 'node:assert/strict';
import { validateAgentResult } from '../api/_lib/agent-validation.js';

let ok=0;
const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`);};
const verified={title:'Verified',url:'https://example.com/verified',publisher:'Example',date:'2026',origin:'human',verification:'verified'};
const candidate={title:'Candidate',url:'https://example.com/candidate',publisher:'Example',date:'2026',origin:'source-agent',verification:'candidate'};
const post={lang:'fi',title:'Testi',category:'info-media',audience:['all'],sources:[verified,candidate],claims:[],body:'Teksti'};

test('source-agentin URL säilyy aina ehdokkaana provenance-tietoineen',()=>{
  const result=validateAgentResult('source',{summary:'ok',candidateSources:[{title:'A',url:'https://example.org/a',why:'w',supports:'s',challenges:'c'}]},post);
  assert.equal(result.candidateSources[0].origin,'source-agent');
  assert.equal(result.candidateSources[0].verification,'candidate');
  assert.ok(result.candidateSources[0].retrievedAt);
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
test('julkaisupaketti ei voi keksiä lähdettä tai taksonomiaa',()=>{
  const result=validateAgentResult('package',{category:'made-up',audience:['wizard'],sources:[verified,{title:'Fake',url:'https://fake.example/x'}],claims:[]},post);
  assert.equal(result.category,post.category);
  assert.deepEqual(result.audience,post.audience);
  assert.deepEqual(result.sources,[verified]);
});

console.log(`\n${ok}/${ok} AGENT CONTRACT -testiä läpi`);
