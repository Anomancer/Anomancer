import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readAdminCss } from './read-admin-css.mjs';

const html=fs.readFileSync('admin.html','utf8');
const js=fs.readFileSync('admin.js','utf8');
const css=readAdminCss();
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
let n=0;
function test(name,fn){fn();n++;console.log(`✓ ${name}`);}

test('Evidence Workbench näyttää valmiusmittarin ja julkaisuesteet ennen publish-dialogia',()=>{assert.match(html,/id="evidenceReadiness"/);assert.match(html,/id="evidenceBlockers"/);assert.match(js,/function evidenceSnapshot\(/);assert.match(js,/Lähde odottaa tarkistusta/);assert.match(js,/Tuettu väite .* tarvitsee tarkistetun lähteen/);});
test('lähteet lisätään rakenteisella composerilla ilman putkimuotoa',()=>{assert.match(html,/id="sourceComposerTitle"/);assert.match(html,/id="sourceComposerUrl"/);assert.match(html,/id="sourceAddBtn"/);assert.match(js,/function addSourceFromComposer\(/);assert.match(js,/origin:'human',verification:'verified'/);});
test('väitteet muokataan rakenteisina kortteina',()=>{assert.match(html,/id="claimReview"/);assert.match(html,/id="claimAddBtn"/);assert.match(js,/function renderClaimReview\(/);assert.match(js,/data-claim-field=\"status\"/);assert.match(js,/data-claim-source/);});
test('supported-väite näyttää väitekohtaisen porttiongelman ja estää ehdokaslähteen valinnan',()=>{assert.match(js,/claim\.status==='supported'/);assert.match(js,/ei kelpaa tuetun väitteen evidenssiksi/);assert.match(js,/claim-blocker/);assert.match(css,/\.claim-card\.has-blocker/);});
test('putki ja JSON säilyvät vain teknisenä edistyneenä pintana',()=>{assert.match(html,/Tekninen data · tuo tai korjaa raakamuotoa/);assert.match(html,/id="sources"/);assert.match(html,/id="claims"/);assert.match(css,/technical-evidence-data/);});
test('mobiilissa evidenssityöpinta reflowaa yhteen sarakkeeseen',()=>{assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.evidence-readiness\{grid-template-columns:1fr\}/);assert.match(css,/\.source-composer\{grid-template-columns:1fr\}/);});
test('release metadata ja check-portti ovat 16.8.4',()=>{assert.equal(pkg.version,'1.18.2');assert.match(pkg.scripts.check,/test-evidence-interaction-1683/);assert.match(html,/id="systemCoreVersion">1\.18\.2/);});

console.log(`\n${n}/7 EVIDENCE INTERACTION 16.8.4 -testiä läpi`);
