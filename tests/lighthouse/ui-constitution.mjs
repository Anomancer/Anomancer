import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('admin.html','utf8');
const css=fs.readFileSync('lighthouse-ui-constitution.css','utf8');
const responsive=fs.readFileSync('admin-responsive.css','utf8');
const shell=fs.readFileSync('admin-shell.js','utf8');
const admin=fs.readFileSync('admin.js','utf8');
const docs=fs.readFileSync('docs/architecture/lighthouse-ui-constitution.md','utf8');

for(const view of ['dashboard','workspaces','workspace','archive','runs','publications','settings','machine']){
  if(view==='workspace') assert.match(html,/data-shell-route="workspace"/);
  else assert.match(html,new RegExp(`data-shell-view="${view}"|data-shell-route="${view}"`),view);
}
assert.match(html,/id="lighthouseMenuButton"/);
assert.match(html,/id="lighthouseMenuDialog"/);
assert.match(html,/id="runsSurfaceHost"/);
assert.match(html,/id="publicationList"/);
assert.match(html,/id="settingsSurfaceHost"/);
assert.doesNotMatch(html,/<dialog[^>]+id="coreSettingsDialog"/);
assert.match(shell,/VALID_ROUTES=new Set\(\['dashboard'/);
assert.match(shell,/runExplorerDisclosure\.open=true/);
for(const token of ['--lhc-header-height','--lhc-content-width','--lhc-radius','--lhc-control-height'])assert.match(css,new RegExp(token));
assert.doesNotMatch(css,/@media\s*\(/,'Constitution ei saa omistaa viewport-breakpointteja');
assert.equal((css.match(/!important/g)||[]).length,0,'Constitution ei saa käyttää !important-escalointia');
assert.ok((responsive.match(/!important/g)||[]).length<=3,'Responsive owner saa pitää vain reduced-motion pakotukset');
for(const primitive of ['Shell','Page header','Panel','List','Form','Status','Empty state','Menu'])assert.match(docs,new RegExp(primitive));

assert.match(html,/aria-label="(?:Lighthouse|Avaa Lighthouse-työpöytä)"/);
assert.match(html,/data-theme-choice="light"/);
assert.match(css,/--lhc-content-width:1480px/);
assert.match(css,/\.editor-grid\[hidden\]/);
assert.match(css,/html\[data-theme="light"\]/);
assert.match(shell,/anomancer\.lighthouse\.theme\.v1/);

assert.match(html,/id="dashboardPublicationCount"/);
assert.match(html,/data-dashboard-action="publications"/);
for(const label of ['LIGHTHOUSE / MANCERIT','LIGHTHOUSE / AINEISTO','LIGHTHOUSE / ARKISTO','LIGHTHOUSE / KONEHUONE']){
  assert.match(html,new RegExp(`core-surface-head lighthouse-page-header[^>]*><div><p class=\"kicker\">${label.replace('/','\\/')}`));
}
assert.match(css,/--lhc-page-gap:24px/);
assert.match(css,/--lhc-section-gap:14px/);
assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(shell,/dashboardPublicationCount/);

// P2: semantic state and empty-state grammar.
for(const state of ['success','warning','error','neutral'])assert.match(css,new RegExp(`\\.lighthouse-status\\[data-state=\\"?${state}`));
assert.match(css,/\.lighthouse-empty-icon/);
assert.match(fs.readFileSync('admin-core.js','utf8'),/statusState\(value\)/);
assert.match(fs.readFileSync('admin-core.js','utf8'),/data-empty-context=\"runs\"/);
assert.match(fs.readFileSync('admin-workspaces.js','utf8'),/data-empty-context=\"mancers\"/);
assert.match(fs.readFileSync('admin-archive.js','utf8'),/data-empty-context=\"archive\"/);
assert.match(fs.readFileSync('admin.js','utf8'),/data-empty-context=\"publications\"/);
assert.match(docs,/P2 amendment · state and absence grammar/);

// P2.2: no ghost shell column, no invisible inert dispatch overlay, linear settings and lazy context rendering.
assert.match(css,/\.app\{[\s\S]*display:block/);
assert.match(css,/\.lighthouse-settings-page\{[\s\S]*grid-template-columns:minmax\(0,1fr\)/);
assert.match(admin,/previewShouldRender\(\)/);
assert.match(admin,/openDispatchLibrary:[\s\S]*publications/);
assert.match(shell,/id==='dispatches'[\s\S]*navigate\('publications'/);
assert.doesNotMatch(html,/data-editor-route="dispatches"/);
assert.match(fs.readFileSync('lighthouse-sw.js','utf8'),/anomancer-lighthouse-v1\.26\.1-cascade-consolidation/);


// P2.2.1 accessibility: tiny dashboard labels and online state must not fall back to dim text.
assert.match(css,/\.lighthouse-panel-kicker\{[^}]*color:var\(--lhc-muted\)/);
assert.match(css,/\[data-connection-state\]\[data-state=\"online\"\]\{color:var\(--lhc-success\)\}/);
assert.doesNotMatch(css,/\.lighthouse-panel-kicker\{[^}]*color:#716a79/);

console.log('✓ Lighthouse UI Constitution R1 + P2.2.1 · unified shell, rhythm, state, empty-state and geometry grammar');

// P2.4: home affordance, full-width editor, theme-safe tabs and archive/workspace resilience.
assert.match(html,/id="lighthouseHomeLink"/);
assert.match(shell,/lighthouseHomeLink[\s\S]*navigate\('dashboard'\)/);
assert.match(css,/\.editor-grid\{[\s\S]*width:min\(var\(--lhc-content-width\)/);
assert.match(css,/\.editor-tabs button\[aria-selected="true"\]/);
assert.match(css,/\.archive-view \.archive-metrics/);
assert.match(fs.readFileSync('admin-archive.js','utf8'),/host\.hidden=true;host\.innerHTML=''/);
assert.match(fs.readFileSync('admin-workspaces.js','utf8'),/data-workspace-retry/);

// P2.5: workspace header is in normal flow, success is quiet, compact actions and light-theme parity are explicit.
assert.match(css,/\.workspace-context-bar\{[\s\S]*position:relative[\s\S]*top:auto/);
assert.match(css,/\.workspace-save-indicator\[data-state="success"\][\s\S]*display:none/);
assert.match(fs.readFileSync('admin-feedback.js','utf8'),/normalized==='ok'\)\{clear\(\);return;\}/);
assert.match(responsive,/@media \(min-width:761px\)\{[\s\S]*\.workspace-context-actions button[\s\S]*height:32px/);
assert.match(css,/html\[data-theme="light"\] \.app input\[type="text"\][\s\S]*background:var\(--lhc-input-bg\)/);
assert.match(css,/html\[data-theme="light"\] \.archive-content-text[\s\S]*background:var\(--lhc-panel-soft\)/);
assert.match(fs.readFileSync('admin.css','utf8'),/html\[data-browser-engine="firefox"\] \.workspace-context-bar\{background:transparent!important;\}/);
