import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('app/lighthouse/lab.css','utf8');

for(const token of [
  'LIGHTHOUSE D1 VISUAL POLISH START',
  '.result-card',
  '.continuation textarea',
  '.work-chain',
  '.chain-user',
  '.runtime',
  'button:focus-visible',
  '@media (hover:hover) and (pointer:fine)',
  '@media (max-width:520px)'
]){
  assert.match(css,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
}

assert.ok(
  css.indexOf('LIGHTHOUSE D1 VISUAL POLISH START') <
  css.indexOf('LIGHTHOUSE D1 VISUAL POLISH END')
);

console.log('✓ Lighthouse D1 Visual Polish');
