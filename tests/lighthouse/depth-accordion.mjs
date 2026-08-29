import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const js=fs.readFileSync('app/lighthouse/lab.js','utf8');
const css=fs.readFileSync('app/lighthouse/lab.css','utf8');

const ids=[
  'trustDetails',
  'workspaceDetails',
  'orchestraDetails',
  'machineDetails',
  'coreDetails',
  'rawRuntimeDetails'
];

for(const id of ids){
  assert.match(html,new RegExp(`id="${id}"`),id);
  assert.match(js,new RegExp(`'${id}'`),id);
}

assert.match(js,/DEPTH_PANEL_IDS/);
assert.match(js,/closeOtherDepthPanels/);
assert.match(js,/panel\.addEventListener\('toggle'/);
assert.match(js,/if\(!panel\.open\)return/);
assert.match(js,/panel!==activePanel && panel\.open/);
assert.match(js,/panel\.open=false/);

assert.match(
  css,
  /LIGHTHOUSE 1\.24\.1 DEPTH ACCORDION START/
);

console.log('✓ Lighthouse 1.24.1 Depth Accordion');
