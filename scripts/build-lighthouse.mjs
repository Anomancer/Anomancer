import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const SOURCE=path.join(ROOT,'app','lighthouse');
const PUBLIC=path.join(ROOT,'public');
const TARGET=path.join(PUBLIC,'lighthouse');
const LAB_HTML=path.join(PUBLIC,'lab.html');

const production=String(process.env.VERCEL_ENV||'')==='production';
const explicitlyEnabled=String(process.env.ANOMANCER_LIGHTHOUSE_LAB||'')==='1';

if(production&&!explicitlyEnabled){
  fs.rmSync(LAB_HTML,{force:true});
  fs.rmSync(TARGET,{recursive:true,force:true});
  console.log('✓ Lighthouse Lab omitted from production build');
  process.exit(0);
}

fs.mkdirSync(TARGET,{recursive:true});

for(const name of ['lab.js','lab.css','workspace-store.js']){
  fs.copyFileSync(path.join(SOURCE,name),path.join(TARGET,name));
}
fs.copyFileSync(path.join(SOURCE,'lab.html'),LAB_HTML);

console.log('✓ Lighthouse Lab built after main public build');
