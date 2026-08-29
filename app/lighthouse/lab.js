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
        history
      })
    });

    const payload=await response.json().catch(()=>({}));

    if(!response.ok||!payload.ok){
      throw new Error(payload.error||'Ajo epäonnistui.');
    }

    addHistory(clean,payload);
    renderResult(payload,{initial:source==='door'});
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
