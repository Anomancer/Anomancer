import assert from 'node:assert/strict';
import fs from 'node:fs';

const js=fs.readFileSync('app/lighthouse/lab.js','utf8');
const css=fs.readFileSync('app/lighthouse/lab.css','utf8');

assert.match(
  js,
  /LIGHTHOUSE 1\.25\.2 RESPONSIVE QA START/
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
  /LIGHTHOUSE 1\.25\.2 RESPONSIVE QA \/ MOBILE SURGERY START/
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

console.log('✓ Lighthouse 1.25.2 Responsive QA / Mobile Surgery');
