import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LIGHTHOUSE_STYLE_FILES,readLighthouseCss} from '../../scripts/read-lighthouse-css.mjs';

const manifest=fs.readFileSync('app/lighthouse/lab.css','utf8');
const css=readLighthouseCss();
const constitution=fs.readFileSync('lighthouse-ui-constitution.css','utf8');
const responsive=fs.readFileSync('admin-responsive.css','utf8');
const adminManifest=fs.readFileSync('admin.css','utf8');
const build=fs.readFileSync('scripts/build-lighthouse.mjs','utf8');
assert.ok(LIGHTHOUSE_STYLE_FILES.length>=10);
for(const file of LIGHTHOUSE_STYLE_FILES){
  assert.match(manifest,new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.ok(fs.existsSync(`app/lighthouse/styles/${file}`),file);
}
assert.ok(Math.max(...LIGHTHOUSE_STYLE_FILES.map(file=>fs.readFileSync(`app/lighthouse/styles/${file}`,'utf8').split('\n').length))<900,'Lighthouse CSS module grew back into a monolith');
assert.equal([...css.matchAll(/font-size\s*:\s*(\.?\d+(?:\.\d+)?)(rem|px)/g)].filter(m=>(m[2]==='rem'?Number(m[1])*16:Number(m[1]))<12).length,0,'Lighthouse has direct text below 12px');
assert.match(css,/@media \(hover:none\) and \(pointer:coarse\)[\s\S]*min-height:44px/);
assert.match(css,/:focus-visible\{[\s\S]*outline:2px solid/);
assert.equal([...constitution.matchAll(/font-size\s*:\s*(\.?\d+(?:\.\d+)?)(rem|px)/g)].filter(m=>(m[2]==='rem'?Number(m[1])*16:Number(m[1]))<12).length,0,'Workbench Constitution has direct text below 12px');
assert.doesNotMatch(constitution,/@media\s*\(/,'Constitution viewport rules escaped canonical responsive owner');
assert.equal((constitution.match(/!important/g)||[]).length,0,'Constitution specificity escalation returned');
assert.ok((responsive.match(/!important/g)||[]).length<=3,'Responsive owner has more than reduced-motion !important rules');
const imports=[...adminManifest.matchAll(/@import url\("([^"]+)"\);/g)].map(m=>m[1]);
assert.ok(imports.indexOf('lighthouse-ui-constitution.css')<imports.indexOf('admin-responsive.css'),'Responsive owner must load after Constitution');
assert.match(build,/readLighthouseCss\(ROOT\)/);
assert.doesNotMatch(build,/cpSync\(styleSource/);
assert.match(fs.readFileSync('ui-tokens.css','utf8'),/--workspace-bar-height-mobile:44px/);
assert.match(fs.readFileSync('ui-tokens.css','utf8'),/--mobile-dock-height:62px/);
assert.match(fs.readFileSync('ui-tokens.css','utf8'),/--mobile-action-height:48px/);
assert.match(constitution,/html\[data-theme="light"\] \.preview h1[\s\S]*color:#f4effa/);
assert.match(responsive,/\.workspace-context-bar\{[\s\S]*?padding:8px 0 7px/);
assert.match(responsive,/\.lighthouse-menu-footer \.lighthouse-shell-mode-link::after\{content:none\}/);
console.log('✓ Lighthouse 1.26.4 frontend consolidation · modular CSS + canonical breakpoints + zero-!important Constitution');
