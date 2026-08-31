import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const roots=['api','app','core','docs','mancers','scripts','server'];
const files=['package.json','vercel.json','README.md','CHANGELOG.md','DEPLOY_TO_PRODUCTION.sh'];
const forbidden=[
  /api\.github\.com/i,
  /\bGITHUB_(?:TOKEN|REPOSITORY|SHA|REF|ACTIONS)\b/i,
  /\bgh\s+pr\b/i,
  /\bgit\s+(?:add|commit|push|pull|checkout|branch|ls-files)\b/i,
  /github\s+actions/i,
  /pull\s+request/i,
  /git\.pull-request/i
];

function walk(dir){
  if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())return walk(full);
    return entry.isFile()?[full]:[];
  });
}

const candidates=[...roots.flatMap(walk),...files.filter(fs.existsSync)];
for(const file of candidates){
  const text=fs.readFileSync(file,'utf8');
  for(const rx of forbidden)assert.doesNotMatch(text,rx,`${file} palautti versionhallintariippuvuuden: ${rx}`);
}

assert.equal(fs.existsSync('.github'),false,'.github-hakemisto ei kuulu Vercel-direct-lähdepuuhun');
assert.equal(fs.existsSync('server/github.js'),false,'vanha GitHub-adapteri ei saa palata');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
assert.equal(pkg.scripts?.['deploy:prod'],'npm run check && vercel --prod');
assert.equal(Object.values(pkg.scripts||{}).some(value=>/\bgit\b|\bgh\b/.test(String(value))),false,'package scripts ei saa riippua Gitistä/GitHubista');
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
assert.equal(vercel.git?.deploymentEnabled,false,'automaattiset Git-deployt pitää olla globaalisti pois päältä');
assert.match(fs.readFileSync('scripts/new-post.mjs','utf8'),/npm run deploy:prod/);

console.log('✓ VCS independence · local source → release gate → direct Vercel production');
