const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const ROUTE_KEY='anomancer.core.shell.route.v16.7';
let route=localStorage.getItem(ROUTE_KEY)||'workspace';
let detail=null;
let editorialView='write';

const coreSurface=q('#coreSurface');
const localSidebar=q('#workspaceLocalSidebar');
const editorGrid=q('.editor-grid');
const narramancer=q('#narramancerWorkspace');
const corePanel=q('#corePanel');
const machineHost=q('#coreMachineHost');
const settings=q('#coreSettingsDialog');

if(corePanel&&machineHost){machineHost.appendChild(corePanel);corePanel.hidden=false;}

function template(){return detail?.template||window.anomancerWorkspaces?.template?.()||null;}
function workspace(){return detail?.workspace||window.anomancerWorkspaces?.current?.()||null;}
function artifact(){return detail?.artifact||window.anomancerWorkspaces?.artifact?.()||null;}
function constitution(){return detail?.constitution||window.anomancerWorkspaces?.constitution?.()||null;}
function isNarrative(){return template()?.kind==='narrative-authoring';}

function setRouteButtons(){
  qa('[data-shell-route]').forEach(el=>{
    const r=el.dataset.shellRoute;
    const active=(route==='workspace'&&r==='workspace')||r===route;
    el.classList.toggle('active',active);
    if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',String(active));
  });
}

function showWorkspace(){
  if(coreSurface)coreSurface.hidden=true;
  if(localSidebar)localSidebar.hidden=false;
  if(isNarrative()){
    if(editorGrid)editorGrid.hidden=true;
    if(narramancer)narramancer.hidden=false;
  }else{
    if(editorGrid)editorGrid.hidden=false;
    if(narramancer)narramancer.hidden=true;
  }
  document.body.dataset.shellSurface='workspace';
  renderLocalNavigation();
}

function showCoreView(name){
  if(coreSurface)coreSurface.hidden=false;
  if(localSidebar)localSidebar.hidden=true;
  if(editorGrid)editorGrid.hidden=true;
  if(narramancer)narramancer.hidden=true;
  qa('[data-shell-view]').forEach(view=>view.hidden=view.dataset.shellView!==name);
  document.body.dataset.shellSurface=name;
  if(name==='artifacts')renderArtifactHome();
}

function navigate(next='workspace'){
  if(next==='dispatches'){
    const current=window.anomancerWorkspaces?.current?.();
    if(current?.id!=='default'){
      const switched=window.anomancerWorkspaces?.switchTo?.('default');
      if(!switched){setRouteButtons();return false;}
    }
    route='dispatches';localStorage.setItem(ROUTE_KEY,route);setRouteButtons();showWorkspace();
    editorialView='write';window.anomancerAdminBridge?.selectEditorView?.('write');window.anomancerAdminBridge?.openDispatchLibrary?.();
    return true;
  }
  route=['workspace','workspaces','artifacts','machine'].includes(next)?next:'workspace';
  localStorage.setItem(ROUTE_KEY,route);setRouteButtons();
  if(route==='workspace'||route==='dispatches')showWorkspace();else showCoreView(route);
  return true;
}

function localSections(){
  const def=template()?.editorDefinition||{};
  const sections=Array.isArray(def.sections)?def.sections:[];
  const sectionMap=new Map(sections.map(s=>[s.id,s]));
  const nav=def.navigation;
  let groups=Array.isArray(nav?.groups)?nav.groups:[];
  if(!groups.length&&sections.length)groups=[{id:'main',label:'Työkalut',items:sections.map(s=>s.id)}];
  return groups.map(group=>({...group,sections:(group.items||[]).map(id=>sectionMap.get(id)).filter(Boolean)})).filter(group=>group.sections.length);
}

function activeLocalSection(){return isNarrative()?window.anomancerNarramancer?.activeSection?.()||'project':editorialView;}

function renderLocalNavigation(){
  const nav=q('#workspaceLocalNav');if(!nav)return;
  const groups=localSections(),active=activeLocalSection();
  nav.innerHTML=groups.map(group=>`<section class="workspace-local-group"><span>${esc(group.label||'Työkalut')}</span>${group.sections.map(section=>`<button type="button" data-local-section="${esc(section.id)}" class="${section.id===active?'active':''}"><strong>${esc(section.label||section.id)}</strong>${section.id==='publish'?'<small>Ihmisen portti</small>':''}</button>`).join('')}</section>`).join('');
}

function openLocalSection(id){
  if(isNarrative()){
    window.anomancerNarramancer?.selectSection?.(id);
  }else if(id==='publish'){
    editorialView='publish';window.anomancerAdminBridge?.openPublicationSettings?.();
  }else{
    editorialView=id;window.anomancerAdminBridge?.selectEditorView?.(id);
  }
  renderLocalNavigation();
}

function renderArtifactHome(){
  const root=q('#artifactHomeSummary'),actions=q('#artifactHomeActions');if(!root)return;
  const w=workspace()||{},t=template()||{},a=artifact()||{},c=constitution()||{};
  const store=t.artifactStoreId||'—',content=t.contentAdapterId||'—',output=t.outputAdapterId||'—';
  root.innerHTML=`<div class="artifact-hero"><div><span>${esc(t.name||'Työtila')}</span><h2>${esc(w.name||w.id||'Työtila')}</h2><p>${esc(t.purpose||w.description||'')}</p></div><span class="artifact-boundary-badge" data-isolated="${a.isolated?'true':'false'}">${a.isolated?'ERISTETTY':'JULKAISU SIDOTTU'}</span></div><div class="artifact-grid"><article><span>Artefaktisäilö</span><strong>${esc(store)}</strong><small>${a.privateArtifactWritable?'Yksityinen kirjoitus sallittu':(a.contentWritable?'Sisältökirjoitus sallittu':'Kirjoitus rajattu')}</small></article><article><span>Sisääntulo</span><strong>${esc(content)}</strong><small>${a.contentReadable?'Sisältö luettavissa':'Ei ristiinlukua'}</small></article><article><span>Ulostulo</span><strong>${esc(output)}</strong><small>${a.publicationEnabled?'Julkinen julkaisu mahdollinen':'Ei automaattista julkaisukohdetta'}</small></article><article><span>Perustuslaki</span><strong>${esc(c.name||w.constitutionId||'—')}</strong><small>Ihminen säilyttää lopullisen päätösvallan</small></article></div>`;
  if(actions){actions.innerHTML=isNarrative()?`<button class="primary" type="button" data-artifact-action="export">Avaa Vienti</button><button class="ghost" type="button" data-artifact-action="workspace">Palaa työtilaan</button>`:`<button class="primary" type="button" data-artifact-action="dispatches">Avaa Lähetykset</button><a href="/lahetykset" target="_blank" rel="noreferrer">Julkinen sivu ↗</a>`;}
}

function applyWorkspace(next){
  detail=next||window.anomancerWorkspaces?.getDetail?.()||detail;
  renderLocalNavigation();renderArtifactHome();
  if(route==='workspace'||route==='dispatches')showWorkspace();
}

q('#workspaceLocalNav')?.addEventListener('click',event=>{const button=event.target.closest?.('[data-local-section]');if(button)openLocalSection(button.dataset.localSection);});
q('#coreShell')?.addEventListener('click',event=>{const target=event.target.closest?.('[data-shell-route]');if(!target)return;event.preventDefault();navigate(target.dataset.shellRoute);});
q('#coreSettingsButton')?.addEventListener('click',()=>settings?.showModal());
q('#coreSettingsClose')?.addEventListener('click',()=>settings?.close());
settings?.addEventListener('click',event=>{if(event.target===settings)settings.close();});
q('#artifactHomeActions')?.addEventListener('click',event=>{const action=event.target.closest?.('[data-artifact-action]')?.dataset.artifactAction;if(action==='export'){navigate('workspace');window.anomancerNarramancer?.selectSection?.('export');}if(action==='workspace')navigate('workspace');if(action==='dispatches')navigate('dispatches');});
window.addEventListener('anomancer:workspace-ready',event=>applyWorkspace(event.detail));
window.addEventListener('anomancer:workspace-change',event=>applyWorkspace(event.detail));
window.addEventListener('anomancer:narramancer-section-change',renderLocalNavigation);
window.addEventListener('anomancer:editor-view-change',event=>{editorialView=event.detail?.view||editorialView;renderLocalNavigation();});
window.addEventListener('anomancer:shell-route',event=>navigate(event.detail?.route));
window.addEventListener('anomancer:admin-ready',()=>{detail=window.anomancerWorkspaces?.getDetail?.()||detail;applyWorkspace(detail);navigate(route);});

window.anomancerShell={navigate,renderLocalNavigation,currentRoute:()=>route,renderArtifactHome};

setRouteButtons();
if(window.anomancerWorkspaces?.current?.()){detail=window.anomancerWorkspaces.getDetail?.();applyWorkspace(detail);navigate(route);}
