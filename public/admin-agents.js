const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const box=q('#agentDesk');
if(box){
  const runBtn=q('#agentRunBtn'), applyBtn=q('#agentApplyBtn'), copyBtn=q('#agentCopyBtn');
  const agentSelect=q('#agentRole'), instruction=q('#agentInstruction'), output=q('#agentOutput'), visual=q('#agentVisual'), rawBox=q('#agentRawBox'), status=q('#agentStatus'), modelStatus=q('#agentModelStatus');
  let moreBtn=q('#agentMoreBtn');
  if(!moreBtn&&runBtn){moreBtn=document.createElement('button');moreBtn.id='agentMoreBtn';moreBtn.type='button';moreBtn.className='secondary';moreBtn.textContent='Hae lisää';moreBtn.hidden=true;runBtn.insertAdjacentElement('afterend',moreBtn);}
  let csrf='',last=null;
  function workspaceId(){return window.anomancerWorkspaces?.currentId?.()||'default';}
  function wsHeaders(extra={}){return window.anomancerWorkspaces?.headers?.(extra)||{...extra,'X-Anomancer-Workspace':workspaceId()};}

  const AGENT_LABELS={source:'Lähdeagentti',claims:'Väitevahti',structure:'Rakenneagentti',writer:'Kirjoitusagentti',critic:'Kriitikko',audience:'Yleisöadapteri',voice:'Äänieditori',package:'Julkaisupaketti'};
  const CATEGORY_VALUES=new Set(['ai-work','info-media','work-decisions','money-risk','software-safety','language-learning','creativity-tools','society-systems']);
  const AUDIENCE_VALUES=new Set(['all','employee','entrepreneur','developer','teacher','creative','decision-maker','investor']);
  const AUDIENCE_DEPTH_VALUES=new Set(['plain','general','professional','technical']);

  function runtimeProfile(agent=agentSelect.value){return window.anomancerCore?.getRuntimeProfile?.(agent)||null;}
  function syncRuntimeState(){const profile=runtimeProfile();const disabled=profile?.active===false;runBtn.disabled=disabled;if(moreBtn)moreBtn.disabled=disabled;if(disabled)setStatus(`${AGENT_LABELS[agentSelect.value]||agentSelect.value} on poistettu käytöstä Coren ajoprofiilissa.`,'warn');else if(status.textContent.includes('Coren ajoprofiilissa'))setStatus('');}

  function setStatus(text,kind=''){status.textContent=text;status.className=`agent-status ${kind}`;}
  function parseSources(text=''){
    const out=[],seen=new Set();
    for(const raw of String(text).split('\n')){const line=raw.trim();if(!line)continue;let src={};if(line.startsWith('{')){try{src=JSON.parse(line);}catch{continue;}}else{const [title='',url='',publisher='',date='']=line.split('|').map(x=>x.trim());src={title,url,publisher,date,origin:'human',verification:'verified'};}if(!src.title||!src.url||seen.has(src.url))continue;seen.add(src.url);out.push(src);}
    return out;
  }
  function parseClaims(text=''){
    return String(text).split('\n').map(raw=>{const p=raw.split('|').map(x=>x.trim());if(!p[1])return null;return{status:['supported','interpretation','open'].includes(p[0])?p[0]:'open',text:p[1],evidence:(p[2]||'').split(',').map(x=>x.trim()).filter(Boolean),note:p.slice(3).join(' | ').trim()};}).filter(Boolean);
  }
  function formatSources(items=[]){return items.map(x=>JSON.stringify({id:x.id||'',title:x.title||'',url:x.url||'',publisher:x.publisher||'',date:x.date||'',origin:x.origin||'human',verification:x.verification||'verified',retrievedAt:x.retrievedAt||'',why:x.why||'',supports:x.supports||'',challenges:x.challenges||''})).join('\n');}
  function formatClaims(items=[]){return items.map(x=>[x.status||'open',x.text||'',(x.evidence||[]).join(', '),x.note||''].join(' | ').replace(/(?:\s*\|\s*)+$/,'')).join('\n');}
  function currentPost(){
    return{
      lang:q('#lang')?.value||'fi',title:q('#title')?.value||'',category:q('#category')?.value||'info-media',
      audience:qa('input[name="audience"]:checked').map(x=>x.value),audienceDepth:AUDIENCE_DEPTH_VALUES.has(q('#audienceDepth')?.value)?q('#audienceDepth').value:'general',description:q('#description')?.value||'',answer:q('#answer')?.value||'',
      slug:q('#slug')?.value||'',sources:parseSources(q('#sources')?.value||''),claims:parseClaims(q('#claims')?.value||''),body:q('#body')?.value||''
    };
  }
  function fire(el){if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
  function sourceRows(items=[]){return (Array.isArray(items)?items:[]).filter(x=>x?.url).map(x=>({id:x.id||'',title:x.title||x.url,url:x.url,publisher:x.publisher||'',date:x.date||'',origin:x.origin||'human',verification:x.verification||(x.origin==='source-agent'?'candidate':'verified'),retrievedAt:x.retrievedAt||'',why:x.why||'',supports:x.supports||'',challenges:x.challenges||''}));}
  function mergeSources(...groups){const out=[],seen=new Set();for(const group of groups)for(const item of sourceRows(group)){if(seen.has(item.url))continue;seen.add(item.url);out.push(item);}return out;}
  function incompleteLabel(reason=''){
    if(reason==='max_output_tokens')return 'vastaus saavutti tulostokenirajan';
    if(reason==='content_filter')return 'vastaus pysähtyi sisältösuodattimeen';
    return reason?`vastaus jäi kesken (${reason})`:'vastaus jäi kesken';
  }
  async function getSession(){
    const r=await fetch('/api/admin/auth?resource=session',{credentials:'same-origin'});const d=await r.json().catch(()=>({}));if(!r.ok||!d.authenticated)throw new Error('Admin-session puuttuu.');csrf=d.csrf||'';return d;
  }
  async function refreshConfig(){
    try{await getSession();const r=await fetch('/api/admin/core?resource=agents',{credentials:'same-origin',headers:wsHeaders()});const d=await r.json();if(!r.ok)throw new Error(d.message||'Agenttien tila ei auennut.');
	      const c=d.deepseek||{};modelStatus.textContent=c.configured?`Core ${d.coreVersion||'16.0'} · DeepSeek valmis · ${c.defaultModel} · lähdehaku ${c.sourceReasoningEffort||'low'} (teho ${c.sourceReasoningEffective||c.sourceReasoningEffort||'low'}) / ${c.sourceMaxOutputTokens||16000}`:'DeepSeek API-avain puuttuu';modelStatus.dataset.kind=c.configured?'ok':'warn';
    }catch{modelStatus.textContent='Kirjaudu sisään, niin agenttitila tarkistetaan.';modelStatus.dataset.kind='';}
  }
  function renderResult(agent,result,meta){
    const recovered=Number(meta?.recoveredSourceCount||0);
    const incomplete=agent==='source'&&meta?.responseStatus==='incomplete';
    const metaBits=[];
    if(incomplete)metaBits.push(`KESKEN: ${meta?.incompleteReason||'tuntematon'}`);
    if(recovered)metaBits.push(`${recovered} pelastettu`);
    if(meta?.outputTokens)metaBits.push(meta?.maxOutputTokens?`${meta.outputTokens}/${meta.maxOutputTokens} tulostokenia`:`${meta.outputTokens} tulostokenia`);
    if(meta?.reasoningTokens)metaBits.push(`${meta.reasoningTokens} päättelytokenia`);
    const title=`${AGENT_LABELS[agent]||agent} · ${meta?.model||'DeepSeek'}${meta?.searchedWeb?' · VERKKOHAKU':''}${metaBits.length?` · ${metaBits.join(' · ')}`:''}`;
    output.textContent=`${title}\n\n${JSON.stringify(result,null,2)}`;
    rawBox.hidden=false;
    let cards=[];
    if(agent==='source')cards=(result.candidateSources||[]).map(source=>`<article><span>EHDOKAS</span><h4>${escapeHtml(source.title||source.url)}</h4><a href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer">Avaa lähde ↗</a>${source.why?`<p><strong>Miksi:</strong> ${escapeHtml(source.why)}</p>`:''}${source.supports?`<p><strong>Tukee:</strong> ${escapeHtml(source.supports)}</p>`:''}${source.challenges?`<p><strong>Haastaa:</strong> ${escapeHtml(source.challenges)}</p>`:''}</article>`);
    else if(agent==='critic')cards=(result.issues||[]).map(issue=>`<article data-severity="${escapeAttr(issue.severity)}"><span>${escapeHtml(issue.severity||'medium')}</span><h4>${escapeHtml(issue.type||'Havainto')}</h4><p>${escapeHtml(issue.problem)}</p>${issue.fix?`<p><strong>Korjaus:</strong> ${escapeHtml(issue.fix)}</p>`:''}</article>`);
    else if(agent==='audience')cards=(result.adaptationSummary||[]).map((item,index)=>`<article><span>${String(index+1).padStart(2,'0')}</span><h4>Yleisömuutos</h4><p>${escapeHtml(item)}</p></article>`);
    else if(agent==='structure')cards=(result.outline||[]).map((item,index)=>`<article><span>${String(index+1).padStart(2,'0')}</span><h4>${escapeHtml(item.heading)}</h4><p>${escapeHtml(item.purpose)}</p></article>`);
    visual.innerHTML=cards.length?cards.join(''):`<div class="agent-summary"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(summaryText(agent,result))}</p></div>`;
    copyBtn.hidden=false;
    const sourceCount=agent==='source'&&Array.isArray(result?.candidateSources)?result.candidateSources.length:0;
    const rawFallback=agent==='source'&&meta?.structured===false;
    applyBtn.hidden=(rawFallback&&sourceCount===0)||!['source','claims','writer','audience','voice','package'].includes(agent);
    applyBtn.textContent=agent==='source'?(rawFallback?'Lisää pelastetut lähteet':'Lisää lähde-ehdokkaat'):agent==='claims'?'Siirrä evidenssikerrokseen':agent==='writer'?'Käytä luonnosta':agent==='audience'?'Käytä yleisöversiota':agent==='voice'?'Käytä äänieditointia':'Käytä julkaisupakettia';
    if(moreBtn)moreBtn.hidden=agent!=='source'||sourceCount===0;
  }
  function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
  function escapeAttr(value=''){return escapeHtml(value);}
  function summaryText(agent,result){if(agent==='claims')return `${result.claims?.length||0} väitettä · tarkista statukset Evidenssi-välilehdellä.`;if(agent==='writer'||agent==='audience'||agent==='voice')return `${String(result.body||'').split(/\s+/).filter(Boolean).length} sanaa · vertaa nykyiseen tekstiin ennen käyttöä.`;if(agent==='package')return 'Esitysmetatieto valmis. Yleisösopimus ja evidenssikerros säilyvät ennallaan.';return 'Tulos valmis.';}
  async function run({more=false}={}){
    try{
      runBtn.disabled=true;if(moreBtn)moreBtn.disabled=true;applyBtn.hidden=true;copyBtn.hidden=true;setStatus(more?'Lähdeagentti etsii lisää ilman duplikaatteja…':'Agentti työskentelee…','working');
      if(!csrf)await getSession();
      const agent=agentSelect.value;
      const payloadPost=currentPost();
      const previous=more&&last?.agent==='source'?sourceRows(last.result?.candidateSources):[];
      if(more&&previous.length)payloadPost.sources=mergeSources(payloadPost.sources,previous);
      const extra=more?'Lisähaku: etsi enintään 4 uutta vahvaa lähdettä, joita ei vielä ole DRAFT CONTEXT sources -listassa. Keskity erityisesti jäljellä oleviin aukkoihin, vastanäyttöön tai alkuperäislähteisiin. Älä toista aiempia URL-osoitteita.':'';
      const combinedInstruction=[instruction.value,extra].filter(Boolean).join('\n\n');
      const r=await fetch('/api/admin/core?resource=agents',{method:'POST',credentials:'same-origin',headers:wsHeaders({'Content-Type':'application/json','X-CSRF-Token':csrf}),body:JSON.stringify({agent,instruction:combinedInstruction,post:payloadPost})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||!d.ok){if(d.policyDecision)await window.anomancerCore?.appendPolicyDecision?.(d.policyDecision);if(r.status===403){csrf='';}throw new Error(d.message||d.error||`HTTP ${r.status}`);}
      if(more&&agent==='source'&&previous.length){
        const merged=mergeSources(previous,d.result?.candidateSources).slice(0,12);
        d.result={...d.result,candidateSources:merged};
        d.meta={...(d.meta||{}),additionalPass:true};
      }
      last=d;await window.anomancerCore?.appendReceipt?.(d.receipt);renderResult(agent,d.result,d.meta);
      if(agent==='source'&&d.meta?.structured===false){
        const count=Array.isArray(d.result?.candidateSources)?d.result.candidateSources.length:0;
        const reason=incompleteLabel(d.meta?.incompleteReason||'');
        setStatus(count?`⚠ Verkkohaku valmistui osittain: ${reason}. ${count} valmista lähde-ehdokasta saatiin talteen. Tarkista ne itse ennen käyttöä.`:`⚠ Verkkohaku valmistui osittain: ${reason}. Raakavastaus säilytettiin. Mitään ei tallennettu eikä julkaistu.`,'warn');
      }else if(agent==='source'){
        const count=Array.isArray(d.result?.candidateSources)?d.result.candidateSources.length:0;
        setStatus(`✓ ${count} lähde-ehdokasta valmis. Mitään ei tallennettu eikä julkaistu. Tarvittaessa voit hakea lisää.`,'ok');
      }else setStatus('✓ Ehdotus valmis. Mitään ei tallennettu eikä julkaistu.','ok');
    }catch(e){setStatus(`✗ ${e.message}`,'err');output.textContent='';visual.innerHTML='';rawBox.hidden=true;if(moreBtn)moreBtn.hidden=true;}
    finally{runBtn.disabled=false;if(moreBtn)moreBtn.disabled=false;syncRuntimeState();}
  }
  function apply(){
    if(!last?.result)return;const a=last.agent,r=last.result;
    if(a==='source'){
      const recovered=last.meta?.structured===false;
      const prompt=recovered?'Lisätäänkö kesken jääneestä vastauksesta pelastetut lähde-ehdokkaat Lähteet-kenttään? Tarkista jokainen URL ja lähteen sisältö itse ennen julkaisua.':'Lisätäänkö verkkohaun lähde-ehdokkaat Lähteet-kenttään? Tarkista URL:t ja sisältö itse ennen julkaisua.';
      if(!confirm(prompt))return;
      const existing=parseSources(q('#sources').value),seen=new Set(existing.map(x=>x.url));
	      const add=(Array.isArray(r.candidateSources)?r.candidateSources:[]).filter(x=>x?.url&&!seen.has(x.url)).map(x=>({...x,title:x.title||x.url,origin:'source-agent',verification:'candidate'}));
      q('#sources').value=formatSources([...existing,...add]);fire(q('#sources'));setStatus(`✓ Lisättiin ${add.length} lähde-ehdokasta. Tarkistusvastuu jäi ihmiselle.`,'ok');return;
    }
    if(a==='claims'){
      if(typeof r.answer==='string'){q('#answer').value=r.answer;fire(q('#answer'));}
      if(Array.isArray(r.claims)){q('#claims').value=formatClaims(r.claims);fire(q('#claims'));}
      setStatus('✓ Ydinvastaus ja väitteet siirretty editoriin. Julkaisu vaatii edelleen sinut.','ok');return;
    }
    if(a==='writer'||a==='audience'||a==='voice'){
      if(!r.body)return setStatus('Agentin vastauksessa ei ollut tekstikenttää.','err');
      if(!confirm('Korvataanko editorin nykyinen Markdown tällä agentin versiolla? Tätä ei vielä tallenneta GitHubiin.'))return;
      q('#body').value=r.body;fire(q('#body'));
      if(a==='writer'){
        if(typeof r.description==='string'&&r.description){q('#description').value=r.description.slice(0,220);fire(q('#description'));}
        if(typeof r.answer==='string'&&r.answer){q('#answer').value=r.answer.slice(0,1200);fire(q('#answer'));}
      }
      setStatus('✓ Agentin tekstiversio siirretty editoriin. Tarkista se ennen tallennusta.','ok');return;
    }
    if(a==='package'){
      if(!confirm('Siirretäänkö julkaisupaketin metadata editoriin? Mitään ei julkaista automaattisesti.'))return;
      const pairs=[['#title','title',180],['#description','description',220],['#slug','slug',100],['#answer','answer',1200]];
      for(const [sel,key,max] of pairs){if(typeof r[key]==='string'&&r[key]){q(sel).value=r[key].slice(0,max);fire(q(sel));}}
      if(CATEGORY_VALUES.has(r.category)){q('#category').value=r.category;fire(q('#category'));}
            setStatus('✓ Julkaisupaketti siirretty editoriin. Ihmisen hyväksyntäportti on edelleen kiinni.','ok');
    }
  }
  runBtn.addEventListener('click',()=>run());
  if(moreBtn)moreBtn.addEventListener('click',()=>run({more:true}));
  applyBtn.addEventListener('click',apply);
  copyBtn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.textContent);setStatus('✓ Agentin tulos kopioitu.','ok');}catch{setStatus('Kopiointi ei onnistunut selaimessa.','err');}});
  agentSelect.addEventListener('change',()=>{last=null;applyBtn.hidden=true;copyBtn.hidden=true;if(moreBtn)moreBtn.hidden=true;output.textContent='';visual.innerHTML='';rawBox.hidden=true;setStatus('');syncRuntimeState();});
  window.addEventListener('anomancer:agent-runtime-change',event=>{if(event.detail?.agentId===agentSelect.value)syncRuntimeState();});
  window.addEventListener('anomancer:core-ready',syncRuntimeState);
  window.addEventListener('anomancer:workspace-change',()=>{last=null;output.textContent='';visual.innerHTML='';rawBox.hidden=true;applyBtn.hidden=true;copyBtn.hidden=true;refreshConfig();syncRuntimeState();});
  setTimeout(()=>{refreshConfig();syncRuntimeState();},700);
}
