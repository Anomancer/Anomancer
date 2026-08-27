import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readAdminCss } from './read-admin-css.mjs';

const html=fs.readFileSync('admin.html','utf8');
const adminCss=readAdminCss();
const controlCss=fs.readFileSync('admin-responsive.css','utf8');
const js=fs.readFileSync('admin.js','utf8');
let ok=0;const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`)};

const mobile=controlCss.slice(controlCss.indexOf('MOBILE CONTROL PLANE REFLOW'));

test('Lisää-komentopinta elää body-tason portaalissa',()=>{
  assert.match(html,/id="mobileCommandPortal"/);
  assert.match(adminCss,/\.mobile-command-portal\{display:contents\}/);
  assert.match(js,/function syncMobileCommandHost\(\)/);
  assert.match(js,/portal\.append\(actions\)/);
});

test('yhteinen responsive-omistaja sisältää control-plane mobiilicascaden',()=>{
  assert.ok(mobile.length>1000);
  assert.match(mobile,/@media\(max-width:760px\)/);
  assert.match(html,/href="\/admin\.css"/);assert.doesNotMatch(html,/href="\/admin-control-plane\.css"/);
});

test('Core-mittarit reflowavat kahteen luettavaan sarakkeeseen',()=>{
  assert.match(mobile,/\.core-metrics\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(mobile,/\.core-metrics strong\{[^}]*white-space:nowrap/);
});

test('agentti- ja työkalurekisterit ovat puhelimessa yhden kortin levyisiä',()=>{
  assert.match(mobile,/\.core-agent-grid,\.core-tool-policy-grid\{grid-template-columns:minmax\(0,1fr\)\}/);
});

test('käyttömittarit ovat kaksi saraketta ja viimeinen voi käyttää koko rivin',()=>{
  assert.match(mobile,/\.core-usage-strip\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(mobile,/\.core-usage-strip article:last-child:nth-child\(odd\)\{grid-column:1\/-1\}/);
});

test('ajokortin hash ei enää putoa merkki per riville',()=>{
  assert.match(mobile,/\.core-run-row\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(mobile,/\.core-run-row>div:first-child>span:not\(\.core-run-status\)[^}]*text-overflow:ellipsis[^}]*white-space:nowrap/);
});

test('työtila- ja orkesteridialogit käyttävät visual viewportia ja yhtä lomakepalstaa',()=>{
  assert.match(mobile,/\.core-agent-dialog,\.core-workspace-dialog,\.core-orchestra-dialog,\.core-run-dialog\{[^}]*100dvw/);
  assert.match(mobile,/\.core-orchestra-form-meta\{grid-template-columns:minmax\(0,1fr\)/);
});

test('orkesterin agenttivalinta on mobiilissa kaksi saraketta',()=>{
  assert.match(mobile,/\.core-builder-agent-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('viewportin vaakavuoto katkaistaan control-plane-juuresta',()=>{
  assert.match(mobile,/html,body\{max-width:100%;overflow-x:clip\}/);
  assert.match(mobile,/\.app,\.workspace\{width:100%;overflow-x:clip\}/);
});

console.log(`\n${ok}/${ok} MOBILE CONTROL PLANE REFLOW 16.3.3 -testiä läpi`);
