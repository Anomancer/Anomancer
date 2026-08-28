import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT=process.cwd();
const SITE=String(process.env.PUBLIC_SITE_URL||'https://anomancer.com').replace(/\/$/,'');
const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'entity-core.json'),'utf8'));
const PERSON_ID=`${SITE}/#person`;
const WEBSITE_ID=`${SITE}/#website`;
const AUTHOR_URL=`${SITE}${cfg.person.authorPath||'/#about'}`;

function read(rel){ return fs.readFileSync(path.join(ROOT,'public',rel),'utf8'); }
function jsonLd(html){
  const m=html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  assert.ok(m,'JSON-LD puuttuu');
  return JSON.parse(m[1]);
}
function node(graph,type){ return (graph['@graph']||[]).find(x=>x['@type']===type); }
function meta(html,name){ const re=new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`,`i`); return (html.match(re)||[])[1]||''; }
function canonical(html){ return (html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)||[])[1]||''; }
function title(html){ return (html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]?.trim()||''; }

let ok=0;
const test=(name,fn)=>{ fn(); ok++; console.log(`✓ ${name}`); };

test('entity-core.json määrittää yhden Person-entiteetin',()=>{
  assert.equal(cfg.siteName,'Anomancer');
  assert.equal(cfg.person.name,'Aatu Isopahkala');
  assert.ok(Array.isArray(cfg.person.sameAs));
  assert.ok(Array.isArray(cfg.person.knowsAbout));
});

for(const [rel,lang,url] of [['index.html','fi',`${SITE}/`],['en.html','en',`${SITE}/en`]]){
  test(`${rel}: WebSite + Person + WebPage käyttävät samoja @id-tunnisteita`,()=>{
    const html=read(rel),g=jsonLd(html);
    assert.equal(g['@context'],'https://schema.org');
    const site=node(g,'WebSite'),person=node(g,'Person'),page=node(g,'WebPage');
    assert.equal(site['@id'],WEBSITE_ID);
    assert.equal(person['@id'],PERSON_ID);
    assert.equal(person.url,AUTHOR_URL);
    assert.equal(page.url,url);
    assert.equal(page.isPartOf['@id'],WEBSITE_ID);
    assert.equal(page.about['@id'],PERSON_ID);
    assert.equal(meta(html,'author'),cfg.person.name);
    assert.match(html,new RegExp(`<link\\s+rel=["']author["']\\s+href=["']${AUTHOR_URL.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`,'i'));
  });
}

const manifest=JSON.parse(read('content-manifest.json'));
test('julkinen manifesti sisältää yhteisen entity-ytimen',()=>{
  assert.equal(manifest.entity.siteName,cfg.siteName);
  assert.equal(manifest.entity.authorId,PERSON_ID);
  assert.equal(manifest.entity.websiteId,WEBSITE_ID);
  assert.equal(manifest.entity.authorUrl,AUTHOR_URL);
});

for(const p of manifest.published){
  const rel=p.lang==='fi'?`lahetykset/${p.slug}.html`:`dispatches/${p.slug}.html`;
  test(`${rel}: BlogPosting on sidottu Person + WebSite -graafiin`,()=>{
    const html=read(rel),g=jsonLd(html);
    const article=node(g,'BlogPosting'),person=node(g,'Person'),site=node(g,'WebSite'),page=node(g,'WebPage');
    assert.equal(person['@id'],PERSON_ID);
    assert.equal(site['@id'],WEBSITE_ID);
    assert.equal(article.author['@id'],PERSON_ID);
    assert.equal(article.publisher['@id'],PERSON_ID);
    assert.equal(article.mainEntityOfPage['@id'],page['@id']);
    assert.equal(page.isPartOf['@id'],WEBSITE_ID);
    assert.equal(article.url,p.url);
    assert.equal(canonical(html),p.url);
    assert.equal(meta(html,'author'),cfg.person.name);
    assert.match(html,/class="article-byline"/);
    assert.match(html,/rel="author" href="\/#about"/);
    assert.doesNotMatch(JSON.stringify(g),/ConsultingService|Organization/);
  });
}

test('jokaisella indeksoitavalla ydinsivulla on title, description ja canonical',()=>{
  const files=['index.html','en.html','lahetykset.html','dispatches.html',...manifest.published.map(p=>p.lang==='fi'?`lahetykset/${p.slug}.html`:`dispatches/${p.slug}.html`)];
  const titles=new Set(),descs=new Set();
  for(const rel of files){
    const html=read(rel),t=title(html),d=meta(html,'description'),c=canonical(html);
    assert.ok(t,`${rel}: title puuttuu`);
    assert.ok(d,`${rel}: description puuttuu`);
    assert.ok(c.startsWith(SITE),`${rel}: canonical puuttuu tai väärä`);
    assert.ok(!titles.has(t),`${rel}: title ei ole uniikki: ${t}`);
    assert.ok(!descs.has(d),`${rel}: description ei ole uniikki`);
    titles.add(t); descs.add(d);
  }
});

console.log(`\n${ok}/${ok} ENTITY CORE -testiä läpi`);
