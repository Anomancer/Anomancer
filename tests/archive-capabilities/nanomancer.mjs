import assert from 'node:assert/strict';
process.env.ANOMANCER_ARCHIVE_STORE='memory';
process.env.ANOMANCER_RUN_STORE='memory';
process.env.ANOMANCER_WORKSPACE_STORE='memory';
process.env.ADMIN_SESSION_SECRET='n'.repeat(64);

const { listCapabilityPlugins, getCapabilityPlugin, validateCapabilityInvocation }=await import('../../server/capability-registry.js');
const { runNanomancer, NANOMANCER_ANALYSIS_FORMAT }=await import('../../server/nanomancer.js');
const archive=await import('../../server/archive-store.js');
const runs=await import('../../server/run-store.js');
const { signSession, verifySession, csrfForSession }=await import('../../server/auth.js');
const { default: capabilitiesHandler }=await import('../../server/admin-routes/capabilities.js');
archive.__resetArchiveStoreForTests();runs.__resetRunStoreForTests();
let passed=0;const ok=name=>{passed++;console.log(`✓ ${name}`)};
function resMock(){return{statusCode:200,headers:{},body:'',setHeader(k,v){this.headers[String(k).toLowerCase()]=v;},end(v=''){this.body+=v;}};}
function reqMock({method='GET',headers={},body=undefined,url='/api/admin/core?resource=capabilities'}={}){return{method,headers,url,...(body!==undefined?{body}:{})};}

const registry=listCapabilityPlugins(),plugin=getCapabilityPlugin('nanomancer');
assert.equal(registry.length,1);assert.equal(plugin.id,'nanomancer');assert.equal(plugin.type,'analysis-capability');assert.equal(plugin.sideEffects,false);assert.equal(plugin.deterministic,true);assert.equal(plugin.permissions.modelAccess,'none');assert.equal(plugin.permissions.workspaceWrite,'none');assert.equal(plugin.permissions.archiveWrite,'none');assert.deepEqual(plugin.supportedWorkspaces,['*']);assert.match(plugin.pluginHash,/^[a-f0-9]{64}$/);ok('Capability Registry exposes Nanomancer as deterministic read-only plugin');

assert.equal(validateCapabilityInvocation({pluginId:'nanomancer',operation:'compare',inputCount:2}).ok,true);assert.equal(validateCapabilityInvocation({pluginId:'nanomancer',operation:'explode',inputCount:2}).ok,false);assert.equal(validateCapabilityInvocation({pluginId:'nanomancer',operation:'compare',inputCount:1}).ok,false);ok('plugin contract fails closed on unknown operations and too few inputs');

const a={score:10,nested:{name:'alpha',items:[1,2]},stable:true},b={score:15,nested:{name:'beta',items:[1,3]},stable:true,extra:'x'};
const first=await runNanomancer({operation:'diff',workspaceId:'default',inputs:[{kind:'inline',id:'a',value:a},{kind:'inline',id:'b',value:b}]});
const second=await runNanomancer({operation:'diff',workspaceId:'default',inputs:[{kind:'inline',id:'a',value:a},{kind:'inline',id:'b',value:b}]});
assert.equal(first.format,NANOMANCER_ANALYSIS_FORMAT);assert.equal(first.plugin.modelUsed,false);assert.equal(first.plugin.sideEffects,false);assert(first.summary.changedPaths>=2);assert(first.summary.addedPaths>=1);assert.equal(first.integrity.analysisHash,second.integrity.analysisHash);assert.equal(first.id,second.id);ok('diff is deterministic and produces a structured analysis artifact without a model');

const dev=await runNanomancer({operation:'deviation',workspaceId:'default',inputs:[{kind:'inline',value:{x:100,label:'a'}},{kind:'inline',value:{x:125,label:'b'}}]});assert.equal(dev.summary.numericChanges,1);assert(dev.comparisons[0].changes.every(x=>x.numeric));assert.equal(dev.comparisons[0].changes[0].numeric.percent,25);ok('deviation mode returns numeric deltas instead of prose guesses');

const consistent=await runNanomancer({operation:'consistency',workspaceId:'default',inputs:[{kind:'inline',value:{a:1,b:2}},{kind:'inline',value:{a:1,b:2}}]});assert.equal(consistent.findings[0].code,'CONSISTENT');const inconsistent=await runNanomancer({operation:'consistency',workspaceId:'default',inputs:[{kind:'inline',value:{a:1}},{kind:'inline',value:{a:2}}]});assert.equal(inconsistent.findings[0].code,'CONSISTENCY_CONFLICT');ok('consistency mode distinguishes agreement from structural conflict');

const own=await archive.putArchiveObject({type:'dataset',title:'Default dataset',workspaceId:'default',content:{json:{rows:10,mean:4.2}}},{humanApproved:true});
const privateObj=await archive.putArchiveObject({type:'dataset',title:'Romancer private',workspaceId:'romancer-lab',content:{json:{rows:12,mean:4.6}}},{humanApproved:true});
const beforeObjects=(await archive.loadArchiveState()).objects.length;
await assert.rejects(()=>runNanomancer({operation:'compare',workspaceId:'default',inputs:[{kind:'archive',id:own.object.id},{kind:'archive',id:privateObj.object.id}]}),e=>e.code==='NANOMANCER_ARCHIVE_CONTEXT_DENIED');
const afterDenied=await archive.loadArchiveState();assert.equal(afterDenied.objects.length,beforeObjects);assert(afterDenied.receipts.length>=1);ok('Archive input respects Context Grant and denied analysis cannot mutate Archive objects');

await archive.grantArchiveAccess(privateObj.object.id,['default'],{humanApproved:true});
const archivedCompare=await runNanomancer({operation:'compare',workspaceId:'default',inputs:[{kind:'archive',id:own.object.id},{kind:'archive',id:privateObj.object.id}]});assert.equal(archivedCompare.inputs[0].kind,'archive-object');assert.equal(archivedCompare.inputs[1].kind,'archive-object');assert.match(archivedCompare.contextReceiptId,/^ctx-/);const stateAfter=await archive.loadArchiveState();assert(stateAfter.receipts.some(r=>r.id===archivedCompare.contextReceiptId));ok('granted Archive comparison creates a Context Receipt with no automatic result persistence');

const receiptBase={format:'anomancer-run-receipt/v1',workspaceId:'default',agent:{id:'writer'},model:{provider:'deepseek',id:'model-a'},routing:{fallbackUsed:false},runtime:{},tools:[],toolPolicy:[],status:'completed',inputHash:'a'.repeat(64),outputHash:'b'.repeat(64),startedAt:'2026-08-28T00:00:00.000Z',finishedAt:'2026-08-28T00:00:01.000Z',durationMs:1000,humanApprovalRequired:true};
await runs.appendRunReceipt({...receiptBase,id:'r1-a',orchestraRunId:'run-a',usage:{inputTokens:100,outputTokens:50,totalTokens:150,reasoningTokens:0,costEuro:0.01},orchestra:{id:'editorial',name:'Editorial'}});await runs.finalizeRun('run-a',{status:'completed',orchestra:{id:'editorial',name:'Editorial'},finishedAt:'2026-08-28T00:00:01.000Z'},'default');
await runs.appendRunReceipt({...receiptBase,id:'r2-a',orchestraRunId:'run-b',outputHash:'c'.repeat(64),usage:{inputTokens:140,outputTokens:80,totalTokens:220,reasoningTokens:0,costEuro:0.02},orchestra:{id:'editorial',name:'Editorial'}});await runs.finalizeRun('run-b',{status:'completed',orchestra:{id:'editorial',name:'Editorial'},finishedAt:'2026-08-28T00:02:01.000Z'},'default');
const cross=await runNanomancer({operation:'cross-run',workspaceId:'default',inputs:[{kind:'run',id:'run-a'},{kind:'run',id:'run-b'}]});assert.equal(cross.inputs.every(x=>x.kind==='run-record'),true);assert(cross.findings.some(x=>x.code==='CROSS_RUN_DELTA'));assert(cross.findings.find(x=>x.code==='CROSS_RUN_DELTA').message.includes('+70'));ok('cross-run compares safe run receipts from the same workspace');

await assert.rejects(()=>runNanomancer({operation:'cross-run',workspaceId:'default',inputs:[{kind:'run',id:'run-a'},{kind:'inline',value:{}}]}),e=>e.code==='NANOMANCER_CROSS_RUN_INPUT');ok('cross-run rejects non-run input rather than silently coercing it');

let req=reqMock(),res=resMock();await capabilitiesHandler(req,res);assert.equal(res.statusCode,401);ok('Capability API is private by default');
const token=signSession(process.env.ADMIN_SESSION_SECRET,{nonce:'nano-api'}),session=verifySession(process.env.ADMIN_SESSION_SECRET,token),csrf=csrfForSession(process.env.ADMIN_SESSION_SECRET,session);
req=reqMock({method:'POST',headers:{cookie:`anomancer_admin=${encodeURIComponent(token)}`,origin:'https://anomancer.com',host:'anomancer.com','x-forwarded-proto':'https','x-csrf-token':csrf,'x-anomancer-workspace':'default'},body:{pluginId:'nanomancer',operation:'compare',inputs:[{kind:'inline',value:{x:1}},{kind:'inline',value:{x:2}}]}});res=resMock();await capabilitiesHandler(req,res);assert.equal(res.statusCode,200);const api=JSON.parse(res.body);assert.equal(api.ok,true);assert.equal(api.analysis.plugin.id,'nanomancer');assert.equal(api.humanApprovalRequiredForPersistence,true);ok('Capability API requires admin + CSRF and returns structured read-only result');

const fsm=await import('node:fs');const html=fsm.readFileSync('admin.html','utf8'),build=fsm.readFileSync('scripts/build-blog.mjs','utf8');assert.match(html,/KYVYKKYYSPLUGIN \/ NANOMANCER/);assert.match(html,/admin-nanomancer\.js/);assert.match(build,/admin-nanomancer\.js/);assert.match(build,/admin-nanomancer\.css/);ok('Nanomancer Workbench and production build assets are wired into the private Core');
const publicCoreSource=fsm.readFileSync('server/public-core.js','utf8');
assert.match(publicCoreSource,/listCapabilityPlugins/);
assert.match(publicCoreSource,/capabilityRegistry/);
assert.doesNotMatch(publicCoreSource,/permissions\s*:/);
assert.doesNotMatch(publicCoreSource,/operations\s*:/);
assert.doesNotMatch(publicCoreSource,/handler\s*:/);
assert.doesNotMatch(publicCoreSource,/execute\s*:/);
ok('public Core exposes only allowlisted Capability metadata, not private execution contracts');

console.log(`\nNanomancer 1.17.2: ${passed}/13 checks passed.`);
