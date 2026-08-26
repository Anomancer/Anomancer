import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const SITE='https://anomancer.com';
const OLD='https://anomancer.vercel.app';
const failures=[];
const must=[
  ['index.html', `${SITE}/`],
  ['en.html', `${SITE}/en`],
  ['lahetykset.html', `${SITE}/lahetykset`],
  ['dispatches.html', `${SITE}/dispatches`],
  ['sitemap.xml', SITE],
  ['rss.xml', SITE],
  ['rss-en.xml', SITE],
  ['robots.txt', `${SITE}/sitemap.xml`],
  ['content-manifest.json', SITE],
];
for(const [rel,needle] of must){
  const p=path.join(ROOT,rel);
  if(!fs.existsSync(p)) failures.push(`${rel}: puuttuu`);
  else if(!fs.readFileSync(p,'utf8').includes(needle)) failures.push(`${rel}: canonical-domain puuttuu`);
}
const generated=['index.html','en.html','lahetykset.html','dispatches.html','sitemap.xml','rss.xml','rss-en.xml','robots.txt','content-manifest.json'];
for(const rel of generated){
  const s=fs.readFileSync(path.join(ROOT,rel),'utf8');
  if(s.includes(OLD)) failures.push(`${rel}: vanha vercel.app jäi outputtiin`);
}
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'content-manifest.json'),'utf8'));
const fi=manifest.published.filter(x=>x.lang==='fi');
if(fi.length===0) failures.push('FI-julkaisuja ei löytynyt manifestista');
const allowedAudiences=new Set(['all','employee','entrepreneur','developer','teacher','creative','decision-maker','investor']);
for(const item of fi){
  const audience=Array.isArray(item.audience)?item.audience:[];
  if(!audience.length){
    failures.push(`${item.slug}: audience puuttuu`);
    continue;
  }
  const unknown=audience.filter(id=>!allowedAudiences.has(id));
  if(unknown.length) failures.push(`${item.slug}: tuntematon audience ${unknown.join(', ')}`);
  if(audience.includes('all')&&audience.length>1) failures.push(`${item.slug}: all ei saa esiintyä kohdeyleisön kanssa`);
}
const list=fs.readFileSync(path.join(ROOT,'lahetykset.html'),'utf8');
const siteJs=fs.readFileSync(path.join(ROOT,'site.js'),'utf8');
if(list.includes("a.includes('all')||a.includes(aud)")) failures.push('audience-filtteri käyttää vanhaa all+target-logiikkaa');
if(!list.includes('src="/site.js"')) failures.push('ulkoinen käyttöliittymäskripti puuttuu');
if(!siteJs.includes("audience==='all'||splitAudience(card.dataset.audience).includes(audience)")) failures.push('strict audience-filtteri puuttuu');
if(failures.length){console.error('DOMAIN MIGRATION FAIL');for(const f of failures)console.error(' -',f);process.exit(1)}
console.log(`✓ Domain migration OK · ${fi.length} FI-lähetystä · canonical ${SITE}`);
