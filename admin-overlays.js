import {runtime} from './admin-runtime.js';
const q=s=>document.querySelector(s);
const registry=new Map();
let activeName='',lastTrigger=null,inerted=[];
let systemPending=null;

function resolve(value){return typeof value==='string'?q(value):value||null;}
function getFocusable(root){
  if(!root)return[];
  return [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true');
}
function setInert(selectors=[],value){
  if(value){
    inerted=[];
    for(const selector of selectors){
      for(const el of document.querySelectorAll(selector)){
        if(el.hasAttribute('inert'))continue;
        el.setAttribute('inert','');inerted.push(el);
      }
    }
  }else{
    for(const el of inerted)el.removeAttribute('inert');
    inerted=[];
  }
}
function register(name,config={}){
  registry.set(name,{kind:'custom',bodyClass:'',inertSelectors:[],focusSelector:'',...config});
  const entry=registry.get(name),root=resolve(entry.element);
  if(entry.kind==='dialog'&&root&&!root.dataset.overlayRegistered){
    root.dataset.overlayRegistered='true';
    root.addEventListener('cancel',event=>{event.preventDefault();close(name);});
    root.addEventListener('close',()=>{if(activeName===name)finishClose(name);});
  }
  return entry;
}
function open(name,trigger=document.activeElement){
  const entry=registry.get(name),root=resolve(entry?.element);if(!entry||!root)return false;
  if(activeName&&activeName!==name)close(activeName,{restore:false});
  activeName=name;lastTrigger=trigger instanceof HTMLElement?trigger:null;
  setInert(entry.inertSelectors,true);
  if(entry.bodyClass)document.body.classList.add(entry.bodyClass);
  if(entry.kind==='dialog'){
    if(!root.open)root.showModal();
  }else{
    root.classList.add('is-open');root.setAttribute('aria-hidden','false');
    const backdrop=resolve(entry.backdrop);if(backdrop)backdrop.classList.add('is-open');
  }
  entry.onOpen?.();
  queueMicrotask(()=>{
    const preferred=entry.focusSelector?root.querySelector(entry.focusSelector):null;
    (preferred||getFocusable(root)[0]||root).focus?.({preventScroll:true});
  });
  runtime.events.emit('overlay-open',{name});
  return true;
}
function finishClose(name,{restore=true}={}){
  const entry=registry.get(name);if(!entry)return;
  if(entry.bodyClass)document.body.classList.remove(entry.bodyClass);
  setInert(entry.inertSelectors,false);
  entry.onClose?.();
  activeName='';
  const trigger=lastTrigger;lastTrigger=null;
  if(restore&&trigger?.isConnected)queueMicrotask(()=>trigger.focus?.({preventScroll:true}));
  runtime.events.emit('overlay-close',{name});
}
function close(name=activeName,{restore=true}={}){
  if(!name)return false;const entry=registry.get(name),root=resolve(entry?.element);if(!entry||!root)return false;
  if(entry.kind==='dialog'){
    if(root.open){root.close();if(activeName===name)finishClose(name,{restore});}
    else if(activeName===name)finishClose(name,{restore});
  }else{
    root.classList.remove('is-open');root.setAttribute('aria-hidden','true');
    const backdrop=resolve(entry.backdrop);if(backdrop)backdrop.classList.remove('is-open');
    if(activeName===name)finishClose(name,{restore});
  }
  return true;
}
function toggle(name,trigger=document.activeElement){return activeName===name?close(name):open(name,trigger);}
function closeAll(){if(activeName)close(activeName);}

function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function systemRoot(){return q('#coreSystemDialog');}
function settleSystem(value){
  if(!systemPending)return;
  const pending=systemPending;systemPending=null;
  pending.resolve(value);
}
function renderSystemFields(fields=[]){
  const host=q('#coreSystemFields');if(!host)return;
  host.innerHTML=fields.map((field,index)=>{
    const id=`coreSystemField-${index}`,type=field.type==='textarea'?'textarea':'input';
    const attrs=[`id="${id}"`,`data-system-field="${esc(field.name||String(index))}"`];
    if(type==='input')attrs.push(`type="${esc(field.type||'text')}"`);
    if(field.required)attrs.push('required');
    if(field.maxLength)attrs.push(`maxlength="${Number(field.maxLength)}"`);
    if(field.placeholder)attrs.push(`placeholder="${esc(field.placeholder)}"`);
    const control=type==='textarea'
      ?`<textarea ${attrs.join(' ')} rows="${Number(field.rows||3)}">${esc(field.value||'')}</textarea>`
      :`<input ${attrs.join(' ')} value="${esc(field.value||'')}">`;
    return `<label><span>${esc(field.label||field.name||'Arvo')}</span>${control}${field.hint?`<small>${esc(field.hint)}</small>`:''}</label>`;
  }).join('');
}
function showSystem({kind='confirm',title='Vahvista toiminto',message='',details='',confirmLabel='Jatka',cancelLabel='Peruuta',destructive=false,fields=[]}={}){
  const root=systemRoot();if(!root)return Promise.resolve(kind==='notice'?true:(kind==='form'?null:false));
  if(systemPending){settleSystem(systemPending.kind==='notice'?true:(systemPending.kind==='form'?null:false));}
  q('#coreSystemDialogKicker').textContent=destructive?'IHMISEN HYVÄKSYNTÄ / VAHVISTUS':'ANOMANCER CORE / VAHVISTUS';
  q('#coreSystemDialogTitle').textContent=title;
  q('#coreSystemDialogMessage').textContent=message;
  const detail=q('#coreSystemDialogDetails');detail.textContent=details||'';detail.hidden=!details;
  const confirmButton=q('#coreSystemConfirm'),cancelButton=q('#coreSystemCancel');
  confirmButton.textContent=confirmLabel;
  confirmButton.className=destructive?'danger':'primary';
  cancelButton.textContent=cancelLabel;
  cancelButton.hidden=kind==='notice';
  renderSystemFields(fields);
  root.dataset.kind=kind;root.dataset.destructive=destructive?'true':'false';
  const promise=new Promise(resolve=>{systemPending={resolve,kind,fields};});
  open('system-dialog',document.activeElement);
  const firstField=q('#coreSystemFields input,#coreSystemFields textarea');
  if(firstField)queueMicrotask(()=>firstField.focus({preventScroll:true}));
  return promise;
}
function collectSystemForm(){
  const values={};
  for(const input of document.querySelectorAll('#coreSystemFields [data-system-field]'))values[input.dataset.systemField]=input.value;
  return values;
}
function confirmDialog(message,options={}){return showSystem({kind:'confirm',message,...options});}
function notice(message,options={}){return showSystem({kind:'notice',title:options.title||'Huomio',message,confirmLabel:options.confirmLabel||'Sulje',...options});}
function promptDialog(message,defaultValue='',options={}){
  const name=options.name||'value';
  return showSystem({kind:'form',message,title:options.title||'Anna tieto',confirmLabel:options.confirmLabel||'Hyväksy',fields:[{name,label:options.label||'Arvo',value:defaultValue,required:options.required,maxLength:options.maxLength,placeholder:options.placeholder}],...options})
    .then(result=>result===null?null:result[name]??'');
}
function formDialog(options={}){return showSystem({kind:'form',...options});}

register('system-dialog',{kind:'dialog',element:'#coreSystemDialog',inertSelectors:['#appView','#loginView','.mobile-command-portal'],focusSelector:'#coreSystemConfirm',onClose:()=>{
  if(systemPending)settleSystem(systemPending.kind==='notice'?true:(systemPending.kind==='form'?null:false));
}});
q('#coreSystemConfirm')?.addEventListener('click',()=>{
  const root=systemRoot();if(!root)return;
  if(root.dataset.kind==='form'){
    const invalid=[...root.querySelectorAll('#coreSystemFields input,#coreSystemFields textarea')].find(input=>!input.checkValidity());
    if(invalid){invalid.reportValidity();invalid.focus();return;}
    settleSystem(collectSystemForm());
  }else settleSystem(true);
  close('system-dialog');
});
q('#coreSystemCancel')?.addEventListener('click',()=>{
  const kind=systemRoot()?.dataset.kind||'confirm';settleSystem(kind==='form'?null:false);close('system-dialog');
});
systemRoot()?.addEventListener('click',event=>{
  if(event.target!==systemRoot())return;
  const kind=systemRoot()?.dataset.kind||'confirm';settleSystem(kind==='form'?null:false);close('system-dialog');
});

document.addEventListener('keydown',event=>{
  if(!activeName)return;
  const entry=registry.get(activeName),root=resolve(entry?.element);if(!entry||!root)return;
  if(event.key==='Escape'){event.preventDefault();close(activeName);return;}
  if(event.key!=='Tab'||entry.kind==='dialog')return;
  const nodes=getFocusable(root);if(!nodes.length){event.preventDefault();root.focus?.();return;}
  const first=nodes[0],last=nodes.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});

runtime.provide('overlays',{register,open,close,toggle,closeAll,active:()=>activeName});
runtime.provide('dialogs',{confirm:confirmDialog,prompt:promptDialog,form:formDialog,notice});
