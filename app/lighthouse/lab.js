const $=s=>document.querySelector(s);

const door=$('#door');
const work=$('#work');
const q=$('#q');
const go=$('#go');
const status=$('#status');
const doorRaccoon=$('#doorRaccoon');

const continueForm=$('#continueForm');
const continueInput=$('#continueInput');
const continueButton=$('#continueButton');
const workStatus=$('#workStatus');
const workRaccoon=$('#workRaccoon');

let history=[];

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
  let i=Math.floor(Math.random()*RACCOON_LINES.length);
  target.textContent=RACCOON_LINES[i];
  return setInterval(()=>{
    i=(i+1)%RACCOON_LINES.length;
    target.textContent=RACCOON_LINES[i];
  },2300);
}

function stopRaccoon(timer,target){
  if(timer)clearInterval(timer);
  target.textContent='';
}

function setDoorBusy(busy){
  go.disabled=busy;
  q.disabled=busy;
  go.textContent=busy?'Työskennellään…':'Jatka';
  status.textContent=busy?'Työskennellään…':'';
}

function setWorkBusy(busy){
  continueButton.disabled=busy;
  continueInput.disabled=busy;
  continueButton.textContent=busy?'Työskennellään…':'Jatka';
  workStatus.textContent=busy?'Jatketaan työtä…':'';
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
        continuation:'Täydennä tähän'
      };
    case 'needs_approval':
      return {
        eyebrow:'PÄÄTÖS TARVITAAN',
        label:'Odottaa hyväksyntää',
        continuation:'Kerro miten jatketaan'
      };
    case 'blocked':
      return {
        eyebrow:'TYÖ PYSÄHTYI',
        label:'Estynyt',
        continuation:'Anna lisätietoa tai muuta tavoitetta'
      };
    default:
      return {
        eyebrow:'TÄSSÄ ON OLENNAISIN',
        label:'',
        continuation:'Jatka tästä'
      };
  }
}

function renderResult(payload){
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
  continueInput.placeholder=result.state==='needs_input'
    ?'Kirjoita puuttuva tieto tähän.'
    :'Kirjoita jatko, tarkennus tai uusi kysymys tästä työstä.';

  $('#runtime').textContent=[
    `capability: ${runtime.capability||''}`,
    `provider: ${runtime.provider||''}`,
    `model: ${runtime.model||''}`,
    `duration: ${runtime.durationMs||0} ms`
  ].join('\n');

  door.hidden=true;
  work.hidden=false;
  window.scrollTo({top:0,behavior:'instant'});
}

function addHistory(userText,payload){
  history.push({role:'user',content:userText});
  const result=payload?.result||{};
  const assistant=[
    result.title,
    result.answer,
    ...(result.questions||[]).map(x=>`Kysymys: ${x}`),
    result.uncertainty?`Epävarmuus: ${result.uncertainty}`:''
  ].filter(Boolean).join('\n\n');

  if(assistant)history.push({role:'assistant',content:assistant});
  history=history.slice(-8);
}

async function run(text,{source='door'}={}){
  const isDoor=source==='door';
  const raccoonTarget=isDoor?doorRaccoon:workRaccoon;
  const timer=startRaccoon(raccoonTarget);

  if(isDoor)setDoorBusy(true);
  else setWorkBusy(true);

  try{
    const response=await fetch('/api/lab/intent',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        text,
        locale:'fi',
        history
      })
    });

    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.ok){
      throw new Error(payload.error||'Ajo epäonnistui.');
    }

    addHistory(text,payload);
    renderResult(payload);

    if(payload.result?.state==='needs_input'){
      requestAnimationFrame(()=>continueInput.focus());
    }

    return true;
  }catch(error){
    const message=String(error?.message||'Ajo epäonnistui.');
    if(isDoor)status.textContent=message;
    else workStatus.textContent=message;
    return false;
  }finally{
    stopRaccoon(timer,raccoonTarget);
    if(isDoor){
      go.disabled=false;
      q.disabled=false;
      go.textContent='Jatka';
    }else{
      continueButton.disabled=false;
      continueInput.disabled=false;
      continueButton.textContent='Jatka';
    }
  }
}

$('#f').addEventListener('submit',async event=>{
  event.preventDefault();
  const text=q.value.trim();
  if(!text)return;
  history=[];
  await run(text,{source:'door'});
});

continueForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const text=continueInput.value.trim();
  if(!text)return;

  const ok=await run(text,{source:'work'});
  if(ok)continueInput.value='';
});

$('#back').addEventListener('click',()=>{
  history=[];
  work.hidden=true;
  door.hidden=false;
  continueInput.value='';
  workStatus.textContent='';
  q.focus();
});
