const q=s=>document.querySelector(s);
const panel=q('#corePanel');
const LEDGER_KEY='anomancer.core.run-ledger.v15';
let snapshot=null;

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
  ledger.entries.push({previousHash,entryHash,receipt});
  localStorage.setItem(LEDGER_KEY,JSON.stringify(ledger));
  await render();
}
function budget(agent){const n=Number(agent?.budget?.maxOutputTokens||0);return n?`${n.toLocaleString('fi-FI')} tok`:'—';}
function renderAgents(){const el=q('#coreAgents');if(!el||!snapshot)return;el.innerHTML=snapshot.agents.map(agent=>`<article class="core-agent-card"><div><span>${esc(agent.id)}</span><strong>${esc(agent.label)}</strong></div><p>${esc(agent.description)}</p><dl><div><dt>Rooli</dt><dd>${esc(agent.role)}</dd></div><div><dt>Mallireitti</dt><dd>${esc(agent.modelRoute)}</dd></div><div><dt>Output</dt><dd>${budget(agent)}</dd></div><div><dt>Saa kirjoittaa</dt><dd>${esc((agent.authority?.write||[]).join(', ')||'ei mitään')}</dd></div></dl><code>${esc(agent.contractHash.slice(0,16))}…</code></article>`).join('');}
function renderOrchestras(){const el=q('#coreOrchestras');if(!el||!snapshot)return;el.innerHTML=snapshot.orchestras.map(o=>`<article class="core-orchestra-card"><div class="core-orchestra-head"><div><span>${esc(o.id)}</span><strong>${esc(o.name)} ${esc(o.version)}</strong></div><code>${esc(o.orchestraHash.slice(0,16))}…</code></div><p>${esc(o.description)}</p><div class="core-stage-line">${o.stages.map((id,i)=>`<span><b>${String(i+1).padStart(2,'0')}</b>${esc(snapshot.agents.find(a=>a.id===id)?.label||id)}</span>`).join('')}</div></article>`).join('');}
async function render(){
  if(!panel)return;const ledger=readLedger(),ok=await verifyLedger(ledger);const receipts=ledger.entries.map(e=>e.receipt);const total=receipts.reduce((sum,r)=>sum+Number(r.usage?.totalTokens||0),0);const output=receipts.reduce((sum,r)=>sum+Number(r.usage?.outputTokens||0),0);
  q('#coreRunCount').textContent=String(receipts.length);q('#coreTokenCount').textContent=total.toLocaleString('fi-FI');q('#coreOutputCount').textContent=output.toLocaleString('fi-FI');q('#coreLedgerState').textContent=ok?'CHAIN OK':'CHAIN BROKEN';q('#coreLedgerState').dataset.state=ok?'ok':'broken';
  const list=q('#coreRuns');list.innerHTML=receipts.length?receipts.slice(-12).reverse().map(r=>`<article class="core-run-row"><div><strong>${esc(r.agent?.label||r.agent?.id)}</strong><span>${esc(r.id)}</span></div><div><span>${esc(r.model?.model||'')}</span><span>${Number(r.usage?.outputTokens||0).toLocaleString('fi-FI')} / ${Number(r.usage?.maxOutputTokens||0).toLocaleString('fi-FI')} out</span><time>${esc(new Date(r.finishedAt).toLocaleString('fi-FI'))}</time></div></article>`).join(''):'<p class="core-empty">Ei ajokuitteja vielä. Ensimmäinen agenttiajo avaa lokin.</p>';
  renderAgents();renderOrchestras();
}
async function loadCore(){try{const r=await fetch('/api/admin/core',{credentials:'same-origin'});if(!r.ok)return;const d=await r.json();snapshot=d.core;q('#coreVersion').textContent=`CORE ${snapshot.version}`;q('#coreAgentCount').textContent=String(snapshot.agents.length);q('#coreOrchestraCount').textContent=String(snapshot.orchestras.length);await render();window.dispatchEvent(new CustomEvent('anomancer:core-ready',{detail:snapshot}));}catch{}}
window.anomancerCore={appendReceipt,readLedger,verifyLedger,getSnapshot:()=>snapshot,refresh:loadCore};
window.addEventListener('anomancer:admin-ready',loadCore);
window.addEventListener('storage',event=>{if(event.key===LEDGER_KEY)render();});
loadCore();
