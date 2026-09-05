import { readMedia } from '../../server/content-store.js';

function mediaPath(req){
  try{return new URL(req.url||'/','http://anomancer.local').searchParams.get('path')||'';}catch{return'';}
}
export default async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;return res.end('Method Not Allowed');}
  try{
    const item=await readMedia(mediaPath(req));
    if(!item){res.statusCode=404;return res.end('Not Found');}
    let body=item.body;
    if(!body&&item.stream)body=Buffer.from(await new Response(item.stream).arrayBuffer());
    res.statusCode=200;
    res.setHeader('Content-Type',item.contentType||'application/octet-stream');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400');
    if(item.etag)res.setHeader('ETag',item.etag);
    if(req.method==='HEAD')return res.end();
    return res.end(body);
  }catch(error){
    console.error('public media read failed',error);
    res.statusCode=503;return res.end('Media unavailable');
  }
}
