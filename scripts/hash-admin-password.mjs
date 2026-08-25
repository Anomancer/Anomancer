import fs from 'node:fs';
import { hashPassword } from '../api/_lib/auth.js';
function promptHidden(label){if(!process.stdin.isTTY){throw new Error('Aja tämä interaktiivisessa terminaalissa.');}const fd=fs.openSync('/dev/tty','r+');process.stdout.write(label);try{process.stdin.setRawMode?.(true);let s='';const buf=Buffer.alloc(1);while(true){fs.readSync(fd,buf,0,1,null);const c=buf.toString();if(c==='\n'||c==='\r')break;if(c==='\u0003')process.exit(130);if(c==='\u007f'){s=s.slice(0,-1);continue}s+=c;}process.stdout.write('\n');return s;}finally{process.stdin.setRawMode?.(false);fs.closeSync(fd);}}
const a=promptHidden('Admin-salasana (väh. 12 merkkiä): ');const b=promptHidden('Uudelleen: ');if(a!==b)throw new Error('Salasanat eivät täsmää.');console.log(hashPassword(a));
