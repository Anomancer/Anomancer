const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
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
  root.innerHTML=(core.agents||[]).map(agent=>`<article class="core-public-agent-card"><div class="core-public-agent-head"><div><span>${esc(agent.id)}</span><strong>${esc(agent.label)}</strong></div><code>${esc(String(agent.contractHash||'').slice(0,12))}…</code></div><p>${esc(agent.description)}</p><dl><div><dt>Rooli</dt><dd>${esc(agent.role)}</dd></div><div><dt>Mallireitti</dt><dd>${esc(agent.modelRoute)}</dd></div><div><dt>Output</dt><dd>${n(agent.maxOutputTokens)} default · ${n(agent.maxOutputTokensCeiling||agent.maxOutputTokens)} max</dd></div><div><dt>Saa kirjoittaa</dt><dd>${esc((agent.write||[]).join(', ')||'ei mitään')}</dd></div><div><dt>Human gate</dt><dd>${esc((agent.humanApproval||[]).join(', ')||'ei erillistä')}</dd></div><div><dt>Julkaisu</dt><dd class="core-deny">DENY</dd></div></dl></article>`).join('');
}

function renderModels(core){
  const root=q('#corePublicModels');if(!root)return;
  const groups=new Map();
  for(const agent of core.agents||[]){
    const key=agent.modelRoute||'unrouted';
    const item=groups.get(key)||{agents:[],budget:0};
    item.agents.push(agent.label||agent.id);item.budget+=Number(agent.maxOutputTokens||0);groups.set(key,item);
  }
  root.innerHTML=[...groups.entries()].map(([route,item])=>`<article><span class="core-model-route">${esc(route)}</span><strong>${item.agents.length} agenttia</strong><p>${esc(item.agents.join(' · '))}</p><small>Yhteinen stage-headroom ${n(item.budget)} tok · provider binding pidetään control planen asetuksena.</small></article>`).join('');
}

function renderTools(core){
  const root=q('#corePublicTools');if(!root)return;
  const tools=new Map();
  for(const agent of core.agents||[]){for(const tool of agent.tools||[]){const list=tools.get(tool)||[];list.push(agent.label||agent.id);tools.set(tool,list)}}
  const cards=[...tools.entries()].map(([tool,agents])=>`<article><span class="core-tool-state">CONTRACT-GATED</span><strong>${esc(tool)}</strong><p>Käytössä: ${esc(agents.join(', '))}</p><small>Työkalun näkyminen sopimuksessa ei itsessään anna julkaisuoikeutta.</small></article>`);
  cards.push(`<article class="core-tool-empty"><span class="core-tool-state">DEFAULT</span><strong>Ei implisiittisiä työkaluja</strong><p>Agentti ei saa käyttöoikeutta vain siksi, että malli teknisesti osaisi pyytää toimintoa.</p><small>Tool Broker tekee tästä seuraavassa kerroksessa runtime-valvotun säännön.</small></article>`);
  root.innerHTML=cards.join('');
}

function renderUsage(core){
  const budgets=(core.agents||[]).map(a=>Number(a.maxOutputTokens||0));
  const total=budgets.reduce((sum,x)=>sum+x,0),largest=Math.max(0,...budgets);
  const totalEl=q('#corePublicRunBudget'),largestEl=q('#corePublicLargestBudget');
  if(totalEl)totalEl.textContent=`${n(total)} tok`;
  if(largestEl)largestEl.textContent=`${n(largest)} tok`;
}

function initSectionNav(){
  const links=new Map(qa('[data-core-nav]').map(a=>[a.dataset.coreNav,a]));
  const sections=qa('[data-core-section]');
  if(!('IntersectionObserver' in window)||!sections.length)return;
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!visible)return;
    for(const link of links.values())link.classList.remove('active');
    links.get(visible.target.id)?.classList.add('active');
  },{rootMargin:'-30% 0px -55% 0px',threshold:[0,.15,.35,.6]});
  sections.forEach(section=>observer.observe(section));
}

async function load(){
  try{
    const response=await fetch('/core-public.json',{credentials:'omit'});if(!response.ok)throw new Error('snapshot');
    const core=await response.json();
    q('#corePublicVersion').textContent=`CORE ${core.version}`;
    q('#corePublicAgentCount').textContent=String(core.agents?.length||0);
    q('#corePublicOrchestraCount').textContent=String(core.orchestras?.length||0);
    renderOrchestra(core);renderAgents(core);renderModels(core);renderTools(core);renderUsage(core);
  }catch{
    const orchestra=q('#corePublicOrchestra'),agents=q('#corePublicAgents'),models=q('#corePublicModels'),tools=q('#corePublicTools');
    if(orchestra)orchestra.innerHTML='<p class="core-public-error">Rakennekarttaa ei saatu ladattua.</p>';
    if(agents)agents.innerHTML='<p class="core-public-error">Agenttirekisteriä ei saatu ladattua.</p>';
    if(models)models.innerHTML='<p class="core-public-error">Mallireittejä ei saatu ladattua.</p>';
    if(tools)tools.innerHTML='<p class="core-public-error">Työkalupintaa ei saatu ladattua.</p>';
  }
}
initSectionNav();load();
