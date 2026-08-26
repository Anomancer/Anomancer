const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const desk=q('#orchestraDesk');
if(desk){
  const runBtn=q('#orchestraRunBtn'),stopBtn=q('#orchestraStopBtn'),applyBtn=q('#orchestraApplyBtn'),copyBtn=q('#orchestraCopyBtn');
  const instruction=q('#orchestraInstruction'),terminal=q('#orchestraTerminal'),stateEl=q('#orchestraRunState'),resultBox=q('#orchestraResultBox'),resultPre=q('#orchestraResult');
  const PIPELINE=[
    {id:'source',label:'Lähdeagentti'},
    {id:'claims',label:'Väitevahti'},
    {id:'structure',label:'Rakenneagentti'},
    {id:'writer',label:'Kirjoitusagentti'},
    {id:'critic',label:'Kriitikko'},
    {id:'voice',label:'Äänieditori'},
    {id:'package',label:'Julkaisupaketti'},
  ];
  let running=false,stopRequested=false,controller=null,csrf='',finalRun=null;

  function now(){return new Date().toLocaleTimeString('fi-FI',{hour12:false});}
  function log(message,mark='·'){
    if(terminal.textContent.startsWith('$ valmis'))terminal.textContent='';
    terminal.textContent+=`${terminal.textContent?'\n':''}[${now()}] ${mark} ${message}`;
    terminal.scrollTop=terminal.scrollHeight;
  }
  function setRunState(text){stateEl.textContent=text;}
  function stageNode(id){return q(`#orchestraStages [data-stage="${id}"]`);}
  function stageState(id,value=''){const n=stageNode(id);if(n){if(value)n.dataset.state=value;else delete n.dataset.state;}}
  function resetStages(){PIPELINE.forEach(s=>stageState(s.id,''));}
  function cleanString(v,max=10000){return String(v??'').slice(0,max);}
  function parseSources(text=''){
    const out=[],seen=new Set();for(const raw of String(text).split('\n')){const line=raw.trim();if(!line)continue;const [title='',url='',publisher='',date='']=line.split('|').map(x=>x.trim());if(!title||!url||seen.has(url))continue;seen.add(url);out.push({title,url,publisher,date});}return out;
  }
  function parseClaims(text=''){
    return String(text).split('\n').map(raw=>{const p=raw.split('|').map(x=>x.trim());if(!p[1])return null;return{status:['supported','interpretation','open'].includes(p[0])?p[0]:'open',text:p[1],evidence:(p[2]||'').split(',').map(x=>x.trim()).filter(Boolean),note:p.slice(3).join(' | ').trim()};}).filter(Boolean);
  }
  function formatSources(items=[]){return items.map(x=>[x.title||'',x.url||'',x.publisher||'',x.date||''].join(' | ').replace(/(?:\s*\|\s*)+$/,'')).join('\n');}
  function formatClaims(items=[]){return items.map(x=>[x.status||'open',x.text||'',(x.evidence||[]).join(', '),x.note||''].join(' | ').replace(/(?:\s*\|\s*)+$/,'')).join('\n');}
  function currentPost(){return{
    lang:q('#lang')?.value||'fi',title:q('#title')?.value||'',category:q('#category')?.value||'info-media',audience:qa('input[name="audience"]:checked').map(x=>x.value),description:q('#description')?.value||'',answer:q('#answer')?.value||'',slug:q('#slug')?.value||'',sources:parseSources(q('#sources')?.value||''),claims:parseClaims(q('#claims')?.value||''),body:q('#body')?.value||''
  };}
  function fire(el,type='input'){if(el)el.dispatchEvent(new Event(type,{bubbles:true}));}
  function mergeSources(base=[],candidates=[]){const out=[],seen=new Set();for(const item of [...base,...candidates]){const url=cleanString(item?.url,2000).trim();if(!url||seen.has(url))continue;seen.add(url);out.push({title:cleanString(item?.title||url,220),url,publisher:cleanString(item?.publisher,160),date:cleanString(item?.date,20)});}return out.slice(0,30);}
  function mergePackageIntoPost(post,pkg){const next={...post};if(!pkg||typeof pkg!=='object')return next;for(const key of ['title','description','slug','answer'])if(typeof pkg[key]==='string'&&pkg[key])next[key]=pkg[key];if(typeof pkg.category==='string')next.category=pkg.category;if(Array.isArray(pkg.audience)&&pkg.audience.length)next.audience=pkg.audience;if(Array.isArray(pkg.sources))next.sources=mergeSources(post.sources,pkg.sources);if(Array.isArray(pkg.claims))next.claims=pkg.claims;return next;}
  async function getSession(){const r=await fetch('/api/admin/session',{credentials:'same-origin'});const d=await r.json().catch(()=>({}));if(!r.ok||!d.authenticated)throw new Error('Admin-session puuttuu.');csrf=d.csrf||'';return d;}
  function stageInstruction(stage,baseInstruction,outputs){
    const bits=[];if(baseInstruction)bits.push(`KOKO ORKESTERIN IHMISOHJE:\n${baseInstruction}`);
    if(stage==='claims'&&outputs.source)bits.push('Lähdeagentin ehdokkaat ovat automaattisesti haettuja ja PROVISIONAALISIA. Älä kutsu niitä ihmisen varmistamiksi lähteiksi. Luokittele epävarmuus näkyvästi.');
    if(stage==='structure'&&outputs.claims)bits.push(`VÄITEVAHDIN ANALYYSI JSON:\n${JSON.stringify(outputs.claims)}`);
    if(stage==='writer'&&outputs.structure)bits.push(`RAKENNEAGENTIN EHDOTUS JSON. Käytä sitä apuna, älä mekaanisena pakkona:\n${JSON.stringify(outputs.structure)}`);
    if(stage==='critic'&&outputs.writer)bits.push('Kritiikin kohteena on juuri orkesterissa syntynyt luonnos. Etsi myös kohdat, joissa lähde-ehdokkaiden varmuus on ylitetty.');
    if(stage==='voice'&&outputs.critic)bits.push(`KRIITIKON HAVAINNOT JSON. Korjaa hyödylliset ongelmat, mutta älä silota kirjoittajan omaa ääntä:\n${JSON.stringify(outputs.critic)}`);
    if(stage==='package')bits.push('Tämä on orkesterin viimeinen koneellinen vaihe. Valmistele paketti, mutta älä väitä mitään julkaistuksi tai ihmisen hyväksymäksi.');
    return bits.join('\n\n').slice(0,12000);
  }
  async function callAgent(agent,post,custom){
    if(!csrf)await getSession();controller=new AbortController();
    const r=await fetch('/api/admin/agents',{method:'POST',credentials:'same-origin',signal:controller.signal,headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({agent,instruction:custom,post})});
    const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok){if(r.status===403)csrf='';throw new Error(d.message||d.error||`HTTP ${r.status}`);}return d;
  }
  function stageSummary(stage,d){
    const m=d.meta||{},r=d.result||{};const bits=[];if(m.model)bits.push(m.model);if(m.outputTokens)bits.push(`${m.outputTokens} tok`);if(m.reasoningTokens)bits.push(`${m.reasoningTokens} reasoning`);
    if(stage==='source')bits.unshift(`${Array.isArray(r.candidateSources)?r.candidateSources.length:0} lähdettä${m.structured===false?' · provisional/fallback':''}`);
    if(stage==='claims')bits.unshift(`${Array.isArray(r.claims)?r.claims.length:0} väitettä`);
    if(stage==='structure')bits.unshift(`${Array.isArray(r.outline)?r.outline.length:0} rakennekohtaa`);
    if(stage==='critic')bits.unshift(`${Array.isArray(r.issues)?r.issues.length:0} havaintoa`);
    if(stage==='voice')bits.unshift(`${cleanString(r.body).split(/\s+/).filter(Boolean).length} sanaa`);
    if(stage==='package')bits.unshift('metadata + evidence');return bits.join(' · ');
  }
  async function runPipeline(){
    if(running)return;const initial=currentPost();if(!initial.body.trim()&&!initial.title.trim())return log('Orkesteri tarvitsee vähintään otsikon tai tekstin.','✗');
    running=true;stopRequested=false;finalRun=null;resetStages();terminal.textContent='';resultBox.hidden=true;applyBtn.hidden=true;copyBtn.hidden=true;runBtn.disabled=true;stopBtn.disabled=false;instruction.disabled=true;setRunState('RUNNING');
    const outputs={},metas={},started=Date.now();let post=structuredClone(initial);const baseInstruction=instruction.value.trim();
    log(`Orkesteri käynnistyi · ${PIPELINE.length} vaihetta · mitään ei tallenneta eikä julkaista`,'▶');
    try{
      for(let i=0;i<PIPELINE.length;i++){
        const stage=PIPELINE[i];if(stopRequested){stageState(stage.id,'stopped');throw Object.assign(new Error('STOP_REQUESTED'),{stopped:true});}
        stageState(stage.id,'running');setRunState(`${i+1}/${PIPELINE.length} ${stage.id.toUpperCase()}`);log(`${i+1}/${PIPELINE.length} ${stage.label} käynnistyy`,'▶');const t0=Date.now();
        const custom=stageInstruction(stage.id,baseInstruction,outputs);const d=await callAgent(stage.id,post,custom);outputs[stage.id]=d.result;metas[stage.id]=d.meta||{};
        if(stage.id==='source')post.sources=mergeSources(post.sources,(d.result?.candidateSources||[]));
        if(stage.id==='claims'){if(typeof d.result?.answer==='string')post.answer=d.result.answer;if(Array.isArray(d.result?.claims))post.claims=d.result.claims;}
        if(stage.id==='writer'){if(typeof d.result?.body==='string'&&d.result.body)post.body=d.result.body;if(typeof d.result?.description==='string')post.description=d.result.description;if(typeof d.result?.answer==='string')post.answer=d.result.answer;}
        if(stage.id==='voice'&&typeof d.result?.body==='string'&&d.result.body)post.body=d.result.body;
        if(stage.id==='package')post=mergePackageIntoPost(post,d.result);
        stageState(stage.id,'done');log(`${stage.label} valmis · ${stageSummary(stage.id,d)} · ${((Date.now()-t0)/1000).toFixed(1)} s`,'✓');
      }
      finalRun={initial,post,outputs,metas,startedAt:new Date(started).toISOString(),finishedAt:new Date().toISOString(),humanApprovalRequired:true,provisionalSources:true};
      resultPre.textContent=JSON.stringify({finalPost:post,package:outputs.package,critic:outputs.critic,run:{startedAt:finalRun.startedAt,finishedAt:finalRun.finishedAt,humanApprovalRequired:true}},null,2);resultBox.hidden=false;applyBtn.hidden=false;copyBtn.hidden=false;setRunState('COMPLETE');log(`Koko putki valmis · ${((Date.now()-started)/1000).toFixed(1)} s · HUMAN APPROVAL REQUIRED`,'◆');
    }catch(e){
      if(e?.name==='AbortError'||e?.stopped||e?.message==='STOP_REQUESTED'){setRunState('STOPPED');log('Ajo pysäytettiin. Nykyinen serveripyyntö on voinut silti ehtiä valmistua, mutta mitään ei sovellettu editoriin.','■');for(const s of PIPELINE){if(stageNode(s.id)?.dataset.state==='running')stageState(s.id,'stopped');}}
      else{setRunState('ERROR');log(e.message||'Tuntematon orkesterivirhe','✗');for(const s of PIPELINE){if(stageNode(s.id)?.dataset.state==='running')stageState(s.id,'error');}}
    }finally{running=false;controller=null;runBtn.disabled=false;stopBtn.disabled=true;instruction.disabled=false;}
  }
  function applyFinal(){
    if(!finalRun?.post)return;const p=finalRun.post;if(!confirm('Siirretäänkö orkesterin lopputulos editoriin? Lähdeagentin ehdokkaat ovat edelleen ihmisen tarkistettavia. Mitään ei julkaista tällä toiminnolla.'))return;
    const pairs=[['#title',p.title,180],['#description',p.description,220],['#slug',p.slug,100],['#answer',p.answer,1200],['#body',p.body,60000],['#sources',formatSources(p.sources),100000],['#claims',formatClaims(p.claims),100000]];
    for(const [sel,val,max] of pairs){const el=q(sel);if(el&&typeof val==='string'){el.value=val.slice(0,max);fire(el);}}
    if(q('#category')&&p.category){q('#category').value=p.category;fire(q('#category'),'change');}
    if(Array.isArray(p.audience)&&p.audience.length){const vals=new Set(p.audience);qa('input[name="audience"]').forEach(x=>x.checked=vals.has(x.value));qa('input[name="audience"]')[0]?.dispatchEvent(new Event('change',{bubbles:true}));}
    log('Lopputulos siirrettiin editoriin. Julkaisu- ja tallennusnapit ovat edelleen erillinen ihmisen päätös.','✓');setRunState('APPLIED / NOT SAVED');
  }
  runBtn.addEventListener('click',runPipeline);stopBtn.addEventListener('click',()=>{if(!running)return;stopRequested=true;stopBtn.disabled=true;setRunState('STOPPING');log('Pysäytys pyydetty…','■');controller?.abort();});applyBtn.addEventListener('click',applyFinal);
  copyBtn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(terminal.textContent+'\n\n'+(resultPre.textContent||''));log('Ajoloki + lopputulos kopioitu leikepöydälle.','✓');}catch{log('Kopiointi ei onnistunut selaimessa.','✗');}});
}
