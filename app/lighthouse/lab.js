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
  hasLocalWorkspaceStorage
} from '/lighthouse/workspace-store.js';

const $=selector=>document.querySelector(selector);

const door=$('#door');
const work=$('#work');
const resultCard=$('#resultCard');

const q=$('#q');
const go=$('#go');

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
      :String(mancer?.label||mancer?.id||'Mancer');
    return li;
  }));

  $('#orchestraMancers').hidden=!mancers.length;
  $('#orchestraNoMancers').hidden=Boolean(mancers.length);
  $('#orchestraNoMancers').textContent=
    orchestration.mancerNote||
    'Erillisiä Mancer-paketteja ei käynnistetty tässä ajossa.';

  const router=orchestration.router||{};
  $('#orchestraRouterMode').textContent=
    router.mode==='fixed'?'Kiinteä reitti':String(router.mode||'');
  $('#orchestraRouterReason').textContent=router.reason||'';

  if(!router.reason){
    $('#orchestraRouterReason').textContent=
      'Reitityspäätökselle ei tallentunut erillistä perustelua.';
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

  renderTrust(result.trust||{});
  renderOrchestration(runtime.orchestration||{});

  $('#runtime').textContent=[
    `capability: ${runtime.capability||''}`,
    `provider: ${runtime.provider||''}`,
    `model: ${runtime.model||''}`,
    `duration: ${runtime.durationMs||0} ms`
  ].join('\n');

  door.hidden=true;
  work.hidden=false;

  renderChain();
  updateTurnCount();

  if(initial){
    requestAnimationFrame(()=>{
      window.scrollTo({top:0,behavior:'instant'});
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
  $('#workspaceStorageStatus').textContent=hasLocalWorkspaceStorage()
    ?'Tallennettu automaattisesti tähän selaimeen.'
    :'Paikallinen tallennus ei ole käytettävissä.';

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
    result,
    runtime:payload?.runtime||{}
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
    const response=await fetch('/api/lab/intent',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        text:clean,
        locale:'fi',
        history,
        workspace:workspaceForIntent(activeWorkspace)
      })
    });

    const payload=await response.json().catch(()=>({}));

    if(!response.ok||!payload.ok){
      throw new Error(payload.error||'Ajo epäonnistui.');
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
  clearActiveWorkspace();
  activeWorkspace=null;

  work.hidden=true;
  door.hidden=false;

  continueInput.value='';
  q.value='';

  clearError('door');
  clearError('work');

  $('#chainDetails').hidden=true;
  $('#chainList').replaceChildren();

  requestAnimationFrame(()=>{
    window.scrollTo({top:0,behavior:'instant'});
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
  activeWorkspace=createWorkspace(text);
  renderWorkspace();

  await run(text,{source:'door'});
});

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
  if(!lastAttempt||lastAttempt.source!=='door')return;
  await run(lastAttempt.text,{source:'door',retry:true});
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

if(activeWorkspace?.latestPayload?.result){
  resumeWorkspace(activeWorkspace);
}else{
  renderWorkspace();
}

