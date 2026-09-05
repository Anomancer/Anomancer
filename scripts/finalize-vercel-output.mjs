import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROUTE_COLLISIONS=[
  'lahetykset.html',
  'dispatches.html',
  'lahetykset',
  'dispatches',
];

function safeTarget(root,rel){
  const target=path.resolve(root,rel),prefix=`${root}${path.sep}`;
  if(!target.startsWith(prefix))throw new Error(`Turvaton public-output-polku: ${rel}`);
  return target;
}

export function finalizeVercelOutput(publicDir=path.join(process.cwd(),'public')){
  const root=path.resolve(publicDir);
  if(path.basename(root)!=='public')throw new Error(`Vercel-outputin pitää olla public-kansio: ${root}`);
  const removed=[];
  for(const rel of ROUTE_COLLISIONS){
    const target=safeTarget(root,rel);
    if(!fs.existsSync(target))continue;
    fs.rmSync(target,{recursive:true,force:true});
    removed.push(rel);
  }
  return removed;
}

const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
  const removed=finalizeVercelOutput();
  console.log(`✓ Vercel dynamic dispatch routes: ${removed.length} static collision(s) removed`);
}
