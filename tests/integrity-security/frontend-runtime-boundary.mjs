import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const migrated=['admin-overlays.js','admin.js','admin-workspaces.js','admin-shell.js','admin-core.js','admin-orchestrator.js'];
const runtime=read('admin-runtime.js');
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('✓ frontend runtime · '+name);};

test('runtime omistaa palvelurekisterin ja legacy-adapterit',()=>{
  assert.match(runtime,/const services=new Map\(\)/);
  assert.match(runtime,/function provide\(name,api/);
  assert.match(runtime,/function service\(name/);
  assert.match(runtime,/function when\(name/);
  assert.match(runtime,/legacyAliases:LEGACY_ALIASES/);
});

test('migreeratut moduulit käyttävät yhtä runtime-seamia',()=>{
  for(const file of migrated){const src=read(file);assert.match(src,/^import \{runtime\} from '\.\/admin-runtime\.js';/);assert.doesNotMatch(src,/window\.anomancer[A-Z]/,file+': suora anomancer-global jäi');}
});

test('migreeratut moduulit eivät ohita nimettyä event-bussia',()=>{
  for(const file of migrated){const src=read(file);assert.doesNotMatch(src,/window\.dispatchEvent\(new CustomEvent\('anomancer:/,file+': raw dispatch jäi');assert.doesNotMatch(src,/window\.addEventListener\('anomancer:/,file+': raw listener jäi');}
});

test('keskeiset providerit rekisteröityvät runtimeen',()=>{
  const expected={'admin-overlays.js':['overlays','dialogs'],'admin.js':['dirty','admin'],'admin-workspaces.js':['workspaces'],'admin-shell.js':['shell'],'admin-core.js':['core'],'admin-orchestrator.js':['orchestrator']};
  for(const [file,names] of Object.entries(expected)){const src=read(file),count=(src.match(/runtime\.provide\(/g)||[]).length;assert.ok(count>=names.length,file+': runtime provider puuttuu');}
});

test('build stageaa runtime-moduulin public-outputiin',()=>{assert.match(read('scripts/build-blog.mjs'),/'admin-runtime\.js'/);});

test('offline shell cacheaa runtime-moduulin ja installer kopioi koko lähdepuun',()=>{assert.match(read('lighthouse-sw.js'),/\/admin-runtime\.js/);const installer=read('INSTALL_TO_CURRENT.sh');assert.match(installer,/rsync -a --delete/);assert.doesNotMatch(installer,/--exclude='admin-runtime\.js'/);});

console.log('\n'+passed+'/'+passed+' FRONTEND RUNTIME BOUNDARY -porttia läpi');
