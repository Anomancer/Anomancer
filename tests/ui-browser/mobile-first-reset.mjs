import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readLighthouseCss} from '../../scripts/read-lighthouse-css.mjs';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const css=readLighthouseCss();
const workbenchCss=fs.readFileSync('lighthouse-workbench.css','utf8'); const responsiveCss=fs.readFileSync('admin-responsive.css','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
let ok=0; const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`)};

test('milestone is v1.36',()=>assert.equal(pkg.version,'1.36.0'));
test('mobile Lighthouse hides the mode switch and secondary dock tools',()=>{
  assert.match(css,/\.one-room-shell \.lighthouse-mode-switch,\s*\.one-room-shell \.door-form > \.composer-meta,\s*\.one-room-shell \.door-mark/);
  assert.match(css,/\.one-room-shell \.lighthouse-dock #kyvytOpen/); assert.match(css,/\.one-room-shell \.lighthouse-dock #infoOpen/);
});
test('mobile work view has one deep-inspection entry instead of three navigation buttons',()=>{
  assert.match(html,/id="mobileDepthNav"/);
  assert.match(css,/\.one-room-shell \.mobile-depth-nav button\[data-depth-target="trustDetails"\]/);
  assert.match(css,/\.one-room-shell \.mobile-depth-nav #moreDepthButton/);
});
test('mobile workbench collapses inactive editor tabs and shell chrome',()=>{
  assert.match(responsiveCss,/v1\.36 · MOBILE WORKBENCH MINIMAL MODE/);
  assert.match(responsiveCss,/\.editor-tabs button\[aria-selected="false"\]\{display:none!important\}/);
  assert.match(responsiveCss,/body\[data-workspace-template="editorial-platform"\] \.core-shell-nav,\s*body\[data-workspace-template="editorial-platform"\] \.core-shell \.connection-state/);
});
test('mobile runtime is bounded rather than a full diagnostics wall',()=>assert.match(css,/\.one-room-shell \.runtime-stages\{max-height:260px;overflow:auto/));

console.log(`\n${ok}/${ok} MOBILE FIRST RESET 1.36 tests passed`);
