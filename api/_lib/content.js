export const CATEGORIES = ['ai-agents','tee','systems','semantics','build','research','field'];

export function slugify(s='') {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);
}

function parseScalar(raw) {
  const s = raw.trim();
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
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
  return { ...data, draft:Boolean(data.draft), body:text.slice(end+5).replace(/^\n+/,'') };
}

export function validatePost(input) {
  const lang = input.lang === 'en' ? 'en' : 'fi';
  const title = String(input.title || '').trim();
  const date = String(input.date || '').trim();
  const category = CATEGORIES.includes(input.category) ? input.category : 'field';
  const description = String(input.description || '').trim();
  const slug = slugify(input.slug || title);
  const translationKey = slugify(input.translationKey || slug);
  const body = String(input.body || '').replace(/\r\n/g,'\n').trim();
  const draft = Boolean(input.draft);
  if (!title) throw Object.assign(new Error('Otsikko puuttuu.'), { statusCode:400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Object.assign(new Error('Päivämäärä on virheellinen.'), { statusCode:400 });
  if (!description) throw Object.assign(new Error('SEO-kuvaus puuttuu.'), { statusCode:400 });
  if (!slug) throw Object.assign(new Error('Slug puuttuu.'), { statusCode:400 });
  if (description.length > 220) throw Object.assign(new Error('SEO-kuvaus on liian pitkä (max 220 merkkiä).'), { statusCode:400 });
  if (body.length > 500_000) throw Object.assign(new Error('Teksti on liian pitkä.'), { statusCode:413 });
  return { lang,title,date,category,description,slug,translationKey,draft,body };
}

export function serializePost(input) {
  const p = validatePost(input);
  return `---\ntitle: ${JSON.stringify(p.title)}\ndate: ${JSON.stringify(p.date)}\ncategory: ${JSON.stringify(p.category)}\ndescription: ${JSON.stringify(p.description)}\nslug: ${JSON.stringify(p.slug)}\nlang: ${JSON.stringify(p.lang)}\ntranslationKey: ${JSON.stringify(p.translationKey)}\ndraft: ${p.draft}\n---\n\n${p.body}\n`;
}

export function newPostPath(post) {
  const p = validatePost(post);
  return `content/${p.lang}/${p.date.replaceAll('-','')}-${p.slug}.md`;
}
