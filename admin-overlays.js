const q=s=>document.querySelector(s);
const registry=new Map();
let activeName='',lastTrigger=null,inerted=[];

function resolve(value){return typeof value==='string'?q(value):value||null;}
function getFocusable(root){
  if(!root)return[];
  return [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true');
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
  if(entry.kind==='dialog'&&root){
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
  window.dispatchEvent(new CustomEvent('anomancer:overlay-open',{detail:{name}}));
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
  window.dispatchEvent(new CustomEvent('anomancer:overlay-close',{detail:{name}}));
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

window.anomancerOverlays={register,open,close,toggle,closeAll,active:()=>activeName};
