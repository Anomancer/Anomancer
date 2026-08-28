import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';

process.env.ANOMANCER_WORKSPACE_STORE='memory';
process.env.ANOMANCER_MANCER_ARTIFACT_STORE='memory';
process.env.ANOMANCER_OPERATION_STORE='memory';
process.env.GITHUB_CONTENT_TOKEN='p3-test-token';
process.env.GITHUB_REPO='example/anomancer';
process.env.GITHUB_BRANCH='master';
process.env.ADMIN_SESSION_SECRET='p'.repeat(64);

const BASE='a'.repeat(40),BASE_TREE='b'.repeat(40),BLOB='c'.repeat(40),NEW_TREE='d'.repeat(40),COMMIT='e'.repeat(40),MERGE='f'.repeat(40);
const requests=[],dispatched=[];let pullCreated=false;
function response(data,status=200){return new Response(status===204?null:JSON.stringify(data),{status,headers:status===204?{}:{'content-type':'application/json'}});}
globalThis.fetch=async(input,options={})=>{
  const url=new URL(String(input)),method=String(options.method||'GET').toUpperCase(),body=options.body?JSON.parse(options.body):null;
  requests.push({url:url.pathname+url.search,method,body});
  if(method==='GET'&&url.pathname.endsWith('/git/ref/heads/master'))return response({object:{sha:BASE}});
  if(method==='GET'&&url.pathname.includes('/git/ref/heads/anomancer%2Fop-'))return response({object:{sha:COMMIT}});
  if(method==='GET'&&url.pathname.endsWith(`/git/commits/${BASE}`))return response({tree:{sha:BASE_TREE}});
  if(method==='POST'&&url.pathname.endsWith('/git/blobs'))return response({sha:BLOB},201);
  if(method==='POST'&&url.pathname.endsWith('/git/trees'))return response({sha:NEW_TREE},201);
  if(method==='POST'&&url.pathname.endsWith('/git/commits'))return response({sha:COMMIT},201);
  if(method==='POST'&&url.pathname.endsWith('/git/refs'))return response({},201);
  if(method==='DELETE'&&url.pathname.includes('/git/refs/heads/anomancer%2Fop-'))return response(null,204);
  if(method==='GET'&&url.pathname.endsWith('/pulls')&&url.searchParams.get('state')==='all')return response(pullCreated?[{number:7,state:'closed',merged:true,merged_at:'2026-08-28T05:00:00.000Z',mergeable:true,merge_commit_sha:MERGE,head:{sha:COMMIT},base:{sha:BASE},html_url:'https://github.com/example/anomancer/pull/7'}]:[]);
  if(method==='POST'&&url.pathname.endsWith('/pulls')){pullCreated=true;return response({number:7,state:'open',merged:false,html_url:'https://github.com/example/anomancer/pull/7'},201);}
  if(method==='GET'&&url.pathname.endsWith('/pulls/7'))return response({number:7,state:'closed',merged:true,mergeable:true,merge_commit_sha:MERGE,merged_at:'2026-08-28T05:00:00.000Z',head:{sha:COMMIT},base:{sha:BASE},html_url:'https://github.com/example/anomancer/pull/7'});
  if(method==='POST'&&url.pathname.includes('/actions/workflows/')&&url.pathname.endsWith('/dispatches')){dispatched.push(body.inputs);return response(null,204);}
  if(method==='GET'&&url.pathname.includes('/actions/workflows/')&&url.pathname.endsWith('/runs')&&url.searchParams.get('event')==='workflow_dispatch')return response({workflow_runs:dispatched.map((item,index)=>({id:index+1,display_title:`Anomancer ${item.operation_id}`,status:'completed',conclusion:'success',head_sha:item.mode==='production'?MERGE:COMMIT,created_at:'2026-08-28T05:00:00.000Z',updated_at:'2026-08-28T05:01:00.000Z',html_url:`https://github.com/example/anomancer/actions/runs/${index+1}`}))});
  throw new Error(`Unexpected GitHub mock request: ${method} ${url.pathname}${url.search}`);
};

const {upsertWorkspace,__resetWorkspaceStoreForTests}=await import('../server/workspace-store.js');
const {saveMancerArtifact,__resetMancerArtifactStoreForTests}=await import('../server/mancer-artifact-store.js');
const {__resetOperationStoreForTests,updateOperation}=await import('../server/operation-store.js');
const {listOperationCapabilities,operationRuntimeStatus,planCapabilityOperation,decideCapabilityOperation,executeCapabilityOperation,refreshCapabilityOperation}=await import('../server/operation-capabilities.js');
const {signSession,verifySession,csrfForSession}=await import('../server/auth.js');
const {default:operationsHandler}=await import('../server/admin-routes/operations.js');

__resetWorkspaceStoreForTests();__resetMancerArtifactStoreForTests();__resetOperationStoreForTests();
const {workspace}=await upsertWorkspace({name:'P3 Capability Test',templateId:'codemancer/development-workbench/1.0.0'}),session={nonce:'p3-human-session'};
const baseArtifact={project:{name:'Capability gate'},code:[{path:'src/p3.js',language:'javascript',content:'export const capabilityGate = true;\n',notes:'P3 bounded operation'}],review:{decision:'approved'},release:{version:'1.18.4',check:'passing',humanApproval:'approved',notes:'P3 test'},architecture:[],tasks:[],tests:[],runs:[],documentation:[]};
await saveMancerArtifact(baseArtifact,{workspace});

let passed=0;
async function test(name,fn){await fn();passed++;console.log(`✓ ${name}`);}
async function approve(operation){return decideCapabilityOperation({operationId:operation.id,decision:'approve',confirmation:operation.confirmationPhrase,expectedRevision:operation.revision,workspace,session});}
function resMock(){return{statusCode:200,headers:{},body:'',setHeader(key,value){this.headers[String(key).toLowerCase()]=value;},end(value=''){this.body+=value;}};}
function reqMock({method='GET',body,headers={},url='/api/admin/core?resource=operations'}={}){const req=new EventEmitter();req.method=method;req.headers=headers;req.url=url;if(body!==undefined)req.body=body;return req;}

await test('capability registry on suljettu eikä tarjoa komentomerkkijonoa',async()=>{
  const capabilities=listOperationCapabilities(),runtime=operationRuntimeStatus(workspace.id);
  assert.deepEqual(capabilities.map(item=>item.id),['repository.write','tests.run','git.pull-request','deploy.preview','deploy.production','repository.rollback','deploy.rollback']);
  assert.ok(capabilities.every(item=>item.approval==='human-written-confirmation'));
  assert.equal(runtime.workflow.arbitraryCommandInput,false);
  assert.equal(runtime.workflow.directShell,false);
  assert.equal(runtime.repository.directDefaultBranchWrite,false);
});

await test('operations HTTP -reitti vaatii admin-istunnon ja mutaatioissa same-origin CSRF:n',async()=>{
  let req=reqMock(),res=resMock();await operationsHandler(req,res);assert.equal(res.statusCode,401);
  const token=signSession(process.env.ADMIN_SESSION_SECRET,{nonce:'p3-api'}),verified=verifySession(process.env.ADMIN_SESSION_SECRET,token),csrf=csrfForSession(process.env.ADMIN_SESSION_SECRET,verified),base={cookie:`anomancer_admin=${encodeURIComponent(token)}`,'x-anomancer-workspace':workspace.id,origin:'https://anomancer.test',host:'anomancer.test','x-forwarded-proto':'https'};
  req=reqMock({headers:base});res=resMock();await operationsHandler(req,res);assert.equal(res.statusCode,200);assert.equal(JSON.parse(res.body).workspace.id,workspace.id);
  req=reqMock({method:'POST',headers:base,body:{action:'unknown'}});res=resMock();await operationsHandler(req,res);assert.equal(res.statusCode,403);
  req=reqMock({method:'POST',headers:{...base,'x-csrf-token':csrf},body:{action:'unknown'}});res=resMock();await operationsHandler(req,res);assert.equal(res.statusCode,400);assert.equal(JSON.parse(res.body).error,'OPERATION_ACTION_UNKNOWN');
});

let repositoryOperation;
await test('repository-write vaatii täsmällisen vahvistuksen ja luo vain operation-haaran',async()=>{
  const plan=await planCapabilityOperation({kind:'repository.write',workspace,session});
  assert.equal(plan.status,'planned');assert.equal(plan.plan.fileCount,1);assert.match(plan.plan.branchName,/^anomancer\/op-/);assert.match(plan.plan.planHash,/^[a-f0-9]{64}$/);
  await assert.rejects(()=>decideCapabilityOperation({operationId:plan.id,decision:'approve',confirmation:'HYVÄKSYN VÄÄRÄN',expectedRevision:plan.revision,workspace,session}),error=>error.code==='OPERATION_CONFIRMATION_MISMATCH');
  const approved=await approve(plan);assert.equal(approved.status,'approved');assert.equal(approved.approval.planHash,approved.plan.planHash);
  repositoryOperation=await executeCapabilityOperation({operationId:approved.id,expectedRevision:approved.revision,workspace,session});
  assert.equal(repositoryOperation.status,'succeeded');assert.equal(repositoryOperation.execution.commitSha,COMMIT);assert.equal(repositoryOperation.execution.baseSha,BASE);
  const branchCreate=requests.find(item=>item.method==='POST'&&item.url.endsWith('/git/refs'));assert.equal(branchCreate.body.ref,`refs/heads/${repositoryOperation.plan.branchName}`);
  assert.equal(requests.some(item=>['PUT','PATCH'].includes(item.method)&&item.url.includes('/heads/master')),false);
  assert.ok(repositoryOperation.audit.length>=3);assert.equal(repositoryOperation.audit[1].previousHash,repositoryOperation.audit[0].auditHash);
});

let testsOperation;
await test('test runner avautuu vasta repository-operaatiosta ja käyttää rajattua workflow-dispatchia',async()=>{
  const plan=await planCapabilityOperation({kind:'tests.run',sourceOperationId:repositoryOperation.id,workspace,session}),approved=await approve(plan);
  testsOperation=await executeCapabilityOperation({operationId:approved.id,expectedRevision:approved.revision,workspace,session});
  assert.equal(testsOperation.status,'dispatched');assert.equal(dispatched.at(-1).mode,'tests');assert.equal(dispatched.at(-1).source_ref,repositoryOperation.execution.branch);
  testsOperation=await refreshCapabilityOperation({operationId:testsOperation.id,expectedRevision:testsOperation.revision,workspace,session});
  assert.equal(testsOperation.status,'passed');assert.match(testsOperation.execution.url,/github\.com/);
});

let pullRequestOperation;
await test('PR ei automergaa ja production avautuu vasta yhdistetyn PR:n sekä release-päätöksen jälkeen',async()=>{
  const prPlan=await planCapabilityOperation({kind:'git.pull-request',sourceOperationId:testsOperation.id,workspace,session}),prApproved=await approve(prPlan);
  pullRequestOperation=await executeCapabilityOperation({operationId:prApproved.id,expectedRevision:prApproved.revision,workspace,session});
  assert.equal(pullRequestOperation.status,'open');assert.equal(pullRequestOperation.execution.number,7);
  pullRequestOperation=await updateOperation(pullRequestOperation.id,item=>{item.status='executing';item.execution={startedAt:item.execution.startedAt};return item;},{workspaceId:workspace.id,expectedRevision:pullRequestOperation.revision});
  pullRequestOperation=await refreshCapabilityOperation({operationId:pullRequestOperation.id,expectedRevision:pullRequestOperation.revision,workspace,session});
  assert.equal(pullRequestOperation.status,'merged');assert.equal(pullRequestOperation.execution.mergeCommitSha,MERGE);
  const productionPlan=await planCapabilityOperation({kind:'deploy.production',sourceOperationId:pullRequestOperation.id,workspace,session}),productionApproved=await approve(productionPlan),production=await executeCapabilityOperation({operationId:productionApproved.id,expectedRevision:productionApproved.revision,workspace,session});
  assert.equal(production.status,'dispatched');assert.equal(dispatched.at(-1).mode,'production');assert.equal(dispatched.at(-1).source_ref,MERGE);
});

await test('deployment rollback on erillinen, eksplisiittiseen kohteeseen sidottu hyväksyntä',async()=>{
  const plan=await planCapabilityOperation({kind:'deploy.rollback',rollbackTarget:'https://anomancer-old.vercel.app',workspace,session});
  assert.match(plan.confirmationPhrase,/^PALAUTA /);const approved=await approve(plan),sent=await executeCapabilityOperation({operationId:approved.id,expectedRevision:approved.revision,workspace,session});
  assert.equal(sent.status,'dispatched');assert.equal(dispatched.at(-1).rollback_target,'https://anomancer-old.vercel.app');
  const refreshed=await refreshCapabilityOperation({operationId:sent.id,expectedRevision:sent.revision,workspace,session});assert.equal(refreshed.status,'rolled_back');
});

await test('polku- ja secret-guardit torjuvat vaarallisen artefaktin ennen GitHub-kirjoitusta',async()=>{
  await saveMancerArtifact({...baseArtifact,code:[{path:'.env.production',content:'TOKEN=not-even-sent'}]},{workspace});
  const before=requests.length;
  await assert.rejects(()=>planCapabilityOperation({kind:'repository.write',workspace,session}),error=>error.code==='OPERATION_PATH_DENIED');
  assert.equal(requests.length,before);
  await saveMancerArtifact({...baseArtifact,code:[{path:'src/config.js',content:`export const token = '${'ghp_'+ 'A'.repeat(24)}';`}]},{workspace});
  await assert.rejects(()=>planCapabilityOperation({kind:'repository.write',workspace,session}),error=>error.code==='OPERATION_SECRET_DETECTED');
});

console.log(`\n${passed}/${passed} P3 CAPABILITY WIRING 1.18.4 checks passed.`);
