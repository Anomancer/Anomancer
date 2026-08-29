const STORAGE_KEY='anomancer:lighthouse:workspaces:v1';
const FORMAT='anomancer-lighthouse-workspaces/v1';
const MAX_WORKSPACES=12;
const MAX_MATERIALS=12;
const MAX_VERSIONS=20;
let lastWriteSucceeded=true;

function now(){
  return new Date().toISOString();
}

function id(prefix='ws'){
  if(globalThis.crypto?.randomUUID){
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
}

function clone(value){
  return JSON.parse(JSON.stringify(value));
}

function shortTitle(text){
  const clean=String(text||'').replace(/\s+/g,' ').trim();
  if(!clean)return 'Nimetön työ';
  return clean.length>64?`${clean.slice(0,63)}…`:clean;
}

function emptyStore(){
  return {
    format:FORMAT,
    activeId:null,
    items:[]
  };
}

function storageAvailable(){
  try{
    const key='__anomancer_lighthouse_storage_test__';
    localStorage.setItem(key,'1');
    localStorage.removeItem(key);
    return true;
  }catch{
    return false;
  }
}

function loadRaw(){
  if(!storageAvailable())return emptyStore();

  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(!parsed||parsed.format!==FORMAT||!Array.isArray(parsed.items)){
      return emptyStore();
    }
    return parsed;
  }catch{
    return emptyStore();
  }
}

function saveRaw(store){
  if(!storageAvailable()){
    lastWriteSucceeded=false;
    return false;
  }

  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({
      format:FORMAT,
      activeId:store.activeId||null,
      items:(Array.isArray(store.items)?store.items:[]).slice(0,MAX_WORKSPACES)
    }));
    lastWriteSucceeded=true;
    return true;
  }catch{
    lastWriteSucceeded=false;
    return false;
  }
}

function sanitizeWorkspace(workspace={}){
  return {
    id:String(workspace.id||id()),
    title:shortTitle(workspace.title),
    createdAt:String(workspace.createdAt||now()),
    updatedAt:String(workspace.updatedAt||now()),
    materials:(Array.isArray(workspace.materials)?workspace.materials:[]).slice(-MAX_MATERIALS),
    versions:(Array.isArray(workspace.versions)?workspace.versions:[]).slice(-MAX_VERSIONS),
    history:(Array.isArray(workspace.history)?workspace.history:[]).slice(-8),
    turns:(Array.isArray(workspace.turns)?workspace.turns:[]).slice(-24),
    latestPayload:workspace.latestPayload||null
  };
}

export function createWorkspace(firstPrompt='',{persist=true}={}){
  const store=loadRaw();
  const workspace=sanitizeWorkspace({
    id:id('ws'),
    title:shortTitle(firstPrompt),
    createdAt:now(),
    updatedAt:now(),
    materials:[],
    versions:[],
    history:[],
    turns:[],
    latestPayload:null
  });

  if(persist){
    store.items=[workspace,...store.items.filter(item=>item.id!==workspace.id)]
      .slice(0,MAX_WORKSPACES);
    store.activeId=workspace.id;
    saveRaw(store);
  }
  return clone(workspace);
}

export function getActiveWorkspace(){
  const store=loadRaw();
  const found=store.items.find(item=>item.id===store.activeId);
  return found?clone(sanitizeWorkspace(found)):null;
}

export function listWorkspaces(){
  return loadRaw().items
    .map(sanitizeWorkspace)
    .sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .map(clone);
}

export function setActiveWorkspace(workspaceId){
  const store=loadRaw();
  const found=store.items.find(item=>item.id===workspaceId);
  if(!found)return null;
  store.activeId=workspaceId;
  saveRaw(store);
  return clone(sanitizeWorkspace(found));
}

export function clearActiveWorkspace(){
  const store=loadRaw();
  store.activeId=null;
  saveRaw(store);
}

export function saveWorkspace(workspace){
  const store=loadRaw();
  const saved=sanitizeWorkspace({...workspace,updatedAt:now()});

  store.items=[saved,...store.items.filter(item=>item.id!==saved.id)]
    .slice(0,MAX_WORKSPACES);
  store.activeId=saved.id;
  saveRaw(store);
  return clone(saved);
}

export function renameWorkspace(workspace,title){
  return saveWorkspace({...workspace,title:shortTitle(title)});
}

export function addMaterial(workspace,{title='',content=''}={}){
  const cleanContent=String(content||'').trim().slice(0,8000);
  const cleanTitle=String(title||'').trim().slice(0,160);

  if(!cleanContent&&!cleanTitle)return workspace;

  const material={
    id:id('mat'),
    title:cleanTitle||shortTitle(cleanContent),
    content:cleanContent,
    createdAt:now()
  };

  return saveWorkspace({
    ...workspace,
    materials:[...(workspace.materials||[]),material].slice(-MAX_MATERIALS)
  });
}

export function removeMaterial(workspace,materialId){
  return saveWorkspace({
    ...workspace,
    materials:(workspace.materials||[]).filter(item=>item.id!==materialId)
  });
}

export function addVersion(workspace,{label='',result=null,turnCount=0}={}){
  const version={
    id:id('ver'),
    label:String(label||'').trim().slice(0,120)||
      `Versio ${(workspace.versions||[]).length+1}`,
    createdAt:now(),
    turnCount:Number(turnCount)||0,
    result:result?clone(result):null
  };

  return saveWorkspace({
    ...workspace,
    versions:[...(workspace.versions||[]),version].slice(-MAX_VERSIONS)
  });
}

export function workspaceForIntent(workspace){
  if(!workspace)return null;
  return {
    id:workspace.id,
    title:workspace.title,
    materials:(workspace.materials||[]).map(item=>({
      title:item.title,
      content:item.content
    }))
  };
}

export function persistRun(workspace,{history=[],turns=[],payload=null}={}){
  if(!workspace)return null;
  return saveWorkspace({
    ...workspace,
    history:[...history].slice(-8),
    turns:[...turns].slice(-24),
    latestPayload:payload?clone(payload):workspace.latestPayload
  });
}

export function hasLocalWorkspaceStorage(){
  return storageAvailable();
}

export function lastWorkspaceWriteSucceeded(){
  return lastWriteSucceeded;
}
