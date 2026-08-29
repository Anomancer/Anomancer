import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('app/lighthouse/lab.css','utf8');

for(const token of [
  'LIGHTHOUSE 1.19.3 D1 VISUAL POLISH START',
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
  css.indexOf('LIGHTHOUSE 1.19.3 D1 VISUAL POLISH START') <
  css.indexOf('LIGHTHOUSE 1.19.3 D1 VISUAL POLISH END')
);

console.log('✓ Lighthouse 1.19.3 D1 Visual Polish');
