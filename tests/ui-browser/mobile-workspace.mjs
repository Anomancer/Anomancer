import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ANOMANCER_TEMPLATE_ID, getWorkspaceTemplate } from '../../server/workspace-templates.js';
import { readAdminCss } from '../../scripts/read-admin-css.mjs';

const html=fs.readFileSync('admin.html','utf8');
const css=readAdminCss();
const js=fs.readFileSync('admin.js','utf8');
const shell=fs.readFileSync('admin-shell.js','utf8');
let ok=0;const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`)};

test('mobiilidokki säilyttää viisi peukalopaikkaa mutta sisältö tulee työtilametadatasta',()=>{
  const dock=html.match(/<nav class="mobile-dock"[\s\S]*?<\/nav>/)?.[0]||'';
  const primary=getWorkspaceTemplate(ANOMANCER_TEMPLATE_ID).editorDefinition.navigation.mobilePrimary;
  assert.ok(dock);
  assert.equal((dock.match(/<button/g)||[]).length,0);
  assert.deepEqual(primary.map(x=>x.label),['Kirjoita','Evidenssi','Orkesteri','Esikatselu']);
  assert.match(shell,/mobilePrimary\.slice\(0,4\)/);
  assert.match(shell,/data-mobile-command="more"/);
  assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
});

test('desktopin editoritabit piilotetaan puhelimessa dokin tieltä',()=>{
  assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.editor-tabs\{display:none\}/);
});

test('vanha sticky julkaisualue ei kilpaile mobiilidokin kanssa',()=>{
  assert.match(css,/\.actions>#saveDraftBtn,\.actions>#publishBtn\{display:none\}/);
  assert.match(html,/id="mobileSaveBtn"/);
  assert.match(html,/id="mobilePublishBtn"/);
});

test('esikatselu on mobiilissa oma overlay-näkymä',()=>{
  assert.match(css,/body\.mobile-preview-open \.preview-panel\{display:flex\}/);
  assert.match(html,/id="mobilePreviewClose"/);
  assert.match(js,/function setMobilePreview\(open\)/);
  assert.match(js,/register\?\.\('editor-preview'/);
});

test('Lisää kokoaa työtilan toissijaiset reitit ja komennot yhteen bottom sheetiin',()=>{
  assert.match(html,/id="workspaceMobileSheet"/);
  assert.match(html,/id="mobileWorkspaceSelect"/);
  assert.match(html,/id="workspaceMobileCommands"/);
  assert.match(html,/id="coreSettingsDialog"/);
  assert.match(shell,/function setMobileSheet\(open/);
  assert.match(shell,/command==='settings'/);
});

test('lähetyslista on mobiilissa täyskorkea drawer eikä matala lista',()=>{
  assert.match(css,/\.sidebar\{z-index:74;width:min\(92vw,390px\);height:100dvh/);
});

test('tekstieditori käyttää mobiilissa selaimen zoomia välttävää 16px fonttia ja kunnollista työskentelykorkeutta',()=>{
  assert.match(css,/\.body-editor\{min-height:58dvh;max-height:none;font-size:16px/);
});

test('safe-area huomioidaan alapalkissa',()=>{
  assert.match(css,/--mobile-safe-bottom:env\(safe-area-inset-bottom,0px\)/);
  assert.match(css,/height:calc\(var\(--mobile-dock-h\) \+ var\(--mobile-safe-bottom\)/);
});

console.log(`\n${ok}/${ok} MOBILE WORKSPACE 16.3.2 COMPAT -testiä läpi`);
