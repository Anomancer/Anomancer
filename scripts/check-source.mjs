import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

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

function checkScript(file){
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['--check',file],{stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    child.stdout.on('data',chunk=>{stdout+=chunk;});
    child.stderr.on('data',chunk=>{stderr+=chunk;});
    child.once('error',reject);
    child.once('close',code=>{
      if(code===0){resolve();return;}
      if(stderr)process.stderr.write(stderr);else if(stdout)process.stderr.write(stdout);
      reject(new Error(`Syntaksitarkistus epäonnistui: ${file}`));
    });
  });
}

const concurrency=Math.max(2,Math.min(8,os.availableParallelism?.()||4));
let cursor=0;
async function worker(){
  while(cursor<scripts.length){
    const file=scripts[cursor++];
    await checkScript(file);
  }
}
await Promise.all(Array.from({length:Math.min(concurrency,scripts.length||1)},()=>worker()));

for(const file of json){
  try{JSON.parse(fs.readFileSync(file,'utf8'));}
  catch(error){throw new Error(`JSON-tarkistus epäonnistui (${file}): ${error.message}`);}
}
console.log(`✓ Lähdekoodin tarkistus ilman versionhallintaa: ${scripts.length} JavaScript-tiedostoa · ${json.length} JSON-tiedostoa · ${concurrency} rinnakkaista syntax-workeria`);
