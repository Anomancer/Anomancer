import assert from 'node:assert/strict';
import { buildEvidenceGraph, classifyClaimVerification, stableClaimId } from '../../server/evidence-graph.js';

const source={id:'s1',title:'Verified study',url:'https://example.com/study',publisher:'Example',verification:'verified',verifiedBy:'human:test',verifiedAt:'2026-09-05T18:00:00.000Z',verificationMethod:'direct-open',verificationEvidence:'https://example.com/study',verificationNotes:'Checked directly.'};
const candidate={id:'s2',title:'Candidate',url:'https://example.com/candidate',publisher:'Example',verification:'candidate'};
const base={sources:[source,candidate],claims:[
  {status:'supported',text:'27 percenttia.',evidence:[source.url],note:'',contradictions:[]},
  {status:'supported',text:'18 percenttia.',evidence:[candidate.url],note:'',contradictions:['Claim X']},
  {status:'open',text:'Avoin kysymys.',evidence:[],note:'',contradictions:[]},
]};

assert.match(stableClaimId('27 percenttia.'),/^claim-/);
assert.equal(classifyClaimVerification(base.claims[0],base.sources),'verified');
assert.equal(classifyClaimVerification(base.claims[1],base.sources),'partial');
assert.equal(classifyClaimVerification(base.claims[2],base.sources),'unverified');

const graph=buildEvidenceGraph(base);
assert.equal(graph.version,'anomancer.evidence-graph/v1');
assert.equal(graph.counts.claims,3);
assert.equal(graph.counts.sources,2);
assert.equal(graph.counts.verifiedClaims,1);
assert.equal(graph.counts.partialClaims,1);
assert.equal(graph.counts.unverifiedClaims,1);
assert.equal(graph.relations.length,2);
assert.equal(graph.claims[1].contradictions.length,1);
assert.equal(graph.publicationReady,false);

const ready=buildEvidenceGraph({sources:[source],claims:[{status:'supported',text:'Verified.',evidence:[source.url],note:''}]});
assert.equal(ready.publicationReady,true);
console.log('Evidence / Claim Graph: 10/10 testiä läpi');
