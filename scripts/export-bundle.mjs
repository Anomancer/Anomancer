import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT=path.resolve(process.cwd());
const mode=process.argv[2];
const dryRun=process.argv.includes('--dry-run');
if(!['source','deploy'].includes(mode))throw new Error('Käyttö: node scripts/export-bundle.mjs source|deploy [--dry-run]');

const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'));
const sourcePrefixes=['api/','app/','capabilities/','catalog/','content/','core/','docs/','mancers/','providers/','scripts/','server/','site/','tests/','visual-fixtures/'];
const sourceRoots=new Set([
  'INSTALL_TO_CURRENT.sh','index.html','en.html','core.html','core-en.html','CHANGELOG.md','CONTRIBUTING.md','LICENSE','README.md','SECURITY.md',
  'DEPLOY_TO_PRODUCTION.sh',
  'admin.html','admin.css','admin-shell.css','admin-workspace.css','admin-editorial.css','admin-narrative.css','admin-control-plane.css','admin-archive.css','admin-nanomancer.css','admin-mancer.css','admin-responsive.css',
  'admin.js','admin-runtime.js','admin-workspaces.js','admin-archive.js','admin-nanomancer.js','admin-mancer.js','admin-shell.js','admin-overlays.js','admin-feedback.js','admin-core.js','admin-agents.js','admin-orchestras.js','admin-machine-room.js','admin-orchestrator.js','admin-narramancer.js',
  'core.css','core-public.js','public-core-render.js','public-core-v3-render.js','site.js','styles.css','ui-tokens.css','narramancer-export.js','lahetyskone-pwa.js','lahetyskone-sw.js','seo-check.mjs',
  'entity-core.json','discovery-policy.json','favicon.svg','manifest.webmanifest','package.json','vercel.json'
]);
const deployPrefixes=['api/','capabilities/','catalog/','core/','mancers/','providers/','server/'];
const deployRoots=new Set(['package.json','vercel.json','entity-core.json','discovery-policy.json']);
const deniedCommon=/(^|\/)(?:\.git|\.vercel|node_modules|dist|\.anomancer-backups|ANOMANCER_IP_PRIVATE|IP_PRIVATE|\.private-ip)(\/|$)|(?:^|\/)(?:\.env[^/]*|.*(?:backup|secret|private-key).*)$/i;
const denied=rel=>deniedCommon.test(rel)||(mode==='source'&&/(^|\/)public(\/|$)/.test(rel));

function discover(){
  const out=[];
  const skipAnywhere=new Set(['.git','.github','.vercel','node_modules','dist','.anomancer','.anomancer-backups','.visual-regression','test-results']);
  const walk=(dir=ROOT)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const absolute=path.join(dir,entry.name),rel=path.relative(ROOT,absolute).split(path.sep).join('/');
    if(skipAnywhere.has(entry.name)||rel==='public')continue;
    if(entry.isDirectory())walk(absolute);else if(entry.isFile()||entry.isSymbolicLink())out.push(rel);
  }};
  walk();return out.sort();
}
function allowed(rel,prefixes,roots){return !denied(rel)&&(roots.has(rel)||prefixes.some(prefix=>rel.startsWith(prefix)));}
function digest(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function copy(rel,stage){const from=path.resolve(ROOT,rel),to=path.resolve(stage,rel),prefix=`${stage}${path.sep}`;if(!to.startsWith(prefix))throw new Error(`Turvaton vientipolku: ${rel}`);fs.mkdirSync(path.dirname(to),{recursive:true});const stat=fs.lstatSync(from);if(stat.isSymbolicLink()){fs.symlinkSync(fs.readlinkSync(from),to);return;}fs.copyFileSync(from,to);}
function publicFiles(){const base=path.join(ROOT,'public'),out=[];const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const absolute=path.join(dir,entry.name);if(entry.isDirectory())walk(absolute);else if(entry.isFile())out.push(path.relative(ROOT,absolute).split(path.sep).join('/'));}};walk(base);return out.sort();}

if(mode==='deploy'&&!dryRun){
  execFileSync(process.execPath,['scripts/build-blog.mjs'],{cwd:ROOT,stdio:'inherit'});
  execFileSync(process.execPath,['scripts/build-lighthouse.mjs'],{
    cwd:ROOT,
    stdio:'inherit',
    env:{
      ...process.env,
      VERCEL_ENV:process.env.VERCEL_ENV||(
        process.env.ANOMANCER_LIGHTHOUSE_LAB==='1'?'preview':'production'
      )
    }
  });
}
const selected=(mode==='source'
  ?discover().filter(rel=>allowed(rel,sourcePrefixes,sourceRoots))
  :[...discover().filter(rel=>allowed(rel,deployPrefixes,deployRoots)),...(fs.existsSync(path.join(ROOT,'public'))?publicFiles():[])]
).filter((rel,index,all)=>all.indexOf(rel)===index).sort();
if(!selected.length)throw new Error('Vientilistalle ei löytynyt tiedostoja.');
if(selected.some(rel=>denied(rel)))throw new Error('Vientilistalla on estetty polku.');

const manifest={format:'anomancer-export/v1',mode,version:pkg.version,createdAt:new Date().toISOString(),allowlist:{rootFiles:mode==='source'?[...sourceRoots].sort():[...deployRoots].sort(),prefixes:mode==='source'?sourcePrefixes:deployPrefixes},files:selected.map(rel=>({path:rel,sha256:digest(path.join(ROOT,rel))}))};
if(dryRun){process.stdout.write(`${JSON.stringify(manifest,null,2)}\n`);process.exit(0);}

const stage=fs.mkdtempSync(path.join(os.tmpdir(),`anomancer-${mode}-`));
try{
  for(const rel of selected)copy(rel,stage);
  fs.writeFileSync(path.join(stage,'EXPORT-MANIFEST.json'),`${JSON.stringify(manifest,null,2)}\n`);
  const outDir=path.join(ROOT,'dist');fs.mkdirSync(outDir,{recursive:true});
  const archive=path.join(outDir,`anomancer-${mode}-${pkg.version}.tar.gz`);
  execFileSync('tar',['-czf',archive,'.'],{cwd:stage,stdio:'inherit'});
  console.log(`✓ ${mode}-vientipaketti: ${archive} · ${selected.length} tiedostoa`);
}finally{fs.rmSync(stage,{recursive:true,force:true});}
