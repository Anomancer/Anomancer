import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { readAdminCss, ADMIN_STYLE_FILES } from '../../scripts/read-admin-css.mjs';

const ROOT=process.cwd();
const chromiumCandidates=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/brave-browser','/snap/bin/chromium'].filter(Boolean);
const CHROMIUM=chromiumCandidates.find(p=>fs.existsSync(p));
assert.ok(CHROMIUM,`Chromium-pohjaista selainta ei löytynyt. Aseta CHROMIUM_BIN. Etsittiin: ${chromiumCandidates.join(', ')}`);
const outDir=path.join(ROOT,'.visual-regression','16.8.4');fs.rmSync(outDir,{recursive:true,force:true});fs.mkdirSync(outDir,{recursive:true});

const profile=fs.mkdtempSync(path.join(os.tmpdir(),'anomancer-visual-'));
const chrome=spawn(CHROMIUM,['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--allow-file-access-from-files','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let wsUrl='';
await new Promise((resolve,reject)=>{let buf='';const timer=setTimeout(()=>reject(new Error('Chromium DevTools ei käynnistynyt')),8000);chrome.stderr.on('data',d=>{buf+=d.toString();const m=buf.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){wsUrl=m[1];clearTimeout(timer);resolve();}});chrome.once('exit',c=>{if(!wsUrl){clearTimeout(timer);reject(new Error(`Chromium sulkeutui ${c}`));}});});
const ws=new WebSocket(wsUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});let seq=0;const pending=new Map();const eventWaiters=[];
ws.onmessage=e=>{const msg=JSON.parse(e.data);if(msg.id&&pending.has(msg.id)){const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);msg.error?reject(new Error(msg.error.message)):resolve(msg.result);return;}for(let i=eventWaiters.length-1;i>=0;i--){const w=eventWaiters[i];if(msg.method===w.method&&(!w.sessionId||msg.sessionId===w.sessionId)){eventWaiters.splice(i,1);w.resolve(msg);}}};
function send(method,params={},sessionId){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});}
function waitEvent(method,sessionId,ms=5000){return new Promise((resolve,reject)=>{const w={method,sessionId,resolve};eventWaiters.push(w);setTimeout(()=>{const i=eventWaiters.indexOf(w);if(i>=0)eventWaiters.splice(i,1);reject(new Error(`Event timeout: ${method}`));},ms);});}
const {targetId}=await send('Target.createTarget',{url:'about:blank'});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});await send('Page.enable',{},sessionId);await send('Runtime.enable',{},sessionId);await send('Accessibility.enable',{},sessionId);
const frameId=(await send('Page.getFrameTree',{},sessionId)).frameTree.frame.id;
const fixtureSource=fs.readFileSync(path.join(ROOT,'visual-fixtures','visual-system-1684.html'),'utf8');
const fixtureHtml=fixtureSource.replace(/<link[^>]+admin\.css[^>]*>/,`<style>${readAdminCss()}</style>`);

const matrix=[
 ['desktop-1440x900',1440,900,[]],['laptop-1024x768',1024,768,[]],['tablet-768x1024',768,1024,[]],['phone-390x844',390,844,[]],['phone-360x800',360,800,[]],
 ['phone-reduced-motion',390,844,[{name:'prefers-reduced-motion',value:'reduce'}]],['phone-more-contrast',390,844,[{name:'prefers-contrast',value:'more'}]],
];
let passed=0;
for(const [name,width,height,features] of matrix){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=768},sessionId);
  await send('Emulation.setEmulatedMedia',{media:'screen',features},sessionId);
  await send('Page.setDocumentContent',{frameId,html:fixtureHtml},sessionId);
  await send('Runtime.evaluate',{expression:'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))',awaitPromise:true},sessionId);
  const evalResp=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const vis=e=>{if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};const px=e=>parseFloat(getComputedStyle(e).fontSize);const buttons=[...document.querySelectorAll('button,select')].filter(vis);const ui=[...document.querySelectorAll('[data-ui-text]')].filter(vis);const meta=[...document.querySelectorAll('[data-meta]')].filter(vis);const focus=document.querySelector('#fixtureFocus');focus?.focus();const f=focus?getComputedStyle(focus):{outlineWidth:'0',outlineStyle:'none'};const shell=document.querySelector('.core-shell')?.getBoundingClientRect();const context=document.querySelector('.workspace-context-bar')?.getBoundingClientRect();return {url:location.href,title:document.title,buttonCount:buttons.length,bodyText:(document.body?.innerText||'').slice(0,80),innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth-innerWidth,minTarget:Math.min(...buttons.map(e=>e.getBoundingClientRect().height)),minUI:Math.min(...ui.map(px)),minMeta:Math.min(...meta.map(px)),focusOutline:parseFloat(f.outlineWidth)||0,focusStyle:f.outlineStyle,topChrome:(shell?.height||0)+(context?.height||0),dockVisible:vis(document.querySelector('.mobile-dock')),localNavVisible:vis(document.querySelector('.workspace-local-sidebar'))};})()`},sessionId);
  if(!evalResp.result?.value) throw new Error(`${name}: render-mittaus epäonnistui: ${evalResp.result?.description||JSON.stringify(evalResp.exceptionDetails||evalResp)}`);
  const m=evalResp.result.value;assert.ok(m.overflow<=1,`${name}: vaakavuoto ${m.overflow}px`);assert.ok(m.minTarget>=(width<=760?43.5:31.5),`${name}: toimintokohde ${m.minTarget}px`);assert.ok(m.minUI>=11.9,`${name}: UI-teksti ${m.minUI}px`);assert.ok(m.minMeta>=11.9,`${name}: metadata ${m.minMeta}px`);assert.ok(m.focusStyle!=='none'&&m.focusOutline>=1.9,`${name}: focus-ring puuttuu`);if(width<=760){assert.ok(m.dockVisible,`${name}: mobiilidokki puuttuu`);assert.equal(m.localNavVisible,false,`${name}: paikallinen rail näkyy mobiilissa`);assert.ok(m.topChrome<=120,`${name}: yläkromi ${m.topChrome}px`);}else{assert.equal(m.localNavVisible,false,`${name}: Constitutionin piilottama paikallinen rail palasi desktopille`);}
  const ax=await send('Accessibility.getFullAXTree',{},sessionId);const unnamed=ax.nodes.filter(n=>n.role?.value==='button'&&!String(n.name?.value||'').trim());assert.equal(unnamed.length,0,`${name}: nimeämättömiä nappeja ${unnamed.length}`);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},sessionId);const buf=Buffer.from(shot.data,'base64');assert.ok(buf.length>5000,`${name}: kuvakaappaus liian pieni`);fs.writeFileSync(path.join(outDir,`${name}.png`),buf);passed++;console.log(`✓ ${name} · ${width}×${height} · sha256 ${crypto.createHash('sha256').update(buf).digest('hex').slice(0,12)}…`);
}
const css=readAdminCss();
const tokens=fs.readFileSync('ui-tokens.css','utf8');
const manifest=fs.readFileSync('admin.css','utf8');
const responsive=fs.readFileSync('admin-responsive.css','utf8');
const componentFiles=ADMIN_STYLE_FILES.filter(f=>f!=='ui-tokens.css'&&f!=='admin-responsive.css');
const componentCss=componentFiles.map(f=>fs.readFileSync(f,'utf8')).join('\n');
assert.equal((componentCss.match(/@media/g)||[]).length,0,'Komponenttien media queryt kuuluvat responsive-omistajalle');
for(const token of ['--shell-height-desktop','--workspace-bar-height-desktop','--shell-height-mobile','--workspace-bar-height-mobile','--mobile-dock-height','--mobile-action-height','--safe-area-bottom','--layer-shell','--layer-feedback'])assert.match(tokens,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+':'),'Kanoninen UI-token puuttuu: '+token);
assert.match(responsive,/--mobile-dock-h:var\(--mobile-dock-height\)/);
assert.doesNotMatch(responsive,/:root\{--core-shell-height:(?:52|56|58)px/,'Mobiilishellin korkeus ei saa enää elää breakpointin raakaarvona');
assert.ok((responsive.match(/@media/g)||[]).length>=12,'Responsive-kerroksen kanoniset breakpointit puuttuvat');
assert.equal([...css.matchAll(/font-size\s*:\s*(\.?\d+(?:\.\d+)?)(rem|px)/g)].filter(m=>(m[2]==='rem'?Number(m[1])*16:Number(m[1]))<12).length,0,'Alle 12px suora font-size löytyi');
assert.equal([...css.matchAll(/font\s*:[^;{}]*?(\.?\d+(?:\.\d+)?)(rem|px)\//g)].filter(m=>(m[2]==='rem'?Number(m[1])*16:Number(m[1]))<12).length,0,'Alle 12px font-shorthand löytyi');
assert.ok((componentCss.match(/!important/g)||[]).length<=1,'Komponenttikerroksessa on liikaa !important-sääntöjä');
assert.ok((responsive.match(/!important/g)||[]).length<=3,'Responsive-kerroksessa on liikaa !important-sääntöjä');
assert.doesNotMatch(componentCss,/\/\*[^*]*\b16\.\d/i,'CSS-kommenteissa ei saa olla release-arkeologiaa');
for(const f of ADMIN_STYLE_FILES){assert.ok(fs.existsSync(f));assert.ok(manifest.includes(`@import url(\"${f}\");`),`Manifestista puuttuu ${f}`);}
passed++;console.log('✓ CSS ownership + typography + cascade policy');

await send('Target.closeTarget',{targetId});ws.close();const exited=new Promise(r=>chrome.once('exit',r));chrome.kill('SIGTERM');await Promise.race([exited,new Promise(r=>setTimeout(r,1000))]);try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:50});}catch{}
console.log(`\n${passed}/${passed} VISUAL SYSTEM 16.8.4 browser-porttia läpi · screenshots: .visual-regression/16.8.4`);
