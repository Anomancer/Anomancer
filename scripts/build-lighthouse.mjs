import fs from 'node:fs';
import path from 'node:path';
import {lighthouseLabAllowed} from '../core/authority/lab-policy.js';
import {syncCapabilityPackageRegistry} from '../server/capability-package-registry.js';
import {listInstalledMancerPackages} from '../server/mancer-registry.js';
import {CORE_VERSION} from '../server/core-registry.js';

const ROOT=process.cwd();
const SOURCE=path.join(ROOT,'app','lighthouse');
const PUBLIC=path.join(ROOT,'public');
const TARGET=path.join(PUBLIC,'lighthouse');
const LAB_HTML=path.join(PUBLIC,'lab.html');
const LIGHTHOUSE_HTML=path.join(PUBLIC,'lighthouse.html');

syncCapabilityPackageRegistry();
const {listCapabilities}=await import('../core/capabilities/registry.js');

if(!lighthouseLabAllowed(process.env)){
  fs.rmSync(LAB_HTML,{force:true});
  fs.rmSync(LIGHTHOUSE_HTML,{force:true});
  fs.rmSync(TARGET,{recursive:true,force:true});
  console.log('✓ Lighthouse omitted by explicit application policy');
  process.exit(0);
}

fs.mkdirSync(TARGET,{recursive:true});

for(const name of ['lab.js','lab.css','workspace-store.js']){
  fs.copyFileSync(path.join(SOURCE,name),path.join(TARGET,name));
}
const assetSource=path.join(SOURCE,'assets');
if(fs.existsSync(assetSource))fs.cpSync(assetSource,path.join(TARGET,'assets'),{recursive:true});
const packageJson=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'));
const bootstrap={
  format:'anomancer-lighthouse-bootstrap/v1',
  lighthouseVersion:String(packageJson.version||''),
  coreVersion:String(CORE_VERSION||''),
  milestone:'M2 · Lighthouse Unification',
  capabilities:listCapabilities(),
  concepts:{
    lighthouse:'Sovelluskuori. Kevyt tila reitittää työn, Työpöytä avaa hallitun työympäristön.',
    mancer:'Rajattu työtila tai työtilatyyppi tiettyä tehtäväkenttää varten.',
    orchestra:'Työnkulku, joka järjestää agentit, kyvykkyydet, tarkistukset ja ihmisen hyväksynnät.',
    agent:'Rajattu rooli, jolla on oma tehtävä, luku- ja kirjoitusrajat sekä työkaluluvat.',
    capability:'Yksittäinen sallittu kyky, jonka agentti tai orkesteri voi käyttää.'
  },
  mancers:[
    {
      id:'anomancer',name:'Anomancer',version:'1.0.0',purpose:'Toimitus-, evidenssi- ja julkaisutyötila. Lähetykset, lähteet, evidenssi, orkesterit ja hallittu julkaisu kuuluvat tähän työmaailmaan.',
      capabilities:['content.read','content.write','media.write','publication.publish','runtime.manage','orchestra.custom','runs.read'],
      orchestras:[{id:'editorial',name:'Toimituksellinen orkesteri'}]
    },
    ...listInstalledMancerPackages().filter(pkg=>pkg.manifest.id!=='toimituskone').map(pkg=>({
      id:pkg.manifest.id,name:pkg.manifest.name,version:pkg.manifest.version,purpose:pkg.manifest.purpose,
      capabilities:Array.isArray(pkg.manifest.capabilities)?pkg.manifest.capabilities:[],
      orchestras:(pkg.orchestraRegistry?.orchestras||[]).map(item=>({id:item.id,name:item.name}))
    }))
  ]
};
const bootstrapJson=JSON.stringify(bootstrap).replace(/</g,'\\u003c');
const html=fs.readFileSync(path.join(SOURCE,'lab.html'),'utf8');
if(!html.includes('__LIGHTHOUSE_BOOTSTRAP__'))throw new Error('Lighthouse bootstrap placeholder missing.');
const rendered=html.replace('__LIGHTHOUSE_BOOTSTRAP__',bootstrapJson);
fs.writeFileSync(LAB_HTML,rendered);
fs.writeFileSync(LIGHTHOUSE_HTML,rendered);

console.log('✓ Lighthouse built: /lighthouse + legacy /lab artifact');
