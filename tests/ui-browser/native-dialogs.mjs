import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {readAdminCss} from '../../scripts/read-admin-css.mjs';

const read=file=>fs.readFileSync(file,'utf8');
const runtimeEval=()=>read('admin-runtime.js').replace('export const runtime=','globalThis.__anomancerRuntime=');
const moduleEval=file=>read(file).replace(/^import \{runtime\} from '\.\/admin-runtime\.js';\n/,"const runtime=globalThis.__anomancerRuntime;\n");
const sources=['admin.js','admin-workspaces.js','admin-archive.js','admin-core.js','admin-agents.js','admin-orchestras.js','admin-orchestrator.js'];
const native=/(?<![.\w])(alert|confirm|prompt)\s*\(/g;
let passed=0;
function ok(name,fn){fn();passed++;console.log(`✓ ${name}`);}

ok('yhteinen async dialog API on olemassa',()=>{
  const js=read('admin-overlays.js');
  assert.match(js,/runtime\.provide\('dialogs',\{confirm:confirmDialog,prompt:promptDialog,form:formDialog,notice\}\)/);
  assert.match(js,/inertSelectors:\['#appView','#loginView','\.mobile-command-portal'\]/);
  assert.match(js,/lastTrigger/);
});

ok('native alert confirm prompt poistettu admin-poluilta',()=>{
  for(const file of sources){
    const matches=[...read(file).matchAll(native)];
    assert.equal(matches.length,0,`${file}: native dialogi jäi käyttöön`);
  }
  assert.match(read('lahetyskone-pwa.js'),/prompt\.prompt\(\)/,'PWA install-prompt säilyy eikä ole window.prompt');
});

ok('ihmisen toimivaltarajat käyttävät async vahvistusta',()=>{
  const joined=sources.map(read).join('\n');
  for(const marker of ['Poista lähetys','Vahvista lähteen tarkistus','Arkistoi työtila','Poista arkisto-objekti','Poista orkesteri','Sovella orkesterin ehdotus'])assert.match(joined,new RegExp(marker));
  assert.match(joined,/await runtime\.service\('dialogs'\)\.confirm/);
});

ok('kuvan alt ja caption ovat yhdessä lomakedialogissa',()=>{
  const js=read('admin.js');
  assert.match(js,/runtime\.service\('dialogs'\)\.form\(\{title:'Kuvan tiedot'/);
  assert.match(js,/name:'alt'/);assert.match(js,/name:'caption'/);
  assert.doesNotMatch(js,/(?<![.\w])prompt\s*\(/);
});

ok('dialogi on semanttisesti admin HTML:ssa ja mobiilityyli kuuluu CSS-ketjuun',()=>{
  const html=read('admin.html'),css=readAdminCss();
  assert.match(html,/id="coreSystemDialog"/);assert.match(html,/aria-labelledby="coreSystemDialogTitle"/);assert.match(html,/aria-describedby="coreSystemDialogMessage"/);
  assert.match(css,/\.core-system-dialog\{/);assert.match(css,/@media\(max-width:520px\)\{[\s\S]*?\.core-system-dialog/);
});

const CHROMIUM=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/brave-browser','/snap/bin/chromium'].filter(Boolean).find(p=>fs.existsSync(p));
assert.ok(CHROMIUM,'Native Dialog Consolidation tarvitsee Chromiumin.');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'anomancer-dialog-ui-'));
const chrome=spawn(CHROMIUM,['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let wsUrl='';
await new Promise((resolve,reject)=>{let b='';const t=setTimeout(()=>reject(new Error('Chromium timeout')),8000);chrome.stderr.on('data',d=>{b+=d;const m=String(b).match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){wsUrl=m[1];clearTimeout(t);resolve();}});});
const ws=new WebSocket(wsUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
let seq=0;const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}};
const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${readAdminCss()}</style></head><body><main id="loginView"></main><div id="appView"><button id="trigger">Poista</button></div><div class="mobile-command-portal"></div>${read('admin.html').match(/<dialog aria-labelledby="coreSystemDialogTitle"[\s\S]*?<\/dialog>/)[0]}</body></html>`;
for(const [name,width,height] of [['desktop',1440,900],['phone',360,800]]){
  const {targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
  await send('Page.enable',{},sessionId);await send('Runtime.enable',{},sessionId);
  const frameId=(await send('Page.getFrameTree',{},sessionId)).frameTree.frame.id;
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=760},sessionId);
  await send('Page.setDocumentContent',{frameId,html},sessionId);
  await send('Runtime.evaluate',{expression:runtimeEval()},sessionId);
  await send('Runtime.evaluate',{expression:moduleEval('admin-overlays.js')},sessionId);
  await send('Runtime.evaluate',{expression:`window.__result='pending';document.querySelector('#trigger').focus();window.anomancerDialogs.confirm('Poistetaanko objekti?',{title:'Poista objekti',details:'Tombstone säilyy.',confirmLabel:'Poista',destructive:true}).then(v=>window.__result=v);`},sessionId);
  await send('Runtime.evaluate',{expression:'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))',awaitPromise:true},sessionId);
  const state=(await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const d=document.querySelector('#coreSystemDialog'),r=d.getBoundingClientRect();return{open:d.open,inert:document.querySelector('#appView').hasAttribute('inert'),focus:document.activeElement.id,width:r.width,scrollWidth:document.documentElement.scrollWidth,innerWidth}})()`},sessionId)).result.value;
  assert.equal(state.open,true,`${name}: dialogi ei auennut`);assert.equal(state.inert,true,`${name}: tausta ei inert`);assert.equal(state.focus,'coreSystemConfirm',`${name}: fokus ei siirtynyt vahvistukseen`);assert.ok(state.width<=state.innerWidth+1,`${name}: dialogi vuotaa viewportista`);assert.ok(state.scrollWidth-state.innerWidth<=1,`${name}: vaakavuoto`);
  await send('Runtime.evaluate',{expression:`document.querySelector('#coreSystemConfirm').click()`},sessionId);
  await send('Runtime.evaluate',{expression:'new Promise(r=>setTimeout(r,0))',awaitPromise:true},sessionId);
  const closed=(await send('Runtime.evaluate',{returnByValue:true,expression:`({result:window.__result,open:document.querySelector('#coreSystemDialog').open,inert:document.querySelector('#appView').hasAttribute('inert'),focus:document.activeElement.id})`},sessionId)).result.value;
  assert.equal(closed.result,true,`${name}: confirm ei resolvannut true`);assert.equal(closed.open,false);assert.equal(closed.inert,false);assert.equal(closed.focus,'trigger',`${name}: fokus ei palautunut triggeriin`);
  passed++;console.log(`✓ async dialog Chromium ${name} · ${width}×${height}`);
  await send('Target.closeTarget',{targetId});
}
ws.close();chrome.kill('SIGTERM');await new Promise(r=>setTimeout(r,250));fs.rmSync(profile,{recursive:true,force:true});
console.log(`\n${passed}/${passed} NATIVE DIALOG CONSOLIDATION 1.18.4 checks passed.`);
