const q=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=value=>Number(value||0).toLocaleString('fi-FI');

function renderOrchestra(core){
  const root=q('#corePublicOrchestra');
  const orchestra=core?.orchestras?.[0];
  if(!root||!orchestra)return;
  const agents=new Map((core.agents||[]).map(agent=>[agent.id,agent]));
  root.innerHTML=`<article class="core-public-orchestra-card"><div class="core-public-orchestra-head"><div><span>${esc(orchestra.id)} / ${esc(orchestra.version)}</span><strong>${esc(orchestra.name)}</strong></div><code>${esc(String(orchestra.orchestraHash||'').slice(0,16))}…</code></div><p>${esc(orchestra.description)}</p><div class="core-public-stage-line">${orchestra.stages.map((id,i)=>{const a=agents.get(id);return `<div class="core-public-stage"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(a?.label||id)}</strong><small>${esc(a?.role||'')}</small></div>`}).join('')}</div><div class="core-public-policy-row"><span>Evidence: ${esc(orchestra.evidencePolicy)}</span><span>Audience: ${esc(orchestra.audiencePolicy)}</span><span>Human final authority: ${orchestra.humanFinalAuthority?'YES':'NO'}</span></div></article>`;
}
function renderAgents(core){
  const root=q('#corePublicAgents');if(!root)return;
  root.innerHTML=(core.agents||[]).map(agent=>`<article class="core-public-agent-card"><div class="core-public-agent-head"><div><span>${esc(agent.id)}</span><strong>${esc(agent.label)}</strong></div><code>${esc(String(agent.contractHash||'').slice(0,12))}…</code></div><p>${esc(agent.description)}</p><dl><div><dt>Rooli</dt><dd>${esc(agent.role)}</dd></div><div><dt>Mallireitti</dt><dd>${esc(agent.modelRoute)}</dd></div><div><dt>Output-katto</dt><dd>${n(agent.maxOutputTokens)} tok</dd></div><div><dt>Saa kirjoittaa</dt><dd>${esc((agent.write||[]).join(', ')||'ei mitään')}</dd></div><div><dt>Julkaisu</dt><dd class="core-deny">DENY</dd></div></dl></article>`).join('');
}
async function load(){
  try{
    const response=await fetch('/core-public.json',{credentials:'omit'});if(!response.ok)throw new Error('snapshot');
    const core=await response.json();
    q('#corePublicVersion').textContent=`CORE ${core.version}`;
    q('#corePublicAgentCount').textContent=String(core.agents?.length||0);
    q('#corePublicOrchestraCount').textContent=String(core.orchestras?.length||0);
    renderOrchestra(core);renderAgents(core);
  }catch{
    const orchestra=q('#corePublicOrchestra'),agents=q('#corePublicAgents');
    if(orchestra)orchestra.innerHTML='<p class="core-public-error">Rakennekarttaa ei saatu ladattua.</p>';
    if(agents)agents.innerHTML='<p class="core-public-error">Agenttirekisteriä ei saatu ladattua.</p>';
  }
}
load();
