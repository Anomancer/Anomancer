import fs from 'node:fs';
import path from 'node:path';
import { sourceVerificationIssues } from '../server/content.js';

const root=path.resolve(process.cwd(),'content');
let changedFiles=0,demotedSources=0,createdClaims=0;

for(const lang of fs.readdirSync(root)){
  const dir=path.join(root,lang);
  if(!fs.statSync(dir).isDirectory())continue;
  for(const name of fs.readdirSync(dir).filter(file=>file.endsWith('.md'))){
    const file=path.join(dir,name);
    const lines=fs.readFileSync(file,'utf8').split('\n');
    const sourceIndex=lines.findIndex(line=>line.startsWith('sources: '));
    const claimIndex=lines.findIndex(line=>line.startsWith('claims: '));
    if(sourceIndex<0||claimIndex<0)continue;
    const sources=JSON.parse(lines[sourceIndex].slice('sources: '.length));
    let claims=JSON.parse(lines[claimIndex].slice('claims: '.length));
    let changed=false;
    for(const source of sources){
      if(source.verification==='verified'&&sourceVerificationIssues(source).length){
        source.verification='candidate';
        demotedSources++;
        changed=true;
      }
    }
    if(sources.length&&!claims.length){
      claims=sources.map(source=>({
        status:'open',
        text:String(source.supports||`Lähde-ehdokas: ${source.title}`).trim().slice(0,600),
        evidence:[source.url],
        note:String(source.challenges||'Lähde odottaa ihmisen jäljitettävää varmennusta.').trim().slice(0,800),
      }));
      createdClaims+=claims.length;
      changed=true;
    }
    if(!changed)continue;
    lines[sourceIndex]=`sources: ${JSON.stringify(sources)}`;
    lines[claimIndex]=`claims: ${JSON.stringify(claims)}`;
    fs.writeFileSync(file,lines.join('\n'));
    changedFiles++;
  }
}

console.log(`Evidence-migraatio: ${changedFiles} tiedostoa · ${demotedSources} lähdettä ehdokkaiksi · ${createdClaims} avointa väitettä`);
