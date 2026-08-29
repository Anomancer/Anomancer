import fs from 'node:fs';import path from 'node:path';
const r=process.cwd(),s=path.join(r,'app/lighthouse'),p=path.join(r,'public'),t=path.join(p,'lighthouse');
fs.mkdirSync(t,{recursive:true});
for(const f of ['lab.js','lab.css'])fs.copyFileSync(path.join(s,f),path.join(t,f));
fs.copyFileSync(path.join(s,'lab.html'),path.join(p,'lab.html'));
console.log('✓ Lighthouse Lab built');
