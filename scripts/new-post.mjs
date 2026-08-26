import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const cats = ['ai-work','info-media','work-decisions','money-risk','software-safety','language-learning','creativity-tools','society-systems'];
const audienceIds=['all','employee','entrepreneur','developer','teacher','creative','decision-maker','investor'];
const rl = readline.createInterface({input,output});
const slugify=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);
const q=async(text,def='')=>{const a=(await rl.question(`${text}${def?` [${def}]`:''}: `)).trim();return a||def;};
const lang=(await q('Kieli fi/en','fi')).toLowerCase()==='en'?'en':'fi';
const title=await q('Otsikko'); if(!title){console.error('Otsikko tarvitaan.');process.exit(1);}
console.log(`Kategoriat: ${cats.join(', ')}`);
let category=await q('Aihe','info-media'); if(!cats.includes(category)) category='info-media';
console.log(`Kenelle: ${audienceIds.join(', ')}`);
let audience=(await q('Kenelle (pilkulla eroteltuna)','all')).split(',').map(x=>x.trim()).filter(x=>audienceIds.includes(x)); if(!audience.length||audience.includes('all')) audience=['all'];
const description=await q('Kuvaus');
const slug=await q('Slug',slugify(title));
const date=await q('Päivä',new Date().toISOString().slice(0,10));
const draft=(await q('Luonnos? y/n','y')).toLowerCase().startsWith('y');
const translationKey=await q('Translation key',slug);
rl.close();
const dir=path.join(process.cwd(),'content',lang);fs.mkdirSync(dir,{recursive:true});
const prefix=date.replaceAll('-',''); let file=path.join(dir,`${prefix}-${slug}.md`); let n=2;while(fs.existsSync(file)){file=path.join(dir,`${prefix}-${slug}-${n++}.md`);}
const fm=`---\ntitle: ${JSON.stringify(title)}\ndate: ${JSON.stringify(date)}\ncategory: ${JSON.stringify(category)}\naudience: ${JSON.stringify(audience)}\ndescription: ${JSON.stringify(description)}\nslug: ${JSON.stringify(slug)}\nlang: ${JSON.stringify(lang)}\ntranslationKey: ${JSON.stringify(translationKey)}\nanswer: ""\nsources: []\nclaims: []\ndraft: ${draft}\n---\n\nKirjoita tähän.\n`;
fs.writeFileSync(file,fm);console.log(`✓ Luotu ${path.relative(process.cwd(),file)}`);console.log('Kun valmis: git add/commit/push → Vercel julkaisee masterin automaattisesti.');
