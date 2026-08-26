const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=value=>Number(value||0).toLocaleString('fi-FI');

function renderOrchestra(core){
  const root=q('#corePublicOrchestra');
  const orchestra=core?.orchestras?.[0];
  if(!root||!orchestra)return;
  const agents=new Map((core.agents||[]).map(agent=>[agent.id,agent]));
  const steps=Array.isArray(orchestra.steps)&&orchestra.steps.length?orchestra.steps:(orchestra.stages||[]).map(id=>({mode:'sequential',agents:[id]}));
  root.innerHTML=`<article class="core-public-orchestra-card"><div class="core-public-orchestra-head"><div><span>${esc(orchestra.id)} / ${esc(orchestra.version)}</span><strong>${esc(orchestra.name)}</strong></div><code>${esc(String(orchestra.orchestraHash||'').slice(0,16))}…</code></div><p>${esc(orchestra.description)}</p><div class="core-public-stage-line">${steps.map((step,i)=>`<div class="core-public-stage${step.mode==='parallel'?' parallel':''}"><span>${String(i+1).padStart(2,'0')}${step.mode==='parallel'?' ∥':''}</span>${(step.agents||[]).map(id=>{const a=agents.get(id);return `<strong>${esc(a?.label||id)}</strong><small>${esc(a?.role||'')}</small>`}).join('')}</div>`).join('')}</div><div class="core-public-policy-row"><span>Evidence: ${esc(orchestra.evidencePolicy)}</span><span>Audience: ${esc(orchestra.audiencePolicy)}</span><span>Human final authority: ${orchestra.humanFinalAuthority?'YES':'NO'}</span></div></article>`;
}

function renderAgents(core){
  const root=q('#corePublicAgents');if(!root)return;
  root.innerHTML=(core.agents||[]).map(agent=>`<article class="core-public-agent-card"><div class="core-public-agent-head"><div><span>${esc(agent.id)}</span><strong>${esc(agent.label)}</strong></div><code>${esc(String(agent.contractHash||'').slice(0,12))}…</code></div><p>${esc(agent.description)}</p><dl><div><dt>Rooli</dt><dd>${esc(agent.role)}</dd></div><div><dt>Mallireitti</dt><dd>${esc(agent.modelRoute)}</dd></div><div><dt>Output</dt><dd>${n(agent.maxOutputTokens)} default · ${n(agent.maxOutputTokensCeiling||agent.maxOutputTokens)} max</dd></div><div><dt>Saa kirjoittaa</dt><dd>${esc((agent.write||[]).join(', ')||'ei mitään')}</dd></div><div><dt>Human gate</dt><dd>${esc((agent.humanApproval||[]).join(', ')||'ei erillistä')}</dd></div><div><dt>Julkaisu</dt><dd class="core-deny">DENY</dd></div></dl></article>`).join('');
}

function renderModels(core){
  const root=q('#corePublicModels');if(!root)return;
  const router=core.modelRouter||{},providers=new Map((router.providers||[]).map(p=>[p.id,p]));
  const agentGroups=new Map();for(const agent of core.agents||[]){const list=agentGroups.get(agent.modelRoute)||[];list.push(agent.label||agent.id);agentGroups.set(agent.modelRoute,list);}
  root.innerHTML=(router.routes||core.modelRoutes||[]).map(route=>{
    const agents=agentGroups.get(route.id)||[];
    const targets=(route.allowedTargets||[]).map(id=>{const target=(router.targets||[]).find(t=>t.id===id);const provider=providers.get(target?.provider);return `<span>${esc(provider?.label||target?.provider||id)} · ${esc(id)}</span>`;}).join('');
    return `<article><span class="core-model-route">${esc(route.id)}</span><strong>${agents.length} agenttia · default ${esc(route.defaultTarget||'')}</strong><p>${esc(agents.join(' · '))}</p><div class="core-model-targets">${targets}</div><small>Fallback vain tämän reitin sallittuihin targetteihin. Provider-avainten tila pysyy yksityisessä control planessa.</small></article>`;
  }).join('');
}

function renderTools(core){
  const root=q('#corePublicTools');if(!root)return;
  const users=new Map();
  for(const agent of core.agents||[])for(const tool of agent.tools||[]){const list=users.get(tool)||[];list.push(agent.label||agent.id);users.set(tool,list);}
  root.innerHTML=(core.tools||[]).map(tool=>{
    const agents=users.get(tool.id)||[];
    const state=tool.actor==='human'?'HUMAN ONLY':agents.length?'BROKER ALLOW':'UNASSIGNED';
    const detail=tool.actor==='human'?'Agentti ei voi suorittaa tätä toimintoa.':agents.length?`Sopimusagentit: ${agents.join(', ')}`:'Ei agenttisopimukseen liitettynä.';
    return `<article data-risk="${esc(tool.risk||'unknown')}"><span class="core-tool-state">${esc(state)}</span><strong>${esc(tool.id)}</strong><p>${esc(tool.description||detail)}</p><small>${esc(detail)} · risk ${esc(tool.risk||'unknown')} · policy ${esc(core.toolBroker?.enforcement||'fail-closed')}</small></article>`;
  }).join('');
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
