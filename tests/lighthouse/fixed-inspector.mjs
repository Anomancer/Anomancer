import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readLighthouseCss} from '../../scripts/read-lighthouse-css.mjs';

const css=readLighthouseCss();

assert.match(
  css,
  /LIGHTHOUSE FIXED DESKTOP INSPECTOR START/
);

assert.match(
  css,
  /\.work,\s*\.work:has\(#workspaceDetails:not\(\[hidden\]\)\)\s*\{[\s\S]*grid-template-columns:minmax\(0,1fr\) 430px/
);

assert.match(
  css,
  /\.depth-inspector\s*\{[\s\S]*width:430px;[\s\S]*height:clamp\(560px,70dvh,690px\)/
);

assert.match(
  css,
  /\.depth-inspector-body\s*\{[\s\S]*overflow-y:auto/
);

assert.match(
  css,
  /scrollbar-gutter:stable/
);

console.log('✓ Lighthouse Fixed Desktop Inspector');
