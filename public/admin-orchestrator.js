const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const desk=q('#orchestraDesk');
if(desk){
  const runBtn=q('#orchestraRunBtn'),stopBtn=q('#orchestraStopBtn'),retryBtn=q('#orchestraRetryBtn'),resumeBtn=q('#orchestraResumeBtn'),applyBtn=q('#orchestraApplyBtn'),copyBtn=q('#orchestraCopyBtn');
  const instruction=q('#orchestraInstruction'),terminal=q('#orchestraTerminal'),stateEl=q('#orchestraRunState'),resultBox=q('#orchestraResultBox'),resultPre=q('#orchestraResult');
  const PIPELINE=[
    {id:'source',label:'Lähdeagentti'},
    {id:'structure',label:'Rakenneagentti'},
    {id:'writer',label:'Kirjoitusagentti'},
    {id:'critic',label:'Kriitikko'},
    {id:'voice',label:'Äänieditori'},
    {id:'claims',label:'Väitevahti'},
    {id:'package',label:'Julkaisupaketti'},
  ];
  const CHECKPOINT_KEY='anomancer.orchestra.checkpoint.v14.2.1';
  let running=false,stopRequested=false,controller=null,csrf='',finalRun=null,checkpoint=null,currentStageIndex=-1;

  function now(){return new Date().toLocaleTimeString('fi-FI',{hour12:false});}
  function log(message,mark='·'){
    if(terminal.textContent.startsWith('$ valmis'))terminal.textContent='';
    terminal.textContent+=`${terminal.textContent?'\n':''}[${now()}] ${mark} ${message}`;
    terminal.scrollTop=terminal.scrollHeight;
  }
  function setRunState(text){stateEl.textContent=text;}
  function stageNode(id){return q(`#orchestraStages [data-stage="${id}"]`);}
  function stageState(id,value=''){const n=stageNode(id);if(n){if(value)n.dataset.state=value;else delete n.dataset.state;n.setAttribute('aria-label',`${PIPELINE.find(x=>x.id===id)?.label||id}: ${value||'odottaa'}`);if(value==='running')n.setAttribute('aria-current','step');else n.removeAttribute('aria-current');}}
  function resetStages(){PIPELINE.forEach(s=>stageState(s.id,''));}
  function cleanString(v,max=10000){return String(v??'').slice(0,max);}
  function stableSourceId(url=''){let hash=2166136261;for(const char of String(url)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return `src-${(hash>>>0).toString(36)}`;}
  function parseSources(text=''){
    const out=[],seen=new Set();for(const raw of String(text).split('\n')){const line=raw.trim();if(!line)continue;let src={};if(line.startsWith('{')){try{src=JSON.parse(line);}catch{continue;}}else{const [title='',url='',publisher='',date='',verification='verified',origin='human']=line.split('|').map(x=>x.trim());src={title,url,publisher,date,verification,origin};}const url=cleanString(src.url,2000).trim();if(!src.title||!url||seen.has(url))continue;seen.add(url);out.push({...src,url});}return out;
  }
  function parseClaims(text=''){
    return String(text).split('\n').map(raw=>{const p=raw.split('|').map(x=>x.trim());if(!p[1])return null;return{status:['supported','interpretation','open'].includes(p[0])?p[0]:'open',text:p[1],evidence:(p[2]||'').split(',').map(x=>x.trim()).filter(Boolean),note:p.slice(3).join(' | ').trim()};}).filter(Boolean);
  }
  function formatSources(items=[]){return items.map(x=>JSON.stringify({id:x.id||'',title:x.title||'',url:x.url||'',publisher:x.publisher||'',date:x.date||'',origin:x.origin||'human',verification:x.verification||'verified',retrievedAt:x.retrievedAt||'',why:x.why||'',supports:x.supports||'',challenges:x.challenges||''})).join('\n');}
  function formatClaims(items=[]){return items.map(x=>[x.status||'open',x.text||'',(x.evidence||[]).join(', '),x.note||''].join(' | ').replace(/(?:\s*\|\s*)+$/,'')).join('\n');}
  function currentPost(){return{
    lang:q('#lang')?.value||'fi',title:q('#title')?.value||'',category:q('#category')?.value||'info-media',audience:qa('input[name="audience"]:checked').map(x=>x.value),description:q('#description')?.value||'',answer:q('#answer')?.value||'',slug:q('#slug')?.value||'',sources:parseSources(q('#sources')?.value||''),claims:parseClaims(q('#claims')?.value||''),body:q('#body')?.value||''
  };}
  function fingerprint(post=currentPost()){let hash=2166136261;const raw=JSON.stringify(post);for(const char of raw){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(36);}
  function currentIdentity(){const bridge=window.anomancerAdminBridge;const base=bridge?.getDraftIdentity?.()||{};return{path:String(base.path||''),sha:String(base.sha||''),instanceId:String(base.instanceId||''),fingerprint:fingerprint(),title:currentPost().title};}
  function sameDocument(a={},b={}){const ap=String(a.path||''),bp=String(b.path||'');if(ap||bp)return Boolean(ap&&bp&&ap===bp&&String(a.sha||'')===String(b.sha||''));const ai=String(a.instanceId||''),bi=String(b.instanceId||'');return Boolean(ai&&bi&&ai===bi);}
  function fire(el,type='input'){if(el)el.dispatchEvent(new Event(type,{bubbles:true}));}
  function mergeSources(base=[],candidates=[]){const out=[],byUrl=new Map();for(const item of [...base,...candidates]){const url=cleanString(item?.url,2000).trim();if(!url)continue;const normalized={id:cleanString(item?.id,80)||stableSourceId(url),title:cleanString(item?.title||url,220),url,publisher:cleanString(item?.publisher,160),date:cleanString(item?.date,20),origin:item?.origin==='source-agent'?'source-agent':'human',verification:['candidate','verified','rejected'].includes(item?.verification)?item.verification:(item?.origin==='source-agent'?'candidate':'verified'),retrievedAt:cleanString(item?.retrievedAt,40),why:cleanString(item?.why,500),supports:cleanString(item?.supports,800),challenges:cleanString(item?.challenges,800)};const existing=byUrl.get(url);if(!existing){byUrl.set(url,normalized);out.push(normalized);continue;}for(const key of ['id','title','publisher','date','retrievedAt','why','supports','challenges'])if(!existing[key]&&normalized[key])existing[key]=normalized[key];}return out.slice(0,30);}
  function mergePackageIntoPost(post,pkg){const next={...post};if(!pkg||typeof pkg!=='object')return next;for(const key of ['title','description','slug','answer'])if(typeof pkg[key]==='string'&&pkg[key])next[key]=pkg[key];if(typeof pkg.category==='string')next.category=pkg.category;if(Array.isArray(pkg.audience)&&pkg.audience.length)next.audience=pkg.audience;return next;}
  async function getSession(){const r=await fetch('/api/admin/session',{credentials:'same-origin'});const d=await r.json().catch(()=>({}));if(!r.ok||!d.authenticated)throw new Error('Admin-session puuttuu.');csrf=d.csrf||'';return d;}
  function stageInstruction(stage,baseInstruction,outputs,metas={}){
    const bits=[];if(baseInstruction)bits.push(`KOKO ORKESTERIN IHMISOHJE:
${baseInstruction}`);
    if(stage==='structure'&&outputs.source){
      bits.push(`LÄHDEAGENTIN TUTKIMUSMUISTIO JSON. Nämä ovat tutkimusjohtolankoja, eivät varmistettua evidenssiä. Huomioi etenkin aukot ja vastanäyttö rakenteessa:
${JSON.stringify({summary:outputs.source.summary,gaps:outputs.source.gaps,warnings:outputs.source.warnings})}`);
    }
    if(stage==='writer'&&outputs.structure)bits.push(`RAKENNEAGENTIN EHDOTUS JSON. Käytä sitä apuna, älä mekaanisena pakkona:
${JSON.stringify(outputs.structure)}`);
    if(stage==='critic'&&outputs.writer)bits.push('Kritiikin kohteena on juuri orkesterissa syntynyt luonnos. Etsi myös kohdat, joissa lähde-ehdokkaiden varmuus on ylitetty.');
    if(stage==='voice'&&outputs.critic)bits.push(`KRIITIKON HAVAINNOT JSON. Korjaa hyödylliset ongelmat, mutta älä silota kirjoittajan omaa ääntä:
${JSON.stringify(outputs.critic)}`);
    if(stage==='claims'&&outputs.source){
      const count=Array.isArray(outputs.source?.candidateSources)?outputs.source.candidateSources.length:0;
      const degraded=metas.source?.structured===false||count===0;
      bits.push(count
        ? `Tarkastat nyt ÄÄNIEDITORIN JÄLKEISEN nykyisen tekstin. Lähdeagentin ${count} ehdokasta ovat PROVISIONAALISIA. Voit kytkeä relevantin candidate-URL:n open/interpretation-väitteeseen jäljitettäväksi tutkimusjohtolangaksi, mutta candidate ei saa tehdä väitteestä supported-tilaa.${degraded?' Lähdevaihe oli DEGRADED, joten älä nosta varmuutta pelkän agenttilähteen perusteella.':''}`
        : 'Tarkastat nyt ÄÄNIEDITORIN JÄLKEISEN nykyisen tekstin. Lähdeagentti ei tuonut yhtään lähde-ehdokasta. Älä merkitse väitteitä tuetuiksi tämän lähdevaiheen perusteella. Jos editorissa ei ollut valmiiksi ihmisen lisäämiä lähteitä, käsittele faktaväitteiden evidenssi puuttuvana.');
    }
    if(stage==='package')bits.push('Tämä on orkesterin viimeinen koneellinen vaihe. Valmistele vain esitysmetadata. Nykyinen Evidence Layer (claims + sources) on lukittu tämän vaiheen ajaksi eikä sitä saa kirjoittaa uusiksi. Älä väitä mitään julkaistuksi tai ihmisen hyväksymäksi.');
    return bits.join('\n\n').slice(0,12000);
  }
  async function callAgent(agent,post,custom){
    if(!csrf)await getSession();controller=new AbortController();
    const r=await fetch('/api/admin/agents',{method:'POST',credentials:'same-origin',signal:controller.signal,headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({agent,instruction:custom,post})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok){
      if(r.status===403)csrf='';
      const error=new Error(d.message||d.error||`HTTP ${r.status}`);
      error.code=d.error||'AGENT_HTTP_ERROR';error.httpStatus=r.status;error.retryable=Boolean(d.retryable);error.retryAfterMs=Number(d.retryAfterMs||0);throw error;
    }
    return d;
  }
  function stageSummary(stage,d){
    const m=d.meta||{},r=d.result||{};const bits=[];if(m.model)bits.push(m.model);if(m.outputTokens)bits.push(`${m.outputTokens} tok`);if(m.reasoningTokens)bits.push(`${m.reasoningTokens} reasoning`);
    if(stage==='source'){
      const count=Array.isArray(r.candidateSources)?r.candidateSources.length:0;
      bits.unshift(`${count} lähdettä${m.structured===false?' · provisional/fallback':''}`);
      if(m.incompleteReason)bits.push(`reason ${m.incompleteReason}`);
      if(m.recoveredSourceCount)bits.push(`${m.recoveredSourceCount} pelastettu`);
    }
    if(stage==='claims')bits.unshift(`${Array.isArray(r.claims)?r.claims.length:0} väitettä`);
    if(stage==='structure')bits.unshift(`${Array.isArray(r.outline)?r.outline.length:0} rakennekohtaa`);
    if(stage==='critic')bits.unshift(`${Array.isArray(r.issues)?r.issues.length:0} havaintoa`);
    if(stage==='voice')bits.unshift(`${cleanString(r.body).split(/\s+/).filter(Boolean).length} sanaa`);
    if(stage==='package')bits.unshift('metadata + evidence');return bits.join(' · ');
  }
  function sourceIsDegraded(d){const count=Array.isArray(d?.result?.candidateSources)?d.result.candidateSources.length:0;return d?.meta?.structured===false||count===0;}
  function isRetryable(error){
    if(error?.name==='AbortError'||stopRequested)return false;
    if(typeof error?.retryable==='boolean')return error.retryable;
    return new Set(['DEEPSEEK_EMPTY','DEEPSEEK_JSON','DEEPSEEK_NETWORK','DEEPSEEK_TIMEOUT','DEEPSEEK_500','DEEPSEEK_502','DEEPSEEK_503','DEEPSEEK_504']).has(String(error?.code||''));
  }
  function errorDiagnostic(error){const parts=[];if(error?.code)parts.push(error.code);if(error?.httpStatus)parts.push(`HTTP ${error.httpStatus}`);if(error?.message&&!parts.includes(error.message))parts.push(error.message);return parts.join(' · ')||'Tuntematon orkesterivirhe';}
  function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
  function safeClone(value){return JSON.parse(JSON.stringify(value));}
  function checkpointPayload(ctx){return{
    version:'14.2.1',status:ctx.status||'running',draftIdentity:ctx.draftIdentity,initial:ctx.initial,post:ctx.post,outputs:ctx.outputs,metas:ctx.metas,stageStates:ctx.stageStates,nextIndex:ctx.nextIndex,failedIndex:ctx.failedIndex,failedError:ctx.failedError||null,baseInstruction:ctx.baseInstruction,startedAt:ctx.startedAt,finishedAt:ctx.finishedAt||'',terminal:terminal.textContent,humanApprovalRequired:true
  };}
  function saveCheckpoint(ctx){
    checkpoint=checkpointPayload(ctx);
    let persisted=true;try{sessionStorage.setItem(CHECKPOINT_KEY,JSON.stringify(checkpoint));}catch{persisted=false;}
    updateCheckpointActions();
    if(!persisted)log('Selaimen checkpoint-tallennus ei onnistunut. Ajo säilyy vain tässä välilehdessä.','⚠');
    return persisted;
  }
  function clearCheckpoint(){checkpoint=null;try{sessionStorage.removeItem(CHECKPOINT_KEY);}catch{}updateCheckpointActions();}
  function loadCheckpoint(){
    try{const raw=sessionStorage.getItem(CHECKPOINT_KEY);if(!raw)return null;const value=JSON.parse(raw);if(value?.version!=='14.2.1'||!value?.post||!value?.outputs||!value?.draftIdentity)return null;return value;}catch{return null;}
  }
  function updateCheckpointActions(){
    const has=checkpoint&&checkpoint.status!=='complete'&&Number(checkpoint.nextIndex)<PIPELINE.length;
    retryBtn.hidden=!(has&&Number.isInteger(checkpoint.failedIndex));
    resumeBtn.hidden=!has;
  }
  function restoreCheckpoint(){
    const cp=loadCheckpoint();if(!cp)return;
    checkpoint=cp;resetStages();
    for(const [id,value] of Object.entries(cp.stageStates||{}))stageState(id,value);
    terminal.textContent=cp.terminal||'$ checkpoint palautettu';
    if(cp.status==='complete'){
      finalRun={initial:cp.initial,post:cp.post,outputs:cp.outputs,metas:cp.metas,startedAt:cp.startedAt,finishedAt:cp.finishedAt,humanApprovalRequired:true,degradedStages:Object.entries(cp.stageStates||{}).filter(([,value])=>value==='degraded').map(([id])=>id),draftIdentity:cp.draftIdentity};
      resultPre.textContent=JSON.stringify({finalPost:cp.post,package:cp.outputs.package,critic:cp.outputs.critic,run:{startedAt:cp.startedAt,finishedAt:cp.finishedAt,humanApprovalRequired:true,degradedStages:finalRun.degradedStages}},null,2);resultBox.hidden=false;applyBtn.hidden=false;
    }
    setRunState(cp.status==='complete'?'COMPLETE / RESTORED':Number.isInteger(cp.failedIndex)?'CHECKPOINT / ERROR':'CHECKPOINT');
    updateCheckpointActions();copyBtn.hidden=false;
    log(cp.status==='complete'?'Valmis orkesteritulos palautettiin. Tarkista luonnosidentiteetti ennen soveltamista.':`Checkpoint löytyi · seuraava vaihe ${Number(cp.nextIndex)+1}/${PIPELINE.length} · luonnosidentiteetti tarkistetaan ennen jatkoa`,'◇');
  }
  function createContext(initial,baseInstruction){return{status:'running',draftIdentity:currentIdentity(),initial:safeClone(initial),post:safeClone(initial),outputs:{},metas:{},stageStates:{},nextIndex:0,failedIndex:null,failedError:null,baseInstruction,startedAt:new Date().toISOString()};}
  function contextFromCheckpoint(cp){return{status:'running',draftIdentity:safeClone(cp.draftIdentity),initial:safeClone(cp.initial),post:safeClone(cp.post),outputs:safeClone(cp.outputs||{}),metas:safeClone(cp.metas||{}),stageStates:safeClone(cp.stageStates||{}),nextIndex:Number(cp.nextIndex)||0,failedIndex:Number.isInteger(cp.failedIndex)?cp.failedIndex:null,failedError:cp.failedError||null,baseInstruction:String(cp.baseInstruction||''),startedAt:cp.startedAt||new Date().toISOString()};}
  function checkpointMatches(cp,{allowChanged=false}={}){const current=currentIdentity();if(!sameDocument(cp.draftIdentity,current)){log(`Checkpoint kuuluu eri luonnokseen (${cp.draftIdentity?.title||cp.draftIdentity?.path||'tuntematon'}). Vaihda oikea teksti auki tai aloita uusi ajo.`,'✗');return false;}if(!allowChanged&&cp.draftIdentity?.fingerprint!==current.fingerprint&&!confirm('Editoria on muutettu orkesteriajon alkamisen jälkeen. Jatketaanko silti alkuperäisestä checkpointista? Nykyisiä editorimuutoksia ei syötetä kesken ajon agenteille.'))return false;return true;}
  function applyStageResult(ctx,stage,d){
    ctx.outputs[stage.id]=d.result;ctx.metas[stage.id]=d.meta||{};
    if(stage.id==='source')ctx.post.sources=mergeSources(ctx.post.sources,(d.result?.candidateSources||[]));
    if(stage.id==='claims'){if(typeof d.result?.answer==='string')ctx.post.answer=d.result.answer;if(Array.isArray(d.result?.claims))ctx.post.claims=d.result.claims;}
    if(stage.id==='writer'){if(typeof d.result?.body==='string'&&d.result.body)ctx.post.body=d.result.body;if(typeof d.result?.description==='string')ctx.post.description=d.result.description;if(typeof d.result?.answer==='string')ctx.post.answer=d.result.answer;}
    if(stage.id==='voice'&&typeof d.result?.body==='string'&&d.result.body)ctx.post.body=d.result.body;
    if(stage.id==='package')ctx.post=mergePackageIntoPost(ctx.post,d.result);
    const state=stage.id==='source'&&sourceIsDegraded(d)?'degraded':'done';ctx.stageStates[stage.id]=state;stageState(stage.id,state);return state;
  }
  async function executeStage(ctx,index,{autoRetry=true}={}){
    const stage=PIPELINE[index];currentStageIndex=index;stageState(stage.id,'running');ctx.stageStates[stage.id]='running';setRunState(`${index+1}/${PIPELINE.length} ${stage.id.toUpperCase()}`);log(`${index+1}/${PIPELINE.length} ${stage.label} käynnistyy`,'▶');
    const t0=Date.now();let attempt=0;
    while(true){
      if(stopRequested)throw Object.assign(new Error('STOP_REQUESTED'),{stopped:true});
      attempt++;
      try{
        const custom=stageInstruction(stage.id,ctx.baseInstruction,ctx.outputs,ctx.metas);const d=await callAgent(stage.id,ctx.post,custom);
        if(stage.id==='source'&&sourceIsDegraded(d)&&d.meta?.incompleteReason!=='content_filter'&&autoRetry&&attempt===1)throw Object.assign(new Error('Lähdevastaus jäi epätäydelliseksi.'),{code:'DEEPSEEK_SOURCE_DEGRADED',retryable:true,retryAfterMs:500});
        const state=applyStageResult(ctx,stage,d);ctx.nextIndex=index+1;ctx.failedIndex=null;ctx.failedError=null;saveCheckpoint(ctx);
        const elapsed=((Date.now()-t0)/1000).toFixed(1);
        if(state==='degraded'){
          const count=Array.isArray(d.result?.candidateSources)?d.result.candidateSources.length:0;
          log(`${stage.label} · DEGRADED · ${stageSummary(stage.id,d)} · ${elapsed} s`,'⚠');
          if(count===0)log('Lähdevaihe jatkuu ilman uutta evidenssiä. Myöhemmät agentit eivät saa teeskennellä lähdetukea.','⚠');
        }else log(`${stage.label} valmis · ${stageSummary(stage.id,d)} · ${elapsed} s`,'✓');
        return d;
      }catch(error){
        if(error?.name==='AbortError'||stopRequested)throw error;
        if(autoRetry&&attempt===1&&isRetryable(error)){
          log(`${stage.label} virhe · ${errorDiagnostic(error)} · automaattinen retry 1/1`,'↻');
          const wait=Math.max(Number(error?.retryAfterMs||0),700*(2**(attempt-1))+Math.floor(Math.random()*350));
          await delay(wait);if(stopRequested)throw Object.assign(new Error('STOP_REQUESTED'),{stopped:true});continue;
        }
        throw error;
      }
    }
  }
  function beginUi({fresh=false}={}){
    running=true;stopRequested=false;finalRun=null;resultBox.hidden=true;applyBtn.hidden=true;runBtn.disabled=true;retryBtn.disabled=true;resumeBtn.disabled=true;stopBtn.disabled=false;instruction.disabled=true;window.anomancerAdminBridge?.setEditorLocked?.(true);if(fresh){resetStages();terminal.textContent='';copyBtn.hidden=true;}setRunState('RUNNING');
  }
  function endUi(){running=false;controller=null;currentStageIndex=-1;runBtn.disabled=false;retryBtn.disabled=false;resumeBtn.disabled=false;stopBtn.disabled=true;instruction.disabled=false;window.anomancerAdminBridge?.setEditorLocked?.(false);updateCheckpointActions();}
  function finishRun(ctx){
    ctx.status='complete';ctx.finishedAt=new Date().toISOString();ctx.nextIndex=PIPELINE.length;
    finalRun={initial:ctx.initial,post:ctx.post,outputs:ctx.outputs,metas:ctx.metas,startedAt:ctx.startedAt,finishedAt:ctx.finishedAt,humanApprovalRequired:true,provisionalSources:true,degradedStages:Object.entries(ctx.stageStates).filter(([,v])=>v==='degraded').map(([id])=>id),draftIdentity:ctx.draftIdentity};
    resultPre.textContent=JSON.stringify({finalPost:ctx.post,package:ctx.outputs.package,critic:ctx.outputs.critic,run:{startedAt:finalRun.startedAt,finishedAt:finalRun.finishedAt,humanApprovalRequired:true,degradedStages:finalRun.degradedStages}},null,2);resultBox.hidden=false;applyBtn.hidden=false;copyBtn.hidden=false;setRunState(finalRun.degradedStages.length?'COMPLETE / DEGRADED':'COMPLETE');
    log(`Koko putki valmis · HUMAN APPROVAL REQUIRED${finalRun.degradedStages.length?` · degraded: ${finalRun.degradedStages.join(', ')}`:''}`,'◆');saveCheckpoint(ctx);
  }
  function failWithCheckpoint(ctx,index,error,{stopped=false}={}){
    ctx.nextIndex=index;ctx.failedIndex=stopped?null:index;ctx.failedError=stopped?null:{code:error?.code||'',httpStatus:error?.httpStatus||0,message:error?.message||''};
    if(index>=0&&index<PIPELINE.length){const id=PIPELINE[index].id;ctx.stageStates[id]=stopped?'stopped':'error';stageState(id,stopped?'stopped':'error');}
    saveCheckpoint(ctx);copyBtn.hidden=false;
    if(stopped){setRunState('STOPPED / CHECKPOINT');log(`Ajo pysäytettiin · checkpoint säilyi vaiheeseen ${index+1}/${PIPELINE.length}. Mitään ei sovellettu editoriin.`,'■');}
    else{setRunState('ERROR / CHECKPOINT');log(`${errorDiagnostic(error)} · checkpoint säilyi · voit yrittää vaihetta uudelleen tai jatkaa tästä`,'✗');}
  }
  async function runRange(ctx,startIndex,endExclusive,{fresh=false,autoRetry=true,completeWhenDone=true}={}){
    beginUi({fresh});
    try{
      for(let i=startIndex;i<endExclusive;i++){
        if(stopRequested)throw Object.assign(new Error('STOP_REQUESTED'),{stopped:true});
        await executeStage(ctx,i,{autoRetry});
      }
      if(completeWhenDone&&endExclusive>=PIPELINE.length)finishRun(ctx);
      else{
        checkpoint=checkpointPayload(ctx);saveCheckpoint(ctx);setRunState('CHECKPOINT / READY');copyBtn.hidden=false;
        log(`Vaihe ${endExclusive}/${PIPELINE.length} valmis · checkpoint päivitetty · Jatka tästä, kun haluat`,'◇');
      }
    }catch(error){
      const stopped=error?.name==='AbortError'||error?.stopped||error?.message==='STOP_REQUESTED'||stopRequested;
      failWithCheckpoint(ctx,currentStageIndex>=0?currentStageIndex:startIndex,error,{stopped});
    }finally{endUi();}
  }
  async function runPipeline(){
    if(running)return;const initial=currentPost();if(!initial.body.trim()&&!initial.title.trim())return log('Orkesteri tarvitsee vähintään otsikon tai tekstin.','✗');
    clearCheckpoint();const ctx=createContext(initial,instruction.value.trim());log('Uusi ajo aloitetaan editorin nykyisestä tilasta. Vanha checkpoint poistettiin.','◇');
    await runRange(ctx,0,PIPELINE.length,{fresh:true,autoRetry:true,completeWhenDone:true});
  }
  async function resumePipeline(){
    if(running)return;const cp=checkpoint||loadCheckpoint();if(!cp)return log('Jatkettavaa checkpointia ei löytynyt.','✗');if(!checkpointMatches(cp))return;const ctx=contextFromCheckpoint(cp);const start=Math.max(0,Math.min(PIPELINE.length-1,Number(cp.nextIndex)||0));
    terminal.textContent=cp.terminal||terminal.textContent;log(`Jatketaan checkpointista · vaihe ${start+1}/${PIPELINE.length}`,'▶');await runRange(ctx,start,PIPELINE.length,{fresh:false,autoRetry:true,completeWhenDone:true});
  }
  async function retryFailedStage(){
    if(running)return;const cp=checkpoint||loadCheckpoint();if(!cp||!Number.isInteger(cp.failedIndex))return log('Uudelleen yritettävää epäonnistunutta vaihetta ei löytynyt.','✗');if(!checkpointMatches(cp))return;const ctx=contextFromCheckpoint(cp);const index=cp.failedIndex;
    terminal.textContent=cp.terminal||terminal.textContent;log(`Manuaalinen retry · ${index+1}/${PIPELINE.length} ${PIPELINE[index].label}`,'↻');await runRange(ctx,index,index+1,{fresh:false,autoRetry:false,completeWhenDone:index===PIPELINE.length-1});
  }
  function applyFinal(){
    if(!finalRun?.post)return;if(!sameDocument(finalRun.draftIdentity,currentIdentity()))return log('Orkesteritulos kuuluu eri luonnokseen. Avaa oikea teksti ennen soveltamista.','✗');const changed=finalRun.draftIdentity?.fingerprint!==currentIdentity().fingerprint;const p=finalRun.post;const degraded=finalRun.degradedStages?.length?`\n\nHuom: DEGRADED-vaiheet: ${finalRun.degradedStages.join(', ')}.`:'';const conflict=changed?'\n\nVAROITUS: editoria on muutettu ajon jälkeen. Soveltaminen korvaa nämä kentät.':'';if(!confirm(`Siirretäänkö orkesterin lopputulos editoriin? Lähdeagentin ehdokkaat ovat edelleen ihmisen tarkistettavia.${degraded}${conflict}\n\nMitään ei julkaista tällä toiminnolla.`))return;
    const pairs=[['#title',p.title,180],['#description',p.description,220],['#slug',p.slug,100],['#answer',p.answer,1200],['#body',p.body,60000],['#sources',formatSources(p.sources),100000],['#claims',formatClaims(p.claims),100000]];
    for(const [sel,val,max] of pairs){const el=q(sel);if(el&&typeof val==='string'){el.value=val.slice(0,max);fire(el);}}
    if(q('#category')&&p.category){q('#category').value=p.category;fire(q('#category'),'change');}
    if(Array.isArray(p.audience)&&p.audience.length){const vals=new Set(p.audience);qa('input[name="audience"]').forEach(x=>x.checked=vals.has(x.value));qa('input[name="audience"]')[0]?.dispatchEvent(new Event('change',{bubbles:true}));}
    log('Lopputulos siirrettiin editoriin. Julkaisu- ja tallennusnapit ovat edelleen erillinen ihmisen päätös.','✓');setRunState('APPLIED / NOT SAVED');
  }
  runBtn.addEventListener('click',runPipeline);
  stopBtn.addEventListener('click',()=>{if(!running)return;stopRequested=true;stopBtn.disabled=true;setRunState('STOPPING');log('Pysäytys pyydetty…','■');controller?.abort();});
  retryBtn.addEventListener('click',retryFailedStage);resumeBtn.addEventListener('click',resumePipeline);applyBtn.addEventListener('click',applyFinal);
  copyBtn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(terminal.textContent+'\n\n'+(resultPre.textContent||''));log('Ajoloki + lopputulos kopioitu leikepöydälle.','✓');}catch{log('Kopiointi ei onnistunut selaimessa.','✗');}});
  restoreCheckpoint();
}
