import { renderPublicCore, publicCoreLang } from './public-core-render.js';

const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const lang=publicCoreLang(document.documentElement.lang);
const loadCopy={fi:{orch:'Rakennekarttaa ei saatu ladattua.',agents:'Agenttirekisteriä ei saatu ladattua.',models:'Mallireittejä ei saatu ladattua.',tools:'Työkalupintaa ei saatu ladattua.'},en:{orch:'Architecture map could not be loaded.',agents:'Agent Registry could not be loaded.',models:'Model routes could not be loaded.',tools:'Tool surface could not be loaded.'}}[lang];

function apply(core){
  const view=renderPublicCore(core,lang);
  if(q('#corePublicVersion'))q('#corePublicVersion').textContent=`CORE ${view.version}`;
  if(q('#corePublicAgentCount'))q('#corePublicAgentCount').textContent=String(view.agentCount);
  if(q('#corePublicPlatform'))q('#corePublicPlatform').innerHTML=view.platformHtml;
  if(q('#corePublicOrchestraCount'))q('#corePublicOrchestraCount').textContent=String(view.orchestraCount);
  if(q('#corePublicAgents'))q('#corePublicAgents').innerHTML=view.agentsHtml;
  if(q('#corePublicOrchestra'))q('#corePublicOrchestra').innerHTML=view.orchestrasHtml;
  if(q('#corePublicModels'))q('#corePublicModels').innerHTML=view.modelsHtml;
  if(q('#corePublicTools'))q('#corePublicTools').innerHTML=view.toolsHtml;
  if(q('#corePublicWorkspaces'))q('#corePublicWorkspaces').innerHTML=view.workspacesHtml;
  if(q('#corePublicRunBudget'))q('#corePublicRunBudget').textContent=view.usage.runBudget;
  if(q('#corePublicLargestBudget'))q('#corePublicLargestBudget').textContent=view.usage.largestBudget;
  if(q('#corePublicReceiptMode'))q('#corePublicReceiptMode').textContent=view.usage.receipt;
}

function initSectionNav(){
  const links=new Map(qa('[data-core-nav]').map(a=>[a.dataset.coreNav,a])),sections=qa('[data-core-section]');
  if(!('IntersectionObserver'in window)||!sections.length)return;
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!visible)return;
    for(const link of links.values()){link.classList.remove('active');link.removeAttribute('aria-current')}
    const active=links.get(visible.target.id);active?.classList.add('active');active?.setAttribute('aria-current','location');
  },{rootMargin:'-25% 0px -60% 0px',threshold:[0,.15,.35,.6]});
  sections.forEach(section=>observer.observe(section));
}

function initAgentSearch(){
  document.addEventListener('input',event=>{
    const input=event.target.closest?.('[data-core-agent-search]');if(!input)return;
    const details=input.closest('.core-registry-details'),term=String(input.value||'').trim().toLocaleLowerCase(lang==='fi'?'fi':'en');let visible=0;
    for(const card of details?.querySelectorAll('[data-agent-search]')||[]){const match=!term||String(card.dataset.agentSearch||'').includes(term);card.hidden=!match;if(match)visible++;}
    const empty=details?.querySelector('[data-core-agent-search-empty]');if(empty){empty.hidden=visible!==0;empty.textContent=`${visible} ${lang==='fi'?'agenttia':'agents'}`;}
  });
}

async function load(){
  try{const response=await fetch('/core-public.json',{credentials:'omit'});if(!response.ok)throw new Error('snapshot');apply(await response.json());}
  catch{
    if(q('#corePublicOrchestra')&&!q('#corePublicOrchestra').children.length)q('#corePublicOrchestra').innerHTML=`<p class="core-public-error">${loadCopy.orch}</p>`;
    if(q('#corePublicAgents')&&!q('#corePublicAgents').children.length)q('#corePublicAgents').innerHTML=`<p class="core-public-error">${loadCopy.agents}</p>`;
    if(q('#corePublicModels')&&!q('#corePublicModels').children.length)q('#corePublicModels').innerHTML=`<p class="core-public-error">${loadCopy.models}</p>`;
    if(q('#corePublicTools')&&!q('#corePublicTools').children.length)q('#corePublicTools').innerHTML=`<p class="core-public-error">${loadCopy.tools}</p>`;
  }
}

initSectionNav();initAgentSearch();load();
