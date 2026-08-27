import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('admin.html','utf8');
const css=fs.readFileSync('admin.css','utf8');
const js=fs.readFileSync('admin.js','utf8');
let ok=0;const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`)};

test('mobiilidokissa on viisi peukalonavigaation kohdetta',()=>{
  const dock=html.match(/<nav class="mobile-dock"[\s\S]*?<\/nav>/)?.[0]||'';
  assert.ok(dock);
  assert.equal((dock.match(/<button/g)||[]).length,5);
  for(const label of ['Lähetykset','Kirjoita','Evidenssi','Agentit','Lisää'])assert.match(dock,new RegExp(label));
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
});

test('Lisää avaa saman komentopinnan työtilalle, asetuksille ja julkaisuohjaukselle',()=>{
  assert.match(html,/class="mobile-quick-actions"/);
  assert.match(html,/id="workspaceSelect"/);
  assert.match(html,/id="mobileSettingsBtn"/);
  assert.match(html,/id="coreSettingsDialog"/);
  assert.match(js,/function setMobileMore\(open\)/);
});

test('lähetyslista on mobiilissa täyskorkea drawer eikä matala lista',()=>{
  assert.match(css,/\.sidebar\{z-index:74;width:min\(92vw,390px\);height:100dvh/);
});

test('tekstieditori käyttää mobiilissa selaimen zoomia välttävää 16px fonttia ja kunnollista työskentelykorkeutta',()=>{
  assert.match(css,/\.body-editor\{min-height:58dvh;max-height:none;font-size:16px/);
});

test('safe-area huomioidaan alapalkissa',()=>{
  assert.match(css,/--mobile-safe-bottom:env\(safe-area-inset-bottom,0px\)/);
  assert.match(css,/height:calc\(var\(--mobile-dock-h\) \+ var\(--mobile-safe-bottom\)\)/);
});

console.log(`\n${ok}/${ok} MOBILE WORKSPACE 16.3.2 -testiä läpi`);
