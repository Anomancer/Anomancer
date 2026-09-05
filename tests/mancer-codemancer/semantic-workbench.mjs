import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CORE_VERSION} from '../../server/core-registry.js';
import {getWorkspaceTemplate} from '../../server/workspace-templates.js';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('admin.html','utf8');
const mancer=fs.readFileSync('admin-mancer.js','utf8');
const workspaces=fs.readFileSync('admin-workspaces.js','utf8');
const responsive=fs.readFileSync('admin-responsive.css','utf8');
const cssManifest=fs.readFileSync('admin.css','utf8');
const cssReader=fs.readFileSync('scripts/read-admin-css.mjs','utf8');
const coreFi=fs.readFileSync('core.html','utf8');
const ui=JSON.parse(fs.readFileSync('mancers/codemancer/ui-schema.json','utf8'));
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log(`✓ ${name}`);};

test('Lighthouse-rakennushaara säilyttää vakaan Coren',()=>{assert.match(pkg.version,/^1\.26\./);assert.equal(CORE_VERSION,'1.18.7');assert.match(html,/<dt>Lighthouse<\/dt><dd>1\.26\.\d+<\/dd>/);assert.match(html,/id="systemCoreVersion">—<\/dd>/);assert.doesNotMatch(html,/MANCER REGISTRY \/ 1\.18\.0|ARKISTONHOITAJA 1\.17\.3|NANOMANCER 1\.17\.2|ARCHIVE CORE 1\.17\.1/);});

test('Romancer on näkyvä nimi, legacy Narramancer-id säilyy',()=>{const template=getWorkspaceTemplate('narramancer/story-studio/1.0.0');assert.equal(template.name,'Romancer');assert.match(html,/ROMANCER \/ YKSITYINEN TARINASTUDIO/);assert.doesNotMatch(html,/>Narramancer</);assert.match(coreFi,/Romancer/);});

test('Codemancerin kone-id:t pysyvät, mutta näkyvät osiot ovat suomeksi',()=>{assert.deepEqual(ui.sections.map(x=>x.id),['project','architecture','code','tasks','tests','runs','review','release','documentation']);assert.deepEqual(ui.sections.map(x=>x.label),['Projekti','Arkkitehtuuri','Koodi','Tehtävät','Testit','Ajot','Tarkistus','Julkaisu','Dokumentaatio']);assert.deepEqual(ui.navigation.mobilePrimary.map(x=>x.label),['Projekti','Koodi','Testit','Tarkistus']);});

test('Review ja julkaisu näyttävät toimivaltarajan ennen sivuvaikutusta',()=>{const review=ui.sections.find(x=>x.id==='review'),release=ui.sections.find(x=>x.id==='release');assert.match(review.notice,/ei sovella koodia/i);assert.match(release.notice,/suunnitellaan, hyväksytään kirjallisesti ja suoritetaan erikseen/i);assert.match(mancer,/mancer-section-notice/);});

test('Mancerin tekninen sopimusmetadata on oletuksena details-luukun takana',()=>{assert.match(mancer,/mancer-contract-details/);assert.match(mancer,/Sopimuksen tekniset tiedot/);assert.doesNotMatch(mancer,/Human final authority|Package contract/);});

test('Mancer-kokoelman poisto on kumottavissa ennen tallennusta',()=>{assert.match(mancer,/lastRemoved/);assert.match(mancer,/data-mancer-undo/);assert.match(mancer,/Kumoa poisto/);assert.match(mancer,/Poista luonnoksesta/);});

test('Työtilakortit eivät näytä id:tä ja hashia ensisijaisena sisältönä',()=>{assert.match(workspaces,/workspace-tech-details/);assert.match(workspaces,/Tekniset tiedot/);assert.match(workspaces,/Pakettitiedot/);assert.doesNotMatch(workspaces,/human final authority|approval missing/);});

test('Mancer-komponenttityyli kuuluu sekä tuotannon CSS-manifestiin että browser-porttiin',()=>{assert.match(cssManifest,/admin-mancer\.css/);assert.match(cssReader,/admin-mancer\.css/);});

test('Kapealla puhelimella Lighthouse-identiteetti säilyy konsolidoidussa media-blokissa',()=>{assert.match(responsive,/@media\(max-width:420px\)\{[\s\S]*?\.core-shell\{grid-template-columns:auto minmax\(62px,1fr\) auto\}[\s\S]*?\.core-shell-brand\{display:flex\}[\s\S]*?\.core-shell-brand \.core-shell-mark\{display:grid\}/);assert.doesNotMatch(responsive,/@media\(max-width:420px\)\{[\s\S]*?\.core-shell-brand\{display:none\}/);});

console.log(`\n${passed}/${passed} SEMANTIC WORKBENCH 1.25 checks passed.`);
