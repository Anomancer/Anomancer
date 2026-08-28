import assert from 'node:assert/strict';
process.env.ANOMANCER_ARCHIVE_STORE='memory';
process.env.ANOMANCER_WORKSPACE_STORE='memory';
process.env.ADMIN_SESSION_SECRET='k'.repeat(64);
const archive=await import('../server/archive-store.js');
const curator=await import('../server/archive-curator.js');
const { signSession }=await import('../server/auth.js');
const { default: archiveHandler }=await import('../server/admin-routes/archive.js');
archive.__resetArchiveStoreForTests();
let passed=0;const ok=name=>{passed++;console.log(`✓ ${name}`)};
function resMock(){return{statusCode:200,headers:{},body:'',setHeader(k,v){this.headers[String(k).toLowerCase()]=v;},end(v=''){this.body+=v;}};}
function reqMock({method='GET',url='/api/admin/core?resource=archive&curator=1',headers={}}={}){return{method,url,headers};}

const contract=curator.archiveCuratorStatus();
assert.equal(contract.id,'archive-curator');assert.equal(contract.role,'archive-governance');assert.equal(contract.modelAccess,'none');assert.equal(contract.networkAccess,'none');assert.equal(contract.sideEffects,false);assert.equal(contract.suggestionsOnly,true);assert(contract.authority.deny.includes('archive.object.delete'));assert(contract.authority.deny.includes('archive.grant'));ok('Arkistonhoitaja is a deterministic suggestions-only governance agent');

const text='TEE parser architecture error model deterministic compiler test suite benchmark stable interface memory boundary context receipt';
const a=await archive.putArchiveObject({type:'artifact',title:'TEE Parser Benchmark A',workspaceId:'default',projectId:'tee-language',tags:['tee','parser'],content:{text},relations:[{targetId:'missing-spec-031',type:'derived-from'}]},{humanApproved:true});
const b=await archive.putArchiveObject({type:'artifact',title:'TEE Parser Benchmark B',workspaceId:'default',projectId:'tee-language',tags:['tee','benchmark'],content:{text}},{humanApproved:true});
const c=await archive.putArchiveObject({type:'report',title:'TEE Parser Benchmark C',workspaceId:'default',projectId:'tee-language',tags:['tee','benchmark'],content:{text:`${text} extended` }},{humanApproved:true});
const d=await archive.putArchiveObject({type:'note',title:'Irrallinen muistio',workspaceId:'default',content:{text:'Tämä objekti ei kuulu projektiin eikä sillä ole suhteita.'}},{humanApproved:true});
const e=await archive.putArchiveObject({type:'dataset',title:'Retention review dataset',workspaceId:'default',retention:{policy:'review',reviewAfter:'2025-01-01T00:00:00.000Z'},content:{json:{rows:12,mean:4.2}}},{humanApproved:true});
const before=await archive.loadArchiveState();
const report=await curator.runArchiveCurator({nowIso:'2026-08-28T00:00:00.000Z'});
const after=await archive.loadArchiveState();
assert.equal(after.revision,before.revision);assert.equal(after.objects.length,before.objects.length);assert.equal(report.mutationPerformed,false);assert(report.proposals.every(p=>p.mutationAllowed===false&&p.humanDecisionRequired===true));ok('governance scan performs no Archive mutation and proposals cannot self-apply');

assert.equal(report.index.objectCount,5);assert.equal(report.index.byWorkspace.default,5);assert.equal(report.index.byProject['tee-language'],3);assert(report.index.topTags.tee>=3);ok('Archive index groups objects by workspace, project, type and tags');
assert.equal(report.health.exactDuplicateGroups,1);assert(report.diagnostics.duplicateGroups.some(group=>group.includes(a.object.id)&&group.includes(b.object.id)));assert(report.health.nearDuplicatePairs>=1);ok('duplicate detector finds exact content hashes and deterministic near-duplicates');
assert.equal(report.health.missingRelationTargets,1);assert(report.proposals.some(p=>p.kind==='relation-missing-target'&&p.objectIds.includes(a.object.id)));assert(report.proposals.some(p=>p.kind==='relation'));ok('relation audit finds missing targets and project-link suggestions');
assert(report.health.retentionDue>=1);assert(report.proposals.some(p=>p.kind==='retention'&&p.objectIds.includes(e.object.id)));assert(report.health.orphanedObjects>=1);assert(report.proposals.some(p=>p.kind==='orphan'&&p.objectIds.includes(d.object.id)));ok('retention and orphan checks surface human-review work without acting on it');
assert.equal(report.health.integrityFailures.length,0);assert.match(report.integrity.reportHash,/^[a-f0-9]{64}$/);assert.equal(report.format,curator.ARCHIVE_GOVERNANCE_REPORT_FORMAT);ok('governance report preserves an integrity hash and does not invent integrity failures');

const workspaceReport=await curator.runArchiveCurator({workspaceId:'romancer-lab',nowIso:'2026-08-28T00:00:00.000Z'});assert.equal(workspaceReport.index.objectCount,0);assert.equal(workspaceReport.scope.mode,'workspace');assert.equal(workspaceReport.scope.workspaceId,'romancer-lab');ok('curator can scope a scan to one workspace instead of silently widening context');

let req=reqMock(),res=resMock();await archiveHandler(req,res);assert.equal(res.statusCode,401);const token=signSession(process.env.ADMIN_SESSION_SECRET,{nonce:'curator-api'});req=reqMock({headers:{cookie:`anomancer_admin=${encodeURIComponent(token)}`}});res=resMock();await archiveHandler(req,res);assert.equal(res.statusCode,200);const api=JSON.parse(res.body);assert.equal(api.ok,true);assert.equal(api.curator.id,'archive-curator');assert.equal(api.report.mutationPerformed,false);ok('private Archive API exposes read-only curator report only to authenticated admin');

const fs=await import('node:fs');const html=fs.readFileSync('admin.html','utf8'),route=fs.readFileSync('server/admin-routes/archive.js','utf8'),publicCore=fs.readFileSync('server/public-core.js','utf8');assert.match(html,/ARKISTONHALLINTA \/ ARKISTONHOITAJA/);assert.match(html,/VAIN EHDOTUKSIA/);assert.match(html,/Tallenna raportti Arkistoon/);assert.doesNotMatch(route,/apply-curator|curator-apply|action==='curator/i);assert.match(publicCore,/curator:'Arkistonhoitaja'/);assert.doesNotMatch(publicCore,/from '.\/archive-curator\.js'|runArchiveCurator|archiveCuratorStatus/);ok('UI exposes explicit human report persistence while public Core reveals only the curator role, never its private governance runtime');

console.log(`\nArkistonhoitaja 1.17.3: ${passed}/10 checks passed.`);
