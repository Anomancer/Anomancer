import fs from 'node:fs';
import { normalizeCitationMode, normalizeCitationPlacements, normalizeVisualizations } from '../server/content.js';
import path from 'node:path';
import crypto from 'node:crypto';
import { normalizeSources as normalizeContentSources, normalizeClaims as normalizeContentClaims, normalizeAliases, normalizeAudienceDepth, isSourceVerified, sourceVerificationIssues } from '../server/content.js';
import { createPublicCoreView } from '../server/public-core.js';
import { createReleaseProvenance } from '../server/release-provenance.js';
import { renderPublicCore } from '../public-core-render.js';
import { renderPublicCoreV3 } from '../public-core-v3-render.js';

const ROOT = path.resolve(process.cwd());
const SOURCE_PAGES = path.join(ROOT,'site','pages');
const PUBLIC = path.join(ROOT,'public');
const SITE = String(process.env.PUBLIC_SITE_URL || 'https://anomancer.com').replace(/\/$/,'');
const ENTITY = JSON.parse(fs.readFileSync(path.join(ROOT,'entity-core.json'),'utf8'));
const DISCOVERY = JSON.parse(fs.readFileSync(path.join(ROOT,'discovery-policy.json'),'utf8'));
const AUTHOR = ENTITY.person.name;
const SITE_NAME = ENTITY.siteName || 'Anomancer';
const AUTHOR_PATH = ENTITY.person.authorPath || '/#about';
const AUTHOR_URL = `${SITE}${AUTHOR_PATH}`;
const PERSON_ID = `${SITE}/#person`;
const WEBSITE_ID = `${SITE}/#website`;

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
    blogPath: '/lahetykset', articleBase: '/lahetykset', home: '/', corePath: '/core', otherBlog: '/dispatches', otherLang: 'EN', selfLang: 'FI',
    title: 'LÄHETYKSET', eyebrow: 'Transmission log',
    intro: 'Vaikeat asiat käännettynä ihmisille. Tekoälyä, työtä, rahaa, mediaa, kieltä, turvallisuutta ja yhteiskunnan järjestelmiä ilman tarpeetonta sisäpiirikieltä.',
    all: 'Kaikki', archive: 'Kaikki lähetykset', read: 'Lue lähetys →', empty: 'Näillä valinnoilla ei löytynyt vielä julkaistuja lähetyksiä.',
    homeLabel: 'Etusivu', core: 'Core', footer: 'Anomancer · Lähetykset', homeBack: '← Etusivulle', back: '← Kaikki lähetykset', deeper: 'Avaa Anomancer Core →',
    published: 'Julkaistu', pinned: 'Pinnattu', minRead: 'min lukuaika', category: 'Aihe', audience: 'Kenelle tästä on hyötyä?', audienceShort:'Yleisö', filterOpen:'Suodata', filterTitle:'Suodata lähetyksiä', clearFilters:'Tyhjennä', showResults:'Näytä tulokset', related: 'Muita lähetyksiä', byline: 'Kirjoittanut', answer: 'Ydinvastaus', evidence: 'Väitteet ja evidenssi', evidenceToggle:'Näytä väitteet ja lähteet', claimCount:'väitettä', sources: 'Lähteet', sourceCount:'lähdettä', supported: 'Tuettu väite', interpretation: 'Tulkinta', open: 'Avoin väite', candidate:'Lähde-ehdokas', verified:'Varmennettu lähde', rejected:'Hylätty lähde',
    translationState:'Englanninkielisiä käännöksiä lisätään vaiheittain.', unavailableTranslation:'Tälle lähetykselle ei ole vielä englanninkielistä versiota. Linkki vie englanninkieliseen hakemistoon.',
    description: 'Ymmärrettävä tietokirjasto tekoälystä, työstä, mediasta, rahasta, kielestä, turvallisuudesta ja yhteiskunnan järjestelmistä.',
  },
  en: {
    blogPath: '/dispatches', articleBase: '/dispatches', home: '/en', corePath: '/en/core', otherBlog: '/lahetykset', otherLang: 'FI', selfLang: 'EN',
    title: 'DISPATCHES', eyebrow: 'Transmission log',
    intro: 'Difficult ideas translated for people. AI, work, money, media, language, safety and social systems without needless insider language.',
    all: 'All', archive: 'All dispatches', read: 'Read dispatch →', empty: 'No published dispatches match these filters yet.',
    homeLabel: 'Home', core: 'Core', footer: 'Anomancer · Dispatches', homeBack: '← Home', back: '← All dispatches', deeper: 'Open Anomancer Core →',
    published: 'Published', pinned: 'Pinned', minRead: 'min read', category: 'Topic', audience: 'Who is this useful for?', audienceShort:'Audience', filterOpen:'Filter', filterTitle:'Filter dispatches', clearFilters:'Clear', showResults:'Show results', related: 'More dispatches', byline: 'Written by', answer: 'Direct answer', evidence: 'Claims & evidence', evidenceToggle:'Show claims and sources', claimCount:'claims', sources: 'Sources', sourceCount:'sources', supported: 'Supported claim', interpretation: 'Interpretation', open: 'Open claim', candidate:'Source candidate', verified:'Verified source', rejected:'Rejected source',
    translationState:'English translations are being expanded in stages. The Finnish archive remains the complete collection.', unavailableTranslation:'This dispatch is not available in English yet. The link opens the English index.',
    description: 'A practical knowledge library about AI, work, media, money, language, safety and social systems, explained without needless jargon.',
  }
};

function esc(s='') {
  return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
function escAttr(s='') { return esc(s).replace(/'/g, '&#39;'); }
function slugify(s='') {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);
}
function projectPath(rel=''){
  const raw=String(rel);if(!raw||raw.includes('\0')||raw.includes('\\')||path.isAbsolute(raw))throw new Error(`Turvaton build-polku: ${raw||'(tyhjä)'}`);
  const target=path.resolve(ROOT,raw),prefix=`${ROOT}${path.sep}`;if(target===ROOT||!target.startsWith(prefix))throw new Error(`Build-polku poistuu projektista: ${raw}`);return target;
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
  data.slug = String(data.slug || slugify(data.title)).trim();
  data.category = normalizeCategory(data.category);
  data.audience = normalizeAudience(data.audience);
  data.audienceDepth = normalizeAudienceDepth(data.audienceDepth);
  data.answer = String(data.answer||'').trim();
  data.sources = normalizeContentSources(data.sources);
  data.claims = normalizeContentClaims(data.claims,data.sources);
  data.citationMode = normalizeCitationMode(data.citationMode);
  data.citationPlacements = normalizeCitationPlacements(data.citationPlacements,{sources:data.sources,claims:data.claims,body});
  data.visualizations = normalizeVisualizations(data.visualizations,{sources:data.sources,claims:data.claims,body});
  data.aliases = normalizeAliases(data.aliases,data.slug);
  data.pinned = Boolean(data.pinned);
  data.draft = Boolean(data.draft);
  data.translationKey = data.translationKey || data.slug;
  for (const req of ['title','date','slug','lang']) if (!data[req]) throw new Error(`${file}: ${req} puuttuu`);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)||data.slug.length>90)throw new Error(`${file}: slug on virheellinen`);
  if(!data.draft&&!data.description) throw new Error(`${file}: description puuttuu julkaistusta tekstistä`);
  for(const source of data.sources){const issues=sourceVerificationIssues(source);if(issues.length)throw new Error(`${file}: lähteen varmennusjälki on puutteellinen (${source.title}): ${issues.join(', ')}`);}
  if(!data.draft&&data.sources.some(source=>source.verification==='rejected')) throw new Error(`${file}: julkaistussa tekstissä on hylätty lähde`);
  if(!data.draft){const verified=new Set(data.sources.filter(isSourceVerified).map(source=>source.url));for(const claim of data.claims){if(claim.status==='supported'&&!claim.evidence.some(url=>verified.has(url)))throw new Error(`${file}: tuettu väite ei nojaa jäljitettävästi varmennettuun lähteeseen`);}}
  if (!['fi','en'].includes(data.lang)) throw new Error(`${file}: lang pitää olla fi/en`);
  return { ...data, body, file, filename:path.basename(file) };
}
function readPosts() {
  const posts = [];
  for (const lang of ['fi','en']) {
    const dir = path.join(ROOT,'content',lang);
    if(!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).filter(n=>n.endsWith('.md')).sort()) posts.push(parsePost(path.join(dir,name),lang));
  }
  const seen = new Set();
  for (const p of posts) {
    const key = `${p.lang}:${p.slug}`;
    if (seen.has(key)) throw new Error(`Duplikaattislug: ${key}`);
    seen.add(key);
    for(const alias of p.aliases||[]){const aliasKey=`${p.lang}:${alias}`;if(seen.has(aliasKey))throw new Error(`Alias törmää olemassa olevaan slugin: ${aliasKey}`);seen.add(aliasKey);}
  }
  return posts.sort((a,b)=>String(b.date).localeCompare(String(a.date)) || a.title.localeCompare(b.title));
}
function inline(md) {
  let s = esc(md);
  const code = [];
  s = s.replace(/`([^`]+)`/g, (_,x)=>`@@CODE${code.push(`<code>${x}</code>`)-1}@@`);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_,label,url)=>`<a href="${escAttr(decodeHtmlAttr(url))}">${label}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g,'<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*/g,'$1<em>$2</em>');
  s = s.replace(/@@CODE(\d+)@@/g,(_,i)=>code[Number(i)]);
  return s;
}
function stripDuplicateTitleHeading(md,title='') {
  const lines=String(md||'').replace(/\r\n/g,'\n').split('\n');
  const first=lines.findIndex(line=>line.trim());
  if(first<0) return md;
  const m=lines[first].match(/^#\s+(.+)$/);
  if(!m) return md;
  const norm=s=>String(s||'').trim().replace(/\s+/g,' ').toLocaleLowerCase();
  if(norm(m[1])!==norm(title)) return md;
  lines.splice(first,1);
  while(lines[first]!==undefined && !lines[first].trim()) lines.splice(first,1);
  return lines.join('\n');
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
function personNode(){
  const node={
    '@type':'Person','@id':PERSON_ID,name:AUTHOR,url:AUTHOR_URL,
    sameAs:Array.isArray(ENTITY.person.sameAs)?ENTITY.person.sameAs:[],
    knowsAbout:Array.isArray(ENTITY.person.knowsAbout)?ENTITY.person.knowsAbout:[]
  };
  if(ENTITY.person.imagePath && fs.existsSync(path.join(ROOT,String(ENTITY.person.imagePath).replace(/^\//,'')))) node.image={'@type':'ImageObject',url:`${SITE}${ENTITY.person.imagePath}`};
  if(ENTITY.person.homeLocation) node.homeLocation={'@type':'Place',name:ENTITY.person.homeLocation};
  return node;
}
function websiteNode(){ return {'@type':'WebSite','@id':WEBSITE_ID,url:`${SITE}/`,name:SITE_NAME,inLanguage:['fi','en'],publisher:{'@id':PERSON_ID},creator:{'@id':PERSON_ID}}; }
function webpageNode({url,name,description,lang}){ return {'@type':'WebPage','@id':`${url}#webpage`,url,name,description,inLanguage:lang,isPartOf:{'@id':WEBSITE_ID},about:{'@id':PERSON_ID}}; }
function graphJson(nodes){ return JSON.stringify({'@context':'https://schema.org','@graph':nodes},null,2).replace(/[<>&\u2028\u2029]/g,char=>`\\u${char.charCodeAt(0).toString(16).padStart(4,'0')}`); }
function pageHead({lang,title,description,url,type='website',alternates=[],jsonLd='',rss='',image='',published='',modified=''}) {
  const locale=lang==='fi'?'fi_FI':'en_US';
  const altLocale=lang==='fi'?'en_US':'fi_FI';
  const articleMeta=type==='article'?`${published?`<meta property="article:published_time" content="${escAttr(published)}" />\n`:''}${modified?`<meta property="article:modified_time" content="${escAttr(modified)}" />\n`:''}<meta property="article:author" content="${escAttr(AUTHOR_URL)}" />\n`:'';
  return `<!doctype html>\n<html lang="${lang}">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<meta name="description" content="${escAttr(description)}" />\n<meta name="author" content="${escAttr(AUTHOR)}" />\n<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />\n<link rel="canonical" href="${escAttr(url)}" />\n<link rel="author" href="${escAttr(AUTHOR_URL)}" />\n${alternates.map(a=>`<link rel="alternate" hreflang="${a.lang}" href="${escAttr(a.url)}" />`).join('\n')}\n<meta property="og:site_name" content="${escAttr(SITE_NAME)}" />\n<meta property="og:type" content="${type}" />\n<meta property="og:title" content="${escAttr(title)}" />\n<meta property="og:description" content="${escAttr(description)}" />\n<meta property="og:url" content="${escAttr(url)}" />\n${image?`<meta property="og:image" content="${escAttr(image)}" />\n`:``}${articleMeta}<meta property="og:locale" content="${locale}" />\n<meta property="og:locale:alternate" content="${altLocale}" />\n<meta name="twitter:card" content="${image?'summary_large_image':'summary'}" />\n<meta name="twitter:title" content="${escAttr(title)}" />\n<meta name="twitter:description" content="${escAttr(description)}" />\n${image?`<meta name="twitter:image" content="${escAttr(image)}" />\n`:``}${rss?`<link rel="alternate" type="application/rss+xml" title="${escAttr(SITE_NAME)}" href="${rss}" />`:''}\n<title>${esc(title)}</title>\n${jsonLd?`<script type="application/ld+json">${jsonLd}</script>`:''}\n<meta name="theme-color" content="#040408" />\n<link rel="icon" href="/media/brand/anomancer-mark.png" type="image/png" />\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="/styles.css" />\n</head>`;
}
function header(lang, blog=false, langTargets={}, unavailableLang=''){ const c=copy[lang]; const fiHref=langTargets.fi||copy.fi.blogPath, enHref=langTargets.en||copy.en.blogPath; const labels=lang==='fi'?{menu:'Avaa valikko',nav:'Päänavigaatio',language:'Kieli'}:{menu:'Open menu',nav:'Main navigation',language:'Language'};const unavailableAttrs=code=>unavailableLang===code?` data-translation-unavailable="true" title="${escAttr(c.unavailableTranslation)}" aria-label="${escAttr(c.unavailableTranslation)}"`:''; return `<header class="site-header"><a class="brand brand-image-link" href="${c.home}" aria-label="Anomancer"><img class="brand-wordmark brand-wordmark-anomancer" src="/media/brand/anomancer-wordmark.png" width="1200" height="142" alt="" decoding="async" /></a><button class="menu-toggle" type="button" aria-label="${labels.menu}" aria-controls="header-menu" aria-expanded="false"><span></span><span></span><span></span></button><div class="header-right" id="header-menu"><nav class="main-nav" aria-label="${labels.nav}"><a href="${c.home}">${c.homeLabel}</a>${!blog?`<a href="${c.blogPath}">${c.title}</a>`:''}<a href="${c.corePath}">${c.core}</a></nav><div class="lang-switch" aria-label="${labels.language}"><a class="${lang==='fi'?'active':''}" href="${fiHref}"${unavailableAttrs('fi')}>FI</a><span>/</span><a class="${lang==='en'?'active':''}" href="${enHref}"${unavailableAttrs('en')}>EN</a></div></div></header>`; }
function menuScript(){ return `<script type="module" src="/site.js"></script>`; }
function blogJsonLd(lang){ const c=copy[lang],url=`${SITE}${c.blogPath}`; const blog={'@type':'Blog','@id':`${url}#blog`,url,name:`${SITE_NAME} — ${c.title}`,description:c.description,inLanguage:lang,isPartOf:{'@id':WEBSITE_ID},author:{'@id':PERSON_ID},publisher:{'@id':PERSON_ID}}; const page=webpageNode({url,name:`${c.title[0]}${c.title.slice(1).toLowerCase()} | ${SITE_NAME}`,description:c.description,lang}); page['@type']='CollectionPage'; page.mainEntity={'@id':blog['@id']}; return graphJson([websiteNode(),personNode(),page,blog]); }
function categoryButtons(lang, published){ const c=copy[lang]; const active=categoryOrder.map(id=>[id,published.filter(p=>p.category===id).length]).filter(([,count])=>count>0); return `<button type="button" class="category-filter is-active" data-category-filter="all" data-filter-label="${escAttr(c.all)}" aria-pressed="true">${c.all}<span>${published.length}</span></button>${active.map(([id,count])=>`<button type="button" class="category-filter" data-category-filter="${id}" data-filter-label="${escAttr(categories[id][lang])}" aria-pressed="false">${categories[id][lang]}<span>${count}</span></button>`).join('')}`; }
function audienceButtons(lang, published){ const c=copy[lang]; const visible=audienceOrder.filter(id=>id!=='all'&&published.some(p=>(p.audience||['all']).includes(id))); const count=id=>published.filter(p=>(p.audience||['all']).includes(id)).length; return [`<button type="button" class="audience-filter is-active" data-audience-filter="all" data-filter-label="${escAttr(c.all)}" aria-pressed="true">${c.all}<span>${published.length}</span></button>`,...visible.map(id=>`<button type="button" class="audience-filter" data-audience-filter="${id}" data-filter-label="${escAttr(audiences[id][lang])}" aria-pressed="false">${audiences[id][lang]}<span>${count(id)}</span></button>`)].join(''); }
function audienceTags(p,lang){ const ids=(p.audience||['all']); return `<div class="audience-tags">${ids.map(id=>`<span class="audience-tag">${esc(audiences[id]?.[lang]||id)}</span>`).join('')}</div>`; }
function postCard(p,lang,{featured=false,headingLevel=2}={}){ const href=`${copy[lang].articleBase}/${p.slug}`; const cover=p.coverImage?`<a class="dispatch-cover" href="${href}" aria-label="${escAttr(p.title)}"><img src="${escAttr(p.coverImage)}" alt="${escAttr(p.coverAlt||'')}" loading="lazy" decoding="async"></a>`:''; const aud=(p.audience||['all']).join(' '); const pinned=p.pinned?`<span class="pinned-tag">${copy[lang].pinned}</span>`:''; return `<article class="dispatch-card${featured?' featured':''}${p.coverImage?' has-cover':''}${p.pinned?' is-pinned':''}" data-category="${p.category}" data-audience="${escAttr(aud)}">${cover}<div class="dispatch-card-top"><div class="dispatch-card-labels"><span class="category-tag">${categories[p.category][lang]}</span>${pinned}</div><time datetime="${p.date}">${humanDate(p.date,lang)}</time></div><h${headingLevel}><a href="${href}">${esc(p.title)}</a></h${headingLevel}><p>${esc(p.description)}</p>${audienceTags(p,lang)}<div class="dispatch-card-foot"><span>${readingMinutes(p.body)} ${copy[lang].minRead}</span><a href="${href}">${copy[lang].read}</a></div></article>`; }
function renderIndex(lang, posts){
  const c=copy[lang];
  const pub=posts.filter(p=>p.lang===lang&&!p.draft).sort((a,b)=>Number(Boolean(b.pinned))-Number(Boolean(a.pinned))||String(b.date).localeCompare(String(a.date))||a.title.localeCompare(b.title));
  const sparseTranslation=lang==='en'&&pub.length<3;
  const alternates=[{lang:'fi',url:`${SITE}${copy.fi.blogPath}`},{lang:'en',url:`${SITE}${copy.en.blogPath}`},{lang:'x-default',url:`${SITE}${copy.fi.blogPath}`}];
  const audienceControls=audienceButtons(lang,pub);
  const audienceBar=!sparseTranslation&&audienceControls?`<div class="audience-bar desktop-filter-surface" aria-label="${escAttr(c.audience)}"><span>${c.audience}</span><div class="audience-filters">${audienceControls}</div></div>`:'';
  const mobileFilters=`<div class="mobile-filter-bar"><button class="dispatch-filter-open" type="button" data-filter-open aria-haspopup="dialog" aria-controls="dispatch-filter-dialog"><strong>${c.filterOpen}</strong><span id="dispatch-filter-summary" data-topic-label="${escAttr(c.category)}" data-audience-label="${escAttr(c.audienceShort)}">${c.category}: ${c.all} · ${c.audienceShort}: ${c.all}</span></button></div><dialog class="dispatch-filter-dialog" id="dispatch-filter-dialog" aria-labelledby="dispatch-filter-title"><div class="dispatch-filter-sheet"><div class="dispatch-filter-sheet-head"><h2 id="dispatch-filter-title">${c.filterTitle}</h2><button type="button" class="dispatch-filter-close-icon" data-filter-close aria-label="${escAttr(c.showResults)}">×</button></div><section class="dispatch-filter-group" aria-labelledby="dispatch-filter-topic"><h3 id="dispatch-filter-topic">${c.category}</h3><div class="dispatch-filter-options">${categoryButtons(lang,pub)}</div></section><section class="dispatch-filter-group" aria-labelledby="dispatch-filter-audience"><h3 id="dispatch-filter-audience">${c.audience}</h3><div class="dispatch-filter-options">${audienceButtons(lang,pub)}</div></section><div class="dispatch-filter-actions"><button type="button" data-filter-clear>${c.clearFilters}</button><button type="button" class="primary" data-filter-close>${c.showResults}</button></div></div></dialog>`;
  const skip=lang==='fi'?'Siirry sisältöön':'Skip to content';
  const translationNote=sparseTranslation?`<aside class="translation-state" role="note">${esc(c.translationState)}</aside>`:'';
  const sidebar=sparseTranslation?'':`<aside class="category-sidebar desktop-filter-surface" aria-label="${escAttr(c.category)}"><div class="category-sticky"><p class="category-title">${c.category}</p>${categoryButtons(lang,pub)}</div></aside>`;
  return `${pageHead({lang,title:`${c.title[0]}${c.title.slice(1).toLowerCase()} | ${SITE_NAME}`,description:c.description,url:`${SITE}${c.blogPath}`,alternates,jsonLd:blogJsonLd(lang),rss:lang==='fi'?`${SITE}/rss.xml`:`${SITE}/rss-en.xml`})}<body><a class="skip-link" href="#main-content">${skip}</a>${header(lang,true)}<main id="main-content" class="section transmission-shell blog-shell"><div class="transmission-intro"><p class="eyebrow">${c.eyebrow}</p><h1>${c.title}</h1><p class="intro">${c.intro}</p></div>${translationNote}${audienceBar}${sparseTranslation?'':mobileFilters}<div class="blog-layout${sparseTranslation?' dispatch-sparse':''}">${sidebar}<section class="blog-stream"><div id="dispatch-empty" class="dispatch-empty" hidden>${c.empty}</div><div class="section-minihead archive-head"><span>${c.archive}</span><span id="dispatch-count">${pub.length}</span></div><div class="dispatch-grid">${pub.map(p=>postCard(p,lang)).join('')}</div></section></div></main><footer class="footer"><span class="footer-brand"><img src="/media/brand/anomancer-wordmark.png" width="1200" height="142" alt="" aria-hidden="true" loading="lazy" decoding="async"><small>${c.footer}</small></span><a href="${c.home}">${c.homeBack}</a></footer>${menuScript()}</body></html>`;
}

function articleJsonLd(p){ const url=articleUrl(p),webpage=webpageNode({url,name:p.title,description:p.description,lang:p.lang}); const data={'@type':'BlogPosting','@id':`${url}#article`,headline:p.title,description:p.description,datePublished:p.date,dateModified:p.updated||p.date,inLanguage:p.lang,mainEntityOfPage:{'@id':webpage['@id']},url,isPartOf:{'@id':`${SITE}${copy[p.lang].blogPath}#blog`},author:{'@id':PERSON_ID},publisher:{'@id':PERSON_ID},copyrightHolder:{'@id':PERSON_ID},articleSection:categories[p.category][p.lang],isAccessibleForFree:true,audience:(p.audience||['all']).map(id=>({'@type':'Audience',audienceType:audiences[id]?.[p.lang]||id}))}; if(p.answer)data.abstract=p.answer; if(p.sources?.length)data.citation=p.sources.map(src=>src.url); if(p.coverImage){data.image=`${SITE}${p.coverImage}`; webpage.primaryImageOfPage={'@type':'ImageObject',url:data.image};} return graphJson([websiteNode(),personNode(),webpage,data]); }
function applyCitationPlacements(body='',p={}){
  if(!['inline','both'].includes(p.citationMode))return body;
  let out=String(body||'');
  for(const placement of p.citationPlacements||[]){const quote=String(placement.quote||''),anchor=String(placement.anchorText||''),url=String(placement.evidenceUrl||'');if(!quote||!anchor||!url||!quote.includes(anchor))continue;const at=out.indexOf(quote);if(at<0||out.indexOf(quote,at+quote.length)>=0)continue;const linked=quote.replace(anchor,`[${anchor}](${url})`);out=out.slice(0,at)+linked+out.slice(at+quote.length);}
  return out;
}
function chartSvg(chart={}){
  const series=Array.isArray(chart.series)?chart.series:[];if(series.length<2)return '';const w=760,h=320,pad={l:58,r:22,t:36,b:68};const vals=series.map(x=>Number(x.value)).filter(Number.isFinite);if(vals.length<2)return '';let min=Math.min(0,...vals),max=Math.max(0,...vals);if(min===max){min-=1;max+=1;}const y=v=>pad.t+(max-v)/(max-min)*(h-pad.t-pad.b),base=y(0),inner=w-pad.l-pad.r;let marks='';if(chart.type==='line'){const pts=series.map((p,i)=>`${pad.l+(i/(series.length-1))*inner},${y(Number(p.value))}`).join(' ');marks=`<polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="3"/>`+series.map((p,i)=>`<circle cx="${pad.l+(i/(series.length-1))*inner}" cy="${y(Number(p.value))}" r="5" fill="currentColor"/>`).join('');}else{const gap=inner/series.length,bw=Math.max(10,gap*.58);marks=series.map((p,i)=>{const yy=y(Number(p.value)),x=pad.l+i*gap+(gap-bw)/2,top=Math.min(yy,base),hh=Math.max(1,Math.abs(base-yy));return `<rect x="${x}" y="${top}" width="${bw}" height="${hh}" rx="4" fill="currentColor" opacity=".76"/>`;}).join('');}const labels=series.map((p,i)=>{const x=chart.type==='line'?pad.l+(i/Math.max(1,series.length-1))*inner:pad.l+(i+.5)*inner/series.length;return `<text x="${x}" y="${h-28}" text-anchor="middle">${esc(String(p.label).slice(0,22))}</text>`;}).join('');return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${escAttr(chart.title||'Kaavio')}"><line x1="${pad.l}" y1="${base}" x2="${w-pad.r}" y2="${base}" stroke="currentColor" opacity=".24"/>${marks}${labels}</svg>`;
}
function visualizationBlocks(p){if(!p.visualizations?.length)return '';const heading=p.lang==='en'?'Data visualizations':'Datasta piirretty';const sourceLabel=p.lang==='en'?'Evidence':'Evidenssi';return `<section class="article-visualizations" aria-label="${escAttr(heading)}"><h2>${esc(heading)}</h2>${p.visualizations.map(chart=>`<figure class="article-chart" id="${escAttr(chart.id)}"><div class="article-chart-head"><h3>${esc(chart.title)}</h3>${chart.unit?`<span>${esc(chart.unit)}</span>`:''}</div>${chartSvg(chart)}${chart.caption?`<figcaption>${esc(chart.caption)}</figcaption>`:''}<div class="article-chart-sources"><span>${esc(sourceLabel)}:</span>${[...new Map((chart.series||[]).map(point=>[point.evidenceUrl,point])).values()].map(point=>`<a href="${escAttr(point.evidenceUrl)}" target="_blank" rel="noopener noreferrer">${esc(new URL(point.evidenceUrl).hostname)}</a>`).join('')}</div></figure>`).join('')}</section>`;}
function evidenceBlocks(p){
  const c=copy[p.lang];
  const sources=p.sources||[], claims=p.claims||[];
  const answer=p.answer?`<section class="article-answer" aria-labelledby="article-answer-title"><p class="evidence-kicker" id="article-answer-title">${esc(c.answer)}</p><p>${esc(p.answer)}</p></section>`:'';
  if(!sources.length&&!claims.length)return {answer,evidence:''};
  const sourceIndex=new Map(sources.map((src,i)=>[src.url,i+1]));
  const showSourceStrip=['sources','both'].includes(p.citationMode);
  const claimHtml=claims.length?`<div class="evidence-claims">${claims.map(claim=>{const urls=(claim.evidence||[]).filter(url=>sourceIndex.has(url));return `<article class="evidence-claim" data-status="${escAttr(claim.status)}"><div class="evidence-claim-head"><span class="evidence-status">${esc(c[claim.status]||claim.status)}</span>${urls.length?`<span class="evidence-refs">${urls.map(url=>showSourceStrip?`<a href="#source-${sourceIndex.get(url)}" aria-label="${escAttr(c.sources)} ${sourceIndex.get(url)}">[${sourceIndex.get(url)}]</a>`:`<a href="${escAttr(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escAttr(c.sources)} ${sourceIndex.get(url)}">[${sourceIndex.get(url)}]</a>`).join(' ')}</span>`:''}</div><p>${esc(claim.text)}</p>${claim.note?`<small>${esc(claim.note)}</small>`:''}</article>`;}).join('')}</div>`:'';
  const sourceHtml=showSourceStrip&&sources.length?`<div class="article-source-strip" aria-label="${escAttr(c.sources)}"><strong>${esc(c.sources)}</strong>${sources.map((src,i)=>`<a id="source-${i+1}" class="article-source" data-verification="${escAttr(src.verification)}" href="${escAttr(src.url)}" target="_blank" rel="noopener noreferrer"><span>${i+1}</span><span class="article-source-copy"><b>${esc(src.title)}</b><small>${esc(c[src.verification]||src.verification)}</small></span></a>`).join('')}</div>`:'';
  const evidence=`<details class="article-evidence"><summary><span><strong>${esc(c.evidenceToggle)}</strong><small>${claims.length} ${esc(c.claimCount)} · ${sources.length} ${esc(c.sourceCount)}</small></span><span class="article-evidence-toggle" aria-hidden="true">+</span></summary><div class="article-evidence-body"><h2 id="article-evidence-title">${esc(c.evidence)}</h2>${claimHtml}${sourceHtml}</div></details>`;
  return {answer,evidence};
}
function renderArticle(p,all){
  const lang=p.lang,c=copy[lang],trans=findTranslation(p,all);
  const ownUrl=articleUrl(p);
  const fiPost=lang==='fi'?p:(trans?.lang==='fi'?trans:null);
  const alts=[{lang,url:ownUrl}];
  if(trans) alts.push({lang:trans.lang,url:articleUrl(trans)});
  alts.push({lang:'x-default',url:fiPost?articleUrl(fiPost):ownUrl});
  const langTargets={};
  langTargets[lang]=`${c.articleBase}/${p.slug}`;
  const otherLang=lang==='fi'?'en':'fi';
  if(trans) langTargets[trans.lang]=`${copy[trans.lang].articleBase}/${trans.slug}`;else langTargets[otherLang]=copy[otherLang].blogPath;
  const related=all.filter(x=>!x.draft&&x.lang===lang&&x.slug!==p.slug).sort((a,b)=>{const cat=(b.category===p.category)-(a.category===p.category);if(cat)return cat;const pa=(p.audience||['all']),aa=(a.audience||['all']),bb=(b.audience||['all']);return bb.filter(x=>pa.includes(x)||x==='all').length-aa.filter(x=>pa.includes(x)||x==='all').length;}).slice(0,3);
  const cover=p.coverImage?`<figure class="article-cover"><img src="${escAttr(p.coverImage)}" alt="${escAttr(p.coverAlt||'')}" decoding="async" fetchpriority="high"></figure>`:'';
  const image=p.coverImage?`${SITE}${p.coverImage}`:'';
  const body=stripDuplicateTitleHeading(p.body,p.title);
  const displayBody=applyCitationPlacements(body,p);
  const evidence=evidenceBlocks(p);
  const skip=lang==='fi'?'Siirry sisältöön':'Skip to content';
  return `${pageHead({lang,title:`${p.title} | ${SITE_NAME}`,description:p.description,url:ownUrl,type:'article',alternates:alts,jsonLd:articleJsonLd(p),rss:lang==='fi'?`${SITE}/rss.xml`:`${SITE}/rss-en.xml`,image,published:p.date,modified:p.updated||p.date})}<body><a class="skip-link" href="#main-content">${skip}</a>${header(lang,true,langTargets,trans?'':otherLang)}<main id="main-content" class="article-shell"><article class="article"><a class="article-back" href="${c.blogPath}">${c.back}</a><div class="article-meta"><span class="category-tag">${categories[p.category][lang]}</span><time datetime="${p.date}">${humanDate(p.date,lang)}</time><span>${readingMinutes(body)} ${c.minRead}</span></div>${audienceTags(p,lang)}<h1>${esc(p.title)}</h1><p class="article-deck">${esc(p.description)}</p><p class="article-byline">${c.byline} <a rel="author" href="${escAttr(AUTHOR_PATH)}">${esc(AUTHOR)}</a></p>${evidence.answer}${cover}<div class="article-body">${markdown(displayBody)}</div>${visualizationBlocks(p)}${evidence.evidence}<div class="article-end"><a href="${c.corePath}">${c.deeper}</a></div></article>${related.length?`<aside class="related"><p class="eyebrow">${c.related}</p><div class="related-grid">${related.map(x=>postCard(x,lang,{headingLevel:3})).join('')}</div></aside>`:''}</main><footer class="footer"><span class="footer-brand"><img src="/media/brand/anomancer-wordmark.png" width="1200" height="142" alt="" aria-hidden="true" loading="lazy" decoding="async"><small>${c.footer}</small></span><a href="${c.blogPath}">${c.back}</a></footer>${menuScript()}</body></html>`;
}

function renderAliasRedirect(p,alias){
  const target=`${copy[p.lang].articleBase}/${p.slug}`;
  const absolute=`${SITE}${target}`;
  const message=p.lang==='fi'?'Artikkeli on siirtynyt. Jatka uuteen osoitteeseen.':'This article has moved. Continue to the new address.';
  return `<!doctype html>\n<html lang="${p.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${escAttr(absolute)}"><meta http-equiv="refresh" content="0;url=${escAttr(target)}"><title>${esc(p.title)}</title></head><body><main><p>${message}</p><p><a href="${escAttr(target)}">${esc(p.title)}</a></p></main></body></html>\n`;
}

function rss(posts,lang){ const c=copy[lang]; const pub=posts.filter(p=>p.lang===lang&&!p.draft).sort((a,b)=>String(b.date).localeCompare(String(a.date))||a.title.localeCompare(b.title)).slice(0,30); const items=pub.map(p=>`<item><title>${esc(p.title)}</title><link>${articleUrl(p)}</link><guid isPermaLink="true">${articleUrl(p)}</guid><pubDate>${new Date(`${p.date}T12:00:00Z`).toUTCString()}</pubDate><description>${esc(p.description)}</description><category>${esc(categories[p.category][lang])}</category></item>`).join('\n'); return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Anomancer — ${c.title}</title><link>${SITE}${c.blogPath}</link><description>${esc(c.description)}</description><language>${lang}</language>${items}</channel></rss>\n`; }

function robotsTxt(){
  const privatePaths=Array.isArray(DISCOVERY.privatePaths)?DISCOVERY.privatePaths:['/admin','/api/admin/'];
  const blockPrivate=privatePaths.map(p=>`Disallow: ${p}`).join('\n');
  const searchAgent=DISCOVERY?.search?.openai?.userAgent||'OAI-SearchBot';
  const trainingAgent=DISCOVERY?.training?.openai?.userAgent||'GPTBot';
  const trainingAccess=DISCOVERY?.training?.openai?.access==='allow'?'Allow: /':'Disallow: /';
  return `# Anomancer discovery policy\n# Search discovery and model-training access are controlled separately.\n\nUser-agent: ${searchAgent}\nAllow: /\n${blockPrivate}\n\nUser-agent: ${trainingAgent}\n${trainingAccess}\n\nUser-agent: *\nAllow: /\n${blockPrivate}\n\nSitemap: ${SITE}/sitemap.xml\n`;
}
function llmsTxt(posts){
  const pub=posts.filter(p=>!p.draft).sort((a,b)=>String(b.date).localeCompare(String(a.date))||a.title.localeCompare(b.title));
  const fi=pub.filter(p=>p.lang==='fi');
  const en=pub.filter(p=>p.lang==='en');
  const lines=[
    '# Anomancer',
    '',
    '> Human-readable gateway by Aatu Isopahkala for systems thinking, AI, language, research, software and creative technology.',
    '',
    `Canonical site: ${SITE}/`,
    `Author: ${AUTHOR} (${AUTHOR_URL})`,
    '',
    '## Main routes',
    `- [Etusivu](${SITE}/)`,
    `- [Lähetykset](${SITE}${copy.fi.blogPath})`,
    `- [English](${SITE}/en)`,
    `- [Dispatches](${SITE}${copy.en.blogPath})`,
    `- [Core FI](${SITE}${copy.fi.corePath})`,
    `- [Core EN](${SITE}${copy.en.corePath})`,
    `- [Core](${SITE}/core)`,
    '',
    '## Machine-readable resources',
    `- [Sitemap](${SITE}/sitemap.xml)`,
    `- [Finnish RSS](${SITE}/rss.xml)`,
    `- [English RSS](${SITE}/rss-en.xml)`,
    `- [Content manifest](${SITE}/content-manifest.json)`,
    `- [Evidence manifest](${SITE}/evidence-manifest.json)`,
    `- [Discovery manifest](${SITE}/discovery-manifest.json)`,
  ];
  if(fi.length){ lines.push('','## Finnish dispatches',...fi.map(p=>`- [${p.title}](${articleUrl(p)}): ${p.answer||p.description}`)); }
  if(en.length){ lines.push('','## English dispatches',...en.map(p=>`- [${p.title}](${articleUrl(p)}): ${p.answer||p.description}`)); }
  lines.push('','## Notes','- Article pages are the canonical source for their claims and citations.','- Evidence metadata is available in evidence-manifest.json when present.','- llms.txt is provided as an experimental convenience document; it is not a substitute for the canonical HTML, sitemap, robots.txt or structured data.','');
  return lines.join('\n');
}
function discoveryManifest(posts,generatedAt){
  const published=posts.filter(p=>!p.draft);
  return {
    version: DISCOVERY.version||'anomancer.discovery/v1',
    generatedAt,
    site:SITE,
    entity:{siteName:SITE_NAME,author:AUTHOR,authorId:PERSON_ID,authorUrl:AUTHOR_URL,websiteId:WEBSITE_ID},
    languages:['fi','en'],
    publishedArticles:published.length,
    search:DISCOVERY.search||{},
    training:DISCOVERY.training||{},
    privatePaths:DISCOVERY.privatePaths||[],
    endpoints:Object.fromEntries(Object.entries(DISCOVERY.machineEndpoints||{}).map(([k,v])=>[k,`${SITE}${v}`])),
    notes:DISCOVERY.notes||[]
  };
}
function sitemap(posts){ const urls=[['/',null],['/en',null],['/core',null],['/en/core',null],[copy.fi.blogPath,null],[copy.en.blogPath,null],...posts.filter(p=>!p.draft).map(p=>[`${copy[p.lang].articleBase}/${p.slug}`,p.date])]; return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u,d])=>`  <url><loc>${SITE}${u}</loc>${d?`<lastmod>${d}</lastmod>`:''}</url>`).join('\n')}\n</urlset>\n`; }
function decodeHtmlAttr(s=''){ return String(s).replace(/&#x27;|&#39;/gi,"'").replace(/&quot;/gi,'\"').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>'); }
function staticHomeJsonLd(lang,title,description,url){ return graphJson([websiteNode(),personNode(),webpageNode({url,name:title,description,lang})]); }
function sourcePagePath(rel=''){
  const raw=String(rel);if(!raw||raw.includes('\0')||raw.includes('\\')||path.isAbsolute(raw))throw new Error(`Turvaton source-page-polku: ${raw||'(tyhjä)'}`);
  const target=path.resolve(SOURCE_PAGES,raw),prefix=`${SOURCE_PAGES}${path.sep}`;if(target===SOURCE_PAGES||!target.startsWith(prefix))throw new Error(`Source-page-polku poistuu site/pages-rajasta: ${raw}`);return target;
}
function outputPath(rel=''){
  const raw=String(rel);if(!raw||raw.includes('\0')||raw.includes('\\')||path.isAbsolute(raw))throw new Error(`Turvaton public-output-polku: ${raw||'(tyhjä)'}`);
  const target=path.resolve(PUBLIC,raw),prefix=`${PUBLIC}${path.sep}`;if(target===PUBLIC||!target.startsWith(prefix))throw new Error(`Public-output-polku poistuu public/-rajasta: ${raw}`);return target;
}
function renderStaticHome(rel,lang){
  const file=sourcePagePath(rel);if(!fs.existsSync(file))throw new Error(`${rel}: source template puuttuu`);
  let html=fs.readFileSync(file,'utf8');
  const url=lang==='fi'?`${SITE}/`:`${SITE}/en`;
  const title=(html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]||`${SITE_NAME} | ${AUTHOR}`;
  const description=decodeHtmlAttr((html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']\s*\/?\s*>/i)||[])[1]||'');
  const jsonLd=staticHomeJsonLd(lang,title,description,url);
  const script=`<script type="application/ld+json">\n${jsonLd}\n  </script>`;
  if(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i.test(html)) html=html.replace(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i,script);
  else html=html.replace('</head>',`${script}\n</head>`);
  if(/<meta\s+name=["']author["'][^>]*>/i.test(html)) html=html.replace(/<meta\s+name=["']author["'][^>]*>/i,`<meta name="author" content="${escAttr(AUTHOR)}" />`);
  else html=html.replace(/(<meta\s+name=["']description["'][^>]*>)/i,`$1\n  <meta name="author" content="${escAttr(AUTHOR)}" />`);
  if(/<link\s+rel=["']author["'][^>]*>/i.test(html)) html=html.replace(/<link\s+rel=["']author["'][^>]*>/i,`<link rel="author" href="${escAttr(AUTHOR_URL)}" />`);
  else html=html.replace(/(<link\s+rel=["']canonical["'][^>]*>)/i,`$1\n  <link rel="author" href="${escAttr(AUTHOR_URL)}" />`);
  return html;
}
function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }
function write(rel,data){ const target=outputPath(rel); ensureDir(path.dirname(target)); fs.writeFileSync(target,data); }
function renderPublicCoreFallback(rel,lang,core){
  const file=sourcePagePath(rel);if(!fs.existsSync(file))throw new Error(`${rel}: source template puuttuu`);
  const view=renderPublicCore(core,lang);const v3=renderPublicCoreV3(core,lang);let html=fs.readFileSync(file,'utf8');
  const replacements={ARCHITECTURE:v3.architectureHtml,CAPABILITIES:v3.capabilitiesHtml,AGENT_COUNT:String(view.agentCount),ORCHESTRA_COUNT:String(view.orchestraCount),PLATFORM:view.platformHtml,AGENTS:view.agentsHtml,ORCHESTRAS:view.orchestrasHtml,MODELS:view.modelsHtml,TOOLS:view.toolsHtml,WORKSPACES:view.workspacesHtml};
  for(const [key,value] of Object.entries(replacements)){
    const rx=new RegExp(`(<!-- CORE_FALLBACK:${key}:START -->)[\\s\\S]*?(<!-- CORE_FALLBACK:${key}:END -->)`);
    if(!rx.test(html))throw new Error(`${rel}: fallback-marker puuttuu: ${key}`);
    html=html.replace(rx,`$1${value}$2`);
  }
  return html;
}

fs.rmSync(PUBLIC,{recursive:true,force:true});
ensureDir(PUBLIC);
write('index.html',renderStaticHome('index.html','fi'));
write('en.html',renderStaticHome('en.html','en'));
const posts=readPosts();
write('lahetykset.html',renderIndex('fi',posts));
write('dispatches.html',renderIndex('en',posts));
for (const p of posts.filter(p=>!p.draft)) {
  write(`${copy[p.lang].articleBase.slice(1)}/${p.slug}.html`,renderArticle(p,posts));
  for(const alias of p.aliases||[]) write(`${copy[p.lang].articleBase.slice(1)}/${alias}.html`,renderAliasRedirect(p,alias));
}
write('rss.xml',rss(posts,'fi'));
write('rss-en.xml',rss(posts,'en'));
write('sitemap.xml',sitemap(posts));
write('robots.txt',robotsTxt());
const published=posts.filter(p=>!p.draft);
const draftCount=posts.filter(p=>p.draft).length;
// Julkinen manifesti sisältää vain julkaistut tekstit. Luonnosten metadata ei kuulu public-outputtiin.
const manifest={generatedAt:new Date().toISOString(),entity:{siteName:SITE_NAME,author:AUTHOR,authorId:PERSON_ID,authorUrl:AUTHOR_URL,websiteId:WEBSITE_ID},published:published.map(p=>({lang:p.lang,slug:p.slug,title:p.title,description:p.description,answer:p.answer||'',category:p.category,audience:p.audience||['all'],audienceDepth:p.audienceDepth||'general',pinned:Boolean(p.pinned),date:p.date,updated:p.updated||p.date,url:articleUrl(p),articleId:`${articleUrl(p)}#article`,authorId:PERSON_ID,coverImage:p.coverImage||'',evidence:{sourceCount:(p.sources||[]).length,claimCount:(p.claims||[]).length,supported:(p.claims||[]).filter(x=>x.status==='supported').length,interpretation:(p.claims||[]).filter(x=>x.status==='interpretation').length,open:(p.claims||[]).filter(x=>x.status==='open').length}}))};
write('content-manifest.json',JSON.stringify(manifest,null,2)+'\n');
const evidenceManifest={version:'anomancer.evidence/v2',generatedAt:manifest.generatedAt,verification:{statuses:['candidate','verified','rejected'],verifiedRequires:['verifiedBy','verifiedAt','verificationMethod','verificationEvidence','verificationNotes']},articles:published.map(p=>({articleId:`${articleUrl(p)}#article`,url:articleUrl(p),title:p.title,lang:p.lang,answer:p.answer||'',claims:p.claims||[],sources:p.sources||[],citationMode:p.citationMode||'inline',citationPlacements:p.citationPlacements||[],visualizations:p.visualizations||[]}))};
write('evidence-manifest.json',JSON.stringify(evidenceManifest,null,2)+'\n');
write('llms.txt',llmsTxt(posts));
const discoveryManifestData=discoveryManifest(posts,manifest.generatedAt);
write('discovery-manifest.json',JSON.stringify(discoveryManifestData,null,2)+'\n');
const publicCore=createPublicCoreView();
write('core-public.json',JSON.stringify(publicCore,null,2)+'\n');
write('core.html',renderPublicCoreFallback('core.html','fi',publicCore));
write('en/core.html',renderPublicCoreFallback('core-en.html','en',publicCore));
const apiFunctionCount=fs.readdirSync(path.join(ROOT,'api'),{recursive:true}).filter(name=>String(name).endsWith('.js')).length;
const releaseProvenance=createReleaseProvenance({publicCore,apiFunctionCount,builtAt:manifest.generatedAt});
write('release-provenance.json',JSON.stringify(releaseProvenance,null,2)+'\n');
const digest=crypto.createHash('sha256').update(JSON.stringify(manifest.published)).digest('hex');
console.log(`✓ Lähetyskone build: ${manifest.published.length} julkaistua · ${draftCount} luonnosta · manifest sha256 ${digest.slice(0,16)}…`);

// Vercel-projektin Output Directory on public. Phase 5:ssa build kirjoittaa vain public/-rajan sisään.
// API-funktiot jäävät projektin /api-hakemistoon Vercelin serverless-funktioiksi.
const staticFiles = [
  'admin.html',
  'ui-tokens.css','styles.css','core.css','admin.css','admin-shell.css','admin-workspace.css','admin-editorial.css','admin-narrative.css','admin-control-plane.css','admin-archive.css','admin-nanomancer.css','admin-mancer.css','admin-responsive.css','admin-runtime.js','admin.js','admin-workspaces.js','admin-archive.js','admin-nanomancer.js','admin-mancer.js','admin-operations.js','admin-shell.js','admin-overlays.js','admin-feedback.js','admin-core.js','admin-agents.js','admin-orchestras.js','admin-machine-room.js','admin-orchestrator.js','admin-narramancer.js','narramancer-export.js','lahetyskone-pwa.js','lahetyskone-sw.js','manifest.webmanifest','favicon.svg',
  'icons/lahetyskone.svg','icons/lahetyskone-192.png','icons/lahetyskone-512.png','icons/lahetyskone-maskable-512.png',
  'site.js','public-core-render.js','public-core-v3-render.js','core-public.js'
];
for (const rel of staticFiles) {
  const src=projectPath(rel);
  if (fs.existsSync(src)) { const target=outputPath(rel);ensureDir(path.dirname(target));fs.copyFileSync(src,target); }
}
const appShellSrc=projectPath('admin.html');
if (fs.existsSync(appShellSrc)) fs.copyFileSync(appShellSrc,outputPath('lahetyskone.html'));
const MEDIA=path.join(ROOT,'media');
if (fs.existsSync(MEDIA)) fs.cpSync(MEDIA,path.join(PUBLIC,'media'),{recursive:true});
console.log(`✓ Vercel public-output: ${PUBLIC}`);

if (process.argv.includes('--check')) {
  for (const p of posts.filter(p=>!p.draft)) {
    const out=outputPath(`${copy[p.lang].articleBase.slice(1)}/${p.slug}.html`);
    if(!fs.existsSync(out)) throw new Error(`Build puuttuu: ${out}`);
    const refs=[p.coverImage,...[...p.body.matchAll(/!\[[^\]]*\]\((\/media\/[^\s)]+)(?:\s+"[^"]*")?\)/g)].map(m=>m[1])].filter(Boolean);
    for(const ref of refs){const src=projectPath(ref.replace(/^\//,''));if(!fs.existsSync(src))throw new Error(`Media puuttuu: ${ref} (${p.title})`);}
  }
  console.log('✓ Content + media check OK');
}
