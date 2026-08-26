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

function setPressed(buttons,active){
  for(const button of buttons){
    const selected=button===active;
    button.classList.toggle('is-active',selected);
    button.setAttribute('aria-pressed',String(selected));
  }
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
  let category='all',audience='all';
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
  };
  categoryButtons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.categoryFilter||'all';setPressed(categoryButtons,button);apply();}));
  audienceButtons.forEach(button=>button.addEventListener('click',()=>{audience=button.dataset.audienceFilter||'all';setPressed(audienceButtons,button);apply();}));
  return {apply,getState:()=>({category,audience})};
}

if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initSiteUi());
  else initSiteUi();
}
