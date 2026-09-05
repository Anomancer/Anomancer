import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readLighthouseCss} from '../../scripts/read-lighthouse-css.mjs';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const js=fs.readFileSync('app/lighthouse/lab.js','utf8');
const css=readLighthouseCss();

for(const id of [
  'mobileDepthNav',
  'depthInspector',
  'depthBack',
  'depthInspectorTitle',
  'desktopDepthTabs',
  'depthInspectorEmpty',
  'depthInspectorBody'
]){
  assert.match(html,new RegExp(`id="${id}"`),id);
}

for(const depth of [
  'trustDetails',
  'workspaceDetails',
  'orchestraDetails',
  'machineDetails',
  'coreDetails'
]){
  assert.match(
    html,
    new RegExp(`data-depth-target="${depth}"`),
    depth
  );
}

assert.match(js,/RESPONSIVE_DEPTHS/);
assert.match(js,/matchMedia\('\(min-width:1100px\)'\)/);
assert.match(js,/matchMedia\('\(max-width:719px\)'\)/);
assert.match(js,/moveDepthPanelsIntoInspector/);
assert.match(js,/showResponsiveDepth/);
assert.match(js,/closeResponsiveDepth/);
assert.match(js,/syncResponsiveShell/);
assert.match(js,/depth-screen-open/);

assert.match(css,/LIGHTHOUSE RESPONSIVE SHELL START/);
assert.match(css,/@media \(min-width:1100px\)/);
assert.match(css,/@media \(max-width:1099px\)/);
assert.match(css,/@media \(max-width:719px\)/);
assert.match(css,/@media \(min-width:720px\) and \(max-width:1099px\)/);
assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(330px,430px\)/);
assert.match(css,/\.work\.depth-screen-open #resultCard/);

/*
 * D0-D6 content contracts remain untouched by this shell test.
 * Responsive Shell only changes where existing surfaces live.
 */
console.log('✓ Lighthouse Responsive Shell');
