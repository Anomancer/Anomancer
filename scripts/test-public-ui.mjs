import assert from 'node:assert/strict';
import fs from 'node:fs';
import { splitAudience } from '../site.js';

let ok=0;
const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`);};

test('yleisölista pilkkoutuu oikealla whitespace-regexillä',()=>{
  assert.deepEqual(splitAudience('teacher   developer\tinvestor'),['teacher','developer','investor']);
});
test('julkinen UI on ulkoisessa moduulissa eikä build-templaten escape-ansassa',()=>{
  const build=fs.readFileSync('scripts/build-blog.mjs','utf8');
  const site=fs.readFileSync('site.js','utf8');
  assert.match(build,/src=\"\/site\.js\"/);
  assert.doesNotMatch(build,/<script>const catFilters/);
  assert.match(site,/split\(\/\\s\+\/\)/);
});
test('filtterit ylläpitävät aria-pressed-tilaa',()=>{
  const site=fs.readFileSync('site.js','utf8');
  assert.match(site,/setAttribute\('aria-pressed'/);
});
test('etusivuilla on skip-linkit ja optimoidut kuvat dimensioineen',()=>{
  for(const file of ['index.html','en.html']){
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,/class="skip-link"/);
    assert.match(html,/aatu-profile-bw\.webp" width="900" height="999"/);
    assert.match(html,/aatu-contact-red\.webp" width="900" height="900"/);
  }
});

console.log(`\n${ok}/${ok} PUBLIC UI -testiä läpi`);
