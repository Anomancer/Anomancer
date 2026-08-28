import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {loadMancerPackage,MANCER_RENDERER_CAPABILITIES} from '../server/mancer-registry.js';

const read=file=>fs.readFileSync(file,'utf8');
const ui=JSON.parse(read('mancers/codemancer/ui-schema.json'));
const manifest=JSON.parse(read('mancers/codemancer/manifest.json'));
const mancer=read('admin-mancer.js');
const css=read('admin-mancer.css');
const responsive=read('admin-responsive.css');
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log(`✓ ${name}`)};

test('Codemancer Package Spec ilmoittaa kahdeksan workbench-renderer-capabilitya',()=>{
  assert.equal(manifest.version,'1.1.0');
  assert.deepEqual(ui.rendererCapabilities,['file-tree','code-editor','diff-view','task-board','test-run-list','approval-review','release-gate','document-preview']);
  assert.deepEqual(ui.rendererCapabilities,MANCER_RENDERER_CAPABILITIES);
});

test('kuusi työosiota käyttää tehtäväkohtaista renderer-capabilitya',()=>{
  const expected={code:'code-editor',tasks:'task-board',tests:'test-run-list',review:'approval-review',release:'release-gate',documentation:'document-preview'};
  for(const [id,renderer] of Object.entries(expected))assert.equal(ui.sections.find(x=>x.id===id)?.renderer,renderer,`${id} renderer`);
  assert.equal(ui.sections.find(x=>x.id==='architecture')?.kind,'collection');
  assert.equal(ui.sections.find(x=>x.id==='project')?.kind,'form');
});

test('Mancer registry validoi capabilityt eikä päästä tuntematonta rendereria läpi',()=>{
  const pkg=loadMancerPackage(path.resolve('mancers/codemancer'));
  assert.deepEqual(pkg.uiSchema.rendererCapabilities,ui.rendererCapabilities);
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'anomancer-renderer-'));
  try{
    fs.cpSync('mancers/codemancer',path.join(tmp,'bad'),{recursive:true});
    const file=path.join(tmp,'bad','ui-schema.json'),bad=JSON.parse(read(file));bad.sections.find(x=>x.id==='code').renderer='quantum-pasta';fs.writeFileSync(file,JSON.stringify(bad));
    assert.throws(()=>loadMancerPackage(path.join(tmp,'bad')),/Unsupported Mancer section renderer/);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});

test('geneerinen Mancer-runtime sisältää renderer-rekisterin ilman työtilanimen kovakoodausta',()=>{
  assert.match(mancer,/const SECTION_RENDERERS=new Map\(\)/);
  assert.match(mancer,/function registerRenderer/);
  for(const renderer of ['code-editor','task-board','test-run-list','approval-review','release-gate','document-preview'])assert.ok(mancer.includes(`registerRenderer('${renderer}'`),`${renderer} puuttuu`);
  assert.doesNotMatch(mancer,/codemancer/i);
  assert.match(mancer,/rendererCapabilities:\(\)=>\[\.\.\.SECTION_RENDERERS\.keys\(\)\]/);
});

test('koodityöpöytä yhdistää file-tree-, editori- ja inspector-kerrokset ilman repository-writea',()=>{
  assert.match(mancer,/mancer-code-workbench/);
  assert.match(mancer,/mancer-item-index/);
  assert.match(mancer,/mancer-code-editor/);
  assert.match(mancer,/Repository-write vaatii erillisen hyväksytyn soveltamisvaiheen/);
  assert.doesNotMatch(mancer,/git push|vercel --prod|\/api\/admin\/(?:git|repo|repository)/i);
});

test('review ja release sitovat diff-, testi- ja ihmispäätöksen näkyväksi portiksi',()=>{
  assert.match(mancer,/function diffMarkup/);
  assert.match(mancer,/function renderApprovalReview/);
  assert.match(mancer,/function renderReleaseGate/);
  assert.match(mancer,/Testievidenssi/);
  assert.match(mancer,/Diffin tarkistus/);
  assert.match(mancer,/Ihmisen release-päätös/);
  assert.match(mancer,/Hyväksyntä on päätösdataa, ei sivuvaikutus/);
});

test('desktop-komponenttityyli ei ota responsive-omistajuutta takaisin',()=>{
  assert.doesNotMatch(css,/@media\s*\(/);
  for(const selector of ['.mancer-workbench{','.mancer-task-board{','.mancer-test-summary{','.mancer-review-grid{','.mancer-release-gates{','.mancer-document-preview{'])assert.ok(css.includes(selector),`${selector} puuttuu`);
  assert.match(responsive,/@media\(max-width:760px\)\{[\s\S]*?1\.18\.3 capability workbench mobile drilldown[\s\S]*?\.mancer-workbench\{grid-template-columns:minmax\(0,1fr\)/);
});

test('root/public peili säilyy build-sopimuksen mukaisena',()=>{
  const build=read('scripts/build-blog.mjs');
  assert.match(build,/admin-mancer\.css/);assert.match(build,/admin-mancer\.js/);assert.match(build,/admin-responsive\.css/);
});

console.log(`\n${passed}/${passed} CODEMANCER WORKBENCH 1.18.3 static checks passed.`);
