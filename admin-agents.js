const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const box=q('#agentDesk');
if(box){
  const runBtn=q('#agentRunBtn'), applyBtn=q('#agentApplyBtn'), copyBtn=q('#agentCopyBtn');
  const agentSelect=q('#agentRole'), instruction=q('#agentInstruction'), output=q('#agentOutput'), status=q('#agentStatus'), modelStatus=q('#agentModelStatus');
  let csrf='',last=null;

  const AGENT_LABELS={source:'Lähdeagentti',claims:'Väitevahti',structure:'Rakenneagentti',writer:'Kirjoitusagentti',critic:'Kriitikko',voice:'Äänieditori',package:'Julkaisupaketti'};
  const CATEGORY_VALUES=new Set(['ai-work','info-media','work-decisions','money-risk','software-safety','language-learning','creativity-tools','society-systems']);
  const AUDIENCE_VALUES=new Set(['all','employee','entrepreneur','developer','teacher','creative','decision-maker','investor']);

  function setStatus(text,kind=''){status.textContent=text;status.className=`agent-status ${kind}`;}
  function parseSources(text=''){
    const out=[],seen=new Set();
    for(const raw of String(text).split('\n')){const line=raw.trim();if(!line)continue;const [title='',url='',publisher='',date='']=line.split('|').map(x=>x.trim());if(!title||!url||seen.has(url))continue;seen.add(url);out.push({title,url,publisher,date});}
    return out;
  }
  function parseClaims(text=''){
    return String(text).split('\n').map(raw=>{const p=raw.split('|').map(x=>x.trim());if(!p[1])return null;return{status:['supported','interpretation','open'].includes(p[0])?p[0]:'open',text:p[1],evidence:(p[2]||'').split(',').map(x=>x.trim()).filter(Boolean),note:p.slice(3).join(' | ').trim()};}).filter(Boolean);
  }
  function formatSources(items=[]){return items.map(x=>[x.title||'',x.url||'',x.publisher||'',x.date||''].join(' | ').replace(/(?:\s*\|\s*)+$/,'')).join('\n');}
  function formatClaims(items=[]){return items.map(x=>[x.status||'open',x.text||'',(x.evidence||[]).join(', '),x.note||''].join(' | ').replace(/(?:\s*\|\s*)+$/,'')).join('\n');}
  function currentPost(){
    return{
      lang:q('#lang')?.value||'fi',title:q('#title')?.value||'',category:q('#category')?.value||'info-media',
      audience:qa('input[name="audience"]:checked').map(x=>x.value),description:q('#description')?.value||'',answer:q('#answer')?.value||'',
      slug:q('#slug')?.value||'',sources:parseSources(q('#sources')?.value||''),claims:parseClaims(q('#claims')?.value||''),body:q('#body')?.value||''
    };
  }
  function fire(el){if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
  async function getSession(){
    const r=await fetch('/api/admin/session',{credentials:'same-origin'});const d=await r.json().catch(()=>({}));if(!r.ok||!d.authenticated)throw new Error('Admin-session puuttuu.');csrf=d.csrf||'';return d;
  }
  async function refreshConfig(){
    try{await getSession();const r=await fetch('/api/admin/agents',{credentials:'same-origin'});const d=await r.json();if(!r.ok)throw new Error(d.message||'Agenttien tila ei auennut.');
      const c=d.deepseek||{};modelStatus.textContent=c.configured?`DeepSeek valmis · ${c.defaultModel}`:'DeepSeek API-avain puuttuu';modelStatus.dataset.kind=c.configured?'ok':'warn';
    }catch{modelStatus.textContent='Kirjaudu sisään, niin agenttitila tarkistetaan.';modelStatus.dataset.kind='';}
  }
  function renderResult(agent,result,meta){
    const title=`${AGENT_LABELS[agent]||agent} · ${meta?.model||'DeepSeek'}${meta?.searchedWeb?' · WEB':''}`;
    output.textContent=`${title}\n\n${JSON.stringify(result,null,2)}`;
    copyBtn.hidden=false;
    const rawFallback=agent==='source'&&meta?.structured===false;
    applyBtn.hidden=rawFallback||!['source','claims','writer','voice','package'].includes(agent);
    applyBtn.textContent=agent==='source'?'Lisää lähde-ehdokkaat':agent==='claims'?'Siirrä Evidence Layeriin':agent==='writer'?'Käytä luonnosta':agent==='voice'?'Käytä äänieditointia':'Käytä julkaisupakettia';
  }
  async function run(){
    try{
      runBtn.disabled=true;applyBtn.hidden=true;copyBtn.hidden=true;setStatus('Agentti työskentelee…','working');
      if(!csrf)await getSession();
      const agent=agentSelect.value;
      const r=await fetch('/api/admin/agents',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({agent,instruction:instruction.value,post:currentPost()})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||!d.ok){if(r.status===403){csrf='';}throw new Error(d.message||d.error||`HTTP ${r.status}`);}
      last=d;renderResult(agent,d.result,d.meta);
      if(agent==='source'&&d.meta?.structured===false)setStatus('⚠ Web-haku valmistui, mutta rakenteinen JSON petti. Raakavastaus säilytettiin alle. Mitään ei tallennettu eikä julkaistu.','warn');
      else setStatus('✓ Ehdotus valmis. Mitään ei tallennettu eikä julkaistu.','ok');
    }catch(e){setStatus(`✗ ${e.message}`,'err');output.textContent='';}
    finally{runBtn.disabled=false;}
  }
  function apply(){
    if(!last?.result)return;const a=last.agent,r=last.result;
    if(a==='source'){
      if(!confirm('Lisätäänkö web-haun lähde-ehdokkaat Lähteet-kenttään? Tarkista URL:t ja sisältö itse ennen julkaisua.'))return;
      const existing=parseSources(q('#sources').value),seen=new Set(existing.map(x=>x.url));
      const add=(Array.isArray(r.candidateSources)?r.candidateSources:[]).filter(x=>x?.url&&!seen.has(x.url)).map(x=>({title:x.title||x.url,url:x.url,publisher:x.publisher||'',date:x.date||''}));
      q('#sources').value=formatSources([...existing,...add]);fire(q('#sources'));setStatus(`✓ Lisättiin ${add.length} lähde-ehdokasta. Tarkistusvastuu jäi ihmiselle.`,'ok');return;
    }
    if(a==='claims'){
      if(typeof r.answer==='string'){q('#answer').value=r.answer;fire(q('#answer'));}
      if(Array.isArray(r.claims)){q('#claims').value=formatClaims(r.claims);fire(q('#claims'));}
      setStatus('✓ Ydinvastaus ja väitteet siirretty editoriin. Julkaisu vaatii edelleen sinut.','ok');return;
    }
    if(a==='writer'||a==='voice'){
      if(!r.body)return setStatus('Agentin vastauksessa ei ollut body-kenttää.','err');
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
      if(Array.isArray(r.audience)){
        const vals=new Set(r.audience.filter(x=>AUDIENCE_VALUES.has(x)));if(vals.size){qa('input[name="audience"]').forEach(x=>x.checked=vals.has(x.value));qa('input[name="audience"]')[0]?.dispatchEvent(new Event('change',{bubbles:true}));}
      }
      if(Array.isArray(r.sources)){const existing=parseSources(q('#sources').value);const allowed=new Set(existing.map(x=>x.url));const safe=r.sources.filter(x=>allowed.has(x.url));q('#sources').value=formatSources(safe.length?safe:existing);fire(q('#sources'));}
      if(Array.isArray(r.claims)){q('#claims').value=formatClaims(r.claims);fire(q('#claims'));}
      setStatus('✓ Julkaisupaketti siirretty editoriin. Human approval gate on edelleen kiinni.','ok');
    }
  }
  runBtn.addEventListener('click',run);applyBtn.addEventListener('click',apply);
  copyBtn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.textContent);setStatus('✓ Agentin tulos kopioitu.','ok');}catch{setStatus('Kopiointi ei onnistunut selaimessa.','err');}});
  agentSelect.addEventListener('change',()=>{last=null;applyBtn.hidden=true;copyBtn.hidden=true;output.textContent='';setStatus('');});
  setTimeout(refreshConfig,700);
}
