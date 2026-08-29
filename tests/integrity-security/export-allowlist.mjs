import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

let ok=0;
const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`);};
const run=mode=>{
  const result=spawnSync(process.execPath,['scripts/export-bundle.mjs',mode,'--dry-run'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr||result.stdout);
  return JSON.parse(result.stdout);
};

const source=run('source');
const deploy=run('deploy');

await test('source bundle syntyy eksplisiittisestä allowlistista',()=>{
  assert.equal(source.format,'anomancer-export/v1');
  assert.equal(source.mode,'source');
  assert.ok(source.allowlist.rootFiles.length);
  assert.ok(source.allowlist.prefixes.length);
});
await test('deploy bundle syntyy erillisestä allowlistista',()=>{
  assert.equal(deploy.format,'anomancer-export/v1');
  assert.equal(deploy.mode,'deploy');
  assert.ok(deploy.allowlist.rootFiles.length);
  assert.ok(deploy.allowlist.prefixes.length);
});
await test('Lighthouse-arkkitehtuuri kuuluu sekä lähde- että runtime-vientiin',()=>{
  const sourceFiles=new Set(source.files.map(item=>item.path));
  const deployFiles=new Set(deploy.files.map(item=>item.path));

  for(const file of [
    'CONSTRUCTION_MODE_1.19.0.md',
    'app/lighthouse/lab.html',
    'catalog/capabilities.json',
    'core/intent/intent-service.js',
    'providers/deepseek/adapter.js',
    'tests/lighthouse/browser-e2e.mjs'
  ])assert.equal(sourceFiles.has(file),true,`source bundle missing ${file}`);

  for(const file of [
    'api/lab/intent.js',
    'catalog/capabilities.json',
    'core/intent/intent-service.js',
    'providers/deepseek/adapter.js'
  ])assert.equal(deployFiles.has(file),true,`deploy bundle missing ${file}`);
});
await test('jakelut eivät sisällä historiaa, salaisuuksia tai paikallista metadataa',()=>{
  for(const manifest of [source,deploy])for(const item of manifest.files){
    assert.doesNotMatch(item.path,/(?:^|\/)\.git(?:\/|$)|(?:^|\/)\.vercel(?:\/|$)|(?:^|\/)\.anomancer-backups(?:\/|$)|(?:^|\/)\.env(?:\.|$)|(?:^|\/)node_modules(?:\/|$)/);
  }
});

console.log(`\n${ok}/${ok} EXPORT ALLOWLIST -porttia läpi`);
