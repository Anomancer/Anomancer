export function splitAudience(value=''){
  return String(value||'all').trim().split(/\s+/).filter(Boolean);
}

export function matchesDispatchFilters(card={},filters={}){
  const category=String(filters.category||'all');
  const audience=String(filters.audience||'all');
  const cardCategory=String(card.category||'');
  const cardAudiences=Array.isArray(card.audience)?card.audience:splitAudience(card.audience);
  const matchesCategory=category==='all'||cardCategory===category;
  // Named audience filters are intentionally strict: `all` means general-purpose content,
  // not an implicit membership in every targeted audience bucket.
  const matchesAudience=audience==='all'||cardAudiences.includes(audience);
  return matchesCategory&&matchesAudience;
}

function syncPressed(buttons,dataKey,value){
  for(const button of buttons){
    const selected=String(button.dataset[dataKey]||'all')===String(value);
    button.classList.toggle('is-active',selected);
    button.setAttribute('aria-pressed',String(selected));
  }
}

function labelFor(buttons,dataKey,value){
  return buttons.find(button=>String(button.dataset[dataKey]||'all')===String(value))?.dataset.filterLabel||String(value);
}

export function initSiteUi(root=document){
  const menuButton=root.querySelector('.menu-toggle');
  const menu=root.querySelector('#header-menu');
  const closeMenu=()=>{menu?.classList.remove('is-open');menuButton?.setAttribute('aria-expanded','false');};
  menuButton?.addEventListener('click',()=>{
    const open=menu?.classList.toggle('is-open')||false;
    menuButton.setAttribute('aria-expanded',String(open));
  });
  menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  root.addEventListener?.('keydown',event=>{if(event.key==='Escape')closeMenu();});

  const categoryButtons=[...root.querySelectorAll('[data-category-filter]')];
  const audienceButtons=[...root.querySelectorAll('[data-audience-filter]')];
  const cards=[...root.querySelectorAll('.dispatch-card')];
  const empty=root.querySelector('#dispatch-empty');
  const count=root.querySelector('#dispatch-count');
  const summary=root.querySelector('#dispatch-filter-summary');
  const dialog=root.querySelector('#dispatch-filter-dialog');
  const openButton=root.querySelector('[data-filter-open]');
  const closeButtons=[...root.querySelectorAll('[data-filter-close]')];
  const clearButton=root.querySelector('[data-filter-clear]');
  let category='all',audience='all';
  const canUseUrl=typeof window!=='undefined'&&window.location&&window.history;
  const allowedCategory=new Set(categoryButtons.map(button=>button.dataset.categoryFilter||'all'));
  const allowedAudience=new Set(audienceButtons.map(button=>button.dataset.audienceFilter||'all'));

  const readUrlState=()=>{
    if(!canUseUrl)return;
    const params=new URLSearchParams(window.location.search);
    const nextCategory=params.get('category')||'all',nextAudience=params.get('audience')||'all';
    category=allowedCategory.has(nextCategory)?nextCategory:'all';
    audience=allowedAudience.has(nextAudience)?nextAudience:'all';
  };
  const writeUrlState=(mode='replace')=>{
    if(!canUseUrl||(!categoryButtons.length&&!audienceButtons.length))return;
    const url=new URL(window.location.href);
    if(category==='all')url.searchParams.delete('category');else url.searchParams.set('category',category);
    if(audience==='all')url.searchParams.delete('audience');else url.searchParams.set('audience',audience);
    window.history[mode==='push'?'pushState':'replaceState']({category,audience},'',`${url.pathname}${url.search}${url.hash}`);
  };

  const updateSummary=()=>{
    if(!summary)return;
    const topicLabel=summary.dataset.topicLabel||'Topic';
    const audienceLabel=summary.dataset.audienceLabel||'Audience';
    summary.textContent=`${topicLabel}: ${labelFor(categoryButtons,'categoryFilter',category)} · ${audienceLabel}: ${labelFor(audienceButtons,'audienceFilter',audience)}`;
  };
  const apply=()=>{
    let visible=0;
    for(const card of cards){
      const visibleForFilters=matchesDispatchFilters(
        {category:card.dataset.category||'',audience:card.dataset.audience||'all'},
        {category,audience}
      );
      card.hidden=!visibleForFilters;
      if(visibleForFilters)visible++;
    }
    if(count)count.textContent=String(visible);
    if(empty)empty.hidden=visible!==0;
    syncPressed(categoryButtons,'categoryFilter',category);
    syncPressed(audienceButtons,'audienceFilter',audience);
    updateSummary();
  };
  categoryButtons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.categoryFilter||'all';apply();writeUrlState('push');}));
  audienceButtons.forEach(button=>button.addEventListener('click',()=>{audience=button.dataset.audienceFilter||'all';apply();writeUrlState('push');}));
  clearButton?.addEventListener('click',()=>{category='all';audience='all';apply();writeUrlState('push');});
  openButton?.addEventListener('click',()=>{if(dialog?.showModal)dialog.showModal();});
  closeButtons.forEach(button=>button.addEventListener('click',()=>dialog?.close?.()));
  dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  readUrlState();
  apply();
  writeUrlState('replace');
  if(canUseUrl)window.addEventListener('popstate',()=>{readUrlState();apply();});
  return {apply,getState:()=>({category,audience}),clear:()=>{category='all';audience='all';apply();writeUrlState('push');}};
}

if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initSiteUi());
  else initSiteUi();
}
