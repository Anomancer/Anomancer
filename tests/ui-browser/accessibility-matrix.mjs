import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const ROOT=path.resolve(process.cwd()),PUBLIC=path.join(ROOT,'public'),RESULTS=path.join(ROOT,'test-results');
const axePath=path.join(ROOT,'node_modules','axe-core','axe.min.js');
const contentTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.webmanifest':'application/manifest+json'};

function resolvePublic(url=''){
  const pathname=new URL(url,'http://127.0.0.1').pathname;
  if(pathname==='/api/admin/auth')return null;
  const clean=decodeURIComponent(pathname).replace(/^\/+|\/+$/g,'');
  const candidates=clean?[path.join(PUBLIC,clean),path.join(PUBLIC,`${clean}.html`),path.join(PUBLIC,clean,'index.html')]:[path.join(PUBLIC,'index.html')];
  const target=candidates.find(file=>fs.existsSync(file)&&fs.statSync(file).isFile());
  if(!target||!target.startsWith(`${PUBLIC}${path.sep}`))return '';
  return target;
}

const server=http.createServer((req,res)=>{
  if(new URL(req.url,'http://127.0.0.1').pathname==='/api/admin/auth'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,authenticated:false,csrf:''}));return;}
  const file=resolvePublic(req.url);if(!file){res.writeHead(404);res.end('not found');return;}
  res.writeHead(200,{'Content-Type':contentTypes[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const article=fs.readdirSync(path.join(PUBLIC,'lahetykset')).find(file=>file.endsWith('.html'));
const routes=['/','/lahetykset','/dispatches','/core','/en/core',`/lahetykset/${article.replace(/\.html$/,'')}`,'/lahetyskone'];
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||chromium.executablePath(),headless:true});
fs.mkdirSync(RESULTS,{recursive:true});
const failures=[];
try{
  for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
    const context=await browser.newContext({viewport});
    for(const route of routes){
      const page=await context.newPage(),pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
      await page.goto(`${base}${route}`,{waitUntil:'networkidle'});await page.addScriptTag({path:axePath});
      const violations=await page.evaluate(async()=>{const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return result.violations.filter(item=>['critical','serious'].includes(item.impact)).map(item=>({id:item.id,impact:item.impact,nodes:item.nodes.slice(0,8).map(node=>node.target)}));});
      const targetIssues=await page.evaluate(()=>[...document.querySelectorAll('.site-header a,.menu-toggle,.category-filter,.audience-filter,.dispatch-filter-open,.core-public-button,.core-registry-details>summary')].filter(node=>{const style=getComputedStyle(node),r=node.getBoundingClientRect();return node.getClientRects().length&&style.visibility!=='hidden'&&style.display!=='none'&&(r.width<44||r.height<44);}).map(node=>({node:node.outerHTML.slice(0,180),width:Math.round(node.getBoundingClientRect().width),height:Math.round(node.getBoundingClientRect().height)})));
      const metaIssues=await page.evaluate(()=>[...document.querySelectorAll('.article-meta,.category-tag,.audience-tag,.footer small,.core-product-section-meta')].filter(node=>{const style=getComputedStyle(node);return node.getClientRects().length&&style.visibility!=='hidden'&&style.display!=='none'&&parseFloat(style.fontSize)<12;}).map(node=>({node:node.outerHTML.slice(0,160),fontSize:getComputedStyle(node).fontSize})));
      if(violations.length||targetIssues.length||metaIssues.length||pageErrors.length){const slug=`${viewport.name}-${route.replace(/[^a-z0-9]+/gi,'-')||'home'}`;await page.screenshot({path:path.join(RESULTS,`${slug}.png`),fullPage:true});failures.push({viewport:viewport.name,route,violations,targetIssues,metaIssues,pageErrors});}
      await page.close();
    }
    await context.close();
  }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
if(failures.length)fs.writeFileSync(path.join(RESULTS,'accessibility-failures.json'),`${JSON.stringify(failures,null,2)}\n`);
assert.deepEqual(failures,[],`Saavutettavuusmatriisi epäonnistui. Katso test-results/accessibility-failures.json (${failures.length} näkymää).`);
console.log(`✓ Saavutettavuusmatriisi: ${routes.length} reittiä · 2 viewportia · axe + 44 px kohteet + metateksti`);
