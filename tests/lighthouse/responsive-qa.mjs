import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('app/lighthouse/lab.html','utf8');
const js=fs.readFileSync('app/lighthouse/lab.js','utf8');
const css=fs.readFileSync('app/lighthouse/lab.css','utf8');
const build=fs.readFileSync('scripts/build-lighthouse.mjs','utf8');
const admin=fs.readFileSync('admin.js','utf8');

for(const id of ['doorNew','kyvytOpen','workOpen','infoOpen'])assert.match(html,new RegExp(`id="${id}"`),id);
assert.match(html,/id="kyvytDialog"[^>]*class="door-sheet"/);
assert.match(html,/id="recentWorkDetails"[^>]*class="door-sheet"/);
assert.match(html,/id="infoDialog"[^>]*class="door-sheet"/);
assert.doesNotMatch(html,/<details id="recentWorkDetails"/);
assert.match(html,/__LIGHTHOUSE_BOOTSTRAP__/);
assert.match(build,/listCapabilities/);
assert.match(build,/listInstalledMancerPackages/);
assert.match(build,/CORE_VERSION/);
assert.match(js,/LIGHTHOUSE D0 DOCK \/ CAPABILITY CATALOG START/);
assert.match(css,/LIGHTHOUSE D0 DOCK \/ MOBILE WIDTH GUARD START/);
assert.match(css,/width:calc\(100vw - 20px\)/);
assert.match(css,/overflow-x:hidden/);

assert.match(html,/id="doorLogin"[^>]*>Kirjaudu<\/button>/);
assert.match(js,/AUTH_RETURN_DRAFT_KEY/);
assert.match(js,/sessionStorage\.setItem\(AUTH_RETURN_DRAFT_KEY/);
assert.match(js,/sessionStorage\.getItem\(AUTH_RETURN_DRAFT_KEY/);
assert.match(js,/window\.location\.assign\('\/admin\.html\?return=%2Flab'\)/);
assert.match(admin,/ADMIN_RETURN_TARGETS=new Set\(\['\/lab'\]\)/);
assert.match(admin,/window\.location\.replace\(target\)/);
assert.doesNotMatch(admin,/window\.location\.replace\(new URLSearchParams/);
assert.match(css,/LIGHTHOUSE AUTH RETURN UX START/);

assert.match(
  js,
  /LIGHTHOUSE RESPONSIVE QA START/
);

assert.match(
  js,
  /button\.setAttribute\('aria-pressed',active\?'true':'false'\)/
);

assert.match(
  js,
  /event\.key!=='Escape'/
);

assert.match(
  js,
  /lastResponsiveDepthLauncher/
);

assert.match(
  js,
  /window\.scrollTo\(\{top:0,behavior:'auto'\}\)/
);

assert.doesNotMatch(
  js,
  /behavior:'instant'/
);

assert.match(
  css,
  /LIGHTHOUSE RESPONSIVE QA \/ MOBILE SURGERY START/
);

assert.match(
  css,
  /@media \(max-width:420px\)/
);

assert.match(
  css,
  /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/
);

assert.match(
  css,
  /input,\s*textarea,\s*select\s*\{[\s\S]*font-size:16px/
);

assert.match(
  css,
  /overflow-wrap:anywhere/
);

assert.match(
  css,
  /min-height:44px/
);

assert.match(
  css,
  /prefers-reduced-motion:reduce/
);

console.log('✓ Lighthouse Responsive QA / Mobile Surgery');
