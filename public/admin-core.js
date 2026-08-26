const q=s=>document.querySelector(s);
const panel=q('#corePanel');
const LEDGER_KEY='anomancer.core.run-ledger.v15';
const RUNTIME_KEY='anomancer.core.agent-runtime.v15.3';
const RUNTIME_FORMAT='anomancer-agent-runtime-store/v1';
let snapshot=null,openAgentId='';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stable(value){if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;return JSON.stringify(value);}
async function sha256(value){const bytes=new TextEncoder().encode(String(value));const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function readLedger(){try{const v=JSON.parse(localStorage.getItem(LEDGER_KEY)||'{"format":"anomancer-run-ledger/v1","entries":[]}');return v&&Array.isArray(v.entries)?v:{format:'anomancer-run-ledger/v1',entries:[]};}catch{return{format:'anomancer-run-ledger/v1',entries:[]};}}
async function verifyLedger(ledger=readLedger()){
  let previous='GENESIS';
  for(const entry of ledger.entries){const payload={previousHash:previous,receipt:entry.receipt};const expected=await sha256(stable(payload));if(entry.previousHash!==previous||entry.entryHash!==expected)return false;previous=entry.entryHash;}
  return true;
}
async function appendReceipt(receipt){
  if(!receipt?.id)return;
  const ledger=readLedger();if(ledger.entries.some(entry=>entry.receipt?.id===receipt.id))return;
  const previousHash=ledger.entries.at(-1)?.entryHash||'GENESIS';const entryHash=await sha256(stable({previousHash,receipt}));
  ledger.entries.push({previousHash,entryHash,receipt});localStorage.setItem(LEDGER_KEY,JSON.stringify(ledger));await render();
}
function budget(agent){const n=Number(agent?.budget?.maxOutputTokens||0);return n?`${n.toLocaleString('fi-FI')} tok`:'—';}
function readRuntimeStore(){try{const value=JSON.parse(localStorage.getItem(RUNTIME_KEY)||'{}');return value?.format===RUNTIME_FORMAT&&value.profiles&&typeof value.profiles==='object'?value:{format:RUNTIME_FORMAT,profiles:{}};}catch{return{format:RUNTIME_FORMAT,profiles:{}};}}
function runtimeForAgent(id){
  const stored=readRuntimeStore().profiles?.[id]||{};const agent=snapshot?.agents?.find(item=>item.id===id);
  if(!agent)return stored&&Object.keys(stored).length?{format:'anomancer-agent-runtime/v1',agentId:id,contractHash:String(stored.contractHash||''),active:stored.active!==false,maxOutputTokens:Number(stored.maxOutputTokens||0)||0,limits:{minOutputTokens:1,maxOutputTokens:Number.MAX_SAFE_INTEGER}}:null;
  const policy=agent.runtimePolicy||{};
  const min=Math.max(1,Number(policy.minOutputTokens||1000));const max=Math.max(min,Number(policy.maxOutputTokens||agent.budget?.maxOutputTokens||min));
  const requested=stored.contractHash===agent.contractHash?Number(stored.maxOutputTokens):Number(agent.budget?.maxOutputTokens||min);
  return {format:'anomancer-agent-runtime/v1',agentId:id,contractHash:agent.contractHash,active:stored.contractHash===agent.contractHash?stored.active!==false:true,maxOutputTokens:Number.isFinite(requested)?Math.min(max,Math.max(min,Math.round(requested))):Number(agent.budget?.maxOutputTokens||min),limits:{minOutputTokens:min,maxOutputTokens:max}};
}
function getRuntimeProfiles(){if(snapshot)return Object.fromEntries(snapshot.agents.map(agent=>[agent.id,runtimeForAgent(agent.id)]));const store=readRuntimeStore();return Object.fromEntries(Object.keys(store.profiles||{}).map(id=>[id,runtimeForAgent(id)]));}
function saveRuntimeProfile(id,patch={}){
  const current=runtimeForAgent(id);if(!current)return null;const store=readRuntimeStore();
  const requested=Number(patch.maxOutputTokens);const maxOutputTokens=Number.isFinite(requested)?Math.min(current.limits.maxOutputTokens,Math.max(current.limits.minOutputTokens,Math.round(requested))):current.maxOutputTokens;
  const profile={contractHash:current.contractHash,active:patch.active!==undefined?patch.active!==false:current.active,maxOutputTokens};
  store.profiles[id]=profile;localStorage.setItem(RUNTIME_KEY,JSON.stringify(store));
  const next=runtimeForAgent(id);window.dispatchEvent(new CustomEvent('anomancer:agent-runtime-change',{detail:{agentId:id,profile:next,profiles:getRuntimeProfiles()}}));return next;
}
function resetRuntimeProfile(id){const store=readRuntimeStore();delete store.profiles[id];localStorage.setItem(RUNTIME_KEY,JSON.stringify(store));const next=runtimeForAgent(id);window.dispatchEvent(new CustomEvent('anomancer:agent-runtime-change',{detail:{agentId:id,profile:next,profiles:getRuntimeProfiles()}}));return next;}
function routeLabel(agent){const route=snapshot?.modelRoutes?.[agent?.modelRoute];return route?.model?`${route.provider||'model'} · ${route.model}`:agent?.modelRoute||'—';}
function chips(items=[],kind=''){return items.length?items.map(item=>`<span class="core-chip${kind?` ${kind}`:''}">${esc(item)}</span>`).join(''):'<span class="core-chip muted">ei määritelty</span>';}
function renderAgents(){
  const el=q('#coreAgents');if(!el||!snapshot)return;
  el.innerHTML=snapshot.agents.map(agent=>{const runtime=runtimeForAgent(agent.id);return `<article class="core-agent-card" data-agent-id="${esc(agent.id)}" data-runtime-state="${runtime?.active?'active':'disabled'}"><div class="core-agent-title"><div><span>${esc(agent.id)}</span><strong>${esc(agent.label)}</strong></div><span class="core-runtime-badge" data-state="${runtime?.active?'active':'disabled'}">${runtime?.active?'ACTIVE':'OFF'}</span></div><p>${esc(agent.description)}</p><dl><div><dt>Rooli</dt><dd>${esc(agent.role)}</dd></div><div><dt>Malli</dt><dd>${esc(routeLabel(agent))}</dd></div><div><dt>Runtime output</dt><dd>${Number(runtime?.maxOutputTokens||0).toLocaleString('fi-FI')} tok</dd></div><div><dt>Sopimus</dt><dd>${budget(agent)}</dd></div></dl><div class="core-agent-foot"><code>${esc(agent.contractHash.slice(0,16))}…</code><button type="button" class="ghost core-agent-open" data-agent-open="${esc(agent.id)}">Hallinnoi</button></div></article>`;}).join('');
}
function renderOrchestras(){const el=q('#coreOrchestras');if(!el||!snapshot)return;el.innerHTML=snapshot.orchestras.map(o=>`<article class="core-orchestra-card"><div class="core-orchestra-head"><div><span>${esc(o.id)}</span><strong>${esc(o.name)} ${esc(o.version)}</strong></div><code>${esc(o.orchestraHash.slice(0,16))}…</code></div><p>${esc(o.description)}</p><div class="core-stage-line">${o.stages.map((id,i)=>{const runtime=runtimeForAgent(id);return `<span data-runtime-state="${runtime?.active?'active':'disabled'}"><b>${String(i+1).padStart(2,'0')}</b>${esc(snapshot.agents.find(a=>a.id===id)?.label||id)}${runtime?.active?'':' · OFF'}</span>`;}).join('')}</div></article>`).join('');}
function renderAgentDialog(id=openAgentId){
  const dialog=q('#coreAgentDialog');const agent=snapshot?.agents?.find(item=>item.id===id);if(!dialog||!agent)return;openAgentId=id;const runtime=runtimeForAgent(id);const policy=agent.runtimePolicy||{};
  q('#coreAgentDialogTitle').textContent=agent.label;q('#coreAgentDialogId').textContent=`${agent.id} · ${agent.role}`;q('#coreAgentDialogDescription').textContent=agent.description;
  q('#coreAgentActive').checked=runtime.active;q('#coreAgentTokens').min=String(runtime.limits.minOutputTokens);q('#coreAgentTokens').max=String(runtime.limits.maxOutputTokens);q('#coreAgentTokens').value=String(runtime.maxOutputTokens);q('#coreAgentTokenRange').textContent=`Sallittu ${runtime.limits.minOutputTokens.toLocaleString('fi-FI')}–${runtime.limits.maxOutputTokens.toLocaleString('fi-FI')} · sopimuksen oletus ${Number(agent.budget?.maxOutputTokens||0).toLocaleString('fi-FI')}`;
  q('#coreAgentModel').textContent=routeLabel(agent);q('#coreAgentTools').innerHTML=chips(agent.tools||[]);q('#coreAgentCapabilities').innerHTML=chips(agent.capabilities||[]);q('#coreAgentRead').innerHTML=chips(agent.authority?.read||[]);q('#coreAgentWrite').innerHTML=chips(agent.authority?.write||[],'allow');q('#coreAgentDeny').innerHTML=chips(agent.authority?.deny||[],'deny');q('#coreAgentApproval').innerHTML=chips(agent.humanApproval||[],'gate');q('#coreAgentHash').textContent=agent.contractHash;
  q('#coreAgentRuntimeNotice').textContent=`Runtime Profile tallentuu vain tähän admin-selaimeen. Sopimuksen malli-, työkalu- ja toimivaltarajat pysyvät muuttumattomina (${(policy.immutable||[]).length} lukittua kenttää).`;
}
function openAgentDialog(id){const dialog=q('#coreAgentDialog');renderAgentDialog(id);if(dialog&&!dialog.open)dialog.showModal();}
async function render(){
  if(!panel||!snapshot)return;const ledger=readLedger(),ok=await verifyLedger(ledger);const receipts=ledger.entries.map(e=>e.receipt);const total=receipts.reduce((sum,r)=>sum+Number(r.usage?.totalTokens||0),0);const output=receipts.reduce((sum,r)=>sum+Number(r.usage?.outputTokens||0),0);const active=snapshot.agents.filter(agent=>runtimeForAgent(agent.id)?.active).length;
  q('#coreRunCount').textContent=String(receipts.length);q('#coreTokenCount').textContent=total.toLocaleString('fi-FI');q('#coreOutputCount').textContent=output.toLocaleString('fi-FI');q('#coreAgentCount').textContent=`${active}/${snapshot.agents.length}`;q('#coreLedgerState').textContent=ok?'CHAIN OK':'CHAIN BROKEN';q('#coreLedgerState').dataset.state=ok?'ok':'broken';
  const list=q('#coreRuns');list.innerHTML=receipts.length?receipts.slice(-12).reverse().map(r=>`<article class="core-run-row"><div><strong>${esc(r.agent?.label||r.agent?.id)}</strong><span>${esc(r.id)}</span></div><div><span>${esc(r.model?.model||'')}</span><span>${Number(r.usage?.outputTokens||0).toLocaleString('fi-FI')} / ${Number(r.usage?.maxOutputTokens||0).toLocaleString('fi-FI')} out</span><time>${esc(new Date(r.finishedAt).toLocaleString('fi-FI'))}</time></div></article>`).join(''):'<p class="core-empty">Ei ajokuitteja vielä. Ensimmäinen agenttiajo avaa lokin.</p>';
  renderAgents();renderOrchestras();if(q('#coreAgentDialog')?.open&&openAgentId)renderAgentDialog(openAgentId);
}
async function loadCore(){try{const r=await fetch('/api/admin/core',{credentials:'same-origin'});if(!r.ok)return;const d=await r.json();snapshot=d.core;q('#coreVersion').textContent=`CORE ${snapshot.version}`;q('#coreOrchestraCount').textContent=String(snapshot.orchestras.length);await render();window.dispatchEvent(new CustomEvent('anomancer:core-ready',{detail:snapshot}));}catch{}}

panel?.addEventListener('click',event=>{const btn=event.target.closest?.('[data-agent-open]');if(btn)openAgentDialog(btn.dataset.agentOpen);});
q('#coreAgentClose')?.addEventListener('click',()=>q('#coreAgentDialog')?.close());
q('#coreAgentCancel')?.addEventListener('click',()=>q('#coreAgentDialog')?.close());
q('#coreAgentSave')?.addEventListener('click',async()=>{if(!openAgentId)return;saveRuntimeProfile(openAgentId,{active:q('#coreAgentActive')?.checked!==false,maxOutputTokens:Number(q('#coreAgentTokens')?.value)});await render();q('#coreAgentDialog')?.close();});
q('#coreAgentReset')?.addEventListener('click',async()=>{if(!openAgentId)return;resetRuntimeProfile(openAgentId);await render();renderAgentDialog(openAgentId);});
q('#coreAgentDialog')?.addEventListener('click',event=>{if(event.target===q('#coreAgentDialog'))q('#coreAgentDialog').close();});
window.anomancerCore={appendReceipt,readLedger,verifyLedger,getSnapshot:()=>snapshot,getRuntimeProfile:runtimeForAgent,getRuntimeProfiles,saveRuntimeProfile,resetRuntimeProfile,refresh:loadCore};
window.addEventListener('anomancer:admin-ready',loadCore);
window.addEventListener('storage',event=>{if(event.key===LEDGER_KEY||event.key===RUNTIME_KEY)render();});
loadCore();
