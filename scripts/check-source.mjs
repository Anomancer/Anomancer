import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT=process.cwd();
const SKIP=new Set(['node_modules','public','.vercel','.anomancer','.visual-regression','test-results']);
const files=[];
function walk(dir,rel=''){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(SKIP.has(entry.name)||entry.name.startsWith('.anomancer-backups'))continue;
    const childRel=rel?`${rel}/${entry.name}`:entry.name;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full,childRel);
    else if(entry.isFile())files.push(childRel);
  }
}
walk(ROOT);
const scripts=files.filter(file=>/\.(?:js|mjs|cjs)$/.test(file));
const json=files.filter(file=>file.endsWith('.json'));
for(const file of scripts){
  const result=spawnSync(process.execPath,['--check',file],{stdio:'pipe',encoding:'utf8'});
  if(result.status!==0){process.stderr.write(result.stderr||result.stdout);throw new Error(`Syntaksitarkistus epäonnistui: ${file}`);}
}
for(const file of json){
  try{JSON.parse(fs.readFileSync(file,'utf8'));}
  catch(error){throw new Error(`JSON-tarkistus epäonnistui (${file}): ${error.message}`);}
}
console.log(`✓ Lähdekoodin tarkistus ilman versionhallintaa: ${scripts.length} JavaScript-tiedostoa · ${json.length} JSON-tiedostoa`);
