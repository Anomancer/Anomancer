import assert from "node:assert/strict";
import fs from "node:fs";

const read=f=>fs.readFileSync(f,"utf8");
const html=read("admin.html");
const css=read("lighthouse-workbench.css");
const pkg=JSON.parse(read("package.json"));

let passed=0;
const test=(name,fn)=>{fn();passed++;console.log(`✓ ${name}`);};

test("Workbench is a single editorial surface",()=>{
  assert.match(pkg.version,/^1\.35\./);
  assert.match(html,/id="workspaceContent"/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(css,/\.workspace-local-sidebar\{\s*display:none!important/);
});

test("The workbench does not persistently show machine controls",()=>{
  assert.match(css,/body\[data-workspace-template=\"editorial-platform\"\] \.workspace-context-actions \.workspace-switcher:not\(\.orchestra-switcher\)\{display:none\}/);
  assert.match(css,/\.preview-panel\{\s*display:none/);
  assert.match(css,/\.light-work-handoff\{\s*display:none!important/);
});

test("Dashboard is a continuation point, not a card wall",()=>{
  assert.match(read('admin-shell.css'),/\.lighthouse-dashboard \.lighthouse-dashboard-grid\{display:none\}/);
  assert.match(html,/Avaa nykyinen työ/);
});

console.log(`\n${passed}/3 WORKBENCH UX RESET -testiä läpi.`);
