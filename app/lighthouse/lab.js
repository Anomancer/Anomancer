import {
  createWorkspace,
  getActiveWorkspace,
  listWorkspaces,
  setActiveWorkspace,
  clearActiveWorkspace,
  renameWorkspace,
  addMaterial,
  removeMaterial,
  addVersion,
  workspaceForIntent,
  persistRun,
  hasLocalWorkspaceStorage,
  lastWorkspaceWriteSucceeded
} from '/lighthouse/workspace-store.js';

const $=selector=>document.querySelector(selector);

const door=$('#door');
const work=$('#work');
const resultCard=$('#resultCard');

const q=$('#q');
const go=$('#go');
const voiceInput=$('#voiceInput');
const attachmentInput=$('#attachmentInput');
const attachmentSummary=$('#attachmentSummary');
const intentPreview=$('#intentPreview');
const previewTitle=$('#previewTitle');
const previewSummary=$('#previewSummary');
const previewEstimate=$('#previewEstimate');
const previewLimitations=$('#previewLimitations');
const previewAuthority=$('#previewAuthority');
const previewEdit=$('#previewEdit');
const previewStart=$('#previewStart');

const continueForm=$('#continueForm');
const continueInput=$('#continueInput');
const continueButton=$('#continueButton');

const doorProgress=$('#doorProgress');
const status=$('#status');
const doorRaccoon=$('#doorRaccoon');

const workProgress=$('#workProgress');
const workStatus=$('#workStatus');
const workRaccoon=$('#workRaccoon');

const doorError=$('#doorError');
const doorErrorText=$('#doorErrorText');
const doorRetry=$('#doorRetry');

const workError=$('#workError');
const workErrorText=$('#workErrorText');
const workRetry=$('#workRetry');

let history=[];
let turns=[];
let lastAttempt=null;
let running=false;
let activeWorkspace=getActiveWorkspace();
let labCsrf='';
let labSessionChecked=false;
let pendingPreview=null;
let pendingText='';
let currentMutation=null;

const RACCOON_LINES=[
  '🦝 Pesukarhu järjestää johtolankoja.',
  '🦝 Etsitään olennainen ennen kellarin avaamista.',
  '🦝 Tarkistetaan ettei vastaus ole pelkkää pöhinää.',
  '🦝 Konehuoneesta kuuluu lupaavaa rapinaa.',
  '🦝 Hetki, pesukarhu lajittelee tärkeän ja kiiltävän.',
  '🦝 Punaisiin nappeihin ei ole vielä koskettu.',
  '🦝 Tarkistetaan vielä yksi laatikko.',
  '🦝 Muotoillaan tästä jotain ihmiselle käyttökelpoista.'
];

function startRaccoon(target){
  let index=Math.floor(Math.random()*RACCOON_LINES.length);
  target.textContent=RACCOON_LINES[index];

  return setInterval(()=>{
    index=(index+1)%RACCOON_LINES.length;
    target.textContent=RACCOON_LINES[index];
  },2300);
}

function stopRaccoon(timer,target){
  if(timer)clearInterval(timer);
  target.textContent='';
}

function setBusy(source,busy){
  running=busy;
  const isDoor=source==='door';

  go.disabled=busy;
  q.disabled=busy;
  if(voiceInput)voiceInput.disabled=busy;
  if(attachmentInput)attachmentInput.disabled=busy;
  if(previewStart)previewStart.disabled=busy;
  if(previewEdit)previewEdit.disabled=busy;
  continueButton.disabled=busy;
  continueInput.disabled=busy;
  $('#back').disabled=busy;

  if(isDoor){
    doorProgress.hidden=!busy;
    status.textContent=busy?'Työskennellään…':'';
    go.textContent=busy?'Työskennellään…':'Jatka';
  }else{
    workProgress.hidden=!busy;
    workStatus.textContent=busy?'Jatketaan samaa työtä…':'';
    continueButton.textContent=busy?'Työskennellään…':'Jatka';
  }

  resultCard?.setAttribute('aria-busy',busy?'true':'false');
}

function clearError(source){
  if(source==='door'){
    doorError.hidden=true;
    doorErrorText.textContent='';
  }else{
    workError.hidden=true;
    workErrorText.textContent='';
  }
}

function showError(source,message){
  if(source==='door'){
    doorErrorText.textContent=message;
    doorError.hidden=false;
  }else{
    workErrorText.textContent=message;
    workError.hidden=false;
  }
}

function makeList(target,values=[]){
  target.replaceChildren(...values.map(value=>{
    const li=document.createElement('li');
    li.textContent=value;
    return li;
  }));
}

function statePresentation(state){
  switch(state){
    case 'needs_input':
      return {
        eyebrow:'JATKETAAN',
        label:'Tarvitsen lisätietoa',
        continuation:'Täydennä tähän',
        placeholder:'Kirjoita puuttuva tieto tähän.'
      };
    case 'needs_approval':
      return {
        eyebrow:'PÄÄTÖS TARVITAAN',
        label:'Odottaa hyväksyntää',
        continuation:'Päätä miten jatketaan',
        placeholder:'Hyväksy, hylkää tai anna tarkempi ohje.'
      };
    case 'blocked':
      return {
        eyebrow:'TYÖ PYSÄHTYI',
        label:'Estynyt',
        continuation:'Muuta tai täydennä tehtävää',
        placeholder:'Anna lisätietoa, muuta tavoitetta tai kokeile toista lähestymistapaa.'
      };
    default:
      return {
        eyebrow:'TÄSSÄ ON OLENNAISIN',
        label:'',
        continuation:'Jatka tästä',
        placeholder:'Kirjoita jatko, tarkennus tai uusi kysymys tästä työstä.'
      };
  }
}

function confidenceLabel(level){
  switch(level){
    case 'high': return 'Korkea';
    case 'low': return 'Matala';
    default: return 'Keskitaso';
  }
}

function renderTrust(trust={}){
  const basis=Array.isArray(trust.basis)?trust.basis:[];
  makeList($('#trustBasis'),basis);

  const sources=Array.isArray(trust.sources)?trust.sources:[];
  makeList($('#trustSources'),sources);
  $('#trustSources').hidden=!sources.length;
  $('#trustNoSources').hidden=Boolean(sources.length);

  const assumptions=Array.isArray(trust.assumptions)?trust.assumptions:[];
  makeList($('#trustAssumptions'),assumptions);
  $('#trustAssumptions').hidden=!assumptions.length;
  $('#trustNoAssumptions').hidden=Boolean(assumptions.length);

  const confidence=trust.confidence||{};
  const level=['low','medium','high'].includes(confidence.level)
    ?confidence.level
    :'medium';

  const pill=$('#trustConfidenceLevel');
  pill.textContent=confidenceLabel(level);
  pill.dataset.level=level;

  $('#trustConfidenceReason').textContent=
    String(confidence.reason||'Luottamustasolle ei annettu erillistä perustelua.');

  $('#trustDetails').open=false;
}

function orchestrationStatusLabel(status){
  switch(status){
    case 'completed': return 'Valmis';
    case 'skipped': return 'Ohitettu';
    case 'running': return 'Käynnissä';
    case 'failed': return 'Epäonnistui';
    default: return 'Odottaa';
  }
}

function renderOrchestration(orchestration={}){
  const details=$('#orchestraDetails');

  if(!orchestration||!orchestration.format){
    details.hidden=true;
    return;
  }

  details.hidden=false;
  details.open=false;

  $('#orchestraName').textContent=orchestration.name||'Työpolku';
  $('#orchestraSummary').textContent=orchestration.summary||'';
  $('#orchestraMode').textContent=
    orchestration.mode==='direct'?'Suora':String(orchestration.mode||'Automaattinen');

  const intelligence=orchestration.intelligence||{};
  const taskLabels={
    general:'Yleinen',debug:'Debug',audit:'Auditointi',compare:'Vertailu',
    plan:'Suunnittelu',research:'Tutkimus',write:'Kirjoitus',transform:'Muunnos'
  };
  const complexityLabels={low:'Kevyt',medium:'Keskitaso',high:'Vaativa'};
  const strategyLabels={direct:'Suora',planned:'Suunniteltu',reviewed:'Tarkistettu'};
  $('#orchestraTaskType').textContent=taskLabels[intelligence.taskType]||String(intelligence.taskType||'Yleinen');
  $('#orchestraComplexity').textContent=complexityLabels[intelligence.complexity]||String(intelligence.complexity||'Kevyt');
  $('#orchestraStrategy').textContent=strategyLabels[intelligence.strategy]||String(intelligence.strategy||'Suora');
  $('#orchestraPasses').textContent=`${Number(intelligence.passes)||1} kierrosta`;

  const stages=Array.isArray(orchestration.stages)?orchestration.stages:[];
  $('#orchestraStageCount').textContent=String(stages.length);

  $('#orchestraStages').replaceChildren(...stages.map((stage,index)=>{
    const li=document.createElement('li');
    li.className='orchestra-stage';
    li.dataset.status=stage.status||'pending';

    const indexNode=document.createElement('span');
    indexNode.className='orchestra-stage-index';
    indexNode.textContent=String(index+1).padStart(2,'0');

    const body=document.createElement('div');
    body.className='orchestra-stage-body';

    const top=document.createElement('div');
    top.className='orchestra-stage-top';

    const title=document.createElement('strong');
    title.textContent=stage.label||stage.id||'Vaihe';

    const status=document.createElement('span');
    status.className='orchestra-stage-status';
    status.textContent=orchestrationStatusLabel(stage.status);

    top.append(title,status);

    const detail=document.createElement('p');
    detail.textContent=stage.detail||'';

    body.append(top,detail);
    li.append(indexNode,body);
    return li;
  }));

  const capabilities=Array.isArray(orchestration.capabilities)
    ?orchestration.capabilities
    :[];

  $('#orchestraCapabilities').replaceChildren(...capabilities.map(capability=>{
    const li=document.createElement('li');

    const id=document.createElement('code');
    id.textContent=capability.id||'capability';

    const purpose=document.createElement('p');
    purpose.textContent=capability.purpose||capability.label||'';

    li.append(id,purpose);
    return li;
  }));

  const mancers=Array.isArray(orchestration.mancers)
    ?orchestration.mancers
    :[];

  $('#orchestraMancers').replaceChildren(...mancers.map(mancer=>{
    const li=document.createElement('li');
    li.textContent=typeof mancer==='string'
      ?mancer
      :[mancer?.label||mancer?.id||'Mancer',mancer?.orchestra?.name].filter(Boolean).join(' · ');
    return li;
  }));

  $('#orchestraMancers').hidden=!mancers.length;
  $('#orchestraNoMancers').hidden=Boolean(mancers.length);
  $('#orchestraNoMancers').textContent=
    orchestration.mancerNote||
    'Erillisiä Mancer-paketteja ei käynnistetty tässä ajossa.';

  const router=orchestration.router||{};
  $('#orchestraRouterMode').textContent=
    router.mode==='adaptive'?'Adaptiivinen reitti':router.mode==='fixed'?'Kiinteä reitti':String(router.mode||'');
  $('#orchestraRouterReason').textContent=router.reason||'';

  if(!router.reason){
    $('#orchestraRouterReason').textContent=
      'Reitityspäätökselle ei tallentunut erillistä perustelua.';
  }
}

function machineStatusLabel(status){
  return status==='used'?'Käytössä':'Ei käytetty';
}

function formatLatency(milliseconds){
  const ms=Number(milliseconds)||0;
  if(ms<1000)return `${Math.round(ms)} ms`;
  return `${(ms/1000).toFixed(ms>=10000?1:2)} s`;
}

function renderMachine(machine={}){
  const details=$('#machineDetails');

  if(!machine||!machine.format){
    details.hidden=true;
    return;
  }

  details.hidden=false;
  details.open=false;

  const execution=machine.execution||{};
  $('#machineProvider').textContent=execution.provider||'unknown';
  $('#machineModel').textContent=execution.model||'Ei ilmoitettu';
  $('#machineCapability').textContent=execution.capability||'Ei ilmoitettu';
  $('#machineLatency').textContent=formatLatency(execution.latencyMs);

  const reasoning=machine.reasoning||{};
  const reasoningRows=[
    ['Tehtävä',String(reasoning.taskType||'general')],
    ['Vaativuus',String(reasoning.complexity||'low')],
    ['Strategia',String(reasoning.strategy||'direct')]
  ];
  $('#machineReasoning').replaceChildren(...reasoningRows.flatMap(([label,value])=>{
    const dt=document.createElement('dt');
    dt.textContent=label;
    const dd=document.createElement('dd');
    dd.textContent=value;
    return [dt,dd];
  }));
  const reasoningPasses=Array.isArray(reasoning.passes)?reasoning.passes:[];
  $('#machineReasoningCount').textContent=String(reasoning.passCount||reasoningPasses.length||1);
  $('#machineReasoningPasses').replaceChildren(...reasoningPasses.map((pass,index)=>{
    const li=document.createElement('li');
    li.dataset.status=pass.status||'completed';
    const top=document.createElement('div');
    const name=document.createElement('strong');
    const labels={plan:'Suunnittelu',work:'Päättely',review:'Tarkistus'};
    name.textContent=`${String(index+1).padStart(2,'0')} · ${labels[pass.phase]||pass.phase||'Päättely'}`;
    const time=document.createElement('span');
    time.textContent=formatLatency(pass.durationMs);
    top.append(name,time);
    const meta=document.createElement('p');
    meta.textContent=pass.status==='failed'
      ?`Epäonnistui: ${pass.error||'tuntematon virhe'}`
      :[pass.provider,pass.model].filter(Boolean).join(' · ')||'Runtime';
    li.append(top,meta);
    return li;
  }));

  const handRuntime=machine.capabilityRuntime||{};
  const handEvents=Array.isArray(handRuntime.events)?handRuntime.events:[];
  $('#machineHandsCount').textContent=String(handEvents.length);
  $('#machineHands').replaceChildren(...handEvents.map((event,index)=>{
    const li=document.createElement('li');
    li.dataset.status=event.status||'unknown';
    const top=document.createElement('div');
    const name=document.createElement('strong');
    name.textContent=`${String(index+1).padStart(2,'0')} · ${event.id||'capability'}`;
    const time=document.createElement('span');
    time.textContent=formatLatency(event.durationMs);
    top.append(name,time);
    const meta=document.createElement('p');
    meta.textContent=event.status==='failed'
      ?`Epäonnistui: ${event.error||'tuntematon virhe'}`
      :[event.adapter,event.external?'ulkoinen luku':'sisäinen'].filter(Boolean).join(' · ');
    li.append(top,meta);
    return li;
  }));
  $('#machineHands').hidden=!handEvents.length;
  $('#machineNoHands').hidden=Boolean(handEvents.length);
  $('#machineNoHands').textContent='Erillisiä read-only kyvykkyyksiä ei tarvittu tässä ajossa.';

  const usage=machine.usage||{};
  const usageRows=[];

  if(usage.inputTokens!==null&&usage.inputTokens!==undefined){
    usageRows.push(['Syöte',String(usage.inputTokens)]);
  }

  if(usage.outputTokens!==null&&usage.outputTokens!==undefined){
    usageRows.push(['Vastaus',String(usage.outputTokens)]);
  }

  if(usage.totalTokens!==null&&usage.totalTokens!==undefined){
    usageRows.push(['Yhteensä',String(usage.totalTokens)]);
  }

  $('#machineUsage').replaceChildren(...usageRows.flatMap(([label,value])=>{
    const dt=document.createElement('dt');
    dt.textContent=label;

    const dd=document.createElement('dd');
    dd.textContent=value;

    return [dt,dd];
  }));

  $('#machineUsage').hidden=!usageRows.length;
  $('#machineUsageEmpty').hidden=Boolean(usageRows.length);

  const cost=machine.cost||{};
  $('#machineCost').textContent=cost.available
    ?`${cost.amount} ${cost.currency}`
    :String(cost.note||'Kustannusta ei laskettu tästä ajosta.');

  const permissions=Array.isArray(machine.permissions)
    ?machine.permissions
    :[];

  $('#machinePermissions').replaceChildren(...permissions.map(permission=>{
    const li=document.createElement('li');
    li.dataset.status=permission.status||'not-used';

    const top=document.createElement('div');

    const label=document.createElement('strong');
    label.textContent=permission.label||permission.id||'Yhteys';

    const status=document.createElement('span');
    status.textContent=machineStatusLabel(permission.status);

    top.append(label,status);

    const detail=document.createElement('p');
    detail.textContent=permission.detail||'';

    li.append(top,detail);
    return li;
  }));

  const flow=machine.dataFlow||{};
  const flowRows=[
    ['Työtila lähetettiin',flow.workspaceContextSent?'Kyllä':'Ei'],
    ['Aineistoja lähetettiin',String(flow.materialsSent||0)],
    ['Historiaviestejä lähetettiin',String(flow.historyTurnsSent||0)],
    ['Ulkoisia lähteitä luettiin',String(flow.externalSourcesRead||0)],
    ['Hakukysely lähetettiin',flow.searchQuerySent?'Kyllä':'Ei'],
    ['Repository-tiedostoja luettiin',String(flow.repositoryFilesRead||0)],
    ['Kohde',String(flow.destination||'runtime')]
  ];

  $('#machineDataFlow').replaceChildren(...flowRows.flatMap(([label,value])=>{
    const dt=document.createElement('dt');
    dt.textContent=label;

    const dd=document.createElement('dd');
    dd.textContent=value;

    return [dt,dd];
  }));

  const tools=Array.isArray(machine.tools)?machine.tools:[];
  $('#machineToolCount').textContent=String(tools.length);

  $('#machineTools').replaceChildren(...tools.map(tool=>{
    const li=document.createElement('li');

    const code=document.createElement('code');
    code.textContent=tool.id||tool.label||'tool';

    const status=document.createElement('span');
    status.textContent=machineStatusLabel(tool.status);

    li.append(code,status);
    return li;
  }));

  $('#machineTools').hidden=!tools.length;
  $('#machineNoTools').hidden=Boolean(tools.length);
  $('#machineNoTools').textContent=
    machine.toolSummary||
    'Erillisiä työkaluja ei kutsuttu tässä ajossa.';
}

function yesNo(value){
  return value?'Kyllä':'Ei';
}

function coreStatus(label,value,detail=''){
  const li=document.createElement('li');
  li.dataset.status=value?'on':'off';

  const top=document.createElement('div');

  const title=document.createElement('strong');
  title.textContent=label;

  const status=document.createElement('span');
  status.textContent=value?'Kyllä':'Ei';

  top.append(title,status);
  li.append(top);

  if(detail){
    const p=document.createElement('p');
    p.textContent=detail;
    li.append(p);
  }

  return li;
}

function renderCore(core={}){
  const details=$('#coreDetails');

  if(!core||!core.format){
    details.hidden=true;
    return;
  }

  details.hidden=false;
  details.open=false;

  const authority=core.authority||{};
  $('#coreAuthorityNote').textContent=authority.note||'';

  const policy=core.policy||{};
  const environment=policy.environment||{};

  $('#coreEnvironment').textContent=
    String(environment.name||'development');

  $('#corePolicy').replaceChildren(
    coreStatus(
      'Lab sallittu tässä ympäristössä',
      environment.labAllowed===true,
      environment.productionDefaultLocked
        ?'Production on oletuksena lukittu ilman erillistä Lighthouse-lippua.'
        :'Construction Mode -lab on tämän ympäristön politiikan mukaan käytettävissä.'
    ),
    coreStatus(
      'Automaattinen mallimuisti',
      policy.automaticModelMemory===true,
      'Lighthouse ei anna mallille automaattista pysyvää muistia.'
    ),
    coreStatus(
      'Automaattinen julkaisu',
      policy.automaticPublication===true,
      'Tämä lab-polku ei julkaise sisältöä automaattisesti.'
    ),
    coreStatus(
      'Automaattiset ulkoiset toiminnot',
      policy.automaticExternalActions===true,
      'Ulkoisia sivuvaikutuksia ei anneta mallin tehtäväksi tässä polussa.'
    )
  );

  const storage=core.storage||{};
  const limits=storage.limits||{};

  const storageRows=[
    ['Työtilat',storage.workspaceStore||'Ei ilmoitettu'],
    ['Automaattitallennus',yesNo(storage.automaticWorkspaceSave)],
    ['Synkronoitu',yesNo(storage.synchronized)],
    ['Palvelinarkisto',yesNo(storage.serverArchive)],
    ['Työtilaraja',String(limits.workspaces??'—')],
    ['Aineistoja / työtila',String(limits.materialsPerWorkspace??'—')],
    ['Versioita / työtila',String(limits.versionsPerWorkspace??'—')]
  ];

  $('#coreStorage').replaceChildren(...storageRows.flatMap(([label,value])=>{
    const dt=document.createElement('dt');
    dt.textContent=label;

    const dd=document.createElement('dd');
    dd.textContent=value;

    return [dt,dd];
  }));

  $('#coreStorageNote').textContent=storage.note||'';

  const contracts=Array.isArray(core.contracts)?core.contracts:[];
  $('#coreContractCount').textContent=String(contracts.length);

  $('#coreContracts').replaceChildren(...contracts.map(contract=>{
    const li=document.createElement('li');

    const meta=document.createElement('span');
    meta.textContent=[contract.layer,contract.name].filter(Boolean).join(' · ');

    const code=document.createElement('code');
    code.textContent=contract.format||'';

    li.append(meta,code);
    return li;
  }));

  const boundaries=core.boundaries||{};
  const boundaryRows=[
    ['Ulkoinen provider käytössä',yesNo(boundaries.externalProviderUsed)],
    ['Verkkohaku käytössä',yesNo(boundaries.webSearchUsed)],
    ['Työtilakonteksti lähetettiin',yesNo(boundaries.workspaceContextSent)],
    ['Lähetettyjä aineistoja',String(boundaries.materialsSent||0)],
    ['Kohde',String(boundaries.destination||'runtime')]
  ];

  $('#coreBoundaries').replaceChildren(...boundaryRows.flatMap(([label,value])=>{
    const dt=document.createElement('dt');
    dt.textContent=label;

    const dd=document.createElement('dd');
    dd.textContent=value;

    return [dt,dd];
  }));

  const provenance=core.provenance||{};
  const completeness=provenance.traceCompleteness||{};

  const traces=[
    ['D2 · Luottamus',completeness.trust],
    ['D3 · Työtila',completeness.workspace],
    ['D4 · Orkestra',completeness.orchestration],
    ['D5 · Kone',completeness.machine]
  ];

  $('#coreProvenance').replaceChildren(...traces.map(([label,present])=>{
    const li=document.createElement('li');
    li.dataset.present=present?'true':'false';

    const name=document.createElement('span');
    name.textContent=label;

    const status=document.createElement('strong');
    status.textContent=present?'Jälki tallessa':'Ei jälkeä';

    li.append(name,status);
    return li;
  }));
}

function renderMutation(mutation={}){
  const panel=$('#mutationPanel');
  const proposal=mutation?.proposal||null;
  currentMutation=proposal?mutation:null;
  if(!proposal||!Array.isArray(proposal.files)||!proposal.files.length){
    panel.hidden=true;
    $('#mutationFiles').replaceChildren();
    return;
  }

  panel.hidden=false;
  $('#mutationSummary').textContent=proposal.summary||'Rajattu repository-muutos odottaa tarkistusta.';
  const risk=$('#mutationRisk');
  risk.textContent=proposal.risk||'high';
  risk.dataset.risk=proposal.risk||'high';

  $('#mutationFiles').replaceChildren(...proposal.files.map(file=>{
    const article=document.createElement('article');
    article.className='mutation-file';
    const header=document.createElement('header');
    const path=document.createElement('strong');
    path.textContent=file.path||'tiedosto';
    const delta=document.createElement('span');
    delta.className='mutation-delta';
    delta.textContent=`+${Number(file.additions)||0} / −${Number(file.deletions)||0}`;
    header.append(path,delta);
    const why=document.createElement('p');
    why.textContent=file.rationale||'Muutos kuuluu hyväksyttävään ehdotukseen.';
    const diff=document.createElement('pre');
    diff.className='mutation-diff';
    diff.textContent=file.diff||'Diff-esikatselua ei ollut saatavilla.';
    article.append(header,why,diff);
    return article;
  }));

  const verification=Array.isArray(proposal.verification)?proposal.verification:[];
  makeList($('#mutationVerification'),verification);
  $('#mutationVerificationBlock').hidden=!verification.length;

  const approval=mutation?.approval||null;
  const approvalBox=$('#mutationApproval');
  const message=$('#mutationMessage');
  const receipt=$('#mutationReceipt');
  receipt.hidden=true;
  receipt.replaceChildren();
  $('#mutationConfirmation').value='';

  if(mutation.available===true&&approval?.token&&approval?.confirmationPhrase){
    approvalBox.hidden=false;
    $('#mutationPhrase').textContent=approval.confirmationPhrase;
    $('#mutationBoundary').textContent=`Kohde: ${proposal.base?.repo||'repository'} · ${proposal.base?.branch||'base'} @ ${String(proposal.base?.sha||'').slice(0,12)}. Hyväksyntä luo vain erillisen ${proposal.branchName||'operation'}-haaran. Default branchiin ei kirjoiteta.`;
    $('#mutationExecute').disabled=false;
    message.textContent='Mitään repositoryssa ei ole vielä muuttunut.';
  }else{
    approvalBox.hidden=true;
    message.textContent=mutation?.error==='admin-session-required'
      ?'Muutosluonnos syntyi, mutta suoritus vaatii kirjautuneen admin-istunnon.'
      :'Muutosluonnos syntyi, mutta kirjoittava operation-portti ei ole tässä ympäristössä käytettävissä.';
  }
}

async function executeCurrentMutation(){
  if(!currentMutation?.proposal||!currentMutation?.approval||running)return;
  const confirmation=$('#mutationConfirmation').value.trim();
  const button=$('#mutationExecute');
  const message=$('#mutationMessage');
  const receiptBox=$('#mutationReceipt');
  if(!confirmation){message.textContent='Kirjoita näkyvä hyväksyntälause ennen suoritusta.';return;}
  button.disabled=true;
  message.textContent='Varmistetaan hash, base-SHA ja lähdetiedostot…';
  try{
    const headers=await labRequestHeaders();
    const response=await fetch('/api/lab/mutation',{
      method:'POST',credentials:'same-origin',headers,
      body:JSON.stringify({proposal:currentMutation.proposal,approval:currentMutation.approval,confirmation})
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.ok)throw new Error(payload.message||payload.error||'Mutation suoritus epäonnistui.');
    currentMutation={...currentMutation,receipt:payload.receipt};
    message.textContent='Operation-haara luotiin. Default branch pysyi muuttumattomana.';
    $('#mutationConfirmation').disabled=true;
    const receipt=payload.receipt||{};
    const title=document.createElement('strong');title.textContent='Suorituskuitti';
    const meta=document.createElement('p');meta.textContent=[`id ${receipt.id||''}`,`commit ${String(receipt.execution?.commitSha||'').slice(0,12)}`,`receipt ${String(receipt.receiptHash||'').slice(0,12)}`].filter(Boolean).join(' · ');
    receiptBox.replaceChildren(title,meta);
    if(receipt.execution?.compareUrl){const link=document.createElement('a');link.href=receipt.execution.compareUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Avaa GitHub-vertailu';receiptBox.append(link);}
    receiptBox.hidden=false;
  }catch(error){
    message.textContent=String(error?.message||'Mutation suoritus epäonnistui.');
    button.disabled=false;
  }
}

function renderResult(payload,{initial=false}={}){
  const result=payload.result||{};
  const runtime=payload.runtime||{};
  const presentation=statePresentation(result.state);

  $('#resultEyebrow').textContent=presentation.eyebrow;
  $('#title').textContent=result.title||'';
  $('#answer').textContent=result.answer||'';

  const pill=$('#statePill');
  pill.textContent=presentation.label;
  pill.hidden=!presentation.label;
  pill.dataset.state=result.state||'completed';

  const questions=result.questions||[];
  makeList($('#questionList'),questions);
  $('#questions').hidden=!questions.length;

  const steps=result.nextSteps||[];
  makeList($('#steps'),steps);
  $('#next').hidden=!steps.length;

  const uncertainty=String(result.uncertainty||'').trim();
  $('#uncText').textContent=uncertainty;
  $('#unc').hidden=!uncertainty;

  $('#continueTitle').textContent=presentation.continuation;
  continueInput.placeholder=presentation.placeholder;

  renderMutation(runtime.mutation||{});
  renderTrust(result.trust||{});
  renderOrchestration(runtime.orchestration||{});
  renderMachine(runtime.machine||{});
  renderCore(runtime.core||{});

  $('#runtime').textContent=JSON.stringify(runtime,null,2);

  door.hidden=true;
  work.hidden=false;

  renderChain();
  updateTurnCount();

  if(initial){
    requestAnimationFrame(()=>{
      window.scrollTo({top:0,behavior:'auto'});
      if(result.state==='needs_input')continueInput.focus({preventScroll:true});
    });
  }else if(result.state==='needs_input'){
    requestAnimationFrame(()=>continueInput.focus({preventScroll:true}));
  }
}

function compact(text,max=220){
  const clean=String(text||'').replace(/\s+/g,' ').trim();
  return clean.length>max?`${clean.slice(0,max-1)}…`:clean;
}

function renderChain(){
  const details=$('#chainDetails');
  const list=$('#chainList');

  if(turns.length<2){
    details.hidden=true;
    list.replaceChildren();
    return;
  }

  const archived=turns.slice(0,-1);
  details.hidden=false;
  $('#chainSummary').textContent=`${archived.length} aiempaa kierrosta`;

  list.replaceChildren(...archived.map((turn,index)=>{
    const li=document.createElement('li');
    li.className='chain-turn';

    const number=document.createElement('span');
    number.className='chain-index';
    number.textContent=String(index+1).padStart(2,'0');

    const body=document.createElement('div');
    body.className='chain-body';

    const user=document.createElement('p');
    user.className='chain-user';
    user.textContent=compact(turn.user,180);

    const result=document.createElement('p');
    result.className='chain-result';
    result.textContent=compact(
      [turn.result?.title,turn.result?.answer].filter(Boolean).join(' · '),
      240
    );

    body.append(user,result);
    li.append(number,body);
    return li;
  }));
}

function updateTurnCount(){
  const count=turns.length;
  $('#turnCount').textContent=count>1?`${count}. kierros`:'';
}

function localTime(value){
  try{
    return new Intl.DateTimeFormat('fi-FI',{
      dateStyle:'short',
      timeStyle:'short'
    }).format(new Date(value));
  }catch{
    return '';
  }
}

function renderRecentWorkspaces(){
  const items=listWorkspaces();
  const details=$('#recentWorkDetails');
  const list=$('#recentWorkList');

  details.hidden=!items.length;
  if(!items.length){
    list.replaceChildren();
    return;
  }

  list.replaceChildren(...items.slice(0,6).map(workspace=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='recent-work-item';
    button.dataset.workspaceId=workspace.id;

    const title=document.createElement('strong');
    title.textContent=workspace.title;

    const meta=document.createElement('span');
    meta.textContent=[
      localTime(workspace.updatedAt),
      `${workspace.materials?.length||0} aineistoa`,
      `${workspace.versions?.length||0} versiota`
    ].filter(Boolean).join(' · ');

    button.append(title,meta);
    return button;
  }));
}

function renderWorkspace(){
  const details=$('#workspaceDetails');

  if(!activeWorkspace){
    details.hidden=true;
    return;
  }

  details.hidden=false;
  $('#workspaceTitle').value=activeWorkspace.title||'';
  const storageAvailable=hasLocalWorkspaceStorage();
  const storageHealthy=lastWorkspaceWriteSucceeded();
  $('#workspaceStorageStatus').textContent=!storageAvailable
    ?'Paikallinen tallennus ei ole käytettävissä.'
    :storageHealthy
      ?'Tallennettu automaattisesti tähän selaimeen.'
      :'Tallennus epäonnistui. Selainkohtainen tila voi olla täynnä.';
  $('#workspaceStorageStatus').dataset.state=
    storageAvailable&&storageHealthy?'saved':'error';

  const materials=activeWorkspace.materials||[];
  $('#materialCount').textContent=String(materials.length);
  $('#materialEmpty').hidden=Boolean(materials.length);

  $('#materialList').replaceChildren(...materials.map(material=>{
    const li=document.createElement('li');
    li.className='material-item';

    const body=document.createElement('div');
    const title=document.createElement('strong');
    title.textContent=material.title||'Aineisto';

    const content=document.createElement('p');
    content.textContent=compact(material.content,260);
    body.append(title,content);

    const remove=document.createElement('button');
    remove.type='button';
    remove.className='text-action';
    remove.dataset.removeMaterial=material.id;
    remove.textContent='Poista';

    li.append(body,remove);
    return li;
  }));

  const versions=activeWorkspace.versions||[];
  $('#versionCount').textContent=String(versions.length);
  $('#versionEmpty').hidden=Boolean(versions.length);

  $('#versionList').replaceChildren(...[...versions].reverse().map(version=>{
    const li=document.createElement('li');
    li.className='version-item';

    const title=document.createElement('strong');
    title.textContent=version.label;

    const meta=document.createElement('span');
    meta.textContent=[
      localTime(version.createdAt),
      version.turnCount?`${version.turnCount}. kierros`:''
    ].filter(Boolean).join(' · ');

    const result=document.createElement('p');
    result.textContent=compact(
      [version.result?.title,version.result?.answer].filter(Boolean).join(' · '),
      220
    );

    li.append(title,meta,result);
    return li;
  }));

  renderRecentWorkspaces();
}

function resumeWorkspace(workspace){
  if(!workspace)return false;

  activeWorkspace=workspace;
  history=Array.isArray(workspace.history)?[...workspace.history]:[];
  turns=Array.isArray(workspace.turns)?[...workspace.turns]:[];
  lastAttempt=null;

  if(workspace.latestPayload?.result){
    renderResult(workspace.latestPayload,{initial:true});
    renderWorkspace();
    return true;
  }

  return false;
}

function addHistory(userText,payload){
  history.push({role:'user',content:userText});

  const result=payload?.result||{};
  const assistant=[
    result.title,
    result.answer,
    ...(result.questions||[]).map(value=>`Kysymys: ${value}`),
    result.uncertainty?`Epävarmuus: ${result.uncertainty}`:''
  ].filter(Boolean).join('\n\n');

  if(assistant){
    history.push({role:'assistant',content:assistant});
  }

  history=history.slice(-8);
  turns.push({
    user:userText,
    result
  });
}

async function labRequestHeaders(){
  if(!labSessionChecked){
    labSessionChecked=true;
    try{
      const response=await fetch('/api/admin/auth?resource=session',{
        credentials:'same-origin'
      });
      const session=await response.json().catch(()=>({}));
      labCsrf=session?.authenticated?String(session.csrf||''):'';
    }catch{
      labCsrf='';
    }
  }

  return {
    'Content-Type':'application/json',
    ...(labCsrf?{'X-CSRF-Token':labCsrf}:{})
  };
}

function hideIntentPreview(){
  pendingPreview=null;
  pendingText='';
  currentMutation=null;
  intentPreview.hidden=true;
  previewTitle.textContent='';
  previewSummary.textContent='';
  previewEstimate.textContent='';
  previewAuthority.textContent='';
  previewLimitations.replaceChildren();
  previewLimitations.hidden=true;
}

function renderIntentPreview(payload,text){
  const recommendation=payload?.recommendation||{};
  const authority=payload?.authority||{};
  const limitations=Array.isArray(recommendation.limitations)
    ?recommendation.limitations
    :[];

  pendingPreview=payload;
  pendingText=text;
  previewTitle.textContent=recommendation.title||'Työ on valmis käynnistettäväksi';
  previewSummary.textContent=recommendation.summary||'Käyn tavoitteen läpi ja kokoan käyttökelpoisen vastauksen.';
  previewEstimate.textContent=recommendation.estimatedStages
    ?`Työ etenee noin ${recommendation.estimatedStages} vaiheessa.`
    :'';
  makeList(previewLimitations,limitations);
  previewLimitations.hidden=!limitations.length;
  const authorityText=authority.externalActionRequested
    ?'Voin valmistella tämän työn, mutta ulkoiset muutokset vaativat erillisen päätöksesi eikä niitä suoriteta automaattisesti.'
    :'Käynnistä vasta kun tämä työskentelytapa näyttää oikealta.';
  previewAuthority.textContent=[recommendation.dataNotice,authorityText].filter(Boolean).join(' ');
  previewStart.textContent=recommendation.startLabel||'Käynnistä';
  intentPreview.hidden=false;
  go.hidden=true;

  requestAnimationFrame(()=>previewStart.focus({preventScroll:true}));
}

async function preview(text,{retry=false}={}){
  if(running)return false;
  const clean=text.trim();
  if(!clean)return false;

  clearError('door');
  if(!retry){
    lastAttempt={source:'preview',text:clean,history:[]};
  }

  const timer=startRaccoon(doorRaccoon);
  setBusy('door',true);
  status.textContent='Jäsennetään tehtävää…';
  go.textContent='Jäsennetään…';

  try{
    const headers=await labRequestHeaders();
    const response=await fetch('/api/lab/preview',{
      method:'POST',
      credentials:'same-origin',
      headers,
      body:JSON.stringify({
        text:clean,
        locale:'fi',
        history:[],
        workspace:workspaceForIntent(activeWorkspace)
      })
    });
    const payload=await response.json().catch(()=>({}));

    if(!response.ok||!payload.ok){
      if(response.status===401||response.status===403){
        labCsrf='';
        labSessionChecked=false;
      }
      throw new Error(payload.message||payload.error||'Tehtävän jäsentäminen epäonnistui.');
    }

    renderIntentPreview(payload,clean);
    return true;
  }catch(error){
    showError('door',String(error?.message||'Tehtävän jäsentäminen epäonnistui.'));
    return false;
  }finally{
    stopRaccoon(timer,doorRaccoon);
    setBusy('door',false);
    if(intentPreview.hidden){
      go.hidden=false;
      go.textContent='Jatka';
    }
  }
}

function syncAttachmentSummary(){
  const materials=activeWorkspace?.materials||[];
  attachmentSummary.hidden=!materials.length;
  attachmentSummary.textContent=materials.length
    ?`${materials.length} aineisto${materials.length===1?'':'a'} lisätty tähän työhön.`
    :'';
}

async function addSelectedFiles(files=[]){
  if(!files.length)return;
  if(!activeWorkspace){
    activeWorkspace=createWorkspace(q.value.trim()||'Uusi työ',{persist:false});
  }

  const accepted=[...files].slice(0,6);
  for(const file of accepted){
    const type=String(file.type||'');
    const name=String(file.name||'Aineisto');
    const textLike=type.startsWith('text/')||type==='application/json'||/\.(?:txt|md|json|csv)$/i.test(name);
    if(!textLike){
      showError('door',`Tiedostoa ${name} ei voida vielä lukea tässä rakennusvaiheessa. Lisää teksti-, Markdown-, JSON- tai CSV-tiedosto.`);
      continue;
    }
    if(Number(file.size)>512_000){
      showError('door',`Tiedosto ${name} on liian suuri. Yhden aineiston raja on 512 kt.`);
      continue;
    }
    const content=(await file.text()).slice(0,8000);
    activeWorkspace=addMaterial(activeWorkspace,{title:name,content});
  }

  hideIntentPreview();
  go.hidden=false;
  syncAttachmentSummary();
  renderWorkspace();
}

function setupVoiceInput(){
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition||!voiceInput)return;

  voiceInput.hidden=false;
  voiceInput.addEventListener('click',()=>{
    if(running)return;
    const recognition=new SpeechRecognition();
    recognition.lang='fi-FI';
    recognition.interimResults=false;
    recognition.maxAlternatives=1;
    voiceInput.disabled=true;
    voiceInput.setAttribute('aria-pressed','true');
    voiceInput.textContent='Kuuntelen…';

    recognition.addEventListener('result',event=>{
      const transcript=String(event.results?.[0]?.[0]?.transcript||'').trim();
      if(transcript){
        q.value=[q.value.trim(),transcript].filter(Boolean).join(q.value.trim()?' ':'');
        hideIntentPreview();
        go.hidden=false;
      }
    });
    recognition.addEventListener('end',()=>{
      voiceInput.disabled=false;
      voiceInput.removeAttribute('aria-pressed');
      voiceInput.textContent='🎙 Puhu';
      q.focus({preventScroll:true});
    });
    recognition.addEventListener('error',()=>{
      showError('door','Puheentunnistus ei onnistunut. Voit jatkaa kirjoittamalla.');
    });
    recognition.start();
  });
}

async function run(text,{source='door',retry=false}={}){
  if(running)return false;

  const clean=text.trim();
  if(!clean)return false;

  clearError(source);

  if(!retry){
    lastAttempt={
      source,
      text:clean,
      history:[...history]
    };
  }else if(lastAttempt){
    history=[...lastAttempt.history];
  }

  const raccoonTarget=source==='door'?doorRaccoon:workRaccoon;
  const timer=startRaccoon(raccoonTarget);

  setBusy(source,true);

  try{
    const headers=await labRequestHeaders();
    const response=await fetch('/api/lab/intent',{
      method:'POST',
      credentials:'same-origin',
      headers,
      body:JSON.stringify({
        text:clean,
        locale:'fi',
        history,
        workspace:workspaceForIntent(activeWorkspace)
      })
    });

    const payload=await response.json().catch(()=>({}));

    if(!response.ok||!payload.ok){
      if(response.status===401||response.status===403){
        labCsrf='';
        labSessionChecked=false;
      }
      throw new Error(payload.message||payload.error||'Ajo epäonnistui.');
    }

    addHistory(clean,payload);

    if(activeWorkspace){
      activeWorkspace=persistRun(activeWorkspace,{
        history,
        turns,
        payload
      });
    }

    renderResult(payload,{initial:source==='door'});
    renderWorkspace();
    return true;
  }catch(error){
    const message=String(error?.message||'Ajo epäonnistui.');
    showError(source,message);
    return false;
  }finally{
    stopRaccoon(timer,raccoonTarget);
    setBusy(source,false);
  }
}

function resetWork(){
  history=[];
  turns=[];
  lastAttempt=null;
  currentMutation=null;
  clearActiveWorkspace();
  activeWorkspace=null;

  work.hidden=true;
  door.hidden=false;

  continueInput.value='';
  q.value='';
  hideIntentPreview();
  go.hidden=false;
  attachmentInput.value='';
  syncAttachmentSummary();

  clearError('door');
  clearError('work');

  $('#chainDetails').hidden=true;
  $('#chainList').replaceChildren();

  requestAnimationFrame(()=>{
    window.scrollTo({top:0,behavior:'auto'});
    q.focus({preventScroll:true});
  });
}

function bindShortcut(textarea,form){
  textarea.addEventListener('keydown',event=>{
    if(event.key!=='Enter')return;
    if(!(event.ctrlKey||event.metaKey))return;
    event.preventDefault();
    form.requestSubmit();
  });
}

$('#f').addEventListener('submit',async event=>{
  event.preventDefault();
  const text=q.value.trim();
  if(!text)return;

  history=[];
  turns=[];
  lastAttempt=null;
  if(!activeWorkspace||activeWorkspace.latestPayload){
    activeWorkspace=createWorkspace(text,{persist:false});
  }else{
    activeWorkspace={...activeWorkspace,title:text.slice(0,64)||activeWorkspace.title};
  }
  renderWorkspace();
  syncAttachmentSummary();

  await preview(text);
});

previewStart.addEventListener('click',async()=>{
  if(!pendingText||running)return;
  const text=pendingText;
  intentPreview.hidden=true;
  go.hidden=true;
  await run(text,{source:'door'});
});

previewEdit.addEventListener('click',()=>{
  hideIntentPreview();
  go.hidden=false;
  q.focus({preventScroll:true});
});

q.addEventListener('input',()=>{
  if(intentPreview.hidden)return;
  hideIntentPreview();
  go.hidden=false;
});

attachmentInput.addEventListener('change',async event=>{
  await addSelectedFiles(event.target.files);
  event.target.value='';
});

setupVoiceInput();
$('#mutationExecute').addEventListener('click',executeCurrentMutation);

continueForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const text=continueInput.value.trim();
  if(!text)return;

  const ok=await run(text,{source:'work'});
  if(ok){
    continueInput.value='';
  }
});

doorRetry.addEventListener('click',async()=>{
  if(!lastAttempt)return;
  if(lastAttempt.source==='preview'){
    await preview(lastAttempt.text,{retry:true});
    return;
  }
  if(lastAttempt.source==='door'){
    await run(lastAttempt.text,{source:'door',retry:true});
  }
});

workRetry.addEventListener('click',async()=>{
  if(!lastAttempt||lastAttempt.source!=='work')return;
  await run(lastAttempt.text,{source:'work',retry:true});
});

$('#back').addEventListener('click',resetWork);

bindShortcut(q,$('#f'));
bindShortcut(continueInput,continueForm);

$('#workspaceTitle').addEventListener('change',event=>{
  if(!activeWorkspace)return;
  activeWorkspace=renameWorkspace(activeWorkspace,event.target.value);
  renderWorkspace();
});

$('#materialForm').addEventListener('submit',event=>{
  event.preventDefault();
  if(!activeWorkspace)return;

  const title=$('#materialTitle').value.trim();
  const content=$('#materialContent').value.trim();
  if(!title&&!content)return;

  activeWorkspace=addMaterial(activeWorkspace,{title,content});
  $('#materialTitle').value='';
  $('#materialContent').value='';
  renderWorkspace();
});

$('#materialList').addEventListener('click',event=>{
  const button=event.target.closest('[data-remove-material]');
  if(!button||!activeWorkspace)return;

  activeWorkspace=removeMaterial(activeWorkspace,button.dataset.removeMaterial);
  renderWorkspace();
});

$('#saveVersion').addEventListener('click',()=>{
  if(!activeWorkspace?.latestPayload?.result)return;

  activeWorkspace=addVersion(activeWorkspace,{
    label:$('#versionLabel').value.trim(),
    result:activeWorkspace.latestPayload.result,
    turnCount:turns.length
  });

  $('#versionLabel').value='';
  renderWorkspace();
});

$('#leaveWorkspace').addEventListener('click',()=>{
  resetWork();
  renderRecentWorkspaces();
});

$('#recentWorkList').addEventListener('click',event=>{
  const button=event.target.closest('[data-workspace-id]');
  if(!button)return;

  const workspace=setActiveWorkspace(button.dataset.workspaceId);
  if(!workspace)return;

  resumeWorkspace(workspace);
});

renderRecentWorkspaces();
syncAttachmentSummary();

if(activeWorkspace?.latestPayload?.result){
  resumeWorkspace(activeWorkspace);
}else{
  renderWorkspace();
}


/* LIGHTHOUSE DEPTH ACCORDION START */

const DEPTH_PANEL_IDS=[
  'trustDetails',
  'workspaceDetails',
  'orchestraDetails',
  'machineDetails',
  'coreDetails',
  'rawRuntimeDetails'
];

const depthPanels=DEPTH_PANEL_IDS
  .map(id=>document.getElementById(id))
  .filter(Boolean);

function closeOtherDepthPanels(activePanel){
  for(const panel of depthPanels){
    if(panel!==activePanel && panel.open){
      panel.open=false;
    }
  }
}

for(const panel of depthPanels){
  panel.addEventListener('toggle',()=>{
    if(!panel.open)return;
    closeOtherDepthPanels(panel);
  });
}

/* LIGHTHOUSE DEPTH ACCORDION END */

/* LIGHTHOUSE RESPONSIVE SHELL START */

const RESPONSIVE_DEPTHS=[
  {
    id:'trustDetails',
    short:'D2',
    label:'Lähteet ja perustelut'
  },
  {
    id:'workspaceDetails',
    short:'D3',
    label:'Aineisto ja työtila'
  },
  {
    id:'orchestraDetails',
    short:'D4',
    label:'Miten tämä tehtiin'
  },
  {
    id:'machineDetails',
    short:'D5',
    label:'Konehuone'
  },
  {
    id:'coreDetails',
    short:'D6',
    label:'Core'
  }
];

const responsiveDepthIds=new Set(
  RESPONSIVE_DEPTHS.map(item=>item.id)
);

const desktopShellQuery=window.matchMedia('(min-width:1100px)');
const mobileShellQuery=window.matchMedia('(max-width:719px)');

const depthInspector=document.getElementById('depthInspector');
const depthInspectorBody=document.getElementById('depthInspectorBody');
const depthInspectorEmpty=document.getElementById('depthInspectorEmpty');
const depthInspectorTitle=document.getElementById('depthInspectorTitle');
const depthBack=document.getElementById('depthBack');
const mobileDepthNav=document.getElementById('mobileDepthNav');
const desktopDepthTabs=document.getElementById('desktopDepthTabs');
const moreDepthButton=document.getElementById('moreDepthButton');
const moreDepthMenu=document.getElementById('moreDepthMenu');
const moreDepthClose=document.getElementById('moreDepthClose');

let selectedResponsiveDepth=null;
let lastResponsiveDepthLauncher=null;

function responsiveDepthMeta(id){
  return RESPONSIVE_DEPTHS.find(item=>item.id===id)||null;
}

function responsiveDepthPanel(id){
  return document.getElementById(id);
}

function moveDepthPanelsIntoInspector(){
  for(const item of RESPONSIVE_DEPTHS){
    const panel=responsiveDepthPanel(item.id);
    if(panel && panel.parentElement!==depthInspectorBody){
      depthInspectorBody.append(panel);
    }
  }

  const raw=document.getElementById('rawRuntimeDetails');
  if(raw && raw.parentElement!==depthInspectorBody){
    depthInspectorBody.append(raw);
  }
}

function setDepthButtonState(id){
  document
    .querySelectorAll('[data-depth-target]')
    .forEach(button=>{
      const active=button.dataset.depthTarget===id;
      button.classList.toggle('is-active',active);

      button.setAttribute('aria-pressed',active?'true':'false');

      if(active){
        button.setAttribute('aria-current','true');
      }else{
        button.removeAttribute('aria-current');
      }
    });
}

function hideResponsiveDepthPanels(){
  for(const item of RESPONSIVE_DEPTHS){
    const panel=responsiveDepthPanel(item.id);
    if(panel){
      panel.hidden=true;
      panel.open=false;
    }
  }

  const raw=document.getElementById('rawRuntimeDetails');
  if(raw){
    raw.hidden=true;
    raw.open=false;
  }
}

function showResponsiveDepth(id,{focus=false}={}){
  const meta=responsiveDepthMeta(id);
  const panel=responsiveDepthPanel(id);

  if(!meta||!panel)return;

  selectedResponsiveDepth=id;

  hideResponsiveDepthPanels();

  panel.hidden=false;
  panel.open=true;

  if(id==='coreDetails'){
    const raw=document.getElementById('rawRuntimeDetails');
    if(raw){
      raw.hidden=false;
    }
  }

  depthInspectorEmpty.hidden=true;
  depthInspectorTitle.textContent=`${meta.short} · ${meta.label}`;
  setDepthButtonState(id);

  if(!desktopShellQuery.matches){
    work.classList.add('depth-screen-open');

    requestAnimationFrame(()=>{
      window.scrollTo({top:0,behavior:'auto'});
      if(focus){
        depthBack.focus({preventScroll:true});
      }
    });
  }else{
    work.classList.remove('depth-screen-open');
  }
}

function closeResponsiveDepth({focusLauncher=false}={}){
  const closingDepth=selectedResponsiveDepth;
  selectedResponsiveDepth=null;
  hideResponsiveDepthPanels();

  depthInspectorEmpty.hidden=false;
  depthInspectorTitle.textContent='Valitse lisätieto';
  setDepthButtonState(null);

  work.classList.remove('depth-screen-open');

  if(focusLauncher && !desktopShellQuery.matches){
    requestAnimationFrame(()=>{
      const fallback=closingDepth
        ?mobileDepthNav?.querySelector(
          `[data-depth-target="${closingDepth}"]`
        )
        :null;

      const target=
        lastResponsiveDepthLauncher?.isConnected
          ?lastResponsiveDepthLauncher
          :fallback||mobileDepthNav?.querySelector('button');

      target?.focus({preventScroll:true});
    });
  }
}

function syncResponsiveShell(){
  moveDepthPanelsIntoInspector();

  const desktop=desktopShellQuery.matches;
  const mobile=mobileShellQuery.matches;

  work.dataset.layout=desktop
    ?'desktop'
    :mobile
      ?'mobile'
      :'compact';

  depthBack.hidden=desktop;

  if(desktop){
    work.classList.remove('depth-screen-open');

    if(selectedResponsiveDepth){
      showResponsiveDepth(selectedResponsiveDepth);
    }else{
      hideResponsiveDepthPanels();
      depthInspectorEmpty.hidden=false;
    }

    return;
  }

  if(selectedResponsiveDepth){
    showResponsiveDepth(selectedResponsiveDepth);
  }else{
    work.classList.remove('depth-screen-open');
    hideResponsiveDepthPanels();
    depthInspectorEmpty.hidden=false;
  }
}

function depthTargetFromEvent(event){
  const button=event.target.closest('[data-depth-target]');
  if(!button)return null;

  const id=button.dataset.depthTarget;
  return responsiveDepthIds.has(id)?id:null;
}

function openMoreDepthMenu(){
  if(!moreDepthMenu||!moreDepthButton)return;
  moreDepthMenu.hidden=false;
  moreDepthButton.setAttribute('aria-expanded','true');
  document.body.classList.add('depth-menu-open');
  requestAnimationFrame(()=>{
    moreDepthMenu.querySelector('[data-depth-target]')?.focus({preventScroll:true});
  });
}

function closeMoreDepthMenu({focus=false}={}){
  if(!moreDepthMenu||!moreDepthButton)return;
  moreDepthMenu.hidden=true;
  moreDepthButton.setAttribute('aria-expanded','false');
  document.body.classList.remove('depth-menu-open');
  if(focus){
    requestAnimationFrame(()=>moreDepthButton.focus({preventScroll:true}));
  }
}

mobileDepthNav?.addEventListener('click',event=>{
  const button=event.target.closest('[data-depth-target]');
  const id=depthTargetFromEvent(event);
  if(!id||!button)return;

  lastResponsiveDepthLauncher=button;
  showResponsiveDepth(id,{focus:true});
});

moreDepthButton?.addEventListener('click',()=>{
  if(moreDepthMenu?.hidden)openMoreDepthMenu();
  else closeMoreDepthMenu({focus:true});
});

moreDepthClose?.addEventListener('click',()=>{
  closeMoreDepthMenu({focus:true});
});

moreDepthMenu?.addEventListener('click',event=>{
  if(event.target===moreDepthMenu){
    closeMoreDepthMenu({focus:true});
    return;
  }
  const button=event.target.closest('[data-depth-target]');
  const id=button?.dataset.depthTarget;
  if(!id||!responsiveDepthIds.has(id))return;
  lastResponsiveDepthLauncher=moreDepthButton;
  closeMoreDepthMenu();
  showResponsiveDepth(id,{focus:true});
});

desktopDepthTabs?.addEventListener('click',event=>{
  const id=depthTargetFromEvent(event);
  if(!id)return;

  if(selectedResponsiveDepth===id){
    closeResponsiveDepth();
  }else{
    showResponsiveDepth(id);
  }
});

depthBack?.addEventListener('click',()=>{
  closeResponsiveDepth({focusLauncher:true});
});

$('#back')?.addEventListener('click',()=>{
  closeResponsiveDepth();
});

desktopShellQuery.addEventListener?.('change',syncResponsiveShell);
mobileShellQuery.addEventListener?.('change',syncResponsiveShell);

moveDepthPanelsIntoInspector();
syncResponsiveShell();

/* Keep the shell correct after a restored/new result changes panel visibility. */
const responsiveShellObserver=new MutationObserver(()=>{
  if(work.hidden)return;
  if(selectedResponsiveDepth){
    const selected=responsiveDepthPanel(selectedResponsiveDepth);
    if(selected?.hidden && selectedResponsiveDepth!=='workspaceDetails'){
      closeResponsiveDepth();
    }
  }
});

responsiveShellObserver.observe(work,{
  attributes:true,
  attributeFilter:['hidden'],
  subtree:false
});

/* LIGHTHOUSE RESPONSIVE SHELL END */

/* LIGHTHOUSE RESPONSIVE QA START */

document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  if(!moreDepthMenu?.hidden){
    event.preventDefault();
    closeMoreDepthMenu({focus:true});
    return;
  }
  if(desktopShellQuery.matches)return;
  if(!work.classList.contains('depth-screen-open'))return;

  event.preventDefault();
  closeResponsiveDepth({focusLauncher:true});
});

/*
 * If a depth launcher receives keyboard activation, remember it so focus
 * returns to the exact control after leaving the pushed inspection screen.
 */
for(const button of mobileDepthNav?.querySelectorAll('[data-depth-target]')||[]){
  button.addEventListener('focus',()=>{
    lastResponsiveDepthLauncher=button;
  });
}

/* LIGHTHOUSE RESPONSIVE QA END */
