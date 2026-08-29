import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const js=fs.readFileSync('app/lighthouse/lab.js','utf8');
const css=fs.readFileSync('app/lighthouse/lab.css','utf8');

for(const id of [
  'voiceInput','attachmentInput','attachmentSummary',
  'intentPreview','previewTitle','previewStart','previewEdit',
  'moreDepthButton','moreDepthMenu','moreDepthClose'
])assert.match(html,new RegExp(`id="${id}"`),id);

const door=html.match(/<main id="door"[\s\S]*?<\/main>/)?.[0]||'';
for(const forbidden of [
  /\bagent\w*/i,/orkester/i,/capabilit/i,/runtime/i,/token/i,
  /artifact/i,/\bMancer\b/i,/model router/i,/deepseek/i,/\bD[0-6]\b/
])assert.doesNotMatch(door,forbidden,`D0 leaked technical term ${forbidden}`);

const mobileNav=html.match(/<nav id="mobileDepthNav"[\s\S]*?<\/nav>/)?.[0]||'';
assert.match(mobileNav,/Miksi\?/);
assert.match(mobileNav,/Aineisto/);
assert.match(mobileNav,/Lisää/);
assert.doesNotMatch(mobileNav,/D[2-6]/);
assert.equal((mobileNav.match(/<button/g)||[]).length,3);

assert.match(html,/Miten tämä tehtiin\?/);
assert.match(html,/Konehuone/);
assert.match(js,/fetch\('\/api\/lab\/preview'/);
assert.match(js,/renderIntentPreview/);
assert.match(js,/addSelectedFiles/);
assert.match(js,/SpeechRecognition/);
assert.match(js,/openMoreDepthMenu/);
assert.match(css,/LIGHTHOUSE UX ARCHITECTURE V2 START/);
assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);

const appJs=fs.readFileSync('app/lighthouse/lab.js','utf8');
assert.doesNotMatch(appJs,/providers\/deepseek|deepseekReasoner|DEEPSEEK_/i);

console.log('✓ Lighthouse UX Architecture v2 · simple D0, explicit start gate, one-room mobile navigation');
