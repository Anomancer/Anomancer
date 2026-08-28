const LEGACY_ALIASES=Object.freeze({
  admin:'anomancerAdminBridge',
  dirty:'anomancerDirty',
  workspaces:'anomancerWorkspaces',
  shell:'anomancerShell',
  orchestrator:'anomancerOrchestrator',
  core:'anomancerCore',
  overlays:'anomancerOverlays',
  dialogs:'anomancerDialogs',
  feedback:'anomancerFeedback',
  archive:'anomancerArchive',
  narramancer:'anomancerNarramancer',
  mancer:'anomancerMancer',
  nanomancer:'anomancerNanomancer',
  operations:'anomancerOperations',
  agents:'anomancerAgents',
  orchestras:'anomancerOrchestras',
  machineRoom:'anomancerMachineRoom'
});

const services=new Map();
const eventTarget=globalThis.window||globalThis;

function eventName(name=''){
  const raw=String(name||'').trim();
  return raw.startsWith('anomancer:')?raw:`anomancer:${raw}`;
}

const events=Object.freeze({
  emit(name,detail={}){
    const type=eventName(name);
    eventTarget.dispatchEvent(new CustomEvent(type,{detail}));
    return type;
  },
  on(name,handler,options){
    const type=eventName(name);
    eventTarget.addEventListener(type,handler,options);
    return()=>eventTarget.removeEventListener(type,handler,options);
  },
  once(name,handler){
    const off=events.on(name,event=>{off();handler(event);});
    return off;
  }
});

function readyLater(name,legacyAlias='',source='runtime'){
  queueMicrotask(()=>events.emit('runtime-service-ready',{name,legacyAlias,source}));
}

function installLegacyAlias(name,alias){
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,alias);
  const initial=globalThis[alias];
  if(initial&&(typeof initial==='object'||typeof initial==='function'))services.set(name,initial);
  if(descriptor&&!descriptor.configurable)return false;
  Object.defineProperty(globalThis,alias,{
    configurable:true,
    enumerable:true,
    get(){return services.get(name)||null;},
    set(api){
      if(api===null||api===undefined){services.delete(name);return;}
      if(typeof api!=='object'&&typeof api!=='function')throw new TypeError(`Legacy runtime service ${name} tarvitsee API-olion.`);
      services.set(name,api);
      readyLater(name,alias,'legacy');
    }
  });
  return true;
}

const legacyAccessors=new Set();
for(const [name,alias] of Object.entries(LEGACY_ALIASES))if(installLegacyAlias(name,alias))legacyAccessors.add(alias);

function provide(name,api,{legacy=true}={}){
  const key=String(name||'').trim();
  if(!key)throw new TypeError('Runtime service tarvitsee nimen.');
  if(!api||(typeof api!=='object'&&typeof api!=='function'))throw new TypeError(`Runtime service ${key} tarvitsee API-olion.`);
  services.set(key,api);
  const alias=LEGACY_ALIASES[key];
  if(legacy&&alias){
    globalThis[alias]=api;
    if(!legacyAccessors.has(alias))readyLater(key,alias,'runtime');
  }else readyLater(key,alias||'','runtime');
  return api;
}

function service(name,{required=false}={}){
  const key=String(name||'').trim();
  let api=services.get(key)||null;
  if(!api){
    const alias=LEGACY_ALIASES[key];
    if(alias&&globalThis[alias]){
      api=globalThis[alias];
      services.set(key,api);
    }
  }
  if(required&&!api)throw new Error(`Runtime service puuttuu: ${key}`);
  return api;
}

function has(name){return Boolean(service(name));}
function list(){return [...new Set([...Object.keys(LEGACY_ALIASES),...services.keys()])].map(name=>({name,ready:Boolean(service(name)),legacyAlias:LEGACY_ALIASES[name]||''}));}

async function when(name,{timeout=8000}={}){
  const ready=service(name);if(ready)return ready;
  return await new Promise((resolve,reject)=>{
    let timer=null;
    const off=events.on('runtime-service-ready',event=>{
      if(event.detail?.name!==name)return;
      if(timer)clearTimeout(timer);off();resolve(service(name,{required:true}));
    });
    timer=setTimeout(()=>{off();reject(new Error(`Runtime service timeout: ${name}`));},Math.max(1,Number(timeout)||8000));
  });
}

export const runtime=Object.freeze({provide,service,has,list,when,events,legacyAliases:LEGACY_ALIASES});
