const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={csrf:'',posts:[],current:null,filter:'all',authenticated:false,mediaPreviews:{}};
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
const els={
  login:$('#loginView'),app:$('#appView'),loginForm:$('#loginForm'),password:$('#password'),loginError:$('#loginError'),
  postList:$('#postList'),repoStatus:$('#repoStatus'),newBtn:$('#newBtn'),logout:$('#logoutBtn'),editing:$('#editingLabel'),
  lang:$('#lang'),date:$('#date'),title:$('#title'),category:$('#category'),slug:$('#slug'),pinned:$('#pinned'),description:$('#description'),translationKey:$('#translationKey'),
  coverImage:$('#coverImage'),coverAlt:$('#coverAlt'),coverPicker:$('#coverPicker'),coverSelect:$('#coverSelectBtn'),coverRemove:$('#coverRemoveBtn'),coverPreview:$('#coverPreview'),coverPreviewImg:$('#coverPreviewImg'),
  body:$('#body'),bodyImagePicker:$('#bodyImagePicker'),insertImage:$('#insertImageBtn'),mediaStatus:$('#mediaStatus'),
  descCount:$('#descCount'),wordCount:$('#wordCount'),preview:$('#preview'),previewBadge:$('#previewBadge'),status:$('#status'),
  saveDraft:$('#saveDraftBtn'),publish:$('#publishBtn'),del:$('#deleteBtn'),live:$('#liveLink'),publicUrl:$('#publicUrl'),publicUrlHint:$('#publicUrlHint'),
  audienceChecks:$$('input[name="audience"]')
};

function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function escAttr(s=''){return esc(s);}
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
function emptyPost(){return{lang:'fi',date:new Date().toISOString().slice(0,10),title:'',category:'info-media',audience:['all'],description:'',slug:'',translationKey:'',coverImage:'',coverAlt:'',pinned:false,draft:true,body:'',path:'',sha:''};}
function selectedAudience(){const picked=els.audienceChecks.filter(x=>x.checked).map(x=>x.value);return picked.length?picked:['all'];}
function setAudience(values){const set=new Set(Array.isArray(values)&&values.length?values:['all']);els.audienceChecks.forEach(x=>x.checked=set.has(x.value));if(!els.audienceChecks.some(x=>x.checked)){const all=els.audienceChecks.find(x=>x.value==='all');if(all)all.checked=true;}}
function currentForm(draft){return{lang:els.lang.value,date:els.date.value,title:els.title.value.trim(),category:els.category.value,audience:selectedAudience(),description:els.description.value.trim(),slug:els.slug.value.trim()||slugify(els.title.value),translationKey:els.translationKey.value.trim()||slugify(els.slug.value||els.title.value),coverImage:els.coverImage.value.trim(),coverAlt:els.coverAlt.value.trim(),pinned:Boolean(els.pinned.checked),draft,body:els.body.value};}
function updateCoverPreview(){const url=els.coverImage.value.trim();els.coverPreview.hidden=!url;els.coverRemove.hidden=!url;if(url){els.coverPreviewImg.src=state.mediaPreviews[url]||url;els.coverPreviewImg.alt=els.coverAlt.value.trim()||'';}else{els.coverPreviewImg.removeAttribute('src');}}
function loadForm(p){state.current=p;els.lang.disabled=Boolean(p.path);els.lang.value=p.lang||'fi';els.date.value=p.date||new Date().toISOString().slice(0,10);els.title.value=p.title||'';els.category.value=CATEGORY_LABELS[p.category]?p.category:'info-media';setAudience(p.audience);els.description.value=p.description||'';els.slug.value=p.slug||'';els.translationKey.value=p.translationKey||'';els.coverImage.value=p.coverImage||'';els.coverAlt.value=p.coverAlt||'';els.pinned.checked=Boolean(p.pinned);els.body.value=p.body||'';els.editing.textContent=p.path?(p.title||p.path):'Uusi lähetys';els.del.hidden=!p.path;updateCoverPreview();renderLiveLink();refreshPreview();renderList();setStatus('');setMediaStatus('');}
function renderList(){const posts=state.posts.filter(p=>state.filter==='all'||(state.filter==='draft'?p.draft:!p.draft));els.postList.innerHTML=posts.map(p=>`<button class="post-item ${state.current?.path===p.path?'active':''}" data-path="${esc(p.path)}"><strong>${esc(p.title||p.path)}</strong><span>${String(p.lang||'').toUpperCase()} · ${esc(CATEGORY_LABELS[p.category]||p.category||'')} · ${esc(p.date||'')} ${p.pinned?'· PINNATTU ':''}${p.coverImage?'· KUVA ':''}${p.draft?'· LUONNOS':'· JULKAISTU'}</span></button>`).join('')||'<p class="muted">Ei julkaisuja tässä näkymässä.</p>';$$('.post-item').forEach(b=>b.onclick=()=>{const p=state.posts.find(x=>x.path===b.dataset.path);if(p)loadForm(p)});}
function publicPath(p){const slug=p.slug||slugify(p.title);const base=p.lang==='en'?'/dispatches':'/lahetykset';return slug?`${base}/${slug}`:`${base}/…`;}
function renderLiveLink(){const p=currentForm(Boolean(state.current?.draft));const slug=p.slug||slugify(p.title);const path=publicPath(p);els.publicUrl.textContent=`${PUBLIC_ORIGIN}${path}`;const savedSlug=state.current?.slug||slugify(state.current?.title||'');const isPublished=Boolean(state.current?.path&&state.current?.draft===false);const isSavedUrl=Boolean(isPublished&&slug&&slug===savedSlug&&p.lang===(state.current?.lang||p.lang));if(isSavedUrl){els.publicUrlHint.textContent='Julkaistu. Tämä on nykyinen julkinen osoite.';els.live.href=`${PUBLIC_ORIGIN}${path}`;els.live.hidden=false;}else{els.live.hidden=true;if(isPublished&&slug){els.publicUrlHint.textContent='URL on muuttunut. Julkaise muutokset, jotta uusi osoite aktivoituu.';}else if(state.current?.path&&state.current?.draft){els.publicUrlHint.textContent='Luonnos. Osoite aktivoituu julkaistaessa.';}else{els.publicUrlHint.textContent='URL muodostuu otsikosta tai slugista.';}}}
function refreshPreview(){const p=currentForm(Boolean(state.current?.draft));const words=p.body.trim()?p.body.trim().split(/\s+/).length:0;els.wordCount.textContent=`${words} sanaa · ${Math.max(1,Math.ceil(words/220))} min`;els.descCount.textContent=`${p.description.length} / 220`;els.previewBadge.textContent=`${p.pinned?'PINNATTU · ':''}${state.current?.draft===false?'JULKAISTU':'LUONNOS'}`;const coverSrc=p.coverImage?(state.mediaPreviews[p.coverImage]||p.coverImage):'';const cover=p.coverImage?`<figure class="preview-cover"><img src="${escAttr(coverSrc)}" alt="${escAttr(p.coverAlt)}"></figure>`:'';const aud=`<div class="preview-audience">${p.audience.map(id=>`<span>${esc(AUDIENCE_LABELS[id]||id)}</span>`).join('')}</div>`;els.preview.innerHTML=`<p class="kicker">${esc(CATEGORY_LABELS[p.category]||p.category)}</p>${aud}<h1>${esc(p.title||'Otsikko')}</h1><p class="muted">${esc(p.date||'')}</p>${cover}${markdown(p.body||'')}`;updateCoverPreview();renderLiveLink();}

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
async function uploadImage(file){const blob=await prepareImage(file);const data=await blobDataUrl(blob);const result=await api('/api/admin/media',{method:'POST',body:JSON.stringify({data,name:file.name,date:els.date.value})});return {...result,previewData:data};}
function insertAtCursor(text){const el=els.body,start=el.selectionStart??el.value.length,end=el.selectionEnd??start,before=el.value.slice(0,start),after=el.value.slice(end);const prefix=before&&!before.endsWith('\n')?'\n\n':'';const suffix=after&&!after.startsWith('\n')?'\n\n':'';el.value=before+prefix+text+suffix+after;const pos=(before+prefix+text).length;el.focus();el.setSelectionRange(pos,pos);refreshPreview();}
function cleanMdText(s=''){return String(s).replace(/[\[\]\n\r]/g,' ').trim();}
async function chooseCover(file){try{setMediaStatus('Kansikuvaa pienennetään ja lähetetään GitHubiin…');const r=await uploadImage(file);state.mediaPreviews[r.url]=r.previewData;els.coverImage.value=r.url;els.coverAlt.value=els.coverAlt.value.trim()||els.title.value.trim()||cleanMdText(file.name.replace(/\.[^.]+$/,''));setMediaStatus(`✓ Kansikuva tallennettu: ${r.url}`,'ok');refreshPreview();}catch(e){setMediaStatus(`✗ ${e.message}`,'err');}finally{els.coverPicker.value='';}}
async function chooseBodyImage(file){
  const proposed=els.title.value.trim()?`${els.title.value.trim()} – kuva`:cleanMdText(file.name.replace(/\.[^.]+$/,''));
  const alt=prompt('Alt-teksti kuvalle:',proposed);if(alt===null){els.bodyImagePicker.value='';return;}
  const caption=prompt('Kuvateksti (valinnainen):','');if(caption===null){els.bodyImagePicker.value='';return;}
  try{setMediaStatus('Kuvaa pienennetään ja lähetetään GitHubiin…');const r=await uploadImage(file);state.mediaPreviews[r.url]=r.previewData;const safeAlt=cleanMdText(alt);const safeCaption=String(caption||'').replace(/["\n\r]/g,' ').trim();insertAtCursor(`![${safeAlt}](${r.url}${safeCaption?` "${safeCaption}"`:''})`);setMediaStatus(`✓ Kuva lisätty tekstiin: ${r.url}`,'ok');}catch(e){setMediaStatus(`✗ ${e.message}`,'err');}finally{els.bodyImagePicker.value='';}
}

async function session(){const d=await api('/api/admin/session',{method:'GET'});state.authenticated=d.authenticated;state.csrf=d.csrf||'';els.login.hidden=state.authenticated;els.app.hidden=!state.authenticated;if(state.authenticated){els.repoStatus.textContent=d.github?.configured?`${d.github.repo} · ${d.github.branch}`:'GitHub-yhteys ei ole vielä konfiguroitu';els.repoStatus.className=`repo-status ${d.github?.configured?'ok':''}`;if(d.github?.configured){try{const st=await api('/api/admin/status',{method:'GET'});if(st.github?.fullName){els.repoStatus.textContent=`✓ ${st.github.fullName} · ${st.github.branch}${st.github.private?' · private':''}`;els.repoStatus.className='repo-status ok';}}catch(e){els.repoStatus.textContent=`GitHub-yhteys: ${e.message}`;els.repoStatus.className='repo-status';}}await loadPosts();}}
async function loadPosts(){try{const d=await api('/api/admin/posts',{method:'GET'});state.posts=d.posts||[];renderList();if(state.current?.path){const fresh=state.posts.find(p=>p.path===state.current.path);if(fresh)loadForm(fresh);else loadForm(emptyPost());}}catch(e){els.repoStatus.textContent=e.message;els.repoStatus.className='repo-status';}}
async function save(draft){try{setStatus(draft?'Tallennetaan luonnosta…':'Julkaistaan…');const post=currentForm(draft);const d=await api('/api/admin/posts',{method:'POST',body:JSON.stringify({path:state.current?.path||'',sha:state.current?.sha||'',post})});const url=`${PUBLIC_ORIGIN}${publicPath(post)}`;await loadPosts();const fresh=state.posts.find(p=>p.path===d.path);if(fresh)loadForm(fresh);setStatus(draft?'✓ Luonnos tallennettu GitHubiin.':`✓ Julkaisucommitti tehty. Julkinen osoite: ${url} · Vercel päivittää sivun automaattisesti.`,'ok');}catch(e){setStatus(`✗ ${e.message}`,'err');}}
async function remove(){if(!state.current?.path||!confirm(`Poistetaanko “${state.current.title}”? Tämä tekee poistocommitin GitHubiin.`))return;try{setStatus('Poistetaan…');await api('/api/admin/posts',{method:'DELETE',body:JSON.stringify({path:state.current.path,sha:state.current.sha})});state.current=null;await loadPosts();loadForm(emptyPost());setStatus('✓ Poistettu GitHubista.','ok');}catch(e){setStatus(`✗ ${e.message}`,'err');}}

els.loginForm.onsubmit=async e=>{e.preventDefault();els.loginError.textContent='';try{await api('/api/admin/login',{method:'POST',body:JSON.stringify({password:els.password.value})});els.password.value='';await session();}catch(e){els.loginError.textContent=e.message||'Kirjautuminen epäonnistui.'}};
els.logout.onclick=async()=>{try{await api('/api/admin/logout',{method:'POST',body:'{}'});}catch{}state.csrf='';state.authenticated=false;els.app.hidden=true;els.login.hidden=false;};
els.newBtn.onclick=()=>loadForm(emptyPost());els.saveDraft.onclick=()=>save(true);els.publish.onclick=()=>save(false);els.del.onclick=remove;
els.coverSelect.onclick=()=>els.coverPicker.click();els.coverPicker.onchange=()=>{const f=els.coverPicker.files?.[0];if(f)chooseCover(f)};
els.coverRemove.onclick=()=>{els.coverImage.value='';els.coverAlt.value='';setMediaStatus('Kansikuva irrotettu artikkelista. GitHubiin jo tallennettu kuvatiedosto jää talteen.');refreshPreview();};
els.insertImage.onclick=()=>els.bodyImagePicker.click();els.bodyImagePicker.onchange=()=>{const f=els.bodyImagePicker.files?.[0];if(f)chooseBodyImage(f)};
$$('.filters button').forEach(b=>b.onclick=()=>{$$('.filters button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;renderList()});
els.audienceChecks.forEach(box=>box.addEventListener('change',()=>{
  if(box.value==='all'&&box.checked){els.audienceChecks.forEach(x=>{if(x!==box)x.checked=false});}
  else if(box.checked){const all=els.audienceChecks.find(x=>x.value==='all');if(all)all.checked=false;}
  if(!els.audienceChecks.some(x=>x.checked)){const all=els.audienceChecks.find(x=>x.value==='all');if(all)all.checked=true;}
  refreshPreview();
}));
[els.lang,els.date,els.title,els.category,els.slug,els.description,els.translationKey,els.coverImage,els.coverAlt,els.body].forEach(el=>el.addEventListener('input',refreshPreview));
els.pinned.addEventListener('change',refreshPreview);
els.title.addEventListener('blur',()=>{if(!els.slug.value)els.slug.value=slugify(els.title.value);if(!els.translationKey.value)els.translationKey.value=slugify(els.title.value);if(els.coverImage.value&&!els.coverAlt.value)els.coverAlt.value=els.title.value.trim();refreshPreview()});
loadForm(emptyPost());session().catch(e=>{els.login.hidden=false;els.loginError.textContent=e.message});
