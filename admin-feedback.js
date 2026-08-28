const q=s=>document.querySelector(s);

const host=q('#systemFeedbackCenter');
let dismissTimer=0;
let lastKey='';

function toneName(value=''){
  const tone=String(value||'').toLowerCase();
  if(['error','err','danger','failed','fail'].includes(tone))return'error';
  if(['ok','success','done','saved'].includes(tone))return'ok';
  if(['warn','warning','attention'].includes(tone))return'warning';
  return'info';
}
function cleanMessage(message=''){
  return String(message??'').replace(/^[✓✗]\s*/,'').trim();
}
function clear(){
  clearTimeout(dismissTimer);
  dismissTimer=0;
  if(!host)return;
  host.hidden=true;
  host.textContent='';
  host.dataset.tone='';
  lastKey='';
}
function show(message,{tone='info',source='',timeout}={}){
  if(!host)return;
  const text=cleanMessage(message);
  if(!text){clear();return;}
  const normalized=toneName(tone),key=`${normalized}|${source}|${text}`;
  if(key===lastKey&&host.hidden===false)return;
  lastKey=key;
  clearTimeout(dismissTimer);
  host.hidden=false;
  host.dataset.tone=normalized;
  host.replaceChildren();
  const body=document.createElement('div');
  body.className='system-feedback-body';
  if(source){
    const label=document.createElement('span');
    label.className='system-feedback-source';
    label.textContent=source;
    body.append(label);
  }
  const messageNode=document.createElement('strong');
  messageNode.textContent=text;
  body.append(messageNode);
  const close=document.createElement('button');
  close.type='button';
  close.className='system-feedback-close';
  close.setAttribute('aria-label','Sulje järjestelmäpalaute');
  close.textContent='×';
  close.addEventListener('click',clear,{once:true});
  host.append(body,close);
  const duration=Number.isFinite(timeout)?Number(timeout):(normalized==='error'?9000:normalized==='warning'?7000:normalized==='ok'?4500:2600);
  if(duration>0)dismissTimer=setTimeout(clear,duration);
}
function report(message,tone='',source=''){
  const text=cleanMessage(message);
  if(!text)return;
  const normalized=toneName(tone);
  const loading=/\b(ladataan|tallennetaan|lähetetään|haetaan|ajetaan|valmistellaan|päivitetään)\b/i.test(text);
  show(text,{tone:normalized,source,timeout:loading?0:undefined});
}
window.addEventListener('anomancer:feedback',event=>show(event.detail?.message||'',event.detail||{}));
window.anomancerFeedback={show,report,clear};
