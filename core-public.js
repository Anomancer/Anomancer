import { renderPublicCore, publicCoreLang } from './public-core-render.js';
import { renderPublicCoreV3 } from './public-core-v3-render.js';

const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const lang=publicCoreLang(document.documentElement.lang);
const loadCopy={fi:{orch:'Rakennekarttaa ei saatu ladattua.',agents:'Agenttirekisteriä ei saatu ladattua.',models:'Mallireittejä ei saatu ladattua.',tools:'Työkalupintaa ei saatu ladattua.'},en:{orch:'Architecture map could not be loaded.',agents:'Agent Registry could not be loaded.',models:'Model routes could not be loaded.',tools:'Tool surface could not be loaded.'}}[lang];

function apply(core){
  const view=renderPublicCore(core,lang);
  const v3=renderPublicCoreV3(core,lang);
  if(q('#corePublicVersion'))q('#corePublicVersion').textContent=`CORE ${view.version}`;
  if(q('#corePublicAgentCount'))q('#corePublicAgentCount').textContent=String(view.agentCount);
  if(q('#corePublicPlatform'))q('#corePublicPlatform').innerHTML=view.platformHtml;
  if(q('#corePublicArchitecture'))q('#corePublicArchitecture').innerHTML=v3.architectureHtml;
  if(q('#corePublicCapabilities'))q('#corePublicCapabilities').innerHTML=v3.capabilitiesHtml;
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



function initMobileDisclosure(){
  const sections=qa('[data-core-section]');
  if(!sections.length)return;
  const mobile=window.matchMedia('(max-width: 760px)');
  const copy=lang==='fi'
    ?{show:'Näytä sisältö',hide:'Piilota sisältö'}
    :{show:'Show details',hide:'Hide details'};

  for(const section of sections){
    if(section.dataset.mobileDisclosure==='ready')continue;
    const head=section.querySelector(':scope > .core-public-section-head');
    if(!head)continue;
    const id=`${section.id||'core'}-mobile-details`;
    const button=document.createElement('button');
    button.type='button';
    button.className='core-mobile-disclosure-toggle';
    button.setAttribute('aria-controls',id);
    button.innerHTML=`<span>${copy.show}</span><b aria-hidden="true">+</b>`;
    const body=document.createElement('div');
    body.className='core-mobile-disclosure-body';
    body.id=id;
    const children=[...section.children];
    const headIndex=children.indexOf(head);
    for(const child of children.slice(headIndex+1))body.append(child);
    head.after(button,body);
    section.dataset.mobileDisclosure='ready';
    section.dataset.mobileOpen='false';

    const setOpen=(open,{exclusive=false}={})=>{
      if(exclusive&&open&&mobile.matches){
        for(const other of sections){
          if(other!==section&&other.dataset.mobileDisclosure==='ready'){
            other.dataset.mobileOpen='false';
            other.classList.remove('is-mobile-open');
            const otherButton=other.querySelector(':scope > .core-mobile-disclosure-toggle');
            const otherBody=other.querySelector(':scope > .core-mobile-disclosure-body');
            if(otherButton){otherButton.setAttribute('aria-expanded','false');const label=otherButton.querySelector('span');if(label)label.textContent=copy.show;}
            if(otherBody)otherBody.hidden=true;
          }
        }
      }
      section.dataset.mobileOpen=open?'true':'false';
      section.classList.toggle('is-mobile-open',open);
      button.setAttribute('aria-expanded',open?'true':'false');
      const label=button.querySelector('span');if(label)label.textContent=open?copy.hide:copy.show;
      body.hidden=mobile.matches?!open:false;
    };
    button.addEventListener('click',()=>setOpen(section.dataset.mobileOpen!=='true',{exclusive:true}));
    section._setCoreMobileOpen=setOpen;
  }

  const sync=()=>{
    for(const section of sections){
      if(section.dataset.mobileDisclosure!=='ready')continue;
      const open=mobile.matches?section.dataset.mobileOpen==='true':true;
      section.classList.toggle('is-mobile-open',mobile.matches&&open);
      const button=section.querySelector(':scope > .core-mobile-disclosure-toggle');
      const body=section.querySelector(':scope > .core-mobile-disclosure-body');
      if(button){button.setAttribute('aria-expanded',mobile.matches&&open?'true':'false');const label=button.querySelector('span');if(label)label.textContent=mobile.matches&&open?copy.hide:copy.show;}
      if(body)body.hidden=mobile.matches?!open:false;
    }
  };
  const resolveHash=selector=>{if(!selector||selector==='#')return null;try{return document.querySelector(selector)}catch{return null}};
  const revealHash=()=>{
    if(!mobile.matches)return;
    const target=resolveHash(location.hash);
    const section=target?.matches?.('[data-core-section]')?target:target?.closest?.('[data-core-section]');
    section?._setCoreMobileOpen?.(true,{exclusive:true});
  };
  mobile.addEventListener?.('change',sync);
  window.addEventListener('hashchange',revealHash);
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href^="#"]');
    if(!link)return;
    const target=resolveHash(link.getAttribute('href'));
    const section=target?.matches?.('[data-core-section]')?target:target?.closest?.('[data-core-section]');
    if(section&&mobile.matches)section._setCoreMobileOpen?.(true,{exclusive:true});
  });
  sync();
  revealHash();
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

initSectionNav();initMobileDisclosure();initAgentSearch();load();
