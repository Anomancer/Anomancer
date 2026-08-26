import assert from 'node:assert/strict';
import fs from 'node:fs';

let ok=0;const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`)};
const read=f=>fs.readFileSync(f,'utf8');
function visible(html){return html
  .replace(/<(script|style|code|textarea)\b[\s\S]*?<\/\1>/gi,' ')
  .replace(/<!--([\s\S]*?)-->/g,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/&nbsp;|&#160;/g,' ')
  .replace(/&amp;/g,'&')
  .replace(/\s+/g,' ')
  .trim();}
function none(text,terms){for(const term of terms)assert.doesNotMatch(text,new RegExp(`\\b${term}\\b`,'i'),`Sekakielinen UI-termi: ${term}`);}
const fiCore=read('core.html'),enCore=read('core-en.html'),admin=read('admin.html'),index=read('index.html'),en=read('en.html');
const coreJs=read('core-public.js'),build=read('scripts/build-blog.mjs');

test('FI Core ei sisällä englanninkielisiä käyttöliittymäotsikoita',()=>none(visible(fiCore),['Overview','Runs','Usage','Workspaces','Models','Tools','Orchestras','Completed','Degraded','Failed','Aborted','Running','Custom','Workspace','Runtime','Provider']));
test('EN Core ei sisällä suomalaisia käyttöliittymäotsikoita',()=>none(visible(enCore),['Yleiskuva','Ajot','Käyttö','Työtilat','Mallit','Työkalut','Orkesterit','Evidenssi','Käynnissä','Valmis','Heikentynyt','Työtila']));
test('yksityinen admin on näkyvältä käyttöliittymältään suomeksi',()=>none(visible(admin),['Workspace','Runtime','Usage','Completed','Degraded','Failed','Aborted','Running','Sequential','Parallel','Provider','Custom','English']));
test('admin ei näytä vanhoja release-numeroita käyttöliittymäsemantiikkana',()=>{assert.doesNotMatch(visible(admin),/\b1[0-5]\.\d(?:\.\d)?\b/);});
test('FI-etusivu ei käytä englanninkielistä järjestelmäsanastoa',()=>none(visible(index),['control plane','Agent Pool','Work']));
test('EN-etusivun Core-linkki osoittaa englanninkieliseen Coreen',()=>{assert.match(en,/href="\/en\/core"/);});
test('Corella on erilliset canonical- ja hreflang-reitit',()=>{assert.match(fiCore,/rel="canonical" href="https:\/\/anomancer\.com\/core"/);assert.match(enCore,/rel="canonical" href="https:\/\/anomancer\.com\/en\/core"/);assert.match(fiCore,/hreflang="en" href="https:\/\/anomancer\.com\/en\/core"/);assert.match(enCore,/hreflang="fi" href="https:\/\/anomancer\.com\/core"/);});
test('dynaaminen Core UI valitsee sanaston dokumentin lang-attribuutista',()=>{assert.match(coreJs,/documentElement\.lang/);assert.match(coreJs,/const C=/);assert.match(coreJs,/fi:/);assert.match(coreJs,/en:/);});
test('build erottaa FI- ja EN-Core-reitit',()=>{assert.match(build,/corePath: '\/core'/);assert.match(build,/corePath: '\/en\/core'/);assert.match(build,/\['\/en\/core',null\]/);assert.match(build,/core-en\.html/);assert.match(build,/path\.join\(PUBLIC,'en','core\.html'\)/);});
console.log(`\n${ok}/${ok} LANGUAGE BOUNDARIES -testiä läpi`);
