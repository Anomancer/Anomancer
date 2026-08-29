import fs from 'node:fs';
import path from 'node:path';
import {lighthouseLabAllowed} from '../core/authority/lab-policy.js';
import {listCapabilities} from '../core/capabilities/registry.js';
import {listInstalledMancerPackages} from '../server/mancer-registry.js';
import {CORE_VERSION} from '../server/core-registry.js';

const ROOT=process.cwd();
const SOURCE=path.join(ROOT,'app','lighthouse');
const PUBLIC=path.join(ROOT,'public');
const TARGET=path.join(PUBLIC,'lighthouse');
const LAB_HTML=path.join(PUBLIC,'lab.html');

if(!lighthouseLabAllowed(process.env)){
  fs.rmSync(LAB_HTML,{force:true});
  fs.rmSync(TARGET,{recursive:true,force:true});
  console.log('✓ Lighthouse Lab omitted from locked remote build');
  process.exit(0);
}

fs.mkdirSync(TARGET,{recursive:true});

for(const name of ['lab.js','lab.css','workspace-store.js']){
  fs.copyFileSync(path.join(SOURCE,name),path.join(TARGET,name));
}
const packageJson=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'));
const bootstrap={
  format:'anomancer-lighthouse-bootstrap/v1',
  lighthouseVersion:String(packageJson.version||''),
  coreVersion:String(CORE_VERSION||''),
  milestone:'M1 · Bounded Agency',
  capabilities:listCapabilities(),
  mancers:listInstalledMancerPackages().map(pkg=>({
    id:pkg.manifest.id,name:pkg.manifest.name,version:pkg.manifest.version,purpose:pkg.manifest.purpose,
    capabilities:Array.isArray(pkg.manifest.capabilities)?pkg.manifest.capabilities:[],
    orchestras:(pkg.orchestraRegistry?.orchestras||[]).map(item=>({id:item.id,name:item.name}))
  }))
};
const bootstrapJson=JSON.stringify(bootstrap).replace(/</g,'\\u003c');
const html=fs.readFileSync(path.join(SOURCE,'lab.html'),'utf8');
if(!html.includes('__LIGHTHOUSE_BOOTSTRAP__'))throw new Error('Lighthouse bootstrap placeholder missing.');
fs.writeFileSync(LAB_HTML,html.replace('__LIGHTHOUSE_BOOTSTRAP__',bootstrapJson));

console.log('✓ Lighthouse Lab built after main public build');
