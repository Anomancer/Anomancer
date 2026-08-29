import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const js=fs.readFileSync('app/lighthouse/lab.js','utf8');
const css=fs.readFileSync('app/lighthouse/lab.css','utf8');

for(const id of [
  'continueForm',
  'workRetry',
  'doorRetry',
  'chainDetails',
  'chainList',
  'workProgress',
  'workError'
]){
  assert.match(html,new RegExp(`id="${id}"`),id);
}

assert.match(js,/metaKey|ctrlKey/);
assert.match(js,/workRetry/);
assert.match(js,/renderChain/);
assert.match(js,/turns\.slice\(0,-1\)/);
assert.match(js,/preventScroll:true/);
assert.match(js,/aria-busy/);
assert.match(css,/\.work-chain/);
assert.match(css,/\.error-box/);
assert.match(css,/\.composer-row/);

console.log('✓ Lighthouse D1 Work Surface Polish');
