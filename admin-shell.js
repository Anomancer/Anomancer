import {runtime} from './admin-runtime.js';
const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const ROUTE_KEY='anomancer.core.shell.route.v16.8';
const VALID_ROUTES=new Set(['workspace','workspaces','archive','materials','machine']);
function readNavigationState(){try{const url=new URL(location.href),view=url.searchParams.get('view'),section=url.searchParams.get('section'),workspaceId=url.searchParams.get('workspace');return{view:VALID_ROUTES.has(view)?view:'',section:section||'',workspaceId:workspaceId||''};}catch{return{view:'',section:'',workspaceId:''};}}
const LEGACY_ROUTE=localStorage.getItem('anomancer.core.shell.route.v16.7');
const URL_ROUTE=readNavigationState().view;
const storedRoute=URL_ROUTE||localStorage.getItem(ROUTE_KEY)||LEGACY_ROUTE||'workspace';
let route=storedRoute==='artifacts'?'materials':storedRoute==='dispatches'?'workspace':storedRoute;
let detail=null;
let editorialView='write';
let restoringHistory=false,navigationBootstrapped=false,sectionNavigation=false;

const coreSurface=q('#coreSurface');
const localSidebar=q('#workspaceLocalSidebar');
const editorGrid=q('.editor-grid');
const narramancer=q('#narramancerWorkspace');
const mancerWorkspace=q('#mancerWorkspace');
const blankWorkspace=q('#blankWorkspace');
const corePanel=q('#corePanel');
const machineHost=q('#coreMachineHost');
const settings=q('#coreSettingsDialog');
const mobileDock=q('#mobileDock');
const mobileActionStrip=q('#mobileActionStrip');
const mobileSheet=q('#workspaceMobileSheet');

if(corePanel&&machineHost){machineHost.appendChild(corePanel);corePanel.hidden=false;}

function template(){return detail?.template||runtime.service('workspaces')?.template?.()||null;}
function workspace(){return detail?.workspace||runtime.service('workspaces')?.current?.()||null;}
function artifact(){return detail?.artifact||runtime.service('workspaces')?.artifact?.()||null;}
function constitution(){return detail?.constitution||runtime.service('workspaces')?.constitution?.()||null;}
function isNarrative(){return template()?.kind==='narrative-authoring';}
function isMancer(){return template()?.mancerPackage?.format==='anomancer-mancer-package/v1';}
function isBlank(){return template()?.kind==='blank-private';}
function setDocumentTitle(surface='workspace'){
  const names={workspaces:'Mancerit',archive:'Arkisto',machine:'Konehuone',materials:'Aineisto & ulostulo'};
  if(names[surface]){document.title=`Lighthouse · ${names[surface]}`;return;}
  if(isNarrative()){runtime.service('narramancer')?.refreshDocumentTitle?.();return;}
  if(isMancer()){runtime.service('mancer')?.refreshDocumentTitle?.();return;}
  const name=isBlank()?(workspace()?.name||'Tyhjä työtila'):'Anomancer';
  document.title=`Lighthouse · ${name}`;
}

function setRouteButtons(){
  qa('[data-shell-route]').forEach(el=>{
    const r=el.dataset.shellRoute;
    const active=(route==='workspace'&&r==='workspace')||r===route;
    el.classList.toggle('active',active);
    if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',String(active));if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
  });
}

function showWorkspace(){
  if(coreSurface)coreSurface.hidden=true;
  if(localSidebar)localSidebar.hidden=isBlank();
  if(isNarrative()){
    if(editorGrid)editorGrid.hidden=true;
    if(narramancer)narramancer.hidden=false;
    if(mancerWorkspace)mancerWorkspace.hidden=true;
    if(blankWorkspace)blankWorkspace.hidden=true;
  }else if(isMancer()){
    if(editorGrid)editorGrid.hidden=true;
    if(narramancer)narramancer.hidden=true;
    if(mancerWorkspace)mancerWorkspace.hidden=false;
    if(blankWorkspace)blankWorkspace.hidden=true;
  }else if(isBlank()){
    if(editorGrid)editorGrid.hidden=true;
    if(narramancer)narramancer.hidden=true;
    if(mancerWorkspace)mancerWorkspace.hidden=true;
    if(blankWorkspace)blankWorkspace.hidden=false;
    renderBlankWorkspace();
  }else{
    if(editorGrid)editorGrid.hidden=false;
    if(narramancer)narramancer.hidden=true;
    if(mancerWorkspace)mancerWorkspace.hidden=true;
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
  if(mancerWorkspace)mancerWorkspace.hidden=true;
  if(blankWorkspace)blankWorkspace.hidden=true;
  qa('[data-shell-view]').forEach(view=>view.hidden=view.dataset.shellView!==name);
  document.body.dataset.shellSurface=name;
  setDocumentTitle(name);
  if(name==='materials')renderArtifactHome();
  if(name==='archive')runtime.service('archive')?.activate?.();
  renderMobileNavigation();
}

function navigationUrl(){const url=new URL(location.href),workspaceId=runtime.service('workspaces')?.currentId?.()||workspace()?.id||'';if(workspaceId)url.searchParams.set('workspace',workspaceId);else url.searchParams.delete('workspace');url.searchParams.set('view',route);if(route==='workspace'){const section=activeLocalSection();if(section)url.searchParams.set('section',section);else url.searchParams.delete('section');}else url.searchParams.delete('section');return url;}
function writeNavigationState(mode='push'){if(restoringHistory&&mode!=='replace')return false;const url=navigationUrl(),next=url.href,current=location.href;if(next===current)return false;history[mode==='replace'?'replaceState':'pushState']({workspace:url.searchParams.get('workspace'),view:route,section:url.searchParams.get('section')},'',next);return true;}
function navigate(next='workspace',{history:historyMode='push'}={}){
  runtime.service('overlays')?.close?.('workspace-sheet',{restore:false});
  route=VALID_ROUTES.has(next)?next:'workspace';
  localStorage.setItem(ROUTE_KEY,route);setRouteButtons();
  if(route==='workspace')showWorkspace();else showCoreView(route);
  if(historyMode!=='none')writeNavigationState(historyMode);
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
function activeLocalSection(){return route==='materials'?'materials':isNarrative()?runtime.service('narramancer')?.activeSection?.()||'project':isMancer()?runtime.service('mancer')?.activeSection?.()||editorSections()[0]?.id||'project':editorialView;}

function renderLocalNavigation(){
  const nav=q('#workspaceLocalNav');if(!nav)return;
  const groups=localSections(),active=activeLocalSection();
  nav.innerHTML=groups.map(group=>`<section class="workspace-local-group"><span>${esc(group.label||'Työkalut')}</span>${group.sections.map(section=>`<button type="button" data-local-section="${esc(section.id)}" class="${section.id===active?'active':''}" ${section.id===active?'aria-current="page"':''}><strong>${esc(section.label||section.id)}</strong>${section.id==='publish'?'<small>Ihmisen portti</small>':''}</button>`).join('')}</section>`).join('');
  renderMobileNavigation();
}

function openLocalSection(id,{history:historyMode='push'}={}){
  sectionNavigation=true;
  try{
    if(isMancer()){
      navigate('workspace',{history:'none'});
      runtime.service('mancer')?.selectSection?.(id);
    }else if(isNarrative()){
      navigate('workspace',{history:'none'});
      runtime.service('narramancer')?.selectSection?.(id);
    }else if(id==='dispatches'){
      navigate('workspace',{history:'none'});runtime.service('admin')?.selectEditorView?.('write');runtime.service('admin')?.openDispatchLibrary?.();editorialView='dispatches';
    }else if(id==='orchestra'){
      navigate('workspace',{history:'none'});runtime.service('admin')?.openOrchestraRun?.();editorialView='orchestra';
    }else if(id==='publish'){
      navigate('workspace',{history:'none'});runtime.service('admin')?.openPublicationSettings?.();editorialView='publish';
    }else if(id==='materials'){
      navigate('materials',{history:'none'});
    }else{
      navigate('workspace',{history:'none'});editorialView=id;runtime.service('admin')?.selectEditorView?.(id);
    }
    renderLocalNavigation();
    if(historyMode!=='none')writeNavigationState(historyMode);
  }finally{sectionNavigation=false;}
}

function mobilePrimary(){
  const nav=editorDefinition().navigation||{};
  return Array.isArray(nav.mobilePrimary)?nav.mobilePrimary.slice(0,3):[];
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
    const saveLabel=isNarrative()?'Tallenna projekti':isMancer()?'Tallenna työtila':'Tallenna luonnos';
    commands.innerHTML=`<button type="button" data-mobile-command="save"><strong>${saveLabel}</strong><small>Nykyinen työtila</small></button><button type="button" data-mobile-command="workspaces"><strong>Mancerit</strong><small>Vaihda työmaailmaa</small></button><button type="button" data-mobile-command="archive"><strong>Arkisto</strong><small>Hallittu muistikerros</small></button><button type="button" data-mobile-command="machine"><strong>Konehuone</strong><small>Globaali ohjaustaso</small></button><button type="button" data-mobile-command="settings"><strong>Asetukset</strong><small>Näkymä ja järjestelmä</small></button>`;
  }
  if(select){
    const all=(runtime.service('workspaces')?.getAll?.()||[]).filter(w=>w.status!=='archived');
    select.innerHTML=all.map(w=>`<option value="${esc(w.id)}">${esc(w.name)}</option>`).join('');
    select.value=workspace()?.id||'';
  }
}
function renderMobileActionStrip(){
  if(!mobileActionStrip)return;
  const visible=route==='workspace'&&!isBlank();
  mobileActionStrip.hidden=!visible;
  if(!visible){mobileActionStrip.innerHTML='';return;}
  const state=q('#workspaceSaveIndicator')?.textContent?.trim()||'VALMIS';
  const saveLabel=isNarrative()?'Tallenna':isMancer()?'Tallenna':'Tallenna';
  const editorial=!isNarrative()&&!isMancer();
  mobileActionStrip.dataset.editorial=editorial?'true':'false';
  mobileActionStrip.innerHTML=`<span class="mobile-action-state" data-state="${esc(state.toLowerCase())}">${esc(state)}</span><button type="button" data-mobile-command="save">${saveLabel}</button>${editorial?'<button type="button" data-mobile-command="preview">Esikatsele</button><button class="primary" type="button" data-mobile-command="publish">Julkaise</button>':''}`;
}
function renderMobileNavigation(){
  if(!mobileDock)return;
  const globalDock=()=>[
    ['workspaces','◇','Mancerit'],
    ['workspace','✎','Työ'],
    ['archive','▤','Arkisto'],
    ['machine','⚙','Kone']
  ].map(([command,icon,label])=>`<button type="button" data-mobile-command="${command}" class="${route===command||(command==='workspace'&&route==='workspace')?'active':''}" aria-pressed="${route===command||(command==='workspace'&&route==='workspace')?'true':'false'}"><span aria-hidden="true">${icon}</span><small>${label}</small></button>`).join('');
  renderMobileActionStrip();
  if(isBlank()){mobileDock.hidden=true;mobileDock.innerHTML='';return;}
  mobileDock.hidden=false;
  if(route!=='workspace'||!template()){
    mobileDock.innerHTML=globalDock()+`<button type="button" data-mobile-command="more" id="mobileMoreBtn" aria-haspopup="dialog" aria-expanded="${runtime.service('overlays')?.active?.()==='workspace-sheet'?'true':'false'}"><span aria-hidden="true">•••</span><small>Lisää</small></button>`;
    renderMobileSheet();return;
  }
  const active=activeLocalSection(),items=mobilePrimary();
  mobileDock.innerHTML=items.map(item=>{
    const target=item.target||'section',isActive=target==='section'&&item.id===active;
    return `<button type="button" data-mobile-${target==='command'?'command':'local'}="${esc(item.id)}" data-mobile-target="${esc(target)}" class="${isActive?'active':''}" aria-pressed="${isActive?'true':'false'}"><span aria-hidden="true">${esc(item.icon||'•')}</span><small>${esc(mobileItemLabel(item))}</small></button>`;
  }).join('')+`<button type="button" data-mobile-command="workspaces"><span aria-hidden="true">◇</span><small>Mancerit</small></button><button type="button" data-mobile-command="more" id="mobileMoreBtn" aria-haspopup="dialog" aria-expanded="${runtime.service('overlays')?.active?.()==='workspace-sheet'?'true':'false'}"><span aria-hidden="true">•••</span><small>Lisää</small></button>`;
  renderMobileSheet();
}
function setMobileSheet(open,trigger=q('#mobileMoreBtn')){
  if(!mobileSheet)return false;
  renderMobileSheet();
  const overlay=runtime.service('overlays');
  if(overlay){return open?overlay.open('workspace-sheet',trigger):overlay.close('workspace-sheet');}
  if(open&&!mobileSheet.open)mobileSheet.showModal();else if(!open&&mobileSheet.open)mobileSheet.close();
  return true;
}
function runMobileCommand(command,trigger){
  if(command==='more'){setMobileSheet(true,trigger);return;}
  if(command==='preview'){setMobileSheet(false);runtime.service('admin')?.openPreview?.();return;}
  if(command==='save'){setMobileSheet(false);if(isNarrative())runtime.service('narramancer')?.save?.();else if(isMancer())runtime.service('mancer')?.save?.();else runtime.service('admin')?.saveDraft?.();return;}
  if(command==='publish'){setMobileSheet(false);runtime.service('admin')?.openPublishReview?.();return;}
  if(command==='workspace'){setMobileSheet(false);navigate('workspace');return;}
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
  put('#blankWorkspaceConstitution',c.name||w.constitutionId||'Tyhjän työtilan perustuslaki');
  put('#blankWorkspaceArtifact',t.artifactStoreId==='workspace/private-isolated/v1'?'Yksityinen eristetty säilö':(t.artifactStoreId||'Yksityinen säilö'));
  put('#blankWorkspaceOutput',t.outputAdapterId==='workspace/no-publication/v1'?'Ei julkaisukohdetta':(t.outputAdapterId||'Ei ulostuloa sidottuna'));
}

function renderArtifactHome(){
  const root=q('#artifactHomeSummary'),actions=q('#artifactHomeActions');if(!root)return;
  const w=workspace()||{},t=template()||{},a=artifact()||{},c=constitution()||{};
  const store=t.artifactStoreId||'—',content=t.contentAdapterId||'—',output=t.outputAdapterId||'—';
  root.innerHTML=`<div class="artifact-hero"><div><span>${esc(t.name||'Työtila')}</span><h2>${esc(w.name||w.id||'Työtila')}</h2><p>${esc(t.purpose||w.description||'')}</p></div><span class="artifact-boundary-badge" data-isolated="${a.isolated?'true':'false'}">${a.isolated?'ERISTETTY':'JULKAISU SIDOTTU'}</span></div><div class="artifact-grid"><article><span>Artefaktisäilö</span><strong>${esc(store)}</strong><small>${a.privateArtifactWritable?'Yksityinen kirjoitus sallittu':(a.contentWritable?'Sisältökirjoitus sallittu':'Kirjoitus rajattu')}</small></article><article><span>Sisääntulo</span><strong>${esc(content)}</strong><small>${a.contentReadable?'Sisältö luettavissa':'Ei ristiinlukua'}</small></article><article><span>Ulostulo</span><strong>${esc(output)}</strong><small>${a.publicationEnabled?'Julkinen julkaisu mahdollinen':'Ei automaattista julkaisukohdetta'}</small></article><article><span>Perustuslaki</span><strong>${esc(c.name||w.constitutionId||'—')}</strong><small>Ihminen säilyttää lopullisen päätösvallan</small></article></div>`;
  if(actions){actions.innerHTML=isNarrative()?`<button class="primary" type="button" data-artifact-action="export">Avaa Vienti</button><button class="ghost" type="button" data-artifact-action="workspace">Palaa työtilaan</button>`:isMancer()?`<button class="primary" type="button" data-artifact-action="workspace">Palaa työtilaan</button><button class="ghost" type="button" data-artifact-action="archive">Avaa Arkisto</button><button class="ghost" type="button" data-artifact-action="machine">Avaa Konehuone</button>`:isBlank()?`<button class="primary" type="button" data-artifact-action="workspace">Palaa työtilaan</button><button class="ghost" type="button" data-artifact-action="machine">Avaa Konehuone</button>`:`<button class="primary" type="button" data-artifact-action="dispatches">Avaa Lähetykset</button><a href="/lahetykset" target="_blank" rel="noopener noreferrer">Julkinen sivu ↗</a>`;}
}

function applyWorkspace(next){
  detail=next||runtime.service('workspaces')?.getDetail?.()||detail;
  renderLocalNavigation();renderArtifactHome();renderBlankWorkspace();renderMobileSheet();
  if(route==='workspace')showWorkspace();else if(route==='materials')showCoreView('materials');else renderMobileNavigation();
}

async function restoreNavigationFromUrl({replace=false}={}){const state=readNavigationState();restoringHistory=true;try{if(state.workspaceId&&runtime.service('workspaces')?.currentId?.()!==state.workspaceId){const changed=await runtime.service('workspaces')?.switchTo?.(state.workspaceId);if(!changed&&runtime.service('workspaces')?.currentId?.()!==state.workspaceId){writeNavigationState('replace');return false;}detail=runtime.service('workspaces')?.getDetail?.()||detail;}navigate(state.view||route,{history:'none'});const rendererPending=route==='workspace'&&state.section&&((isMancer()&&!runtime.service('mancer')?.selectSection)||(isNarrative()&&!runtime.service('narramancer')?.selectSection));if(route==='workspace'&&state.section&&!rendererPending)openLocalSection(state.section,{history:'none'});if(replace&&!rendererPending)writeNavigationState('replace');return !rendererPending;}finally{restoringHistory=false;}}

const LIGHT_WORKSPACE_KEY='anomancer:lighthouse:workspaces:v1';
function requestedLightWork(){
  const id=new URL(location.href).searchParams.get('lightWork');if(!id)return null;
  try{const store=JSON.parse(localStorage.getItem(LIGHT_WORKSPACE_KEY)||'null');return store?.items?.find(item=>item?.id===id)||null;}catch{return null;}
}
function clearLightWorkRequest(){const url=new URL(location.href);url.searchParams.delete('lightWork');history.replaceState(history.state,'',url);}
function renderLightWorkHandoff(){
  const host=q('#lightWorkHandoff'),item=requestedLightWork();if(!host)return;
  host.hidden=!item;if(!item)return;
  const result=item.latestPayload?.result||{};
  q('#lightWorkHandoffTitle').textContent=result.title||item.title||'Jatka samaa työtä';
  q('#lightWorkHandoffSummary').textContent=result.answer?`${String(result.answer).replace(/\s+/g,' ').trim().slice(0,220)}${String(result.answer).length>220?'…':''}`:'Työ löytyi selaimen paikallisesta Lighthouse-työtilasta.';
  q('#lightWorkOpenSource').href='/lighthouse';
  q('#lightWorkImport').disabled=!item.latestPayload?.result;
}
q('#lightWorkImport')?.addEventListener('click',async()=>{const item=requestedLightWork();if(!item)return;const imported=await runtime.service('admin')?.importLightWorkspace?.(item);if(imported){clearLightWorkRequest();q('#lightWorkHandoff').hidden=true;navigate('workspace',{history:'replace'});}});
q('#lightWorkDismiss')?.addEventListener('click',()=>{clearLightWorkRequest();q('#lightWorkHandoff').hidden=true;});

runtime.service('overlays')?.register?.('workspace-sheet',{kind:'dialog',element:'#workspaceMobileSheet',bodyClass:'workspace-sheet-open',focusSelector:'#workspaceMobileSheetClose'});

q('#workspaceLocalNav')?.addEventListener('click',event=>{const button=event.target.closest?.('[data-local-section]');if(button)openLocalSection(button.dataset.localSection);});
q('#coreShell')?.addEventListener('click',event=>{const target=event.target.closest?.('[data-shell-route]');if(!target)return;event.preventDefault();navigate(target.dataset.shellRoute);});
q('#coreSettingsButton')?.addEventListener('click',()=>settings?.showModal());
q('#coreSettingsClose')?.addEventListener('click',()=>settings?.close());
settings?.addEventListener('click',event=>{if(event.target===settings)settings.close();});
q('#blankWorkspace')?.addEventListener('click',event=>{const action=event.target.closest?.('[data-blank-action]')?.dataset.blankAction;if(action)navigate(action);});
q('#artifactHomeActions')?.addEventListener('click',event=>{const action=event.target.closest?.('[data-artifact-action]')?.dataset.artifactAction;if(action==='export'){navigate('workspace');runtime.service('narramancer')?.selectSection?.('export');}if(action==='workspace'||action==='machine'||action==='archive')navigate(action);if(action==='dispatches'){navigate('workspace');runtime.service('admin')?.selectEditorView?.('write');runtime.service('admin')?.openDispatchLibrary?.();editorialView='dispatches';renderLocalNavigation();}});
mobileDock?.addEventListener('click',event=>{
  const local=event.target.closest?.('[data-mobile-local]');if(local){setMobileSheet(false);openLocalSection(local.dataset.mobileLocal);window.scrollTo({top:0,behavior:'smooth'});return;}
  const command=event.target.closest?.('[data-mobile-command]');if(command)runMobileCommand(command.dataset.mobileCommand,command);
});
mobileActionStrip?.addEventListener('click',event=>{const command=event.target.closest?.('[data-mobile-command]');if(command)runMobileCommand(command.dataset.mobileCommand,command);});
for(const indicator of qa('#workspaceSaveIndicator,#narramancerDirty,#mancerDirty'))new MutationObserver(renderMobileActionStrip).observe(indicator,{subtree:true,childList:true,characterData:true});
q('#workspaceMobileMoreNav')?.addEventListener('click',event=>{const local=event.target.closest?.('[data-mobile-local]');if(local){setMobileSheet(false);openLocalSection(local.dataset.mobileLocal);window.scrollTo({top:0,behavior:'smooth'});}});
q('#workspaceMobileCommands')?.addEventListener('click',event=>{const command=event.target.closest?.('[data-mobile-command]');if(command)runMobileCommand(command.dataset.mobileCommand,command);});
q('#workspaceMobileSheetClose')?.addEventListener('click',()=>setMobileSheet(false));
q('#mobileWorkspaceSelect')?.addEventListener('change',async event=>{
  const id=event.target.value,before=workspace()?.id||'';
  if(id===before){setMobileSheet(false);navigate('workspace');return;}
  const changed=await runtime.service('workspaces')?.switchTo?.(id);
  if(changed){setMobileSheet(false);navigate('workspace');}else renderMobileSheet();
});
runtime.events.on('overlay-open',event=>{if(event.detail?.name==='workspace-sheet')q('#mobileMoreBtn')?.setAttribute('aria-expanded','true');});
runtime.events.on('overlay-close',event=>{if(event.detail?.name==='workspace-sheet')q('#mobileMoreBtn')?.setAttribute('aria-expanded','false');});
runtime.events.on('workspace-ready',async event=>{applyWorkspace(event.detail);if(!navigationBootstrapped){navigationBootstrapped=true;await restoreNavigationFromUrl({replace:true});}});
runtime.events.on('workspace-change',event=>applyWorkspace(event.detail));
runtime.events.on('narramancer-section-change',()=>{renderLocalNavigation();renderMobileNavigation();if(!sectionNavigation&&!restoringHistory)writeNavigationState('replace');});
runtime.events.on('mancer-section-change',()=>{renderLocalNavigation();renderMobileNavigation();if(!sectionNavigation&&!restoringHistory)writeNavigationState('replace');});
runtime.events.on('editor-view-change',event=>{editorialView=event.detail?.view||editorialView;renderLocalNavigation();renderMobileNavigation();if(!sectionNavigation&&!restoringHistory)writeNavigationState('replace');});
runtime.events.on('shell-route',event=>navigate(event.detail?.route));
window.addEventListener('popstate',()=>restoreNavigationFromUrl());
runtime.events.on('admin-ready',()=>{detail=runtime.service('workspaces')?.getDetail?.()||detail;renderLightWorkHandoff();if(detail){applyWorkspace(detail);navigate(route,{history:'none'});}});

runtime.events.on('runtime-service-ready',async event=>{
  const name=event.detail?.name;if(name!=='mancer'&&name!=='narramancer')return;
  const nav=readNavigationState();if(route!=='workspace'||!nav.section)return;
  if((name==='mancer'&&!isMancer())||(name==='narramancer'&&!isNarrative()))return;
  await restoreNavigationFromUrl({replace:true});
});

runtime.provide('shell',{navigate,openLocalSection,restoreNavigationFromUrl,writeNavigationState,renderLocalNavigation,renderMobileNavigation,setMobileSheet,currentRoute:()=>route,renderArtifactHome,renderBlankWorkspace});

setRouteButtons();
renderLightWorkHandoff();
if(runtime.service('workspaces')?.current?.()){detail=runtime.service('workspaces').getDetail?.();applyWorkspace(detail);navigate(route,{history:'none'});}
