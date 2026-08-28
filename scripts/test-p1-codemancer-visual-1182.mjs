import assert from 'node:assert/strict';
import fs from 'node:fs';

let ok=0;
const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`);};
const read=file=>fs.readFileSync(file,'utf8');

test('kaikki käytetyt design-tokenit on määritelty tai niillä on fallback',()=>{
  const files=fs.readdirSync('.').filter(file=>file.endsWith('.css'));
  const css=files.map(read).join('\n');
  const definitions=new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(match=>match[1]));
  const unresolved=[];
  for(const match of css.matchAll(/var\(\s*(--[\w-]+)(\s*,)?/g)){
    if(!definitions.has(match[1])&&!match[2])unresolved.push(match[1]);
  }
  assert.deepEqual([...new Set(unresolved)].sort(),[]);
  assert.doesNotMatch(css,/var\(--(?:accent|border|panel-soft|color-success-strong|color-danger-strong)\)/);
});

test('Codemancer-kontrollit käyttävät yhteistä tummaa kontrollisopimusta',()=>{
  const css=read('admin-mancer.css');
  assert.match(css,/\.mancer-form :is\(input,select,textarea\)[\s\S]*?#mancerPanel :is\(input,select,textarea\)\[data-mancer-path\]/);
  for(const token of ['--tap-target','--color-border-input','--color-surface-input','--color-text-strong','--color-focus-border','--focus-ring']){
    assert.ok(css.includes(`var(${token})`),`${token} puuttuu Mancer-kontrolleista`);
  }
  assert.match(css,/color-scheme:dark/);
  assert.match(css,/font-family:var\(--font-mono\)/);
});

test('työohjaimet edeltävät teknistä governance-luukkua',()=>{
  const js=read('admin-mancer.js');
  const render=js.slice(js.indexOf('function renderPanel()'),js.indexOf('function renderShell()'));
  assert.match(render,/mancer-authority-badge/);
  assert.ok(render.indexOf('mancer-work-body')<render.indexOf('contractDetails()'));
  assert.match(js,/Ihminen hyväksyy/);
  assert.match(js,/Sopimuksen tekniset tiedot/);
  assert.doesNotMatch(js,/mancer-authority-note/);
});

test('mobiilihierarkia pitää komentopalkin tiiviinä ja estää kontrollien automaattizoomin',()=>{
  const css=read('admin-responsive.css');
  assert.match(css,/\.mancer-commandbar\{min-height:56px;align-items:center;flex-direction:row/);
  assert.match(css,/\.mancer-commandbar \.kicker,\.mancer-commandbar small,\.mancer-command-actions>span\{display:none\}/);
  assert.match(css,/\.mancer-form :is\(input,select,textarea\),#mancerPanel :is\(input,select,textarea\)\[data-mancer-path\]\{font-size:16px\}/);
  assert.match(css,/\.mancer-section-kind\{display:none\}/);
});

test('visuaalinen fixture ja Chromium-portti vartioivat P1-rakennetta',()=>{
  const fixture=read('visual-fixtures/mancer-118.html');
  assert.match(fixture,/mancer-authority-badge/);
  assert.ok(fixture.indexOf('mancer-work-body')<fixture.indexOf('mancer-contract-details'));
  const browser=read('scripts/test-mancer-ui-118.mjs');
  for(const metric of ['firstControlTop','contractTop','commandbarHeight','backgroundColor','fontSize'])assert.match(browser,new RegExp(metric));
  assert.match(browser,/tekninen governance syrjäytti varsinaisen työn/);
});

test('juuri- ja public-lähteet pysyvät identtisinä',()=>{
  for(const file of ['admin-mancer.js','admin-mancer.css','admin-responsive.css','admin-archive.css','admin-editorial.css','styles.css']){
    assert.equal(read(file),read(`public/${file}`),`${file} poikkeaa public-peilistä`);
  }
});

console.log(`\n${ok}/${ok} P1 CODEMANCER VISUAL SURGERY -testiä läpi`);
