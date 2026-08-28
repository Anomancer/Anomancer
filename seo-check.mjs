import fs from 'node:fs';
import path from 'node:path';
const SITE='https://anomancer.com';
const PUBLIC=path.resolve('public');
const out=rel=>path.join(PUBLIC,rel);
let bad=0;
const fail=m=>{console.error(`✗ ${m}`);bad++;};
for(const [file,url] of [['index.html','/'],['en.html','/en'],['lahetykset.html','/lahetykset'],['dispatches.html','/dispatches']]){
  const s=fs.readFileSync(out(file),'utf8');
  if(!s.includes(`<link rel="canonical" href="${SITE}${url}"`)) fail(`${file}: canonical`);
  if(!s.includes('name="robots" content="index,follow')) fail(`${file}: robots meta`);
  if(!s.includes('application/ld+json')) fail(`${file}: JSON-LD`);
}
const manifest=JSON.parse(fs.readFileSync(out('content-manifest.json'),'utf8'));
for(const p of manifest.published){
  const base=p.lang==='fi'?'lahetykset':'dispatches';
  const file=path.join(base,`${p.slug}.html`);
  if(!fs.existsSync(out(file))){fail(`artikkeli puuttuu: ${file}`);continue;}
  const s=fs.readFileSync(out(file),'utf8');
  if(!s.includes(`<link rel="canonical" href="${p.url}"`)) fail(`${file}: canonical`);
  if(!s.includes('"@type":"BlogPosting"')&&!s.includes('"@type": "BlogPosting"')) fail(`${file}: BlogPosting JSON-LD`);
}
const sitemap=fs.readFileSync(out('sitemap.xml'),'utf8');
const robots=fs.readFileSync(out('robots.txt'),'utf8');
const admin=fs.readFileSync(out('admin.html'),'utf8');
if(!robots.includes(`${SITE}/sitemap.xml`)) fail('robots sitemap');
for(const p of manifest.published) if(!sitemap.includes(`<loc>${p.url}</loc>`)) fail(`sitemap: ${p.url}`);
if(!fs.existsSync(out('rss.xml'))||!fs.existsSync(out('rss-en.xml'))) fail('RSS puuttuu');
if(sitemap.includes('.html')) fail('sitemap sisältää .html URL:n');
if(!admin.includes('noindex,nofollow')) fail('admin: robots meta');
if(sitemap.includes('/admin')) fail('sitemap sisältää adminin');
if(!robots.includes('Disallow: /admin')) fail('robots ei estä adminia');
if(!robots.includes('Disallow: /api/admin/')) fail('robots ei estä admin API:a');
if(bad) process.exit(1);
console.log(`✓ SEO/content/admin smoke test OK · ${manifest.published.length} julkaistua artikkelia`);
