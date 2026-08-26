import crypto from 'node:crypto';
import { getSession, requireCsrf } from '../../server/auth.js';
import { json, readJson, sameOrigin } from '../../server/http.js';
import { putBase64File } from '../../server/github.js';

const TYPES={
  'image/webp':'webp',
  'image/jpeg':'jpg',
  'image/png':'png',
};
const MAX_BYTES=2*1024*1024;

function authorized(req,res){
  const session=getSession(req);
  if(!session){json(res,401,{ok:false,error:'AUTH'});return false;}
  if(!sameOrigin(req)||!requireCsrf(req,session)){json(res,403,{ok:false,error:'CSRF'});return false;}
  return true;
}
function slug(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\.[^.]+$/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)||'kuva';}
function validMagic(buf,mime){
  if(mime==='image/png')return buf.length>8&&buf.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if(mime==='image/jpeg')return buf.length>3&&buf[0]===0xff&&buf[1]===0xd8&&buf[2]===0xff;
  if(mime==='image/webp')return buf.length>12&&buf.subarray(0,4).toString('ascii')==='RIFF'&&buf.subarray(8,12).toString('ascii')==='WEBP';
  return false;
}

export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{ok:false,error:'METHOD'});
  if(!authorized(req,res))return;
  try{
    const body=await readJson(req,3_400_000);
    const raw=String(body.data||'');
    const m=raw.match(/^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=\r\n]+)$/);
    if(!m)return json(res,400,{ok:false,error:'IMAGE_DATA',message:'Kuvadatan formaatti on virheellinen.'});
    const mime=m[1],ext=TYPES[mime],base64=m[2].replace(/\s+/g,'');
    const bytes=Buffer.from(base64,'base64');
    if(!bytes.length||bytes.length>MAX_BYTES)return json(res,413,{ok:false,error:'IMAGE_SIZE',message:'Kuva on liian suuri uploadiin (max 2 Mt pakattuna).'});
    if(!validMagic(bytes,mime))return json(res,400,{ok:false,error:'IMAGE_MAGIC',message:'Kuvan sisältö ei vastaa ilmoitettua formaattia.'});
    const date=/^\d{4}-\d{2}-\d{2}$/.test(String(body.date||''))?String(body.date):new Date().toISOString().slice(0,10);
    const [year,month]=date.split('-');
    const file=`${slug(body.name)}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const path=`media/${year}/${month}/${file}`;
    const result=await putBase64File(path,base64,{message:`media: add ${file}`});
    return json(res,200,{ok:true,path,url:`/${path}`,mime,size:bytes.length,commitSha:result.commitSha,htmlUrl:result.htmlUrl});
  }catch(e){return json(res,e.statusCode||500,{ok:false,error:e.code||'MEDIA',message:e.message});}
}
