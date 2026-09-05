import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const html=read('app/lighthouse/lab.html');
const css=read('app/lighthouse/styles/95-runtime-rails.css');
const build=read('scripts/build-lighthouse.mjs');
const pkg=JSON.parse(read('package.json'));

let passed=0;
const test=(name,fn)=>{fn();passed++;console.log(`✓ ${name}`);};

test('Lighthouse on yksi päätyötila',()=>{
  assert.match(html,/body class="one-room-shell"/);
  assert.doesNotMatch(html,/class="lighthouse-mode-switch"/);
  assert.match(html,/class="one-room-heading"/);
  assert.match(html,/LÄHETYSKONE/);
});

test('Edistyneet pinnat ovat edelleen progressiivisesti avattavia',()=>{
  for(const id of ['workspaceDetails','orchestraDetails','machineDetails','coreDetails']){
    assert.match(html,new RegExp(`id="${id}"[^>]*data-one-room-secondary`));
  }
  assert.match(html,/id="depthInspector"/);
});

test('Työpöytähandoff ei ole enää päätilan identiteetti',()=>{
  assert.match(css,/\.one-room-shell \.work-nav-modes a:first-child\{display:none\}/);
  assert.match(css,/\.one-room-shell \.work-nav-modes a\.workbench-handoff/);
});

test('Version ja milestone ovat One Room -linjassa',()=>{
  assert.match(pkg.version,/^1\.33\./);
  assert.match(build,/M3 · One Room, One Machine/);
});

console.log(`\n${passed}/4 ONE ROOM -testiä läpi.`);
