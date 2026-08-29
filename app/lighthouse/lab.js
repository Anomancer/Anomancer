const $=s=>document.querySelector(s),door=$('#door'),work=$('#work'),q=$('#q'),go=$('#go'),status=$('#status');
$('#f').addEventListener('submit',async e=>{
  e.preventDefault(); const text=q.value.trim(); if(!text)return;
  go.disabled=q.disabled=true; go.textContent='Työskennellään…'; status.textContent='Selvitetään olennaista…';
  try{
    const r=await fetch('/api/lab/intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,locale:'fi'})});
    const x=await r.json(); if(!r.ok||!x.ok)throw new Error(x.error||'Ajo epäonnistui.');
    $('#title').textContent=x.result.title; $('#answer').textContent=x.result.answer;
    $('#steps').replaceChildren(...(x.result.nextSteps||[]).map(v=>{const li=document.createElement('li');li.textContent=v;return li}));
    $('#next').hidden=!(x.result.nextSteps||[]).length; $('#uncText').textContent=x.result.uncertainty||''; $('#unc').hidden=!x.result.uncertainty;
    $('#runtime').textContent=`capability: ${x.runtime.capability}\nprovider: ${x.runtime.provider}\nmodel: ${x.runtime.model}\nduration: ${x.runtime.durationMs} ms`;
    door.hidden=true; work.hidden=false; status.textContent='';
  }catch(err){status.textContent=err.message||'Ajo epäonnistui.'}
  finally{go.disabled=q.disabled=false;go.textContent='Jatka';}
});
$('#back').addEventListener('click',()=>{work.hidden=true;door.hidden=false;q.focus()});
