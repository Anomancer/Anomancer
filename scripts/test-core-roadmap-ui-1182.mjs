import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';

const read=f=>fs.readFileSync(f,'utf8');
const CHROMIUM=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/brave-browser','/snap/bin/chromium'].filter(Boolean).find(fs.existsSync);
assert.ok(CHROMIUM,'Core roadmap UI -testi tarvitsee Chromiumin.');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'anomancer-core-roadmap-'));
const chrome=spawn(CHROMIUM,['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let wsUrl='';
await new Promise((resolve,reject)=>{let buf='';const timer=setTimeout(()=>reject(new Error('Chromium timeout')),8000);chrome.stderr.on('data',d=>{buf+=d;const m=String(buf).match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){wsUrl=m[1];clearTimeout(timer);resolve();}});});
const ws=new WebSocket(wsUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}};
const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
const source=read('core.html').replace(/<link[^>]+href="\/styles\.css"[^>]*>/,'').replace(/<link[^>]+href="\/core\.css"[^>]*>/,'').replace('</head>',`<style>${read('ui-tokens.css')}\n${read('styles.css')}\n${read('core.css')}</style></head>`);
let passed=0;
for(const [name,width,height] of [['desktop',1440,900],['phone',390,844],['narrow',360,800]]){
  const {targetId}=await send('Target.createTarget',{url:'about:blank'});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});await send('Page.enable',{},sessionId);await send('Runtime.enable',{},sessionId);const frameId=(await send('Page.getFrameTree',{},sessionId)).frameTree.frame.id;
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=680},sessionId);await send('Page.setDocumentContent',{frameId,html:source},sessionId);await send('Runtime.evaluate',{expression:'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))',awaitPromise:true},sessionId);
  const before=(await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const d=document.querySelector('.core-roadmap-details'),s=d.querySelector('summary'),r=s.getBoundingClientRect();s.focus();const cs=getComputedStyle(s);return{open:d.open,summaryHeight:r.height,overflow:document.documentElement.scrollWidth-innerWidth,focus:document.activeElement===s,outline:parseFloat(cs.outlineWidth)||0,name:s.innerText.trim()}})()`},sessionId)).result.value;
  assert.equal(before.open,false,`${name}: roadmap ei ole oletuksena suljettu`);assert.ok(before.summaryHeight>=44,`${name}: avauskohde liian pieni`);assert.ok(before.overflow<=1,`${name}: vaakavuoto suljettuna ${before.overflow}px`);assert.equal(before.focus,true,`${name}: summary ei saa fokusta`);assert.ok(before.outline>=2,`${name}: focus-ring puuttuu`);assert.ok(before.name.length>10,`${name}: avauskohteen nimi puuttuu`);
  await send('Runtime.evaluate',{expression:`document.querySelector('.core-roadmap-details summary').click();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`,awaitPromise:true},sessionId);
  const after=(await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const d=document.querySelector('.core-roadmap-details'),cards=[...d.querySelectorAll('.core-roadmap-grid article')],bad=cards.filter(c=>{const r=c.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5}).length;return{open:d.open,overflow:document.documentElement.scrollWidth-innerWidth,cards:cards.length,bad}})()`},sessionId)).result.value;
  assert.equal(after.open,true,`${name}: roadmap ei avaudu`);assert.ok(after.cards>=17,`${name}: roadmap-kortteja puuttuu`);assert.equal(after.bad,0,`${name}: roadmap-kortti vuotaa viewportista`);assert.ok(after.overflow<=1,`${name}: vaakavuoto avattuna ${after.overflow}px`);
  passed++;console.log(`✓ roadmap Chromium ${name} · ${width}×${height}`);await send('Target.closeTarget',{targetId});
}
ws.close();chrome.kill('SIGTERM');await new Promise(r=>setTimeout(r,200));fs.rmSync(profile,{recursive:true,force:true});
console.log(`\n${passed}/${passed} CORE ROADMAP UI 1.18.2 -porttia läpi`);
