const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const ROUTE_KEY='anomancer.core.shell.route.v16.8';
const LEGACY_ROUTE=localStorage.getItem('anomancer.core.shell.route.v16.7');
const storedRoute=localStorage.getItem(ROUTE_KEY)||LEGACY_ROUTE||'workspace';
let route=storedRoute==='artifacts'?'materials':storedRoute==='dispatches'?'workspace':storedRoute;
let detail=null;
let editorialView='write';

const coreSurface=q('#coreSurface');
const localSidebar=q('#workspaceLocalSidebar');
const editorGrid=q('.editor-grid');
const narramancer=q('#narramancerWorkspace');
const blankWorkspace=q('#blankWorkspace');
const corePanel=q('#corePanel');
const machineHost=q('#coreMachineHost');
const settings=q('#coreSettingsDialog');
const mobileDock=q('#mobileDock');
const mobileSheet=q('#workspaceMobileSheet');

if(corePanel&&machineHost){machineHost.appendChild(corePanel);corePanel.hidden=false;}

function template(){return detail?.template||window.anomancerWorkspaces?.template?.()||null;}
function workspace(){return detail?.workspace||window.anomancerWorkspaces?.current?.()||null;}
function artifact(){return detail?.artifact||window.anomancerWorkspaces?.artifact?.()||null;}
function constitution(){return detail?.constitution||window.anomancerWorkspaces?.constitution?.()||null;}
function isNarrative(){return template()?.kind==='narrative-authoring';}
function isBlank(){return template()?.kind==='blank-private';}
function setDocumentTitle(surface='workspace'){
  const names={workspaces:'Työtilat',archive:'Arkisto',machine:'Konehuone',materials:'Aineisto & ulostulo'};
  if(names[surface]){document.title=`Anomancer Core · ${names[surface]}`;return;}
  if(isNarrative()){window.anomancerNarramancer?.refreshDocumentTitle?.();return;}
  const name=isBlank()?(workspace()?.name||'Tyhjä työtila'):'Lähetyskone';
  document.title=`Anomancer Core · ${name}`;
}

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
  if(localSidebar)localSidebar.hidden=isBlank();
  if(isNarrative()){
    if(editorGrid)editorGrid.hidden=true;
    if(narramancer)narramancer.hidden=false;
    if(blankWorkspace)blankWorkspace.hidden=true;
  }else if(isBlank()){
    if(editorGrid)editorGrid.hidden=true;
    if(narramancer)narramancer.hidden=true;
    if(blankWorkspace)blankWorkspace.hidden=false;
    renderBlankWorkspace();
  }else{
    if(editorGrid)editorGrid.hidden=false;
    if(narramancer)narramancer.hidden=true;
    if(blankWorkspace)blankWorkspace.hidden=true;
  }
  document.body.dataset.shellSurface='workspace';
  setDocumentTitle('workspace');
  renderLocalNavigation();
  renderMobileNavigation();
}

function showCoreView(name){
  if(coreSurface)coreSurface.hidden=false;
  if(localSidebar)localSidebar.hidden=true;
  if(editorGrid)editorGrid.hidden=true;
  if(narramancer)narramancer.hidden=true;
  if(blankWorkspace)blankWorkspace.hidden=true;
  qa('[data-shell-view]').forEach(view=>view.hidden=view.dataset.shellView!==name);
  document.body.dataset.shellSurface=name;
  setDocumentTitle(name);
  if(name==='materials')renderArtifactHome();
  if(name==='archive')window.anomancerArchive?.activate?.();
  renderMobileNavigation();
}

function navigate(next='workspace'){
  window.anomancerOverlays?.close?.('workspace-sheet',{restore:false});
  route=['workspace','workspaces','archive','materials','machine'].includes(next)?next:'workspace';
  localStorage.setItem(ROUTE_KEY,route);setRouteButtons();
  if(route==='workspace')showWorkspace();else showCoreView(route);
  return true;
}

function editorDefinition(){return template()?.editorDefinition||{};}
function editorSections(){return Array.isArray(editorDefinition().sections)?editorDefinition().sections:[];}
function localSections(){
  const sections=editorSections(),sectionMap=new Map(sections.map(s=>[s.id,s]));
  let groups=Array.isArray(editorDefinition().navigation?.groups)?editorDefinition().navigation.groups:[];
  if(!groups.length&&sections.length)groups=[{id:'main',label:'Työkalut',items:sections.map(s=>s.id)}];
  return groups.map(group=>({...group,sections:(group.items||[]).map(id=>sectionMap.get(id)).filter(Boolean)})).filter(group=>group.sections.length);
}
function activeLocalSection(){return route==='materials'?'materials':isNarrative()?window.anomancerNarramancer?.activeSection?.()||'project':editorialView;}

function renderLocalNavigation(){
  const nav=q('#workspaceLocalNav');if(!nav)return;
  const groups=localSections(),active=activeLocalSection();
  nav.innerHTML=groups.map(group=>`<section class="workspace-local-group"><span>${esc(group.label||'Työkalut')}</span>${group.sections.map(section=>`<button type="button" data-local-section="${esc(section.id)}" class="${section.id===active?'active':''}"><strong>${esc(section.label||section.id)}</strong>${section.id==='publish'?'<small>Ihmisen portti</small>':''}</button>`).join('')}</section>`).join('');
  renderMobileNavigation();
}

function openLocalSection(id){
  if(isNarrative()){
    navigate('workspace');
    window.anomancerNarramancer?.selectSection?.(id);
  }else if(id==='dispatches'){
    navigate('workspace');window.anomancerAdminBridge?.selectEditorView?.('write');window.anomancerAdminBridge?.openDispatchLibrary?.();editorialView='dispatches';
  }else if(id==='orchestra'){
    navigate('workspace');window.anomancerAdminBridge?.openOrchestraRun?.();editorialView='orchestra';
  }else if(id==='publish'){
    navigate('workspace');window.anomancerAdminBridge?.openPublicationSettings?.();editorialView='publish';
  }else if(id==='materials'){
    navigate('materials');
  }else{
    navigate('workspace');editorialView=id;window.anomancerAdminBridge?.selectEditorView?.(id);
  }
  renderLocalNavigation();
}

function mobilePrimary(){
  const nav=editorDefinition().navigation||{};
  return Array.isArray(nav.mobilePrimary)?nav.mobilePrimary.slice(0,4):[];
}
function mobileItemLabel(item){
  const section=editorSections().find(x=>x.id===item.id);
  return item.label||section?.label||item.id;
}
function mobileSecondary(){
  const primaryIds=new Set(mobilePrimary().filter(x=>x.target!=='command').map(x=>x.id));
  return editorSections().filter(section=>!primaryIds.has(section.id));
}
function renderMobileSheet(){
  const moreNav=q('#workspaceMobileMoreNav'),commands=q('#workspaceMobileCommands'),select=q('#mobileWorkspaceSelect');
  if(moreNav)moreNav.innerHTML=mobileSecondary().map(section=>`<button type="button" data-mobile-local="${esc(section.id)}"><strong>${esc(section.label||section.id)}</strong><small>${section.id==='publish'?'Ihmisen julkaisupäätös':'Avaa työtilassa'}</small></button>`).join('')||'<p class="muted">Ei muita työtilatyökaluja.</p>';
  if(commands){
    const saveLabel=isNarrative()?'Tallenna projekti':'Tallenna luonnos';
    commands.innerHTML=`<button type="button" data-mobile-command="save"><strong>${saveLabel}</strong><small>Nykyinen työtila</small></button><button type="button" data-mobile-command="workspaces"><strong>Työtilat</strong><small>Vaihda kontekstia</small></button><button type="button" data-mobile-command="archive"><strong>Arkisto</strong><small>Hallittu muistikerros</small></button><button type="button" data-mobile-command="machine"><strong>Konehuone</strong><small>Globaali ohjaustaso</small></button><button type="button" data-mobile-command="settings"><strong>Asetukset</strong><small>Näkymä ja järjestelmä</small></button>`;
  }
  if(select){
    const all=(window.anomancerWorkspaces?.getAll?.()||[]).filter(w=>w.status!=='archived');
    select.innerHTML=all.map(w=>`<option value="${esc(w.id)}">${esc(w.name)}</option>`).join('');
    select.value=workspace()?.id||'';
  }
}
function renderMobileNavigation(){
  if(!mobileDock)return;
  const hide=isBlank()||route!=='workspace'||!template();
  mobileDock.hidden=hide;
  if(hide){mobileDock.innerHTML='';return;}
  const active=activeLocalSection(),items=mobilePrimary();
  mobileDock.innerHTML=items.map(item=>{
    const target=item.target||'section',isActive=target==='section'&&item.id===active;
    return `<button type="button" data-mobile-${target==='command'?'command':'local'}="${esc(item.id)}" data-mobile-target="${esc(target)}" class="${isActive?'active':''}" aria-pressed="${isActive?'true':'false'}"><span aria-hidden="true">${esc(item.icon||'•')}</span><small>${esc(mobileItemLabel(item))}</small></button>`;
  }).join('')+`<button type="button" data-mobile-command="more" id="mobileMoreBtn" aria-haspopup="dialog" aria-expanded="${window.anomancerOverlays?.active?.()==='workspace-sheet'?'true':'false'}"><span aria-hidden="true">•••</span><small>Lisää</small></button>`;
  renderMobileSheet();
}
function setMobileSheet(open,trigger=q('#mobileMoreBtn')){
  if(!mobileSheet)return false;
  renderMobileSheet();
  const overlay=window.anomancerOverlays;
  if(overlay){return open?overlay.open('workspace-sheet',trigger):overlay.close('workspace-sheet');}
  if(open&&!mobileSheet.open)mobileSheet.showModal();else if(!open&&mobileSheet.open)mobileSheet.close();
  return true;
}
function runMobileCommand(command,trigger){
  if(command==='more'){setMobileSheet(true,trigger);return;}
  if(command==='preview'){setMobileSheet(false);window.anomancerAdminBridge?.openPreview?.();return;}
  if(command==='save'){setMobileSheet(false);if(isNarrative())window.anomancerNarramancer?.save?.();else window.anomancerAdminBridge?.saveDraft?.();return;}
  if(command==='workspaces'){setMobileSheet(false);navigate('workspaces');return;}
  if(command==='archive'){setMobileSheet(false);navigate('archive');return;}
  if(command==='machine'){setMobileSheet(false);navigate('machine');return;}
  if(command==='settings'){setMobileSheet(false);if(settings&&!settings.open)settings.showModal();}
}

function renderBlankWorkspace(){
  const w=workspace()||{},t=template()||{},c=constitution()||{};
  const put=(selector,value)=>{const node=q(selector);if(node)node.textContent=value||'—';};
  put('#blankWorkspaceName',w.name||t.name||'Tyhjä työtila');
  put('#blankWorkspacePurpose',w.description||t.purpose||'Rakenna uusi työtilatyyppi turvallisen aineisto- ja ulostulorajan taakse.');
  put('#blankWorkspaceConstitution',c.name||w.constitutionId||'Blank Private Constitution');
  put('#blankWorkspaceArtifact',t.artifactStoreId==='workspace/private-isolated/v1'?'Yksityinen eristetty säilö':(t.artifactStoreId||'Yksityinen säilö'));
  put('#blankWorkspaceOutput',t.outputAdapterId==='workspace/no-publication/v1'?'Ei julkaisukohdetta':(t.outputAdapterId||'Ei ulostuloa sidottuna'));
}

function renderArtifactHome(){
  const root=q('#artifactHomeSummary'),actions=q('#artifactHomeActions');if(!root)return;
  const w=workspace()||{},t=template()||{},a=artifact()||{},c=constitution()||{};
  const store=t.artifactStoreId||'—',content=t.contentAdapterId||'—',output=t.outputAdapterId||'—';
  root.innerHTML=`<div class="artifact-hero"><div><span>${esc(t.name||'Työtila')}</span><h2>${esc(w.name||w.id||'Työtila')}</h2><p>${esc(t.purpose||w.description||'')}</p></div><span class="artifact-boundary-badge" data-isolated="${a.isolated?'true':'false'}">${a.isolated?'ERISTETTY':'JULKAISU SIDOTTU'}</span></div><div class="artifact-grid"><article><span>Artefaktisäilö</span><strong>${esc(store)}</strong><small>${a.privateArtifactWritable?'Yksityinen kirjoitus sallittu':(a.contentWritable?'Sisältökirjoitus sallittu':'Kirjoitus rajattu')}</small></article><article><span>Sisääntulo</span><strong>${esc(content)}</strong><small>${a.contentReadable?'Sisältö luettavissa':'Ei ristiinlukua'}</small></article><article><span>Ulostulo</span><strong>${esc(output)}</strong><small>${a.publicationEnabled?'Julkinen julkaisu mahdollinen':'Ei automaattista julkaisukohdetta'}</small></article><article><span>Perustuslaki</span><strong>${esc(c.name||w.constitutionId||'—')}</strong><small>Ihminen säilyttää lopullisen päätösvallan</small></article></div>`;
  if(actions){actions.innerHTML=isNarrative()?`<button class="primary" type="button" data-artifact-action="export">Avaa Vienti</button><button class="ghost" type="button" data-artifact-action="workspace">Palaa työtilaan</button>`:isBlank()?`<button class="primary" type="button" data-artifact-action="workspace">Palaa työtilaan</button><button class="ghost" type="button" data-artifact-action="machine">Avaa Konehuone</button>`:`<button class="primary" type="button" data-artifact-action="dispatches">Avaa Lähetykset</button><a href="/lahetykset" target="_blank" rel="noreferrer">Julkinen sivu ↗</a>`;}
}

function applyWorkspace(next){
  detail=next||window.anomancerWorkspaces?.getDetail?.()||detail;
  renderLocalNavigation();renderArtifactHome();renderBlankWorkspace();renderMobileSheet();
  if(route==='workspace')showWorkspace();else if(route==='materials')showCoreView('materials');else renderMobileNavigation();
}

window.anomancerOverlays?.register?.('workspace-sheet',{kind:'dialog',element:'#workspaceMobileSheet',bodyClass:'workspace-sheet-open',focusSelector:'#workspaceMobileSheetClose'});

q('#workspaceLocalNav')?.addEventListener('click',event=>{const button=event.target.closest?.('[data-local-section]');if(button)openLocalSection(button.dataset.localSection);});
q('#coreShell')?.addEventListener('click',event=>{const target=event.target.closest?.('[data-shell-route]');if(!target)return;event.preventDefault();navigate(target.dataset.shellRoute);});
q('#coreSettingsButton')?.addEventListener('click',()=>settings?.showModal());
q('#coreSettingsClose')?.addEventListener('click',()=>settings?.close());
settings?.addEventListener('click',event=>{if(event.target===settings)settings.close();});
q('#blankWorkspace')?.addEventListener('click',event=>{const action=event.target.closest?.('[data-blank-action]')?.dataset.blankAction;if(action)navigate(action);});
q('#artifactHomeActions')?.addEventListener('click',event=>{const action=event.target.closest?.('[data-artifact-action]')?.dataset.artifactAction;if(action==='export'){navigate('workspace');window.anomancerNarramancer?.selectSection?.('export');}if(action==='workspace'||action==='machine')navigate(action);if(action==='dispatches'){navigate('workspace');window.anomancerAdminBridge?.selectEditorView?.('write');window.anomancerAdminBridge?.openDispatchLibrary?.();editorialView='dispatches';renderLocalNavigation();}});
mobileDock?.addEventListener('click',event=>{
  const local=event.target.closest?.('[data-mobile-local]');if(local){setMobileSheet(false);openLocalSection(local.dataset.mobileLocal);window.scrollTo({top:0,behavior:'smooth'});return;}
  const command=event.target.closest?.('[data-mobile-command]');if(command)runMobileCommand(command.dataset.mobileCommand,command);
});
q('#workspaceMobileMoreNav')?.addEventListener('click',event=>{const local=event.target.closest?.('[data-mobile-local]');if(local){setMobileSheet(false);openLocalSection(local.dataset.mobileLocal);window.scrollTo({top:0,behavior:'smooth'});}});
q('#workspaceMobileCommands')?.addEventListener('click',event=>{const command=event.target.closest?.('[data-mobile-command]');if(command)runMobileCommand(command.dataset.mobileCommand,command);});
q('#workspaceMobileSheetClose')?.addEventListener('click',()=>setMobileSheet(false));
q('#mobileWorkspaceSelect')?.addEventListener('change',event=>{
  const id=event.target.value,before=workspace()?.id||'';
  if(id===before){setMobileSheet(false);navigate('workspace');return;}
  const changed=window.anomancerWorkspaces?.switchTo?.(id);
  if(changed){setMobileSheet(false);navigate('workspace');}else renderMobileSheet();
});
window.addEventListener('anomancer:overlay-open',event=>{if(event.detail?.name==='workspace-sheet')q('#mobileMoreBtn')?.setAttribute('aria-expanded','true');});
window.addEventListener('anomancer:overlay-close',event=>{if(event.detail?.name==='workspace-sheet')q('#mobileMoreBtn')?.setAttribute('aria-expanded','false');});
window.addEventListener('anomancer:workspace-ready',event=>applyWorkspace(event.detail));
window.addEventListener('anomancer:workspace-change',event=>applyWorkspace(event.detail));
window.addEventListener('anomancer:narramancer-section-change',()=>{renderLocalNavigation();renderMobileNavigation();});
window.addEventListener('anomancer:editor-view-change',event=>{editorialView=event.detail?.view||editorialView;renderLocalNavigation();renderMobileNavigation();});
window.addEventListener('anomancer:shell-route',event=>navigate(event.detail?.route));
window.addEventListener('anomancer:admin-ready',()=>{detail=window.anomancerWorkspaces?.getDetail?.()||detail;applyWorkspace(detail);navigate(route);});

window.anomancerShell={navigate,renderLocalNavigation,renderMobileNavigation,setMobileSheet,currentRoute:()=>route,renderArtifactHome,renderBlankWorkspace};

setRouteButtons();
if(window.anomancerWorkspaces?.current?.()){detail=window.anomancerWorkspaces.getDetail?.();applyWorkspace(detail);navigate(route);}
