import assert from 'node:assert/strict';
import fs from 'node:fs';

let ok=0;const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`)};
const read=f=>fs.readFileSync(f,'utf8');
const admin=read('admin.html'),adminJs=read('admin.js'),adminCss=read('admin.css'),controlCss=read('admin-control-plane.css');
const styles=read('styles.css'),coreCss=read('core.css'),tokens=read('ui-tokens.css'),build=read('scripts/build-blog.mjs');

test('16.0 käyttää yhteistä semanttista design-token-kerrosta',()=>{assert.match(tokens,/--color-canvas/);assert.match(tokens,/--space-4/);assert.match(tokens,/--tap-target/);assert.match(styles,/@import url\([\"']\/ui-tokens\.css[\"']\)/g);assert.match(adminCss,/@import url\([\"']\/ui-tokens\.css[\"']\)/g);assert.match(coreCss,/@import url\([\"']\/ui-tokens\.css[\"']\)/g);assert.match(controlCss,/@import url\([\"']\/ui-tokens\.css[\"']\)/g);});
test('julkisen Coren CSS on erotettu yleisestä sivusto-CSS:stä',()=>{assert.doesNotMatch(styles,/\.core-public-page/);assert.match(coreCss,/\.core-public-page/);assert.match(admin,/admin-control-plane\.css/);});
test('editorin näkymät eivät enää käytä workspace-nimeä',()=>{assert.doesNotMatch(admin,/data-workspace-(tab|panel)/);assert.doesNotMatch(adminJs,/data-workspace-(tab|panel)/);assert.doesNotMatch(adminCss,/\.workspace-(tabs|panel)/);assert.match(admin,/class="editor-tabs"/);assert.match(adminJs,/selectEditorView/);});
test('editorin välilehdet käyttävät oikeaa ARIA tab -mallia',()=>{assert.match(admin,/role="tablist"/);assert.match(admin,/role="tab"/);assert.match(admin,/role="tabpanel"/);assert.match(admin,/aria-selected="true"/);assert.match(adminJs,/aria-selected/);assert.match(adminJs,/ArrowLeft/);assert.match(adminJs,/ArrowRight/);});
test('näppäimistöfokus ja liikkeen vähennys ovat yhteisiä saavutettavuussääntöjä',()=>{assert.match(tokens,/:focus-visible/);assert.match(tokens,/prefers-reduced-motion/);assert.match(tokens,/prefers-contrast/);});
test('kosketuskohteella on vähimmäiskoko',()=>{assert.match(tokens,/--tap-target:\s*44px/);assert.match(tokens,/min-height:\s*var\(--tap-target\)/);});
test('16.0 stageaa kaikki uudet CSS-kerrokset Vercel public-outputiin',()=>{for(const file of ['ui-tokens.css','core.css','admin-control-plane.css'])assert.match(build,new RegExp(file.replace('.','\\.')));});
test('Vercelin api-puussa on edelleen tasan 12 JavaScript-entrypointtia',()=>{const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):e.name.endsWith('.js')?[`${dir}/${e.name}`]:[]);const files=walk('api');assert.equal(files.length,12);assert.equal(files.some(x=>x.includes('/_lib/')),false);});
test('piilotetuilla tiedostovalitsimilla on saavutettavat nimet',()=>{assert.match(admin,/<input(?=[^>]*id=\"coverPicker\")(?=[^>]*aria-label=\"Kansikuvan tiedostovalitsin\")[^>]*>/);assert.match(admin,/<input(?=[^>]*id=\"bodyImagePicker\")(?=[^>]*aria-label=\"Tekstikuvan tiedostovalitsin\")[^>]*>/)});
test('näkymättömät yleisövalinnat eivät levennä viewportia ja mobiiliyläpalkki murtuu hallitusti',()=>{const css=fs.readFileSync('admin.css','utf8');assert.match(css,/\.audience-options input\{width:1px!important;height:1px!important/);assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.top-actions\{width:100%;display:grid;grid-template-columns:minmax\(0,1fr\) auto/);});
console.log(`\n${ok}/${ok} UI SEMANTICS -testiä läpi`);
