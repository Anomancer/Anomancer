export const CATEGORIES = ['ai-work','info-media','work-decisions','money-risk','software-safety','language-learning','creativity-tools','society-systems'];
export const AUDIENCES = ['all','employee','entrepreneur','developer','teacher','creative','decision-maker','investor'];

export const CLAIM_STATUSES = ['supported','interpretation','open'];
export const SOURCE_VERIFICATIONS = ['candidate','verified','rejected'];
export const SOURCE_ORIGINS = ['human','source-agent','import'];

export function stableSourceId(url='') {
  let hash=2166136261;
  for (const char of String(url)) { hash^=char.charCodeAt(0); hash=Math.imul(hash,16777619); }
  return `src-${(hash>>>0).toString(36)}`;
}

function cleanHttpUrl(value='') {
  const raw=String(value||'').trim();
  if (!raw) return '';
  try {
    const u=new URL(raw);
    if (!['http:','https:'].includes(u.protocol)) return '';
    return u.toString();
  } catch { return ''; }
}

export function normalizeSources(value) {
  const items=Array.isArray(value)?value:[];
  const out=[];
  const seen=new Set();
  for (const item of items) {
    const src=item&&typeof item==='object'?item:{};
    const title=String(src.title||'').trim();
    const url=cleanHttpUrl(src.url);
    const publisher=String(src.publisher||'').trim();
    const date=String(src.date||'').trim();
    if (!title || !url || seen.has(url)) continue;
    seen.add(url);
    const origin=SOURCE_ORIGINS.includes(src.origin)?src.origin:'human';
    // Legacy/manual sources were already accepted by a human. Agent candidates must
    // always be explicitly promoted before they can be published.
    const fallbackVerification=origin==='source-agent'?'candidate':'verified';
    const verification=SOURCE_VERIFICATIONS.includes(src.verification)?src.verification:fallbackVerification;
    out.push({
      id:String(src.id||stableSourceId(url)).trim().slice(0,80),title,url,publisher,date,origin,verification,
      retrievedAt:String(src.retrievedAt||'').trim().slice(0,40),
      why:String(src.why||'').trim().slice(0,500),
      supports:String(src.supports||'').trim().slice(0,800),
      challenges:String(src.challenges||'').trim().slice(0,800),
    });
  }
  return out;
}

export function normalizeClaims(value, sources=[]) {
  const items=Array.isArray(value)?value:[];
  const allowed=new Set(sources.map(x=>x.url));
  return items.map(item=>{
    const src=item&&typeof item==='object'?item:{};
    const status=CLAIM_STATUSES.includes(src.status)?src.status:'open';
    const text=String(src.text||'').trim();
    const note=String(src.note||'').trim();
    const evidence=[...new Set((Array.isArray(src.evidence)?src.evidence:[]).map(cleanHttpUrl).filter(Boolean))];
    return {status,text,evidence:evidence.filter(url=>allowed.has(url)),note};
  }).filter(x=>x.text);
}

export const LEGACY_CATEGORY_MAP = {
  'ai-agents':'ai-work',
  'tee':'software-safety',
  'systems':'society-systems',
  'semantics':'language-learning',
  'build':'software-safety',
  'research':'info-media',
  'field':'info-media',
};

export function normalizeCategory(value='') {
  const raw=String(value||'').trim();
  const mapped=LEGACY_CATEGORY_MAP[raw]||raw;
  return CATEGORIES.includes(mapped)?mapped:'info-media';
}

export function normalizeAudience(value) {
  let items=[];
  if (Array.isArray(value)) items=value;
  else if (typeof value === 'string' && value.trim()) items=value.split(',');
  const clean=[...new Set(items.map(x=>String(x).trim()).filter(x=>AUDIENCES.includes(x)))];
  if (!clean.length) return ['all'];
  if (clean.includes('all')) return ['all'];
  return clean;
}

export function slugify(s='') {
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
  if (s.startsWith('"') && s.endsWith('"')) {
    try { return JSON.parse(s); } catch {}
  }
  return s.replace(/^['"]|['"]$/g,'');
}

export function parseMarkdown(raw, path='') {
  const text = String(raw || '').replace(/\r\n/g,'\n');
  if (!text.startsWith('---\n')) throw new Error(`${path || 'post'}: frontmatter puuttuu`);
  const end = text.indexOf('\n---\n', 4);
  if (end < 0) throw new Error(`${path || 'post'}: frontmatter ei sulkeudu`);
  const data = {};
  for (const line of text.slice(4,end).split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i < 0) continue;
    data[line.slice(0,i).trim()] = parseScalar(line.slice(i+1));
  }
  const sources=normalizeSources(data.sources);
  const claims=normalizeClaims(data.claims,sources);
  return { ...data, category:normalizeCategory(data.category), audience:normalizeAudience(data.audience), aliases:normalizeAliases(data.aliases,data.slug), answer:String(data.answer||'').trim(), sources, claims, pinned:Boolean(data.pinned), draft:Boolean(data.draft), body:text.slice(end+5).replace(/^\n+/,'') };
}

export function normalizeAliases(value,currentSlug='') {
  const items=Array.isArray(value)?value:(typeof value==='string'&&value.trim()?[value]:[]);
  return [...new Set(items.map(slugify).filter(Boolean))].filter(x=>x!==slugify(currentSlug)).slice(0,20);
}

export function validatePost(input,{forPublish=!Boolean(input?.draft)}={}) {
  const lang = input.lang === 'en' ? 'en' : 'fi';
  const title = String(input.title || '').trim();
  const date = String(input.date || '').trim();
  const category = normalizeCategory(input.category);
  const audience = normalizeAudience(input.audience);
  const description = String(input.description || '').trim();
  const slug = slugify(input.slug || title);
  const translationKey = slugify(input.translationKey || slug);
  const aliases = normalizeAliases(input.aliases,slug);
  const body = String(input.body || '').replace(/\r\n/g,'\n').trim();
  const answer = String(input.answer || '').trim();
  const sources = normalizeSources(input.sources);
  const claims = normalizeClaims(input.claims,sources);
  const coverImage = String(input.coverImage || '').trim();
  const coverAlt = String(input.coverAlt || '').trim();
  const pinned = Boolean(input.pinned);
  const draft = Boolean(input.draft);
  if (!title) throw Object.assign(new Error('Otsikko puuttuu.'), { statusCode:400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Object.assign(new Error('Päivämäärä on virheellinen.'), { statusCode:400 });
  if (forPublish && !description) throw Object.assign(new Error('SEO-kuvaus puuttuu.'), { statusCode:400 });
  if (!slug) throw Object.assign(new Error('Slug puuttuu.'), { statusCode:400 });
  if (description.length > 220) throw Object.assign(new Error('SEO-kuvaus on liian pitkä (max 220 merkkiä).'), { statusCode:400 });
  if (body.length > 500_000) throw Object.assign(new Error('Teksti on liian pitkä.'), { statusCode:413 });
  if (answer.length > 1200) throw Object.assign(new Error('Ydinvastaus on liian pitkä (max 1200 merkkiä).'), { statusCode:400 });
  if (sources.length > 30) throw Object.assign(new Error('Lähteitä voi olla enintään 30.'), { statusCode:400 });
  for (const src of sources) {
    if (src.title.length > 220) throw Object.assign(new Error('Lähteen nimi on liian pitkä (max 220 merkkiä).'), { statusCode:400 });
    if (src.publisher.length > 160) throw Object.assign(new Error('Lähteen julkaisija on liian pitkä (max 160 merkkiä).'), { statusCode:400 });
    if (src.date && !/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(src.date)) throw Object.assign(new Error('Lähteen päivämäärä pitää olla YYYY, YYYY-MM tai YYYY-MM-DD.'), { statusCode:400 });
    if (forPublish && src.verification !== 'verified') throw Object.assign(new Error(`Lähde odottaa ihmisen tarkistusta: ${src.title}`), { statusCode:400, code:'SOURCE_NOT_VERIFIED' });
  }
  if (claims.length > 40) throw Object.assign(new Error('Väitteitä voi olla enintään 40.'), { statusCode:400 });
  for (const claim of claims) {
    if (claim.text.length > 600) throw Object.assign(new Error('Väite on liian pitkä (max 600 merkkiä).'), { statusCode:400 });
    if (claim.note.length > 800) throw Object.assign(new Error('Väitteen huomio on liian pitkä (max 800 merkkiä).'), { statusCode:400 });
    if (claim.evidence.length > 12) throw Object.assign(new Error('Yhdellä väitteellä voi olla enintään 12 evidenssilinkkiä.'), { statusCode:400 });
    if (claim.status === 'supported' && claim.evidence.length === 0) throw Object.assign(new Error('Tuetulla väitteellä pitää olla vähintään yksi lähde.'), { statusCode:400 });
    if (forPublish && claim.status === 'supported') {
      const verified=new Set(sources.filter(src=>src.verification==='verified').map(src=>src.url));
      if (!claim.evidence.some(url=>verified.has(url))) throw Object.assign(new Error('Tuetulla väitteellä pitää olla vähintään yksi ihmisen tarkistama lähde.'), { statusCode:400, code:'CLAIM_SOURCE_NOT_VERIFIED' });
    }
  }
  if (coverImage && !/^\/media\/[A-Za-z0-9._\/-]+$/.test(coverImage)) throw Object.assign(new Error('Kansikuvan polku on virheellinen.'), { statusCode:400 });
  if (coverImage && !coverAlt) throw Object.assign(new Error('Kansikuvalta puuttuu alt-teksti.'), { statusCode:400 });
  if (coverAlt.length > 180) throw Object.assign(new Error('Kansikuvan alt-teksti on liian pitkä (max 180 merkkiä).'), { statusCode:400 });
  return { lang,title,date,category,audience,description,slug,translationKey,aliases,coverImage,coverAlt,answer,sources,claims,pinned,draft,body };
}

export function serializePost(input) {
  const p = validatePost(input,{forPublish:!Boolean(input?.draft)});
  return `---\ntitle: ${JSON.stringify(p.title)}\ndate: ${JSON.stringify(p.date)}\ncategory: ${JSON.stringify(p.category)}\naudience: ${JSON.stringify(p.audience)}\ndescription: ${JSON.stringify(p.description)}\nslug: ${JSON.stringify(p.slug)}\nlang: ${JSON.stringify(p.lang)}\ntranslationKey: ${JSON.stringify(p.translationKey)}\naliases: ${JSON.stringify(p.aliases)}\ncoverImage: ${JSON.stringify(p.coverImage)}\ncoverAlt: ${JSON.stringify(p.coverAlt)}\nanswer: ${JSON.stringify(p.answer)}\nsources: ${JSON.stringify(p.sources)}\nclaims: ${JSON.stringify(p.claims)}\npinned: ${p.pinned}\ndraft: ${p.draft}\n---\n\n${p.body}\n`;
}

export function newPostPath(post) {
  const p = validatePost(post,{forPublish:false});
  return `content/${p.lang}/${p.date.replaceAll('-','')}-${p.slug}.md`;
}
