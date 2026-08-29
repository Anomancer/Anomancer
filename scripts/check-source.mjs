import fs from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';

const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const scripts=tracked.filter(file=>/\.(?:js|mjs)$/.test(file)&&!file.startsWith('public/'));
const json=tracked.filter(file=>file.endsWith('.json')&&!file.startsWith('public/'));
for(const file of scripts){const result=spawnSync(process.execPath,['--check',file],{stdio:'pipe',encoding:'utf8'});if(result.status!==0){process.stderr.write(result.stderr||result.stdout);throw new Error(`Syntaksitarkistus epäonnistui: ${file}`);}}
for(const file of json){try{JSON.parse(fs.readFileSync(file,'utf8'));}catch(error){throw new Error(`JSON-tarkistus epäonnistui (${file}): ${error.message}`);}}
console.log(`✓ Lähdekoodin kevyt tarkistus: ${scripts.length} JavaScript-tiedostoa · ${json.length} JSON-tiedostoa`);
