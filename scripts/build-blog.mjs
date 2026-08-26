import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SITE = 'https://anomancer.vercel.app';
const AUTHOR = 'Aatu Isopahkala';
const OBSERVATORY = 'https://bhc-observatory.vercel.app/';

const categories = {
  'ai-work': { fi: 'Tekoäly arjessa ja työssä', en: 'AI in everyday life & work' },
  'info-media': { fi: 'Tieto, väitteet ja media', en: 'Information, claims & media' },
  'work-decisions': { fi: 'Työ, organisaatiot ja päätöksenteko', en: 'Work, organisations & decisions' },
  'money-risk': { fi: 'Raha, riskit ja mittarit', en: 'Money, risk & metrics' },
  'software-safety': { fi: 'Ohjelmistot, automaatio ja turvallisuus', en: 'Software, automation & safety' },
  'language-learning': { fi: 'Kieli, ajattelu ja oppiminen', en: 'Language, thinking & learning' },
  'creativity-tools': { fi: 'Luovuus ja työkalut', en: 'Creativity & tools' },
  'society-systems': { fi: 'Yhteiskunta ja järjestelmät', en: 'Society & systems' },
};
const categoryOrder = Object.keys(categories);
const legacyCategoryMap = {
  'ai-agents':'ai-work', 'tee':'software-safety', 'systems':'society-systems',
  'semantics':'language-learning', 'build':'software-safety', 'research':'info-media', 'field':'info-media'
};
const audiences = {
  all: { fi:'Kaikille', en:'Everyone' },
  employee: { fi:'Työntekijälle', en:'Employees' },
  entrepreneur: { fi:'Yrittäjälle', en:'Entrepreneurs' },
  developer: { fi:'Kehittäjälle', en:'Developers' },
  teacher: { fi:'Opettajalle', en:'Teachers' },
  creative: { fi:'Luovalle tekijälle', en:'Creative workers' },
  'decision-maker': { fi:'Päättäjälle', en:'Decision-makers' },
  investor: { fi:'Sijoittajalle', en:'Investors' },
};
const audienceOrder = Object.keys(audiences);
function normalizeCategory(value=''){ const raw=String(value||'').trim(); const mapped=legacyCategoryMap[raw]||raw; return categories[mapped]?mapped:'info-media'; }
function normalizeAudience(value){ let items=Array.isArray(value)?value:(typeof value==='string'&&value.trim()?value.split(','):[]); items=[...new Set(items.map(x=>String(x).trim()).filter(x=>audiences[x]))]; if(!items.length||items.includes('all'))return ['all']; return items; }

const copy = {
  fi: {
    blogPath: '/lahetykset', articleBase: '/lahetykset', home: '/', otherBlog: '/dispatches', otherLang: 'EN', selfLang: 'FI',
    title: 'LÄHETYKSET', eyebrow: 'Transmission log',
    intro: 'Vaikeat asiat käännettynä ihmisille. Tekoälyä, työtä, rahaa, mediaa, kieltä, turvallisuutta ja yhteiskunnan järjestelmiä ilman tarpeetonta sisäpiirikieltä.',
    all: 'Kaikki', archive: 'Kaikki lähetykset', read: 'Lue lähetys →', empty: 'Näillä valinnoilla ei löytynyt vielä julkaistuja lähetyksiä.',
    homeLabel: 'Etusivu', observatory: 'Observatorio', footer: 'ANOMANCER · Lähetykset', back: '← Kaikki lähetykset', deeper: 'Syvemmälle Observatorioon →',
    published: 'Julkaistu', minRead: 'min lukuaika', category: 'Aihe', audience: 'Kenelle tästä on hyötyä?', related: 'Muita lähetyksiä',
    description: 'Selkokielinen tietokirjasto tekoälystä, työstä, mediasta, rahasta, kielestä, turvallisuudesta ja yhteiskunnan järjestelmistä.',
  },
  en: {
    blogPath: '/dispatches', articleBase: '/dispatches', home: '/en', otherBlog: '/lahetykset', otherLang: 'FI', selfLang: 'EN',
    title: 'DISPATCHES', eyebrow: 'Transmission log',
    intro: 'Difficult ideas translated for people. AI, work, money, media, language, safety and social systems without needless insider language.',
    all: 'All', archive: 'All dispatches', read: 'Read dispatch →', empty: 'No published dispatches match these filters yet.',
    homeLabel: 'Home', observatory: 'Observatory', footer: 'ANOMANCER · Dispatches', back: '← All dispatches', deeper: 'Go deeper into the Observatory →',
    published: 'Published', minRead: 'min read', category: 'Topic', audience: 'Who is this useful for?', related: 'More dispatches',
    description: 'A plain-language knowledge library about AI, work, media, money, language, safety and social systems.',
  }
};

function esc(s='') {
  return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
function escAttr(s='') { return esc(s).replace(/'/g, '&#39;'); }
function slugify(s='') {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);
}
function parseScalar(raw) {
  const s = raw.trim();
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
    try { return JSON.parse(s); } catch {}
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    try { return JSON.parse(s.replace(/^'/,'"').replace(/'$/,'"')); } catch { return s.slice(1,-1); }
  }
  return s;
}
function parsePost(file, lang) {
  const raw = fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
  if (!raw.startsWith('---\n')) throw new Error(`${file}: frontmatter puuttuu`);
  const end = raw.indexOf('\n---\n',4);
  if (end < 0) throw new Error(`${file}: frontmatter ei sulkeudu`);
  const head = raw.slice(4,end);
  const body = raw.slice(end+5).trim();
  const data = {};
  for (const line of head.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i < 0) continue;
    data[line.slice(0,i).trim()] = parseScalar(line.slice(i+1));
  }
  data.lang = data.lang || lang;
  data.slug = data.slug || slugify(data.title);
  data.category = normalizeCategory(data.category);
  data.audience = normalizeAudience(data.audience);
  data.draft = Boolean(data.draft);
  data.translationKey = data.translationKey || data.slug;
  for (const req of ['title','date','description','slug','lang']) if (!data[req]) throw new Error(`${file}: ${req} puuttuu`);
  if (!['fi','en'].includes(data.lang)) throw new Error(`${file}: lang pitää olla fi/en`);
  return { ...data, body, file, filename:path.basename(file) };
}
function readPosts() {
  const posts = [];
  for (const lang of ['fi','en']) {
    const dir = path.join(ROOT,'content',lang);
    for (const name of fs.readdirSync(dir).filter(n=>n.endsWith('.md')).sort()) posts.push(parsePost(path.join(dir,name),lang));
  }
  const seen = new Set();
  for (const p of posts) {
    const key = `${p.lang}:${p.slug}`;
    if (seen.has(key)) throw new Error(`Duplikaattislug: ${key}`);
    seen.add(key);
  }
  return posts.sort((a,b)=>String(b.date).localeCompare(String(a.date)) || a.title.localeCompare(b.title));
}
function inline(md) {
  let s = esc(md);
  const code = [];
  s = s.replace(/`([^`]+)`/g, (_,x)=>`@@CODE${code.push(`<code>${x}</code>`)-1}@@`);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_,label,url)=>`<a href="${escAttr(url)}">${label}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g,'<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*/g,'$1<em>$2</em>');
  s = s.replace(/@@CODE(\d+)@@/g,(_,i)=>code[Number(i)]);
  return s;
}
function markdown(md) {
  const lines = md.replace(/\r\n/g,'\n').split('\n');
  const out=[]; let para=[]; let list=null; let code=false; let codeLang=''; let codeLines=[];
  const flushPara=()=>{ if(para.length){ out.push(`<p>${inline(para.join(' '))}</p>`); para=[]; } };
  const flushList=()=>{ if(list){ out.push(`<${list.type}>${list.items.map(x=>`<li>${inline(x)}</li>`).join('')}</${list.type}>`); list=null; } };
  const flushCode=()=>{ if(code){ out.push(`<pre><code${codeLang?` class="language-${escAttr(codeLang)}"`:''}>${esc(codeLines.join('\n'))}</code></pre>`); code=false; codeLines=[]; codeLang=''; } };
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (code) { flushCode(); } else { flushPara(); flushList(); code=true; codeLang=line.slice(3).trim(); }
      continue;
    }
    if (code) { codeLines.push(line); continue; }
    if (!line.trim()) { flushPara(); flushList(); continue; }
    const img=line.trim().match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)(?:\s+"([^"]*)")?\)$/);
    if(img){ flushPara(); flushList(); const [,alt,url,caption='']=img; out.push(`<figure class="article-image"><img src="${escAttr(url)}" alt="${escAttr(alt)}" loading="lazy" decoding="async">${caption?`<figcaption>${esc(caption)}</figcaption>`:''}</figure>`); continue; }
    const h=line.match(/^(#{1,3})\s+(.+)$/); if(h){ flushPara(); flushList(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    if (/^---+$/.test(line.trim())) { flushPara(); flushList(); out.push('<hr>'); continue; }
    const bq=line.match(/^>\s?(.*)$/); if(bq){ flushPara(); flushList(); out.push(`<blockquote>${inline(bq[1])}</blockquote>`); continue; }
    const ul=line.match(/^[-*]\s+(.+)$/); if(ul){ flushPara(); if(!list||list.type!=='ul'){flushList(); list={type:'ul',items:[]};} list.items.push(ul[1]); continue; }
    const ol=line.match(/^\d+\.\s+(.+)$/); if(ol){ flushPara(); if(!list||list.type!=='ol'){flushList(); list={type:'ol',items:[]};} list.items.push(ol[1]); continue; }
    para.push(line.trim());
  }
  flushPara(); flushList(); flushCode(); return out.join('\n');
}
function stripMarkdown(md) { return md.replace(/```[\s\S]*?```/g,' ').replace(/[#>*_`\[\]()!-]/g,' ').replace(/\s+/g,' ').trim(); }
function readingMinutes(md){ return Math.max(1,Math.ceil(stripMarkdown(md).split(/\s+/).filter(Boolean).length/210)); }
function humanDate(date,lang){ const d=new Date(`${date}T12:00:00Z`); return new Intl.DateTimeFormat(lang==='fi'?'fi-FI':'en-US',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d); }
function articleUrl(p){ return `${SITE}${copy[p.lang].articleBase}/${p.slug}`; }
function findTranslation(post, all){ return all.find(p=>!p.draft && p.lang!==post.lang && p.translationKey===post.translationKey); }
function pageHead({lang,title,description,url,type='website',alternates=[],jsonLd='',rss='',image=''}) {
  const locale=lang==='fi'?'fi_FI':'en_US';
  const altLocale=lang==='fi'?'en_US':'fi_FI';
  return `<!doctype html>\n<html lang="${lang}">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<meta name="description" content="${escAttr(description)}" />\n<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />\n<link rel="canonical" href="${escAttr(url)}" />\n${alternates.map(a=>`<link rel="alternate" hreflang="${a.lang}" href="${escAttr(a.url)}" />`).join('\n')}\n<meta property="og:site_name" content="ANOMANCER" />\n<meta property="og:type" content="${type}" />\n<meta property="og:title" content="${escAttr(title)}" />\n<meta property="og:description" content="${escAttr(description)}" />\n<meta property="og:url" content="${escAttr(url)}" />\n${image?`<meta property="og:image" content="${escAttr(image)}" />\n`:``}<meta property="og:locale" content="${locale}" />\n<meta property="og:locale:alternate" content="${altLocale}" />\n<meta name="twitter:card" content="${image?'summary_large_image':'summary'}" />\n<meta name="twitter:title" content="${escAttr(title)}" />\n<meta name="twitter:description" content="${escAttr(description)}" />\n${image?`<meta name="twitter:image" content="${escAttr(image)}" />\n`:``}${rss?`<link rel="alternate" type="application/rss+xml" title="ANOMANCER" href="${rss}" />`:''}\n<title>${esc(title)}</title>\n${jsonLd?`<script type="application/ld+json">${jsonLd}</script>`:''}\n<meta name="theme-color" content="#040408" />\n<link rel="icon" href="/favicon.svg" type="image/svg+xml" />\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="/styles.css" />\n</head>`;
}
function header(lang, blog=false){ const c=copy[lang]; return `<header class="site-header"><a class="brand" href="${c.home}">ANOMANCER</a><button class="menu-toggle" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button><div class="header-right" id="header-menu"><nav class="main-nav" aria-label="Navigation"><a href="${c.home}">${c.homeLabel}</a>${!blog?`<a href="${c.blogPath}">${c.title}</a>`:''}<a href="${OBSERVATORY}">${c.observatory}</a></nav><div class="lang-switch" aria-label="Language"><a class="${lang==='fi'?'active':''}" href="${lang==='fi'?c.blogPath:copy.fi.blogPath}">FI</a><span>/</span><a class="${lang==='en'?'active':''}" href="${lang==='en'?c.blogPath:copy.en.blogPath}">EN</a></div></div></header>`; }
function menuScript(){ return `<script>const b=document.querySelector('.menu-toggle'),m=document.querySelector('#header-menu');b?.addEventListener('click',()=>{const o=m.classList.toggle('is-open');b.setAttribute('aria-expanded',String(o));});m?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>m.classList.remove('is-open')));</script>`; }
function blogJsonLd(lang){ const c=copy[lang]; return JSON.stringify({'@context':'https://schema.org','@type':'Blog','@id':`${SITE}${c.blogPath}#blog`,url:`${SITE}${c.blogPath}`,name:`ANOMANCER — ${c.title}`,description:c.description,inLanguage:lang,author:{'@type':'Person','@id':`${SITE}/#person`,name:AUTHOR,url:`${SITE}/`}},null,2); }
function categoryButtons(lang, published){ const c=copy[lang]; return `<button class="category-filter is-active" data-category-filter="all">${c.all}<span>${published.length}</span></button>${categoryOrder.map(id=>`<button class="category-filter" data-category-filter="${id}">${categories[id][lang]}<span>${published.filter(p=>p.category===id).length}</span></button>`).join('')}`; }
function audienceButtons(lang, published){ const c=copy[lang]; return audienceOrder.map(id=>`<button class="audience-filter${id==='all'?' is-active':''}" data-audience-filter="${id}">${id==='all'?c.all:audiences[id][lang]}</button>`).join(''); }
function audienceTags(p,lang){ const ids=(p.audience||['all']); return `<div class="audience-tags">${ids.map(id=>`<span class="audience-tag">${esc(audiences[id]?.[lang]||id)}</span>`).join('')}</div>`; }
function postCard(p,lang,featured=false){ const href=`${copy[lang].articleBase}/${p.slug}`; const cover=p.coverImage?`<a class="dispatch-cover" href="${href}" aria-label="${escAttr(p.title)}"><img src="${escAttr(p.coverImage)}" alt="${escAttr(p.coverAlt||'')}" loading="lazy" decoding="async"></a>`:''; const aud=(p.audience||['all']).join(' '); return `<article class="dispatch-card${featured?' featured':''}${p.coverImage?' has-cover':''}" data-category="${p.category}" data-audience="${escAttr(aud)}">${cover}<div class="dispatch-card-top"><span class="category-tag">${categories[p.category][lang]}</span><time datetime="${p.date}">${humanDate(p.date,lang)}</time></div><h${featured?'2':'3'}><a href="${href}">${esc(p.title)}</a></h${featured?'2':'3'}><p>${esc(p.description)}</p>${audienceTags(p,lang)}<div class="dispatch-card-foot"><span>${readingMinutes(p.body)} ${copy[lang].minRead}</span><a href="${href}">${copy[lang].read}</a></div></article>`; }
function renderIndex(lang, posts){ const c=copy[lang]; const pub=posts.filter(p=>p.lang===lang&&!p.draft); const alternates=[{lang:'fi',url:`${SITE}${copy.fi.blogPath}`},{lang:'en',url:`${SITE}${copy.en.blogPath}`},{lang:'x-default',url:`${SITE}${copy.fi.blogPath}`}]; return `${pageHead({lang,title:`${c.title[0]}${c.title.slice(1).toLowerCase()} | ANOMANCER`,description:c.description,url:`${SITE}${c.blogPath}`,alternates,jsonLd:blogJsonLd(lang),rss:lang==='fi'?`${SITE}/rss.xml`:`${SITE}/rss-en.xml`})}<body>${header(lang,true)}<main class="section transmission-shell blog-shell"><div class="transmission-intro"><p class="eyebrow">${c.eyebrow}</p><h1>${c.title}</h1><p class="intro">${c.intro}</p></div><div class="audience-bar" aria-label="${escAttr(c.audience)}"><span>${c.audience}</span><div class="audience-filters">${audienceButtons(lang,pub)}</div></div><div class="blog-layout"><aside class="category-sidebar" aria-label="${escAttr(c.category)}"><div class="category-sticky"><p class="category-title">${c.category}</p>${categoryButtons(lang,pub)}</div></aside><section class="blog-stream"><div id="dispatch-empty" class="dispatch-empty" hidden>${c.empty}</div><div class="section-minihead archive-head"><span>${c.archive}</span><span id="dispatch-count">${pub.length}</span></div><div class="dispatch-grid">${pub.map(p=>postCard(p,lang)).join('')}</div></section></div></main><footer class="footer"><span>${c.footer}</span><a href="${c.home}">${c.back}</a></footer><script>const catFilters=[...document.querySelectorAll('[data-category-filter]')],audFilters=[...document.querySelectorAll('[data-audience-filter]')],cards=[...document.querySelectorAll('.dispatch-card')],empty=document.querySelector('#dispatch-empty'),count=document.querySelector('#dispatch-count');let cat='all',aud='all';function applyFilters(){let n=0;cards.forEach(card=>{const a=(card.dataset.audience||'all').split(/\s+/);const showCat=cat==='all'||card.dataset.category===cat;const showAud=aud==='all'||a.includes('all')||a.includes(aud);const show=showCat&&showAud;card.hidden=!show;if(show)n++;});if(count)count.textContent=n;if(empty)empty.hidden=n!==0;}catFilters.forEach(btn=>btn.addEventListener('click',()=>{catFilters.forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');cat=btn.dataset.categoryFilter;applyFilters();}));audFilters.forEach(btn=>btn.addEventListener('click',()=>{audFilters.forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');aud=btn.dataset.audienceFilter;applyFilters();}));</script>${menuScript()}</body></html>`; }
function articleJsonLd(p){ const data={'@context':'https://schema.org','@type':'BlogPosting',headline:p.title,description:p.description,datePublished:p.date,dateModified:p.updated||p.date,inLanguage:p.lang,mainEntityOfPage:articleUrl(p),url:articleUrl(p),author:{'@type':'Person','@id':`${SITE}/#person`,name:AUTHOR,url:`${SITE}/`},publisher:{'@id':`${SITE}/#person`},articleSection:categories[p.category][p.lang],audience:(p.audience||['all']).map(id=>({'@type':'Audience',audienceType:audiences[id]?.[p.lang]||id}))}; if(p.coverImage)data.image=`${SITE}${p.coverImage}`; return JSON.stringify(data,null,2); }
function renderArticle(p,all){ const lang=p.lang,c=copy[lang], trans=findTranslation(p,all); const alts=[{lang,url:articleUrl(p)},{lang:'x-default',url:articleUrl(p)}]; if(trans) alts.splice(1,0,{lang:trans.lang,url:articleUrl(trans)}); const related=all.filter(x=>!x.draft&&x.lang===lang&&x.slug!==p.slug).sort((a,b)=>{const cat=(b.category===p.category)-(a.category===p.category);if(cat)return cat;const pa=(p.audience||['all']),aa=(a.audience||['all']),bb=(b.audience||['all']);return bb.filter(x=>pa.includes(x)||x==='all').length-aa.filter(x=>pa.includes(x)||x==='all').length;}).slice(0,3); const cover=p.coverImage?`<figure class="article-cover"><img src="${escAttr(p.coverImage)}" alt="${escAttr(p.coverAlt||'')}" decoding="async" fetchpriority="high"></figure>`:''; const image=p.coverImage?`${SITE}${p.coverImage}`:''; return `${pageHead({lang,title:`${p.title} | ANOMANCER`,description:p.description,url:articleUrl(p),type:'article',alternates:alts,jsonLd:articleJsonLd(p),rss:lang==='fi'?`${SITE}/rss.xml`:`${SITE}/rss-en.xml`,image})}<body>${header(lang,true)}<main class="article-shell"><article class="article"><a class="article-back" href="${c.blogPath}">${c.back}</a><div class="article-meta"><span class="category-tag">${categories[p.category][lang]}</span><time datetime="${p.date}">${humanDate(p.date,lang)}</time><span>${readingMinutes(p.body)} ${c.minRead}</span></div>${audienceTags(p,lang)}<h1>${esc(p.title)}</h1><p class="article-deck">${esc(p.description)}</p>${cover}<div class="article-body">${markdown(p.body)}</div><div class="article-end"><a href="${OBSERVATORY}">${c.deeper}</a></div></article>${related.length?`<aside class="related"><p class="eyebrow">${c.related}</p><div class="related-grid">${related.map(x=>postCard(x,lang)).join('')}</div></aside>`:''}</main><footer class="footer"><span>${c.footer}</span><a href="${c.blogPath}">${c.back}</a></footer>${menuScript()}</body></html>`; }
function rss(posts,lang){ const c=copy[lang]; const pub=posts.filter(p=>p.lang===lang&&!p.draft).slice(0,30); const items=pub.map(p=>`<item><title>${esc(p.title)}</title><link>${articleUrl(p)}</link><guid isPermaLink="true">${articleUrl(p)}</guid><pubDate>${new Date(`${p.date}T12:00:00Z`).toUTCString()}</pubDate><description>${esc(p.description)}</description><category>${esc(categories[p.category][lang])}</category></item>`).join('\n'); return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>ANOMANCER — ${c.title}</title><link>${SITE}${c.blogPath}</link><description>${esc(c.description)}</description><language>${lang}</language>${items}</channel></rss>\n`; }
function sitemap(posts){ const urls=[['/',null],['/en',null],[copy.fi.blogPath,null],[copy.en.blogPath,null],...posts.filter(p=>!p.draft).map(p=>[`${copy[p.lang].articleBase}/${p.slug}`,p.date])]; return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u,d])=>`  <url><loc>${SITE}${u}</loc>${d?`<lastmod>${d}</lastmod>`:''}</url>`).join('\n')}\n</urlset>\n`; }
function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }
function write(rel,data){ const target=path.join(ROOT,rel); ensureDir(path.dirname(target)); fs.writeFileSync(target,data); }

const posts=readPosts();
write('lahetykset.html',renderIndex('fi',posts));
write('dispatches.html',renderIndex('en',posts));
for (const dir of ['lahetykset','dispatches']) { ensureDir(path.join(ROOT,dir)); for(const f of fs.readdirSync(path.join(ROOT,dir))) if(f.endsWith('.html')) fs.unlinkSync(path.join(ROOT,dir,f)); }
for (const p of posts.filter(p=>!p.draft)) write(`${copy[p.lang].articleBase.slice(1)}/${p.slug}.html`,renderArticle(p,posts));
write('rss.xml',rss(posts,'fi'));
write('rss-en.xml',rss(posts,'en'));
write('sitemap.xml',sitemap(posts));
write('robots.txt',`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin/\n\nSitemap: ${SITE}/sitemap.xml\n`);
const published=posts.filter(p=>!p.draft);
const draftCount=posts.filter(p=>p.draft).length;
// Julkinen manifesti sisältää vain julkaistut tekstit. Luonnosten metadata ei kuulu public-outputtiin.
const manifest={generatedAt:new Date().toISOString(),published:published.map(p=>({lang:p.lang,slug:p.slug,title:p.title,category:p.category,audience:p.audience||['all'],date:p.date,url:articleUrl(p),coverImage:p.coverImage||''}))};
write('content-manifest.json',JSON.stringify(manifest,null,2)+'\n');
const digest=crypto.createHash('sha256').update(JSON.stringify(manifest.published)).digest('hex');
console.log(`✓ Lähetyskone build: ${manifest.published.length} julkaistua · ${draftCount} luonnosta · manifest sha256 ${digest.slice(0,16)}…`);

// Vercel-projektin Output Directory on public. Staattinen sivusto stageataan sinne,
// API-funktiot jäävät projektin /api-hakemistoon Vercelin serverless-funktioiksi.
const PUBLIC = path.join(ROOT, 'public');
fs.rmSync(PUBLIC, { recursive:true, force:true });
ensureDir(PUBLIC);
const publicFiles = [
  'index.html','en.html','lahetykset.html','dispatches.html','admin.html',
  'styles.css','admin.css','admin.js','favicon.svg',
  'robots.txt','sitemap.xml','rss.xml','rss-en.xml','content-manifest.json'
];
for (const rel of publicFiles) {
  const src=path.join(ROOT,rel);
  if (fs.existsSync(src)) fs.copyFileSync(src,path.join(PUBLIC,rel));
}
for (const dir of ['lahetykset','dispatches']) {
  const src=path.join(ROOT,dir);
  if (fs.existsSync(src)) fs.cpSync(src,path.join(PUBLIC,dir),{recursive:true});
}
const MEDIA=path.join(ROOT,'media');
if (fs.existsSync(MEDIA)) fs.cpSync(MEDIA,path.join(PUBLIC,'media'),{recursive:true});
console.log(`✓ Vercel public-output: ${PUBLIC}`);

if (process.argv.includes('--check')) {
  for (const p of posts.filter(p=>!p.draft)) {
    const out=path.join(ROOT,copy[p.lang].articleBase.slice(1),`${p.slug}.html`);
    if(!fs.existsSync(out)) throw new Error(`Build puuttuu: ${out}`);
    const refs=[p.coverImage,...[...p.body.matchAll(/!\[[^\]]*\]\((\/media\/[^\s)]+)(?:\s+"[^"]*")?\)/g)].map(m=>m[1])].filter(Boolean);
    for(const ref of refs){const src=path.join(ROOT,ref.replace(/^\//,''));if(!fs.existsSync(src))throw new Error(`Media puuttuu: ${ref} (${p.title})`);}
  }
  console.log('✓ Content + media check OK');
}
