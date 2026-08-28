import assert from 'node:assert/strict';
process.env.ANOMANCER_ARCHIVE_STORE='memory';
process.env.ANOMANCER_WORKSPACE_STORE='memory';
const archive=await import('../../server/archive-store.js');
const { signSession, verifySession, csrfForSession }=await import('../../server/auth.js');
const { default: archiveHandler }=await import('../../server/admin-routes/archive.js');
archive.__resetArchiveStoreForTests();
let passed=0;
const ok=(name)=>{passed++;console.log(`✓ ${name}`);};
function resMock(){return{statusCode:200,headers:{},body:'',setHeader(k,v){this.headers[String(k).toLowerCase()]=v;},end(v=''){this.body+=v;}};}
function reqMock({method='GET',url='/api/admin/core?resource=archive',headers={},body=undefined}={}){return{method,url,headers,...(body!==undefined?{body}:{})};}


const status=archive.archiveStoreStatus();
assert.equal(status.configured,true);assert.equal(status.durable,false);assert.equal(status.automaticModelMemory,false);assert.equal(status.requiresContextGrant,true);ok('Archive Store is server-authoritative and not automatic model memory');

await assert.rejects(()=>archive.putArchiveObject({title:'Ei saa tallentua',workspaceId:'default'}),error=>error.code==='ARCHIVE_HUMAN_APPROVAL_REQUIRED');ok('archive write requires explicit human approval');

const a=await archive.putArchiveObject({type:'decision',title:'TEE parser decision',summary:'Parseri käyttää eksplisiittistä virhemallia.',workspaceId:'default',projectId:'tee-language',tags:['tee','parser'],provenance:{createdBy:'human',sourceRunId:'run-001',agentId:'critic',model:'test-model'},relations:[{targetId:'spec-v031',type:'derived-from'}],content:{text:'Decision body'}},{humanApproved:true});
assert.equal(a.object.format,archive.ARCHIVE_OBJECT_FORMAT);assert.equal(a.object.workspaceId,'default');assert.equal(a.object.provenance.sourceRunId,'run-001');assert.equal(a.object.integrity.algorithm,'sha256');assert.equal(a.object.integrity.objectHash.length,64);assert.equal(archive.verifyArchiveObjectIntegrity(a.object),true);ok('Archive Object preserves provenance, relations and integrity');

const b=await archive.putArchiveObject({type:'artifact',title:'Romancer private canon',workspaceId:'romancer-lab',projectId:'novel',content:{text:'private canon data'}},{humanApproved:true});
assert.equal(b.object.visibility.scope,'workspace');assert.deepEqual(b.object.visibility.workspaceIds,['romancer-lab']);ok('objects default to owner-workspace visibility');

const ownerContext=await archive.queryArchiveContext({workspaceId:'romancer-lab',objectIds:[b.object.id]});
assert.equal(ownerContext.objects.length,1);assert.equal(ownerContext.objects[0].id,b.object.id);ok('owner workspace can query its Archive context');

const denied=await archive.queryArchiveContext({workspaceId:'default',objectIds:[b.object.id]});
assert.equal(denied.objects.length,0);assert.equal(denied.notAccessed[0].reason,'not-granted');ok('cross-workspace context is denied without grant');

await assert.rejects(()=>archive.grantArchiveAccess(b.object.id,['default']),error=>error.code==='ARCHIVE_GRANT_APPROVAL_REQUIRED');ok('cross-workspace grant requires human approval');
const grant=await archive.grantArchiveAccess(b.object.id,['default'],{humanApproved:true});assert.equal(grant.object.visibility.scope,'granted');assert(grant.object.visibility.workspaceIds.includes('default'));ok('explicit grant expands read boundary without changing owner');

const allowed=await archive.queryArchiveContext({workspaceId:'default',objectIds:[a.object.id,b.object.id,'missing-object']});
assert.equal(allowed.objects.length,2);assert.equal(allowed.notAccessed.length,1);assert.equal(allowed.notAccessed[0].reason,'not-found');ok('context query returns only granted/owned objects and records misses');

const receiptResult=await archive.createContextReceipt({workspaceId:'default',runId:'orchestra-run-42',purpose:'Compare parser decision with granted canon',objectIds:[a.object.id,b.object.id,'missing-object']});
assert.equal(receiptResult.receipt.format,archive.CONTEXT_RECEIPT_FORMAT);assert.equal(receiptResult.receipt.used.length,2);assert.equal(receiptResult.receipt.notAccessed.length,1);assert.equal(receiptResult.receipt.integrity.receiptHash.length,64);ok('Context Receipt records used and not-accessed memory');

const search=await archive.searchArchive({q:'parser',humanView:true});assert.equal(search.total,1);assert.equal(search.objects[0].id,a.object.id);assert.equal(search.receipts.length,1);ok('human Archive search spans managed objects and receipts');

process.env.ADMIN_SESSION_SECRET='a'.repeat(64);
let req=reqMock(),res=resMock();await archiveHandler(req,res);assert.equal(res.statusCode,401);ok('Archive API is private by default');
const token=signSession(process.env.ADMIN_SESSION_SECRET,{nonce:'archive-api'}),session=verifySession(process.env.ADMIN_SESSION_SECRET,token),csrf=csrfForSession(process.env.ADMIN_SESSION_SECRET,session);req=reqMock({method:'POST',headers:{cookie:`anomancer_admin=${encodeURIComponent(token)}`,origin:'https://anomancer.com',host:'anomancer.com','x-forwarded-proto':'https','x-csrf-token':csrf},body:{action:'put',humanApproved:true,object:{type:'note',title:'API archive note',workspaceId:'default',content:{text:'server route'}}}});res=resMock();await archiveHandler(req,res);assert.equal(res.statusCode,200);const apiBody=JSON.parse(res.body);assert.equal(apiBody.ok,true);assert.equal(apiBody.object.title,'API archive note');ok('Archive API requires admin session + CSRF for mutation');

const beforeDelete=await archive.loadArchiveState();await assert.rejects(()=>archive.removeArchiveObject(a.object.id),error=>error.code==='ARCHIVE_DELETE_APPROVAL_REQUIRED');const deleted=await archive.removeArchiveObject(a.object.id,{humanApproved:true,expectedRevision:beforeDelete.revision});assert.equal(deleted.tombstone.objectId,a.object.id);assert.equal(deleted.tombstone.objectHash,a.object.integrity.objectHash);const afterDelete=await archive.loadArchiveState();assert(!afterDelete.objects.some(x=>x.id===a.object.id));assert(afterDelete.tombstones.some(x=>x.objectId===a.object.id));ok('deletion requires authority and leaves an integrity tombstone');

console.log(`\nArchive Core 1.17.1: ${passed}/14 checks passed.`);
