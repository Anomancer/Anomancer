import { assertEditorialPublishQuality } from './editorial-quality.js';

export const CATEGORIES = ['ai-work','info-media','work-decisions','money-risk','software-safety','language-learning','creativity-tools','society-systems'];
export const AUDIENCES = ['all','employee','entrepreneur','developer','teacher','creative','decision-maker','investor'];
export const AUDIENCE_DEPTHS = ['plain','general','professional','technical'];

export const CLAIM_STATUSES = ['supported','interpretation','open'];
export const SOURCE_VERIFICATIONS = ['candidate','verified','rejected'];
export const SOURCE_ORIGINS = ['human','source-agent','import'];
export const SOURCE_VERIFICATION_METHODS = ['direct-open','cached-copy','publisher-metadata','secondary-confirmation'];
export const CITATION_MODES = ['inline','sources','both'];
export const CHART_TYPES = ['bar','line'];

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
    // A source is a candidate until a human creates a traceable verification record.
    // Origin alone must never silently promote a source to verified.
    const fallbackVerification='candidate';
    const verification=SOURCE_VERIFICATIONS.includes(src.verification)?src.verification:fallbackVerification;
    out.push({
      id:String(src.id||stableSourceId(url)).trim().slice(0,80),title,url,publisher,date,origin,verification,
      retrievedAt:String(src.retrievedAt||'').trim().slice(0,40),
      why:String(src.why||'').trim().slice(0,500),
      supports:String(src.supports||'').trim().slice(0,800),
      challenges:String(src.challenges||'').trim().slice(0,800),
      verifiedBy:String(src.verifiedBy||'').trim().slice(0,120),
      verifiedAt:String(src.verifiedAt||'').trim().slice(0,40),
      verificationMethod:SOURCE_VERIFICATION_METHODS.includes(src.verificationMethod)?src.verificationMethod:'',
      verificationEvidence:String(src.verificationEvidence||'').trim().slice(0,800),
      verificationNotes:String(src.verificationNotes||'').trim().slice(0,800),
    });
  }
  return out;
}

const DIRECT_ACCESS_CONFLICT=/(?:\b403\b|\b404\b|access denied|forbidden|could not (?:open|access|retrieve)|unable to (?:open|access|retrieve)|ei (?:saatu|onnistuttu|pystytty) (?:avaamaan|hakemaan|tarkistamaan)|tarkistus suositellaan|maksumuuri|paywall)/iu;

export function sourceVerificationIssues(source={}) {
  if(source.verification!=='verified') return [];
  const issues=[];
  if(!SOURCE_VERIFICATION_METHODS.includes(source.verificationMethod)) issues.push('varmennusmenetelmä puuttuu');
  if(!String(source.verifiedBy||'').trim()) issues.push('varmentaja puuttuu');
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z$/.test(String(source.verifiedAt||''))) issues.push('varmennusaika puuttuu tai ei ole UTC ISO -muodossa');
  if(!String(source.verificationEvidence||'').trim()) issues.push('varmennusevidenssi puuttuu');
  if(!String(source.verificationNotes||'').trim()) issues.push('varmennusmuistiinpano puuttuu');
  if(source.verificationMethod==='direct-open'&&DIRECT_ACCESS_CONFLICT.test(String(source.challenges||''))) issues.push('suora avaus on ristiriidassa lähteen haastekuvauksen kanssa');
  return issues;
}

export function isSourceVerified(source={}) {
  return source.verification==='verified'&&sourceVerificationIssues(source).length===0;
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

export function normalizeCitationMode(value='inline') {
  const raw=String(value||'inline').trim();
  return CITATION_MODES.includes(raw)?raw:'inline';
}

function occurrences(haystack,needle){
  if(!needle)return 0;let count=0,pos=0;
  while((pos=haystack.indexOf(needle,pos))!==-1){count++;pos+=needle.length;}
  return count;
}

export function approvedEvidenceUrls(sources=[],claims=[]) {
  const verified=new Set(sources.filter(isSourceVerified).map(src=>src.url));
  const approved=new Set();
  for(const claim of claims){if(claim.status!=='supported')continue;for(const link of claim.evidence||[])if(verified.has(link))approved.add(link);}
  return approved;
}

export function normalizeCitationPlacements(value,{sources=[],claims=[],body=''}={}) {
  const approved=approvedEvidenceUrls(sources,claims),seen=new Set(),out=[];
  for(const item of Array.isArray(value)?value:[]){
    const raw=item&&typeof item==='object'?item:{};
    const evidenceUrl=cleanHttpUrl(raw.evidenceUrl),quote=String(raw.quote||'').trim(),anchorText=String(raw.anchorText||'').trim(),claimText=String(raw.claimText||'').trim();
    if(!approved.has(evidenceUrl)||quote.length<12||quote.length>420||anchorText.length<2||anchorText.length>180)continue;
    if(anchorText.includes('[')||anchorText.includes(']')||anchorText.includes('(')||anchorText.includes(')')||anchorText.includes('`')||anchorText.includes('\n')||anchorText.includes('\r')||!quote.includes(anchorText)||occurrences(String(body||''),quote)!==1)continue;
    const key=`${evidenceUrl}\n${quote}\n${anchorText}`;if(seen.has(key))continue;seen.add(key);
    out.push({claimText:claimText.slice(0,600),evidenceUrl,quote,anchorText});
    if(out.length>=40)break;
  }
  return out;
}

function numberTokens(text=''){
  return [...String(text).matchAll(/[-+]?\d[\d\s]*(?:[.,]\d+)?/g)].map(m=>Number(m[0].replace(/\s+/g,'').replace(',','.'))).filter(Number.isFinite);
}
function quoteSupportsValue(quote,value){
  const n=Number(value);if(!Number.isFinite(n))return false;
  return numberTokens(quote).some(x=>Math.abs(x-n)<=Math.max(1e-9,Math.abs(n)*1e-9));
}
function chartId(raw,index=0){
  const base=String(raw.id||raw.title||`chart-${index+1}`).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,56);
  return base||`chart-${index+1}`;
}
export function normalizeVisualizations(value,{sources=[],claims=[],body=''}={}){
  const approved=approvedEvidenceUrls(sources,claims),claimText=claims.filter(c=>c.status==='supported').map(c=>c.text).join('\n'),out=[];
  for(const [index,item] of (Array.isArray(value)?value:[]).slice(0,6).entries()){
    const raw=item&&typeof item==='object'?item:{};const type=CHART_TYPES.includes(raw.type)?raw.type:'bar';
    const title=String(raw.title||'').trim().slice(0,180),unit=String(raw.unit||'').trim().slice(0,60),caption=String(raw.caption||'').trim().slice(0,500);
    if(!title)continue;const series=[];
    for(const point of (Array.isArray(raw.series)?raw.series:[]).slice(0,20)){
      const p=point&&typeof point==='object'?point:{};const label=String(p.label||'').trim().slice(0,120),valueNum=Number(p.value),evidenceUrl=cleanHttpUrl(p.evidenceUrl),evidenceQuote=String(p.evidenceQuote||'').trim().slice(0,420);
      if(!label||!Number.isFinite(valueNum)||!approved.has(evidenceUrl)||evidenceQuote.length<3)continue;
      if(!String(body||'').includes(evidenceQuote)&&!claimText.includes(evidenceQuote))continue;
      if(!quoteSupportsValue(evidenceQuote,valueNum))continue;
      series.push({label,value:valueNum,evidenceUrl,evidenceQuote});
    }
    if(series.length<2)continue;
    out.push({id:chartId(raw,index),type,title,unit,caption,series});
  }
  return out;
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

export function normalizeAudienceDepth(value='general') {
  const raw=String(value||'general').trim();
  return AUDIENCE_DEPTHS.includes(raw)?raw:'general';
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

function validMediaPath(value=''){
  const raw=String(value||'').trim();if(!raw.startsWith('/media/')||raw.includes('\\')||raw.includes('\0'))return false;
  const parts=raw.slice('/media/'.length).split('/');return Boolean(parts.length&&parts.every(part=>part&&part!=='.'&&part!=='..'&&/^[A-Za-z0-9._-]+$/.test(part)));
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
  const body=text.slice(end+5).replace(/^\n+/,'');
  const citationMode=normalizeCitationMode(data.citationMode);
  const citationPlacements=normalizeCitationPlacements(data.citationPlacements,{sources,claims,body});
  const visualizations=normalizeVisualizations(data.visualizations,{sources,claims,body});
  return { ...data, category:normalizeCategory(data.category), audience:normalizeAudience(data.audience), audienceDepth:normalizeAudienceDepth(data.audienceDepth), aliases:normalizeAliases(data.aliases,data.slug), answer:String(data.answer||'').trim(), sources, claims, citationMode, citationPlacements, visualizations, pinned:Boolean(data.pinned), draft:Boolean(data.draft), body };
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
  const audienceDepth = normalizeAudienceDepth(input.audienceDepth);
  const description = String(input.description || '').trim();
  const slug = slugify(input.slug || title);
  const translationKey = slugify(input.translationKey || slug);
  const aliases = normalizeAliases(input.aliases,slug);
  const body = String(input.body || '').replace(/\r\n/g,'\n').trim();
  const answer = String(input.answer || '').trim();
  const sources = normalizeSources(input.sources);
  const claims = normalizeClaims(input.claims,sources);
  const citationMode = normalizeCitationMode(input.citationMode);
  const citationPlacements = normalizeCitationPlacements(input.citationPlacements,{sources,claims,body});
  const visualizations = normalizeVisualizations(input.visualizations,{sources,claims,body});
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
    const verificationIssues=sourceVerificationIssues(src);
    if (verificationIssues.length) throw Object.assign(new Error(`Lähteen varmennusjälki on puutteellinen (${src.title}): ${verificationIssues.join(', ')}`), { statusCode:400, code:'SOURCE_VERIFICATION_INVALID' });
    if (forPublish && src.verification === 'rejected') throw Object.assign(new Error(`Hylättyä lähdettä ei voi julkaista: ${src.title}`), { statusCode:400, code:'SOURCE_REJECTED' });
  }
  if (claims.length > 40) throw Object.assign(new Error('Väitteitä voi olla enintään 40.'), { statusCode:400 });
  for (const claim of claims) {
    if (claim.text.length > 600) throw Object.assign(new Error('Väite on liian pitkä (max 600 merkkiä).'), { statusCode:400 });
    if (claim.note.length > 800) throw Object.assign(new Error('Väitteen huomio on liian pitkä (max 800 merkkiä).'), { statusCode:400 });
    if (claim.evidence.length > 12) throw Object.assign(new Error('Yhdellä väitteellä voi olla enintään 12 evidenssilinkkiä.'), { statusCode:400 });
    if (claim.status === 'supported' && claim.evidence.length === 0) throw Object.assign(new Error('Tuetulla väitteellä pitää olla vähintään yksi lähde.'), { statusCode:400 });
    if (forPublish && claim.status === 'supported') {
      const verified=new Set(sources.filter(isSourceVerified).map(src=>src.url));
      if (!claim.evidence.some(url=>verified.has(url))) throw Object.assign(new Error('Tuetulla väitteellä pitää olla vähintään yksi jäljitettävästi varmennettu lähde.'), { statusCode:400, code:'CLAIM_SOURCE_NOT_VERIFIED' });
    }
  }
  if (coverImage && !validMediaPath(coverImage)) throw Object.assign(new Error('Kansikuvan polku on virheellinen.'), { statusCode:400 });
  if (coverImage && !coverAlt) throw Object.assign(new Error('Kansikuvalta puuttuu alt-teksti.'), { statusCode:400 });
  if (coverAlt.length > 180) throw Object.assign(new Error('Kansikuvan alt-teksti on liian pitkä (max 180 merkkiä).'), { statusCode:400 });
  if (forPublish) assertEditorialPublishQuality({lang,title,body});
  return { lang,title,date,category,audience,audienceDepth,description,slug,translationKey,aliases,coverImage,coverAlt,answer,sources,claims,citationMode,citationPlacements,visualizations,pinned,draft,body };
}

export function serializePost(input) {
  const p = validatePost(input,{forPublish:!Boolean(input?.draft)});
  return `---\ntitle: ${JSON.stringify(p.title)}\ndate: ${JSON.stringify(p.date)}\ncategory: ${JSON.stringify(p.category)}\naudience: ${JSON.stringify(p.audience)}\naudienceDepth: ${JSON.stringify(p.audienceDepth)}\ndescription: ${JSON.stringify(p.description)}\nslug: ${JSON.stringify(p.slug)}\nlang: ${JSON.stringify(p.lang)}\ntranslationKey: ${JSON.stringify(p.translationKey)}\naliases: ${JSON.stringify(p.aliases)}\ncoverImage: ${JSON.stringify(p.coverImage)}\ncoverAlt: ${JSON.stringify(p.coverAlt)}\nanswer: ${JSON.stringify(p.answer)}\nsources: ${JSON.stringify(p.sources)}\nclaims: ${JSON.stringify(p.claims)}\ncitationMode: ${JSON.stringify(p.citationMode)}\ncitationPlacements: ${JSON.stringify(p.citationPlacements)}\nvisualizations: ${JSON.stringify(p.visualizations)}\npinned: ${p.pinned}\ndraft: ${p.draft}\n---\n\n${p.body}\n`;
}

export function newPostPath(post) {
  const p = validatePost(post,{forPublish:false});
  return `content/${p.lang}/${p.date.replaceAll('-','')}-${p.slug}.md`;
}
