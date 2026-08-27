const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={csrf:'',posts:[],current:null,filter:'all',authenticated:false,mediaPreviews:{},dirty:false,busy:false,editorLocked:false,baseline:'',draftInstanceId:''};
const PUBLIC_ORIGIN='https://anomancer.com';
const MAX_SOURCE_BYTES=20*1024*1024;
const MAX_UPLOAD_BYTES=2*1024*1024;
const CATEGORY_LABELS={
  'ai-work':'Tekoäly arjessa ja työssä',
  'info-media':'Tieto, väitteet ja media',
  'work-decisions':'Työ, organisaatiot ja päätöksenteko',
  'money-risk':'Raha, riskit ja mittarit',
  'software-safety':'Ohjelmistot, automaatio ja turvallisuus',
  'language-learning':'Kieli, ajattelu ja oppiminen',
  'creativity-tools':'Luovuus ja työkalut',
  'society-systems':'Yhteiskunta ja järjestelmät'
};
const AUDIENCE_LABELS={all:'Kaikille',employee:'Työntekijälle',entrepreneur:'Yrittäjälle',developer:'Kehittäjälle',teacher:'Opettajalle',creative:'Luovalle tekijälle','decision-maker':'Päättäjälle',investor:'Sijoittajalle'};
const AUDIENCE_DEPTH_LABELS={plain:'Selkokieli',general:'Yleistajuinen',professional:'Ammattilainen',technical:'Syvä tekninen'};
const els={
  login:$('#loginView'),app:$('#appView'),loginForm:$('#loginForm'),password:$('#password'),loginError:$('#loginError'),
  postList:$('#postList'),repoStatus:$('#repoStatus'),newBtn:$('#newBtn'),logout:$('#logoutBtn'),editing:$('#editingLabel'),
  lang:$('#lang'),date:$('#date'),title:$('#title'),category:$('#category'),slug:$('#slug'),pinned:$('#pinned'),audienceDepth:$('#audienceDepth'),description:$('#description'),answer:$('#answer'),sources:$('#sources'),claims:$('#claims'),translationKey:$('#translationKey'),
  coverImage:$('#coverImage'),coverAlt:$('#coverAlt'),coverPicker:$('#coverPicker'),coverSelect:$('#coverSelectBtn'),coverRemove:$('#coverRemoveBtn'),coverPreview:$('#coverPreview'),coverPreviewImg:$('#coverPreviewImg'),
  body:$('#body'),bodyImagePicker:$('#bodyImagePicker'),insertImage:$('#insertImageBtn'),mediaStatus:$('#mediaStatus'),
  descCount:$('#descCount'),answerCount:$('#answerCount'),wordCount:$('#wordCount'),preview:$('#preview'),previewBadge:$('#previewBadge'),status:$('#status'),
  saveDraft:$('#saveDraftBtn'),publish:$('#publishBtn'),del:$('#deleteBtn'),live:$('#liveLink'),publicUrl:$('#publicUrl'),publicUrlHint:$('#publicUrlHint'),
  audienceChecks:$$('input[name="audience"]'),sourceReview:$('#sourceReview'),publishDialog:$('#publishDialog'),publishSummary:$('#publishSummary'),publishConfirm:$('#publishConfirmBtn'),sidebar:$('#sidebar'),sidebarToggle:$('#sidebarToggle'),sidebarClose:$('#sidebarClose')
};

function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function escAttr(s=''){return esc(s);}

function parseSourcesText(text=''){
  const out=[];const seen=new Set();
  for(const raw of String(text).split('\n')){const line=raw.trim();if(!line)continue;let source={};if(line.startsWith('{')){try{source=JSON.parse(line);}catch{continue;}}else{const parts=line.split('|').map(x=>x.trim());const [title='',url='',publisher='',date='']=parts;source={title,url,publisher,date,origin:'human',verification:'verified'};}const title=String(source.title||'').trim(),url=String(source.url||'').trim();if(!title||!url||seen.has(url))continue;seen.add(url);out.push({...source,title,url,origin:source.origin==='source-agent'?'source-agent':'human',verification:['candidate','verified','rejected'].includes(source.verification)?source.verification:(source.origin==='source-agent'?'candidate':'verified')});}
  return out;
}
function formatSourcesText(items=[]){return (Array.isArray(items)?items:[]).map(x=>JSON.stringify({id:x.id||'',title:x.title||'',url:x.url||'',publisher:x.publisher||'',date:x.date||'',origin:x.origin||'human',verification:x.verification||'verified',retrievedAt:x.retrievedAt||'',why:x.why||'',supports:x.supports||'',challenges:x.challenges||''})).join('\n');}
function parseClaimsText(text=''){
  return String(text).split('\n').map(raw=>{const line=raw.trim();if(!line)return null;const parts=line.split('|').map(x=>x.trim());const status=['supported','interpretation','open'].includes(parts[0])?parts[0]:'open';const text=parts[1]||'';const evidence=(parts[2]||'').split(',').map(x=>x.trim()).filter(Boolean);const note=parts.slice(3).join(' | ').trim();return text?{status,text,evidence,note}:null;}).filter(Boolean);
}
function formatClaimsText(items=[]){return (Array.isArray(items)?items:[]).map(x=>[x.status||'open',x.text||'',(x.evidence||[]).join(', '),x.note||''].join(' | ').replace(/(?:\s*\|\s*)+$/,'')).join('\n');}
function slugify(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);}
function inline(s=''){let x=esc(s);x=x.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,'<a href="$2" target="_blank" rel="noreferrer">$1</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g,'$1<em>$2</em>');return x;}
function imageMarkup(line){
  const m=String(line).match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)(?:\s+"([^"]*)")?\)$/);
  if(!m)return null;
  const [,alt,url,caption='']=m;const src=state.mediaPreviews[url]||url;
  return `<figure class="md-image"><img src="${escAttr(src)}" alt="${escAttr(alt)}" loading="lazy">${caption?`<figcaption>${esc(caption)}</figcaption>`:''}</figure>`;
}
function markdown(md=''){
  const lines=String(md).replace(/\r\n/g,'\n').split('\n'),out=[];let para=[],list=null,code=false,codeLines=[];
  const fp=()=>{if(para.length){out.push(`<p>${inline(para.join(' '))}</p>`);para=[]}};
  const fl=()=>{if(list){out.push(`<${list.t}>${list.a.map(v=>`<li>${inline(v)}</li>`).join('')}</${list.t}>`);list=null}};
  const fc=()=>{if(code){out.push(`<pre><code>${esc(codeLines.join('\n'))}</code></pre>`);code=false;codeLines=[]}};
  for(const line of lines){
    if(line.startsWith('```')){fp();fl();if(code)fc();else code=true;continue}
    if(code){codeLines.push(line);continue}
    const img=imageMarkup(line.trim());if(img){fp();fl();out.push(img);continue}
    const h=line.match(/^(#{1,3})\s+(.+)/);if(h){fp();fl();out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);continue}
    if(/^>\s?/.test(line)){fp();fl();out.push(`<blockquote>${inline(line.replace(/^>\s?/,''))}</blockquote>`);continue}
    const ul=line.match(/^[-*]\s+(.+)/);const ol=line.match(/^\d+\.\s+(.+)/);if(ul||ol){fp();const t=ul?'ul':'ol';if(!list||list.t!==t){fl();list={t,a:[]}}list.a.push((ul||ol)[1]);continue}
    if(/^---+$/.test(line.trim())){fp();fl();out.push('<hr>');continue}
    if(!line.trim()){fp();fl();continue}
    para.push(line.trim())
  }
  fp();fl();fc();return out.join('');
}

async function api(url,opts={}){const headers={'Content-Type':'application/json',...(opts.headers||{})};if(state.csrf&&opts.method&&opts.method!=='GET')headers['X-CSRF-Token']=state.csrf;const r=await fetch(url,{credentials:'same-origin',...opts,headers});const data=await r.json().catch(()=>({ok:false,message:`HTTP ${r.status}`}));if(!r.ok||data.ok===false)throw Object.assign(new Error(data.message||data.error||`HTTP ${r.status}`),{data,status:r.status});return data;}
function setStatus(text,type=''){els.status.textContent=text;els.status.className=`status ${type}`;}
function setMediaStatus(text,type=''){els.mediaStatus.textContent=text;els.mediaStatus.className=`media-status ${type}`;}
function newDraftInstanceId(){return globalThis.crypto?.randomUUID?.()||`draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;}
function emptyPost(){return{lang:'fi',date:new Date().toISOString().slice(0,10),title:'',category:'info-media',audience:['all'],audienceDepth:'general',description:'',answer:'',sources:[],claims:[],slug:'',translationKey:'',aliases:[],coverImage:'',coverAlt:'',pinned:false,draft:true,body:'',path:'',sha:''};}
function selectedAudience(){const picked=els.audienceChecks.filter(x=>x.checked).map(x=>x.value);return picked.length?picked:['all'];}
function setAudience(values){const set=new Set(Array.isArray(values)&&values.length?values:['all']);els.audienceChecks.forEach(x=>x.checked=set.has(x.value));if(!els.audienceChecks.some(x=>x.checked)){const all=els.audienceChecks.find(x=>x.value==='all');if(all)all.checked=true;}}
function currentForm(draft){const slug=els.slug.value.trim()||slugify(els.title.value);const savedSlug=state.current?.slug||'';const aliases=[...new Set([...(state.current?.aliases||[]),...(state.current?.draft===false&&savedSlug&&savedSlug!==slug?[savedSlug]:[])])].filter(x=>x&&x!==slug);return{lang:els.lang.value,date:els.date.value,title:els.title.value.trim(),category:els.category.value,audience:selectedAudience(),audienceDepth:els.audienceDepth?.value||'general',description:els.description.value.trim(),answer:els.answer.value.trim(),sources:parseSourcesText(els.sources.value),claims:parseClaimsText(els.claims.value),slug,translationKey:els.translationKey.value.trim()||slugify(els.slug.value||els.title.value),aliases,coverImage:els.coverImage.value.trim(),coverAlt:els.coverAlt.value.trim(),pinned:Boolean(els.pinned.checked),draft,body:els.body.value};}
function fingerprintPost(post){let hash=2166136261;const raw=JSON.stringify(post);for(const char of raw){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(36);}
function updateDirty(){state.dirty=fingerprintPost(currentForm(Boolean(state.current?.draft)))!==state.baseline;document.title=`${state.dirty?'• ':''}Anomancer Core · Lähetyskone`;}
function confirmDiscard(){return !state.dirty||confirm('Tässä tekstissä on tallentamattomia muutoksia. Hylätäänkö ne?');}
function updateCoverPreview(){const url=els.coverImage.value.trim();els.coverPreview.hidden=!url;els.coverRemove.hidden=!url;if(url){els.coverPreviewImg.src=state.mediaPreviews[url]||url;els.coverPreviewImg.alt=els.coverAlt.value.trim()||'';}else{els.coverPreviewImg.removeAttribute('src');}}
function loadForm(p){state.current=p;state.draftInstanceId=p.path?'':newDraftInstanceId();els.lang.disabled=Boolean(p.path);els.lang.value=p.lang||'fi';els.date.value=p.date||new Date().toISOString().slice(0,10);els.title.value=p.title||'';els.category.value=CATEGORY_LABELS[p.category]?p.category:'info-media';setAudience(p.audience);if(els.audienceDepth)els.audienceDepth.value=AUDIENCE_DEPTH_LABELS[p.audienceDepth]?p.audienceDepth:'general';els.description.value=p.description||'';els.answer.value=p.answer||'';els.sources.value=formatSourcesText(p.sources);els.claims.value=formatClaimsText(p.claims);els.slug.value=p.slug||'';els.translationKey.value=p.translationKey||'';els.coverImage.value=p.coverImage||'';els.coverAlt.value=p.coverAlt||'';els.pinned.checked=Boolean(p.pinned);els.body.value=p.body||'';els.editing.textContent=p.path?(p.title||p.path):'Uusi lähetys';els.del.hidden=!p.path;updateCoverPreview();renderLiveLink();refreshPreview();renderList();setStatus('');setMediaStatus('');state.baseline=fingerprintPost(currentForm(Boolean(p.draft)));state.dirty=false;document.title='Anomancer Core · Lähetyskone';}
function renderList(){const posts=state.posts.filter(p=>state.filter==='all'||(state.filter==='draft'?p.draft:!p.draft));els.postList.innerHTML=posts.map(p=>`<button class="post-item ${state.current?.path===p.path?'active':''}" data-path="${esc(p.path)}"><strong>${esc(p.title||p.path)}</strong><span>${String(p.lang||'').toUpperCase()} · ${esc(CATEGORY_LABELS[p.category]||p.category||'')} · ${esc(p.date||'')} ${p.pinned?'· PINNATTU ':''}${p.coverImage?'· KUVA ':''}${p.draft?'· LUONNOS':'· JULKAISTU'}</span></button>`).join('')||'<p class="muted">Ei julkaisuja tässä näkymässä.</p>';$$('.post-item').forEach(b=>b.onclick=()=>{const p=state.posts.find(x=>x.path===b.dataset.path);if(p&&confirmDiscard()){loadForm(p);closeSidebar();}});}
function publicPath(p){const slug=p.slug||slugify(p.title);const base=p.lang==='en'?'/dispatches':'/lahetykset';return slug?`${base}/${slug}`:`${base}/…`;}
function renderLiveLink(){const p=currentForm(Boolean(state.current?.draft));const slug=p.slug||slugify(p.title);const path=publicPath(p);els.publicUrl.textContent=`${PUBLIC_ORIGIN}${path}`;const savedSlug=state.current?.slug||slugify(state.current?.title||'');const isPublished=Boolean(state.current?.path&&state.current?.draft===false);const isSavedUrl=Boolean(isPublished&&slug&&slug===savedSlug&&p.lang===(state.current?.lang||p.lang));if(isSavedUrl){els.publicUrlHint.textContent='Julkaistu. Tämä on nykyinen julkinen osoite.';els.live.href=`${PUBLIC_ORIGIN}${path}`;els.live.hidden=false;}else{els.live.hidden=true;if(isPublished&&slug){els.publicUrlHint.textContent='URL on muuttunut. Julkaise muutokset, jotta uusi osoite aktivoituu.';}else if(state.current?.path&&state.current?.draft){els.publicUrlHint.textContent='Luonnos. Osoite aktivoituu julkaistaessa.';}else{els.publicUrlHint.textContent='URL muodostuu otsikosta tai URL-tunnuksesta.';}}}
function renderSourceReview(){if(!els.sourceReview)return;const sources=parseSourcesText(els.sources.value);if(!sources.length){els.sourceReview.innerHTML='<p class="source-empty">Ei lähteitä. Lisää lähde raakadatakenttään tai aja Lähdeagentti.</p>';return;}els.sourceReview.innerHTML=sources.map((source,index)=>{const status=source.verification||'verified';const label=status==='verified'?'Tarkistettu':status==='rejected'?'Hylätty':'Ehdokas';return `<article class="source-card" data-source-status="${escAttr(status)}"><div class="source-card-head"><span class="source-state">${label}</span><span>${source.origin==='source-agent'?'Agenttihaku':'Ihmisen lisäämä'}</span></div><h4>${esc(source.title)}</h4>${source.publisher||source.date?`<p>${esc([source.publisher,source.date].filter(Boolean).join(' · '))}</p>`:''}${source.why?`<p><strong>Miksi:</strong> ${esc(source.why)}</p>`:''}${source.supports?`<p><strong>Tukee:</strong> ${esc(source.supports)}</p>`:''}${source.challenges?`<p><strong>Haastaa:</strong> ${esc(source.challenges)}</p>`:''}<div class="source-actions"><a href="${escAttr(source.url)}" target="_blank" rel="noopener noreferrer">Avaa lähde ↗</a>${status!=='verified'?`<button type="button" data-source-action="verify" data-source-index="${index}">Merkitse tarkistetuksi</button>`:''}${status==='verified'&&source.origin==='source-agent'?`<button type="button" class="ghost" data-source-action="candidate" data-source-index="${index}">Palauta ehdokkaaksi</button>`:''}<button type="button" class="ghost" data-source-action="remove" data-source-index="${index}">Poista</button></div></article>`;}).join('');}
function updateSource(index,action){const sources=parseSourcesText(els.sources.value),source=sources[index];if(!source)return;if(action==='remove')sources.splice(index,1);else if(action==='verify'){if(!confirm(`Merkitäänkö “${source.title||source.url}” tarkistetuksi? Vahvista vain, jos olet avannut lähteen ja tarkistanut, että sen sisältö, asiayhteys ja väitteeseen kytkentä pitävät.`))return;source.verification='verified';}else source.verification='candidate';els.sources.value=formatSourcesText(sources);refreshPreview();updateDirty();}
function refreshPreview(){const p=currentForm(Boolean(state.current?.draft));const words=p.body.trim()?p.body.trim().split(/\s+/).length:0;els.wordCount.textContent=`${words} sanaa · ${Math.max(1,Math.ceil(words/220))} min`;els.descCount.textContent=`${p.description.length} / 220`;els.answerCount.textContent=`${p.answer.length} / 1200`;els.previewBadge.textContent=`${p.pinned?'PINNATTU · ':''}${state.current?.draft===false?'JULKAISTU':'LUONNOS'}`;const coverSrc=p.coverImage?(state.mediaPreviews[p.coverImage]||p.coverImage):'';const cover=p.coverImage?`<figure class="preview-cover"><img src="${escAttr(coverSrc)}" alt="${escAttr(p.coverAlt)}"></figure>`:'';const aud=`<div class="preview-audience">${p.audience.map(id=>`<span>${esc(AUDIENCE_LABELS[id]||id)}</span>`).join('')}<span>${esc(AUDIENCE_DEPTH_LABELS[p.audienceDepth]||'Yleistajuinen')}</span></div>`;const answer=p.answer?`<section class="preview-evidence-answer"><strong>Ydinvastaus</strong><p>${esc(p.answer)}</p></section>`:'';const verified=p.sources.filter(x=>x.verification==='verified').length;const ev=(p.sources.length||p.claims.length)?`<p class="preview-evidence-count">Evidenssikerros · ${verified}/${p.sources.length} lähdettä tarkistettu · ${p.claims.length} väitettä</p>`:'';els.preview.innerHTML=`<p class="kicker">${esc(CATEGORY_LABELS[p.category]||p.category)}</p>${aud}<h1>${esc(p.title||'Otsikko')}</h1><p class="muted">${esc(p.date||'')}</p>${answer}${cover}${markdown(p.body||'')}${ev}`;updateCoverPreview();renderLiveLink();renderSourceReview();}

function setBusy(value){state.busy=value;for(const element of [els.saveDraft,els.publish,els.del,els.newBtn])if(element)element.disabled=value||state.editorLocked;}
function setEditorLocked(value){state.editorLocked=value;const selectors=['#lang','#date','#title','#category','#slug','#pinned','#audienceDepth','#description','#translationKey','#coverAlt','#body','#answer','#sources','#claims','#coverSelectBtn','#coverRemoveBtn','#insertImageBtn','#saveDraftBtn','#publishBtn','#deleteBtn','#newBtn','#agentRunBtn','#agentApplyBtn','#agentMoreBtn','.post-item','.source-review button'];for(const selector of selectors)for(const element of $$(selector))element.disabled=value||state.busy;document.body.classList.toggle('editor-locked',value);}
function setSidebarOpen(open){els.sidebar?.classList.toggle('is-open',Boolean(open));els.sidebarToggle?.setAttribute('aria-expanded',String(Boolean(open)));document.body.classList.toggle('library-open',Boolean(open));}
function closeSidebar(){setSidebarOpen(false);}
function updateSidebarLabel(){if(els.sidebarToggle)els.sidebarToggle.textContent=`Lähetykset${state.posts.length?` · ${state.posts.length}`:''}`;}
function selectEditorView(name){$$('[data-editor-tab]').forEach(button=>{const active=button.dataset.editorTab===name;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});$$('[data-editor-panel]').forEach(panel=>{const active=panel.dataset.editorPanel===name;panel.classList.toggle('active',active);panel.hidden=!active;});}

function imageDimensions(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{resolve({img,width:img.naturalWidth,height:img.naturalHeight,url})};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Kuvaa ei voitu avata.'))};img.src=url;});}
async function canvasBlob(canvas,type,quality){return await new Promise(resolve=>canvas.toBlob(resolve,type,quality));}
async function prepareImage(file){
  if(!file)throw new Error('Kuva puuttuu.');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Tuettu kuvaformaatti: JPG, PNG tai WebP.');
  if(file.size>MAX_SOURCE_BYTES)throw new Error('Alkuperäinen kuva on liian suuri (max 20 Mt).');
  const decoded=await imageDimensions(file);
  try{
    let max=1600,quality=.84,blob=null;
    for(let attempt=0;attempt<5;attempt++){
      const scale=Math.min(1,max/Math.max(decoded.width,decoded.height));
      const w=Math.max(1,Math.round(decoded.width*scale)),h=Math.max(1,Math.round(decoded.height*scale));
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d',{alpha:true});ctx.drawImage(decoded.img,0,0,w,h);
      blob=await canvasBlob(canvas,'image/webp',quality);
      if(!blob)blob=await canvasBlob(canvas,'image/jpeg',quality);
      if(blob&&blob.size<=MAX_UPLOAD_BYTES)break;
      max=Math.max(800,Math.round(max*.82));quality=Math.max(.62,quality-.06);
    }
    if(!blob||blob.size>MAX_UPLOAD_BYTES)throw new Error('Kuva ei pienentynyt tarpeeksi. Kokeile pienempää kuvaa.');
    return blob;
  } finally {URL.revokeObjectURL(decoded.url);}
}
function blobDataUrl(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('Kuvan lukeminen epäonnistui.'));r.readAsDataURL(blob);});}
async function uploadImage(file){const blob=await prepareImage(file);const data=await blobDataUrl(blob);const result=await api('/api/admin/content?resource=media',{method:'POST',body:JSON.stringify({data,name:file.name,date:els.date.value})});return {...result,previewData:data};}
function insertAtCursor(text){const el=els.body,start=el.selectionStart??el.value.length,end=el.selectionEnd??start,before=el.value.slice(0,start),after=el.value.slice(end);const prefix=before&&!before.endsWith('\n')?'\n\n':'';const suffix=after&&!after.startsWith('\n')?'\n\n':'';el.value=before+prefix+text+suffix+after;const pos=(before+prefix+text).length;el.focus();el.setSelectionRange(pos,pos);refreshPreview();updateDirty();}
function cleanMdText(s=''){return String(s).replace(/[\[\]\n\r]/g,' ').trim();}
async function chooseCover(file){try{setMediaStatus('Kansikuvaa pienennetään ja lähetetään GitHubiin…');const r=await uploadImage(file);state.mediaPreviews[r.url]=r.previewData;els.coverImage.value=r.url;els.coverAlt.value=els.coverAlt.value.trim()||els.title.value.trim()||cleanMdText(file.name.replace(/\.[^.]+$/,''));setMediaStatus(`✓ Kansikuva tallennettu: ${r.url}`,'ok');refreshPreview();updateDirty();}catch(e){setMediaStatus(`✗ ${e.message}`,'err');}finally{els.coverPicker.value='';}}
async function chooseBodyImage(file){
  const proposed=els.title.value.trim()?`${els.title.value.trim()} – kuva`:cleanMdText(file.name.replace(/\.[^.]+$/,''));
  const alt=prompt('Alt-teksti kuvalle:',proposed);if(alt===null){els.bodyImagePicker.value='';return;}
  const caption=prompt('Kuvateksti (valinnainen):','');if(caption===null){els.bodyImagePicker.value='';return;}
  try{setMediaStatus('Kuvaa pienennetään ja lähetetään GitHubiin…');const r=await uploadImage(file);state.mediaPreviews[r.url]=r.previewData;const safeAlt=cleanMdText(alt);const safeCaption=String(caption||'').replace(/["\n\r]/g,' ').trim();insertAtCursor(`![${safeAlt}](${r.url}${safeCaption?` "${safeCaption}"`:''})`);setMediaStatus(`✓ Kuva lisätty tekstiin: ${r.url}`,'ok');}catch(e){setMediaStatus(`✗ ${e.message}`,'err');}finally{els.bodyImagePicker.value='';}
}

async function session(){const d=await api('/api/admin/auth?resource=session',{method:'GET'});state.authenticated=d.authenticated;state.csrf=d.csrf||'';els.login.hidden=state.authenticated;els.app.hidden=!state.authenticated;if(state.authenticated){els.repoStatus.textContent=d.github?.configured?`${d.github.repo} · ${d.github.branch}`:'GitHub-yhteys ei ole vielä konfiguroitu';els.repoStatus.className=`repo-status ${d.github?.configured?'ok':''}`;if(d.github?.configured){try{const st=await api('/api/admin/auth?resource=status',{method:'GET'});if(st.github?.fullName){els.repoStatus.textContent=`✓ ${st.github.fullName} · ${st.github.branch}${st.github.private?' · yksityinen':''}`;els.repoStatus.className='repo-status ok';}}catch(e){els.repoStatus.textContent=`GitHub-yhteys: ${e.message}`;els.repoStatus.className='repo-status';}}await loadPosts();window.dispatchEvent(new CustomEvent('anomancer:admin-ready'));}}
async function loadPosts(){try{const d=await api('/api/admin/content?resource=posts',{method:'GET'});state.posts=d.posts||[];updateSidebarLabel();renderList();if(state.current?.path){const fresh=state.posts.find(p=>p.path===state.current.path);if(fresh)loadForm(fresh);else loadForm(emptyPost());}}catch(e){els.repoStatus.textContent=e.message;els.repoStatus.className='repo-status';}}
async function save(draft){if(state.busy||state.editorLocked)return;setBusy(true);try{setStatus(draft?'Tallennetaan luonnosta…':'Julkaistaan…');const post=currentForm(draft);const d=await api('/api/admin/content?resource=posts',{method:'POST',body:JSON.stringify({path:state.current?.path||'',sha:state.current?.sha||'',post})});const url=`${PUBLIC_ORIGIN}${publicPath(post)}`;await loadPosts();const fresh=state.posts.find(p=>p.path===d.path);if(fresh)loadForm(fresh);setStatus(draft?'✓ Luonnos tallennettu GitHubiin.':`✓ Julkaisucommitti tehty. Julkinen osoite: ${url} · Vercel päivittää sivun automaattisesti.`,'ok');}catch(e){setStatus(`✗ ${e.message}`,'err');}finally{setBusy(false);}}
async function remove(){if(state.busy||state.editorLocked||!state.current?.path||!confirm(`Poistetaanko “${state.current.title}”? Tämä tekee poistocommitin GitHubiin.`))return;setBusy(true);try{setStatus('Poistetaan…');await api('/api/admin/content?resource=posts',{method:'DELETE',body:JSON.stringify({path:state.current.path,sha:state.current.sha})});state.current=null;state.dirty=false;await loadPosts();loadForm(emptyPost());setStatus('✓ Poistettu GitHubista.','ok');}catch(e){setStatus(`✗ ${e.message}`,'err');}finally{setBusy(false);}}
function publishReview(){const p=currentForm(false);const verified=new Set(p.sources.filter(x=>x.verification==='verified').map(x=>x.url));const pending=p.sources.filter(x=>x.verification!=='verified');const unsupported=p.claims.filter(claim=>claim.status==='supported'&&!claim.evidence.some(url=>verified.has(url)));const errors=[];if(!p.title)errors.push('Otsikko puuttuu.');if(!p.description)errors.push('SEO-kuvaus puuttuu.');if(pending.length)errors.push(`${pending.length} lähdettä odottaa ihmisen tarkistusta.`);if(unsupported.length)errors.push(`${unsupported.length} tuettua väitettä ilman tarkistettua evidenssiä.`);if(p.coverImage&&!p.coverAlt)errors.push('Kansikuvalta puuttuu alt-teksti.');els.publishSummary.innerHTML=`<dl><div><dt>Otsikko</dt><dd>${esc(p.title||'—')}</dd></div><div><dt>Julkinen URL</dt><dd>${esc(PUBLIC_ORIGIN+publicPath(p))}</dd></div><div><dt>Lähteet</dt><dd>${p.sources.length} · ${verified.size} tarkistettu</dd></div><div><dt>Väitteet</dt><dd>${p.claims.length}</dd></div>${p.aliases.length?`<div><dt>Vanhat osoitteet</dt><dd>${p.aliases.map(esc).join(', ')}</dd></div>`:''}</dl>${errors.length?`<div class="publish-errors" role="alert"><strong>Julkaisu ei ole vielä valmis:</strong><ul>${errors.map(error=>`<li>${esc(error)}</li>`).join('')}</ul></div>`:'<p class="publish-ready">✓ Julkaisun pakolliset tarkistukset läpäisty.</p>'}`;els.publishConfirm.disabled=errors.length>0;els.publishDialog.showModal();}

els.loginForm.onsubmit=async e=>{e.preventDefault();els.loginError.textContent='';try{await api('/api/admin/auth?resource=login',{method:'POST',body:JSON.stringify({password:els.password.value})});els.password.value='';await session();}catch(e){els.loginError.textContent=e.message||'Kirjautuminen epäonnistui.'}};
els.logout.onclick=async()=>{if(!confirmDiscard())return;try{await api('/api/admin/auth?resource=logout',{method:'POST',body:'{}'});}catch{}state.csrf='';state.authenticated=false;state.dirty=false;els.app.hidden=true;els.login.hidden=false;};
els.newBtn.onclick=()=>{if(confirmDiscard()){loadForm(emptyPost());closeSidebar();}};els.saveDraft.onclick=()=>save(true);els.publish.onclick=publishReview;els.del.onclick=remove;
els.coverSelect.onclick=()=>els.coverPicker.click();els.coverPicker.onchange=()=>{const f=els.coverPicker.files?.[0];if(f)chooseCover(f)};
els.coverRemove.onclick=()=>{els.coverImage.value='';els.coverAlt.value='';setMediaStatus('Kansikuva irrotettu artikkelista. GitHubiin jo tallennettu kuvatiedosto jää talteen.');refreshPreview();updateDirty();};
els.insertImage.onclick=()=>els.bodyImagePicker.click();els.bodyImagePicker.onchange=()=>{const f=els.bodyImagePicker.files?.[0];if(f)chooseBodyImage(f)};
$$('.filters button').forEach(b=>b.onclick=()=>{$$('.filters button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;renderList()});
els.audienceDepth?.addEventListener('change',()=>{refreshPreview();updateDirty();});
els.audienceChecks.forEach(box=>box.addEventListener('change',()=>{
  if(box.value==='all'&&box.checked){els.audienceChecks.forEach(x=>{if(x!==box)x.checked=false});}
  else if(box.checked){const all=els.audienceChecks.find(x=>x.value==='all');if(all)all.checked=false;}
  if(!els.audienceChecks.some(x=>x.checked)){const all=els.audienceChecks.find(x=>x.value==='all');if(all)all.checked=true;}
  refreshPreview();updateDirty();
}));
[els.lang,els.date,els.title,els.category,els.slug,els.description,els.answer,els.sources,els.claims,els.translationKey,els.coverImage,els.coverAlt,els.body].forEach(el=>el.addEventListener('input',()=>{refreshPreview();updateDirty();}));
els.pinned.addEventListener('change',()=>{refreshPreview();updateDirty();});
els.title.addEventListener('blur',()=>{if(!els.slug.value)els.slug.value=slugify(els.title.value);if(!els.translationKey.value)els.translationKey.value=slugify(els.title.value);if(els.coverImage.value&&!els.coverAlt.value)els.coverAlt.value=els.title.value.trim();refreshPreview();updateDirty()});
els.sourceReview?.addEventListener('click',event=>{const button=event.target.closest('[data-source-action]');if(button)updateSource(Number(button.dataset.sourceIndex),button.dataset.sourceAction);});
$$('[data-editor-tab]').forEach(button=>button.addEventListener('click',()=>selectEditorView(button.dataset.editorTab)));
$$('[data-editor-tab]').forEach((button,index,tabs)=>button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();let next=index;if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else next=(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();selectEditorView(tabs[next].dataset.editorTab);}));
els.sidebarToggle?.addEventListener('click',()=>setSidebarOpen(!els.sidebar?.classList.contains('is-open')));
els.sidebarClose?.addEventListener('click',closeSidebar);
$('#sidebarBackdrop')?.addEventListener('click',closeSidebar);
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&els.sidebar?.classList.contains('is-open'))closeSidebar();});
els.publishDialog?.addEventListener('close',()=>{if(els.publishDialog.returnValue==='confirm')save(false);});
window.addEventListener('beforeunload',event=>{if(state.dirty){event.preventDefault();event.returnValue='';}});
window.anomancerAdminBridge={getDraftIdentity:()=>({path:state.current?.path||'',sha:state.current?.sha||'',instanceId:state.current?.path?'':state.draftInstanceId,title:els.title.value.trim()}),getPost:()=>currentForm(Boolean(state.current?.draft)),setEditorLocked,updateSources:sources=>{els.sources.value=formatSourcesText(sources);refreshPreview();updateDirty();}};

const LAYOUT_KEY='anomancer.admin.layout.v16.0.1';
function clampLayout(value,min,max,fallback){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
function readLayout(){try{return JSON.parse(localStorage.getItem(LAYOUT_KEY)||'{}')||{};}catch{return {};}}
function writeLayout(next){try{localStorage.setItem(LAYOUT_KEY,JSON.stringify(next));}catch{}}
function initLayoutControls(){
  const grid=$('.editor-grid'),editorWidth=$('#editorWidth'),libraryWidth=$('#libraryWidth'),previewToggle=$('#previewToggle'),editorOut=$('#editorWidthValue'),libraryOut=$('#libraryWidthValue'),reset=$('#layoutReset'),resizer=$('#editorResizer');
  if(!grid||!editorWidth||!libraryWidth||!previewToggle)return;
  let layout={editor:56,library:320,preview:true,...readLayout()};
  const apply=()=>{
    layout.editor=clampLayout(layout.editor,42,72,56);layout.library=clampLayout(layout.library,260,460,320);layout.preview=layout.preview!==false;
    document.documentElement.style.setProperty('--editor-size',`${layout.editor}%`);
    document.documentElement.style.setProperty('--library-width',`${layout.library}px`);
    grid.classList.toggle('preview-hidden',!layout.preview);
    editorWidth.value=String(layout.editor);libraryWidth.value=String(layout.library);previewToggle.checked=layout.preview;
    if(editorOut)editorOut.value=`${layout.editor} %`;if(libraryOut)libraryOut.value=`${layout.library} px`;
    if(resizer)resizer.setAttribute('aria-valuenow',String(layout.editor));
  };
  const save=()=>{apply();writeLayout(layout);};
  editorWidth.addEventListener('input',()=>{layout.editor=Number(editorWidth.value);save();});
  libraryWidth.addEventListener('input',()=>{layout.library=Number(libraryWidth.value);save();});
  previewToggle.addEventListener('change',()=>{layout.preview=previewToggle.checked;save();});
  reset?.addEventListener('click',()=>{layout={editor:56,library:320,preview:true};save();});
  let dragging=false;
  const fromPointer=x=>{const rect=grid.getBoundingClientRect();if(rect.width<1)return;layout.editor=clampLayout(((x-rect.left)/rect.width)*100,42,72,56);save();};
  resizer?.addEventListener('pointerdown',event=>{if(window.matchMedia('(max-width:1100px)').matches)return;dragging=true;resizer.classList.add('is-dragging');resizer.setPointerCapture?.(event.pointerId);fromPointer(event.clientX);});
  resizer?.addEventListener('pointermove',event=>{if(dragging)fromPointer(event.clientX);});
  const stop=event=>{if(!dragging)return;dragging=false;resizer?.classList.remove('is-dragging');try{resizer?.releasePointerCapture?.(event.pointerId);}catch{}};
  resizer?.addEventListener('pointerup',stop);resizer?.addEventListener('pointercancel',stop);
  resizer?.addEventListener('dblclick',()=>{layout.editor=56;save();});
  resizer?.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();if(event.key==='Home')layout.editor=42;else if(event.key==='End')layout.editor=72;else layout.editor+=event.key==='ArrowRight'?2:-2;save();});
  apply();
}

initLayoutControls();
setSidebarOpen(false);
loadForm(emptyPost());session().catch(e=>{els.login.hidden=false;els.loginError.textContent=e.message});
