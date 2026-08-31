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
assert.match(html,/Hyväksy ja kirjoita projektitiedostot/);

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

let writeCalls=0;
const adapters={
  getProjectHead:async()=>({project:'Anomancer',sha:BASE}),
  getFile:async path=>({path,sha:SOURCE,content:'export const fixed=false;\n'}),
  writeFiles:async({files})=>{
    writeCalls++;
    assert.equal(files.length,1);
    return {project:'Anomancer',mode:'local-project',files:files.map(item=>item.path),revision:'c'.repeat(64),written:true};
  }
};

try{
  const churnBefore=[
    'export function example(){',
    ...Array.from({length:24},(_,i)=>`  const value${i}=${i};`),
    '  return true;',
    '}',
    ''
  ].join('\n');
  const churnAfter=[
    'export function example(){',
    ...Array.from({length:12},(_,i)=>` const value${i}=${i};`),
    ' const inserted=true;',
    ...Array.from({length:12},(_,i)=>` const value${i+12}=${i+12};`),
    ' return true;',
    '}',
    ''
  ].join('\n');
  await assert.rejects(
    ()=>sealLighthouseMutation({
      ...baseProposal,
      files:[{path:'core/intent/contracts.js',content:churnAfter,rationale:'Yhden rivin korjaus.'}]
    },{
      session,
      adapters:{
        ...adapters,
        getFile:async path=>({path,sha:SOURCE,content:churnBefore})
      }
    }),
    error=>error?.code==='LIGHTHOUSE_MUTATION_FORMAT_CHURN'
  );
  assert.equal(writeCalls,0,'format churn must be rejected before write');

  const sealed=await sealLighthouseMutation(baseProposal,{session,adapters});
  assert.equal(writeCalls,0,'proposal sealing must not write');
  assert.equal(sealed.proposal.files.length,1);
  assert.match(sealed.proposal.files[0].diff,/--- a\/core\/intent\/contracts\.js/);
  assert.equal(sealed.proposal.files[0].sourceSha,SOURCE);
  assert.equal(sealed.proposal.files[0].changeFootprint.formattingOnly,0);
  assert.equal(sealed.proposal.base.project,'Anomancer');
  assert.equal(sealed.proposal.base.revision,BASE);
  assert.equal(sealed.approval.humanApprovalRequired,true);
  assert.equal(sealed.approval.productionWrite,false);
  assert.match(sealed.approval.confirmationPhrase,/^HYVÄKSYN /);

  await assert.rejects(
    ()=>executeLighthouseMutation({...sealed,confirmation:'HYVÄKSYN VÄÄRÄ',session,adapters}),
    error=>error?.code==='LIGHTHOUSE_MUTATION_CONFIRMATION'
  );
  assert.equal(writeCalls,0);

  const tampered=structuredClone(sealed.proposal);
  tampered.files[0].content='export const fixed="tampered";\n';
  await assert.rejects(
    ()=>executeLighthouseMutation({proposal:tampered,approval:sealed.approval,confirmation:sealed.approval.confirmationPhrase,session,adapters}),
    error=>error?.code==='LIGHTHOUSE_MUTATION_HASH_MISMATCH'
  );
  assert.equal(writeCalls,0);

  const driftAdapters={...adapters,getFile:async path=>({path,sha:'e'.repeat(40),content:'changed elsewhere\n'})};
  await assert.rejects(
    ()=>executeLighthouseMutation({proposal:sealed.proposal,approval:sealed.approval,confirmation:sealed.approval.confirmationPhrase,session,adapters:driftAdapters}),
    error=>error?.code==='LIGHTHOUSE_MUTATION_SOURCE_CHANGED'
  );
  assert.equal(writeCalls,0);

  const receipt=await executeLighthouseMutation({proposal:sealed.proposal,approval:sealed.approval,confirmation:sealed.approval.confirmationPhrase,session,adapters});
  assert.equal(writeCalls,1);
  assert.equal(receipt.productionWrite,false);
  assert.equal(receipt.externalSideEffect,'local-project-files-written');
  assert.equal(receipt.execution.project,'Anomancer');
  assert.equal(receipt.execution.revision,'c'.repeat(64));
  assert.match(receipt.receiptHash,/^[a-f0-9]{64}$/);

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

  console.log('✓ Lighthouse Actuator · signed proposal, explicit confirmation, drift locks and local-project execution');
}finally{
  if(originalSecret===undefined)delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET=originalSecret;
}
