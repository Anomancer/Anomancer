import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const skipped=new Set(['.git','.github','node_modules','public','.vercel','.anomancer','.anomancer-backups','.visual-regression','test-results']);
function sourceFiles(dir=root){const out=[];for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(skipped.has(entry.name))continue;const abs=path.join(dir,entry.name),rel=path.relative(root,abs).replaceAll('\\','/');if(entry.isDirectory())out.push(...sourceFiles(abs));else if(entry.isFile()||entry.isSymbolicLink())out.push(rel);}return out;}
const files=sourceFiles().sort();
function fingerprint(rel){
  const p=path.join(root,rel),st=fs.lstatSync(p);
  if(st.isSymbolicLink())return `L:${fs.readlinkSync(p)}`;
  return `F:${crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}`;
}
const before=new Map(files.map(rel=>[rel,fingerprint(rel)]));
for(const [alias,target] of [['index.html','site/pages/index.html'],['en.html','site/pages/en.html'],['core.html','site/pages/core.html'],['core-en.html','site/pages/core-en.html']]){
  assert.equal(fs.lstatSync(alias).isSymbolicLink(),true,`${alias} ei ole source-yhteensopivuussymlinkki`);
  assert.equal(fs.readlinkSync(alias),target,`${alias} osoittaa väärään sourceen`);
  assert.equal(fs.existsSync(target),true,`${target} puuttuu`);
}
const run=spawnSync(process.execPath,['scripts/build-blog.mjs'],{encoding:'utf8'});
if(run.status!==0)throw new Error(`build epäonnistui\n${run.stdout}\n${run.stderr}`);
for(const [rel,hash] of before)assert.equal(fingerprint(rel),hash,`build muutti sourcea: ${rel}`);
for(const rel of ['public/index.html','public/en.html','public/core.html','public/en/core.html','public/lahetykset.html','public/dispatches.html','public/content-manifest.json','public/evidence-manifest.json','public/release-provenance.json'])assert.equal(fs.existsSync(rel),true,`public-output puuttuu: ${rel}`);
for(const rel of ['lahetykset','dispatches','lahetykset.html','dispatches.html','rss.xml','rss-en.xml','sitemap.xml','robots.txt','content-manifest.json','evidence-manifest.json','discovery-manifest.json','core-public.json','release-provenance.json','llms.txt'])assert.equal(fs.existsSync(rel),false,`legacy root build-output palasi: ${rel}`);
const buildSource=fs.readFileSync('scripts/build-blog.mjs','utf8');
assert.match(buildSource,/const SOURCE_PAGES = path\.join\(ROOT,'site','pages'\)/);
assert.match(buildSource,/function outputPath/);
assert.match(buildSource,/function renderStaticHome/);
assert.match(buildSource,/function renderPublicCoreFallback/);
assert.doesNotMatch(buildSource,/fs.writeFileSync(file,html)/);
console.log('✓ BUILD/SOURCE BOUNDARY · source immutable · output only public/');
