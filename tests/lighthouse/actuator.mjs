import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MUTATION_PROPOSAL_FORMAT} from '../../core/mutation/proposal.js';
import {runIntent} from '../../core/intent/intent-service.js';
import {sealLighthouseMutation,executeLighthouseMutation} from '../../server/lighthouse-actuator.js';

const originalSecret=process.env.ADMIN_SESSION_SECRET;
process.env.ADMIN_SESSION_SECRET='lighthouse-actuator-test-secret-0123456789abcdef';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const client=fs.readFileSync('app/lighthouse/lab.js','utf8');
for(const id of ['mutationPanel','mutationFiles','mutationPhrase','mutationConfirmation','mutationExecute','mutationReceipt'])assert.match(html,new RegExp(`id=\"${id}\"`));
assert.match(client,/\/api\/lab\/mutation/);
assert.match(html,/Hyväksy ja luo operation-haara/);

const BASE='a'.repeat(40);
const SOURCE='b'.repeat(40);
const session={nonce:'actuator-session'};
const baseProposal={
  format:MUTATION_PROPOSAL_FORMAT,
  summary:'Korjaa rajattu Lighthouse-tiedosto.',
  risk:'medium',
  verification:['Aja Lighthouse-testit.'],
  files:[{path:'core/intent/contracts.js',content:'export const fixed=true;\n',rationale:'Korjaa testitapaus.'}]
};

let commitCalls=0;
const adapters={
  getRepositoryHead:async()=>({repo:'Anomancer/Anomancer',branch:'architecture/lighthouse-v1',sha:BASE}),
  getFile:async path=>({path,sha:SOURCE,content:'export const fixed=false;\n'}),
  findOperationBranch:async()=>null,
  createOperationCommit:async({branchName,baseSha,files,message})=>{
    commitCalls++;
    assert.match(branchName,/^anomancer\/op-lighthouse-/);
    assert.equal(baseSha,BASE);
    assert.equal(files.length,1);
    assert.match(message,/^lighthouse: approved mutation mut-[a-z0-9-]+ [a-f0-9]{12}$/);
    return {repo:'Anomancer/Anomancer',baseBranch:'architecture/lighthouse-v1',baseSha:BASE,defaultBranchShaBefore:BASE,defaultBranchShaAfter:BASE,defaultBranchUnchanged:true,branch:branchName,commitSha:'c'.repeat(40),treeSha:'d'.repeat(40),compareUrl:'https://github.com/example/compare',branchUrl:'https://github.com/example/tree'};
  }
};

try{
  const sealed=await sealLighthouseMutation(baseProposal,{session,adapters});
  assert.equal(commitCalls,0,'proposal sealing must not write');
  assert.equal(sealed.proposal.files.length,1);
  assert.match(sealed.proposal.files[0].diff,/--- a\/core\/intent\/contracts\.js/);
  assert.equal(sealed.proposal.files[0].sourceSha,SOURCE);
  assert.equal(sealed.approval.humanApprovalRequired,true);
  assert.equal(sealed.approval.defaultBranchWrite,false);
  assert.match(sealed.approval.confirmationPhrase,/^HYVÄKSYN /);

  await assert.rejects(
    ()=>executeLighthouseMutation({...sealed,confirmation:'HYVÄKSYN VÄÄRÄ',session,adapters}),
    error=>error?.code==='LIGHTHOUSE_MUTATION_CONFIRMATION'
  );
  assert.equal(commitCalls,0);

  const tampered=structuredClone(sealed.proposal);
  tampered.files[0].content='export const fixed="tampered";\n';
  await assert.rejects(
    ()=>executeLighthouseMutation({proposal:tampered,approval:sealed.approval,confirmation:sealed.approval.confirmationPhrase,session,adapters}),
    error=>error?.code==='LIGHTHOUSE_MUTATION_HASH_MISMATCH'
  );
  assert.equal(commitCalls,0);

  const driftAdapters={...adapters,getFile:async path=>({path,sha:'e'.repeat(40),content:'changed elsewhere\n'})};
  await assert.rejects(
    ()=>executeLighthouseMutation({proposal:sealed.proposal,approval:sealed.approval,confirmation:sealed.approval.confirmationPhrase,session,adapters:driftAdapters}),
    error=>error?.code==='LIGHTHOUSE_MUTATION_SOURCE_CHANGED'
  );
  assert.equal(commitCalls,0);

  const receipt=await executeLighthouseMutation({proposal:sealed.proposal,approval:sealed.approval,confirmation:sealed.approval.confirmationPhrase,session,adapters});
  assert.equal(commitCalls,1);
  assert.equal(receipt.defaultBranchUnchanged,true);
  assert.equal(receipt.externalSideEffect,'operation-branch-created');
  assert.match(receipt.execution.branch,/^anomancer\/op-lighthouse-/);
  assert.equal(receipt.execution.commitSha,'c'.repeat(40));
  assert.match(receipt.receiptHash,/^[a-f0-9]{64}$/);

  await assert.rejects(
    ()=>executeLighthouseMutation({proposal:sealed.proposal,approval:sealed.approval,confirmation:sealed.approval.confirmationPhrase,session,adapters:{...adapters,findOperationBranch:async()=>({branch:sealed.proposal.branchName,sha:'c'.repeat(40)})}}),
    error=>error?.code==='LIGHTHOUSE_MUTATION_REPLAY'
  );
  assert.equal(commitCalls,1);

  await assert.rejects(
    ()=>sealLighthouseMutation({...baseProposal,files:[{path:'server/auth.js',content:'export const nope=true;'}]},{session,adapters}),
    error=>error?.code==='LIGHTHOUSE_MUTATION_PATH'
  );

  const phases=[];
  const mutationRun=await runIntent({text:'Korjaa core/intent/contracts.js ja valmistele muutos repositoryyn.'},{
    availability:{'repository.read':true,'repository.propose':true,'repository.write':true},
    capabilityExecutor:async()=>({
      format:'anomancer-hands-execution/v1',
      events:[{id:'repository.read',status:'completed',adapter:'fake',external:true,durationMs:1}],
      context:[{kind:'repository',label:'core/intent/contracts.js',content:'export const fixed=false;',meta:{path:'core/intent/contracts.js',untrusted:true}}],
      sources:[{type:'repository-file',title:'core/intent/contracts.js',path:'core/intent/contracts.js',sha:SOURCE}],
      tools:[{id:'repository.read',label:'repository.read',status:'used'}],mancers:[],failures:[],searchedWeb:false,searchQuerySent:false,webFetchUsed:false,repositoryReadUsed:true,externalReadUsed:true,durationMs:1
    }),
    reasoner:async payload=>{
      phases.push(payload.phase);
      if(payload.phase==='proposal')return {result:{summary:'Vaihda arvo turvallisesti.',risk:'medium',files:[{path:'core/intent/contracts.js',content:'export const fixed=true;\n',rationale:'Korjaus'}],verification:['Aja testit.']},meta:{provider:'fake',model:'fake',externalProvider:false}};
      return {result:{state:'completed',title:'Korjaus valmis tarkistettavaksi',answer:'Muutos voidaan valmistella.',questions:[],nextSteps:[],uncertainty:'',trust:{basis:[],sources:[],assumptions:[],confidence:{level:'medium',reason:'testi'}}},meta:{provider:'fake',model:'fake',externalProvider:false}};
    }
  });
  assert.ok(phases.includes('proposal'));
  assert.equal(mutationRun.result.state,'needs_approval');
  assert.equal(mutationRun.runtime.mutation.proposed,true);
  assert.equal(mutationRun.runtime.mutation.proposal.files[0].path,'core/intent/contracts.js');
  assert.equal(mutationRun.runtime.machine.connections.mutationProposed,true);
  assert.equal(mutationRun.runtime.machine.connections.externalWriteUsed,false);
  assert.equal(mutationRun.runtime.core.boundaries.mutationProposed,true);
  assert.equal(mutationRun.runtime.core.provenance.mutationExecuted,false);

  console.log('✓ Lighthouse Actuator · signed proposal, explicit confirmation, drift locks and operation-branch-only execution');
}finally{
  if(originalSecret===undefined)delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET=originalSecret;
}
