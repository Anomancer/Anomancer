import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {readAdminCss} from '../../scripts/read-admin-css.mjs';

const CHROMIUM=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/brave-browser','/snap/bin/chromium'].filter(Boolean).find(p=>fs.existsSync(p));
assert.ok(CHROMIUM,'Mancer UI tarvitsee Chromiumin.');
const outDir=path.resolve('.visual-regression/1.18.4');fs.mkdirSync(outDir,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'anomancer-mancer-ui-'));
const chrome=spawn(CHROMIUM,[
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-breakpad',
  '--disable-crash-reporter',
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  '--allow-file-access-from-files',
  '--remote-debugging-port=0',
  `--user-data-dir=${profile}`,
  'about:blank'
],{
  stdio:['ignore','ignore','pipe'],
  detached:process.platform!=='win32'
});
let wsUrl='';
await new Promise((resolve,reject)=>{let b='';const t=setTimeout(()=>reject(new Error('Chromium timeout')),8000);chrome.stderr.on('data',d=>{b+=d;const m=String(b).match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){wsUrl=m[1];clearTimeout(t);resolve();}});});
const ws=new WebSocket(wsUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
let seq=0;const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}};
const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
const {targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
await send('Page.enable',{},sessionId);await send('Runtime.enable',{},sessionId);await send('Accessibility.enable',{},sessionId);
const frameId=(await send('Page.getFrameTree',{},sessionId)).frameTree.frame.id;
const src=fs.readFileSync('visual-fixtures/mancer-118.html','utf8').replace(/<link[^>]+admin\.css[^>]*>/,`<style>${readAdminCss()}</style>`);
let passed=0;
for(const [name,width,height] of [['desktop',1440,900],['phone-360',360,800]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=760},sessionId);
  await send('Page.setDocumentContent',{frameId,html:src},sessionId);
  await send('Runtime.evaluate',{expression:'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))',awaitPromise:true},sessionId);
  const r=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};const controls=[...document.querySelectorAll('button,select,input,textarea,summary')].filter(visible);const form=getComputedStyle(document.querySelector('.mancer-form')).gridTemplateColumns;const details=document.querySelector('.mancer-contract-details');const first=document.querySelector('.mancer-form textarea,.mancer-form input,.mancer-form select');const control=getComputedStyle(first);return{innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(e=>e.getBoundingClientRect().height)),form,title:document.querySelector('h2').textContent.trim(),detailsOpen:details.open,text:document.body.innerText,firstControlTop:first.getBoundingClientRect().top,contractTop:details.getBoundingClientRect().top,commandbarHeight:document.querySelector('.mancer-commandbar').getBoundingClientRect().height,control:{backgroundColor:control.backgroundColor,color:control.color,borderStyle:control.borderStyle,borderWidth:control.borderWidth,borderRadius:control.borderRadius,paddingLeft:control.paddingLeft,fontSize:control.fontSize}}})()`},sessionId);
  const m=r.result.value;
  assert.ok(m.scrollWidth-m.innerWidth<=1,`${name}: horizontal overflow`);
  assert.ok(m.minTarget>=43.5,`${name}: control under 44px (${m.minTarget})`);
  assert.equal(m.title,'Tarkistus');
  assert.equal(m.detailsOpen,false,`${name}: tekniset sopimustiedot ovat oletuksena kiinni`);
  assert.doesNotMatch(m.text,/Human final authority|Package contract|\bReview\b/);
  assert.equal(m.control.borderStyle,'solid',`${name}: kontrollilta puuttuu eksplisiittinen reunus`);
  assert.notEqual(m.control.borderWidth,'0px',`${name}: kontrollin reunus katosi`);
  assert.equal(m.control.backgroundColor,'rgb(8, 8, 14)',`${name}: kontrolli ei käytä input-pintatokenia`);
  assert.equal(m.control.color,'rgb(255, 255, 255)',`${name}: kontrollin tekstikontrasti ei käytä vahvaa tekstitokenia`);
  assert.equal(m.control.borderRadius,'8px',`${name}: kontrollin kulmasäde irtosi tokenista`);
  assert.ok(parseFloat(m.control.paddingLeft)>=10,`${name}: kontrollin sisämarginaali on liian pieni`);
  assert.ok(m.contractTop>m.firstControlTop,`${name}: tekninen governance syrjäytti varsinaisen työn`);
  if(width===360){
    assert.equal(m.form.split(' ').length,1,`${name}: Mancer form ei reflowannut yhteen palstaan`);
    assert.ok(m.firstControlTop<520,`${name}: ensimmäinen työohjain alkaa liian myöhään (${m.firstControlTop}px)`);
    assert.ok(m.commandbarHeight<=72,`${name}: komentopalkki vie liikaa pystypinta-alaa (${m.commandbarHeight}px)`);
    assert.ok(parseFloat(m.control.fontSize)>=16,`${name}: mobiilikontrolli altistaa iOS-automaattizoomille`);
  }
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},sessionId);
  fs.writeFileSync(path.join(outDir,`mancer-${name}.png`),Buffer.from(shot.data,'base64'));
  passed++;console.log(`✓ Mancer UI ${name} · ${width}×${height}`);
}
await send('Target.closeTarget',{targetId});
ws.close();

async function waitForExit(proc,timeoutMs){
  if(proc.exitCode!==null||proc.signalCode!==null)return true;
  return new Promise(resolve=>{
    const onExit=()=>{clearTimeout(timer);resolve(true);};
    const timer=setTimeout(()=>{
      proc.off('exit',onExit);
      resolve(false);
    },timeoutMs);
    proc.once('exit',onExit);
  });
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function signalChrome(signal){
  try{
    if(process.platform!=='win32'&&chrome.pid){
      process.kill(-chrome.pid,signal);
    }else{
      chrome.kill(signal);
    }
  }catch(error){
    if(error?.code!=='ESRCH')throw error;
  }
}

signalChrome('SIGTERM');
if(!(await waitForExit(chrome,3000))){
  signalChrome('SIGKILL');
  await waitForExit(chrome,2000);
}

let profileCleaned=false;
for(let attempt=1;attempt<=30;attempt++){
  try{
    fs.rmSync(profile,{recursive:true,force:true});
    profileCleaned=true;
    break;
  }catch(error){
    if(!['ENOTEMPTY','EBUSY','EPERM'].includes(error?.code))throw error;
    await sleep(100);
  }
}

if(!profileCleaned&&fs.existsSync(profile)){
  console.warn(`⚠ Chromium temp profile jäi siivoamatta: ${profile}`);
}
console.log(`\n${passed}/${passed} MANCER UI 1.18.4 browser-porttia läpi`);
