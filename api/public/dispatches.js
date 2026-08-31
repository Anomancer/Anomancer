import { listPosts } from '../../server/content-store.js';
import { parseMarkdown } from '../../server/content.js';
import { renderIndex, renderArticle } from '../../scripts/build-blog.mjs';

function param(req,key){
  try{return new URL(req.url||'/','http://anomancer.local').searchParams.get(key)||'';}catch{return'';}
}
function sendHtml(res,status,html){
  res.statusCode=status;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=300');
  return res.end(html);
}
export default async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;return res.end('Method Not Allowed');}
  try{
    const lang=param(req,'lang')==='en'?'en':'fi';
    const slug=param(req,'slug').trim();
    const files=await listPosts();
    const posts=files.map(file=>({...parseMarkdown(file.content,file.path),path:file.path,sha:file.sha}));
    if(!slug)return sendHtml(res,200,renderIndex(lang,posts));
    const post=posts.find(item=>item.lang===lang&&!item.draft&&item.slug===slug);
    if(post)return sendHtml(res,200,renderArticle(post,posts));
    const alias=posts.find(item=>item.lang===lang&&!item.draft&&(item.aliases||[]).includes(slug));
    if(alias){res.statusCode=308;res.setHeader('Location',`${lang==='en'?'/dispatches':'/lahetykset'}/${alias.slug}`);return res.end();}
    res.statusCode=404;res.setHeader('Content-Type','text/plain; charset=utf-8');return res.end(lang==='en'?'Dispatch not found.':'Lähetystä ei löytynyt.');
  }catch(error){
    console.error('public dispatch render failed',error);
    res.statusCode=503;res.setHeader('Content-Type','text/plain; charset=utf-8');return res.end('Public content storage is temporarily unavailable.');
  }
}
