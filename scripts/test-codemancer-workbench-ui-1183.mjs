import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {readAdminCss} from './read-admin-css.mjs';

process.env.ANOMANCER_WORKSPACE_STORE='memory';
process.env.ANOMANCER_MANCER_ARTIFACT_STORE='memory';
const {__resetWorkspaceStoreForTests,upsertWorkspace,listWorkspaces,workspaceStoreStatus}=await import('../server/workspace-store.js');
const {listWorkspaceTemplates,listConstitutions}=await import('../server/workspace-templates.js');
const {artifactBoundaryForWorkspace}=await import('../server/artifact-boundary.js');
const {listMancerPackageHealth}=await import('../server/mancer-registry.js');
const {__resetMancerArtifactStoreForTests,loadMancerArtifact}=await import('../server/mancer-artifact-store.js');

__resetWorkspaceStoreForTests();__resetMancerArtifactStoreForTests();
const created=await upsertWorkspace({name:'Workbench Browser Lab',templateId:'codemancer/development-workbench/1.0.0'}),workspaceId=created.workspace.id;
const data=await listWorkspaces({includeArchived:true});
const payload={builtins:data.builtins,custom:data.custom,all:data.all,state:{format:data.state.format,coreVersion:data.state.coreVersion,revision:data.state.revision,updatedAt:data.state.updatedAt},store:workspaceStoreStatus(),templates:listWorkspaceTemplates(),constitutions:listConstitutions(),artifactBoundaries:Object.fromEntries(data.all.map(w=>[w.id,artifactBoundaryForWorkspace(w)])),mancerPackages:listMancerPackageHealth()};
const artifact=await loadMancerArtifact({workspace:created.workspace});
artifact.data.project={...artifact.data.project,name:'Workbench Lab',repository:'~/GitHub/Workbench',branch:'feature/workbench',goal:'Capability renderer vertical slice'};
artifact.data.code=[
 {id:'code-a',path:'src/core.js',language:'javascript',content:'export const core = true;\n',notes:'Core entry'},
 {id:'code-b',path:'src/ui.js',language:'javascript',content:'export function render(){\n  return "ui";\n}\n',notes:'UI renderer'}
];
artifact.data.tasks=[
 {id:'t1',title:'Renderer registry',status:'done',origin:'human',notes:'Generic registry'},
 {id:'t2',title:'Mobile drilldown',status:'doing',origin:'agent',notes:'Responsive ownership'},
 {id:'t3',title:'Release gate',status:'todo',origin:'orchestra',notes:'Human final authority'},
 {id:'t4',title:'Blocked probe',status:'blocked',origin:'human',notes:'Dependency'}
];
artifact.data.tests=[
 {id:'test-a',name:'Static workbench gate',status:'passed',command:'npm run test:codemancer-workbench',evidence:'8/8 PASS'},
 {id:'test-b',name:'Browser workbench gate',status:'passed',command:'node scripts/test-codemancer-workbench-ui-1183.mjs',evidence:'Browser PASS'}
];
artifact.data.review={summary:'Renderer-capabilityt korvaavat geneerisen CRUD-pinnan.',diff:'diff --git a/admin-mancer.js b/admin-mancer.js\n@@ renderer @@\n-old renderer\n+capability renderer',testState:'passing',decision:'approved'};
artifact.data.release={version:'1.18.3',check:'passing',notes:'Codemancer Workbench vertical slice',humanApproval:'approved'};
artifact.data.documentation=[{id:'doc-a',title:'README',kind:'readme',body:'# Workbench\n\nCapability renderer vertical slice.\n- Human approval remains final.'}];

const safe=value=>JSON.stringify(value).replace(/<\/script/gi,'<\\/script');
const mockApi=`<script>
const __WB_WORKSPACES=${safe(payload)};let __WB_ARTIFACT=${safe(artifact)};
const __wbWorkspace=id=>__WB_WORKSPACES.all.find(w=>w.id===id)||__WB_WORKSPACES.all.find(w=>w.id==='default');
const __wbJson=(data,status=200)=>Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}));
window.fetch=(input,init={})=>{const raw=typeof input==='string'?input:input?.url||'',url=new URL(raw,'https://anomancer.local/'),method=String(init.method||'GET').toUpperCase(),headers=new Headers(init.headers||{}),wid=headers.get('X-Anomancer-Workspace')||'default',resource=url.searchParams.get('resource');
 if(url.pathname==='/api/admin/auth')return __wbJson({ok:true,authenticated:true,csrf:'wb-csrf',github:{configured:false}});
 if(url.pathname==='/api/admin/content'&&resource==='posts')return __wbJson({ok:true,posts:[],workspace:__wbWorkspace(wid),artifact:__WB_WORKSPACES.artifactBoundaries[wid]});
 if(url.pathname==='/api/admin/content'&&resource==='mancer-artifact'){const workspace=__wbWorkspace(wid);if(method==='GET')return __wbJson({ok:true,workspace,boundary:__WB_WORKSPACES.artifactBoundaries[workspace.id],state:structuredClone(__WB_ARTIFACT),store:{configured:true,durable:false},humanFinalAuthority:true});const body=JSON.parse(String(init.body||'{}'));__WB_ARTIFACT={...__WB_ARTIFACT,revision:__WB_ARTIFACT.revision+1,data:structuredClone(body.data||{})};return __wbJson({ok:true,workspace,state:structuredClone(__WB_ARTIFACT),store:{configured:true,durable:false},saved:true,humanFinalAuthority:true});}
 if(url.pathname==='/api/admin/core'&&resource==='workspaces')return __wbJson({ok:true,...structuredClone(__WB_WORKSPACES)});
 if(url.pathname==='/api/admin/core'){if(resource==='runs')return __wbJson({ok:true,runs:[],items:[],total:0});if(resource==='archive')return __wbJson({ok:true,objects:[],receipts:[],revision:0,total:0,store:{configured:true,durable:false}});if(resource==='capabilities')return __wbJson({ok:true,capabilities:[]});if(resource==='agents')return __wbJson({ok:true,agents:[],runtime:[],routes:[]});if(resource==='orchestras')return __wbJson({ok:true,orchestras:[],custom:[]});if(resource==='runtime')return __wbJson({ok:true,profiles:[],runtime:[]});return __wbJson({ok:true,core:{},resource:resource||'core'});}
 return __wbJson({ok:false,error:'UNMOCKED',message:'Unmocked '+url.pathname},404);};
</script>`;
let source=fs.readFileSync('admin.html','utf8').replace(/<link[^>]+href="\/admin\.css"[^>]*>/,`<style>${readAdminCss()}</style>`);
source=source.replace('</head>',`<base href="https://anomancer.local/">${mockApi}</head>`);
const exportUrl=`data:text/javascript;base64,${Buffer.from(fs.readFileSync('narramancer-export.js','utf8')).toString('base64')}`;
source=source.replace(/<script src="\/([^\"]+)" type="module"><\/script>/g,(_,file)=>{let js=fs.readFileSync(file,'utf8');if(file==='admin-narramancer.js')js=js.replace('./narramancer-export.js',exportUrl);return `<script type="module">\n${js.replace(/<\/script/gi,'<\\/script')}\n</script>`;});

const candidates=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/brave-browser','/snap/bin/chromium'].filter(Boolean),CHROMIUM=candidates.find(p=>fs.existsSync(p));assert.ok(CHROMIUM,'1.18.3 workbench UI tarvitsee Chromiumin.');
const profile=fs.mkdtempSync(`${os.tmpdir()}/anomancer-wb-`),chrome=spawn(CHROMIUM,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let wsUrl='';await new Promise((resolve,reject)=>{let buf='';const timer=setTimeout(()=>reject(new Error('Chromium timeout')),8000);chrome.stderr.on('data',d=>{buf+=d;const m=String(buf).match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){wsUrl=m[1];clearTimeout(timer);resolve();}});});
const ws=new WebSocket(wsUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}};const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
const {targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});await send('Runtime.enable',{},sessionId);await send('Page.enable',{},sessionId);const frameId=(await send('Page.getFrameTree',{},sessionId)).frameTree.frame.id;
const bootstrap=`(()=>{const data=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data.has(String(k))?data.get(String(k)):null,setItem:(k,v)=>data.set(String(k),String(v)),removeItem:k=>data.delete(String(k)),clear:()=>data.clear(),key:i=>[...data.keys()][i]??null,get length(){return data.size}}});history.replaceState({},'',${JSON.stringify(`about:blank?workspace=${encodeURIComponent(workspaceId)}&view=workspace&section=code`)});return location.href;})()`;
await send('Runtime.evaluate',{expression:bootstrap,returnByValue:true},sessionId);await send('Page.setDocumentContent',{frameId,html:source},sessionId);
async function value(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function waitFor(expression,label,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){try{if(await value(expression))return;}catch{}await new Promise(r=>setTimeout(r,60));}let debug='';try{debug=await value(`JSON.stringify({href:location.href,title:document.title,ready:document.readyState,body:(document.body?.innerText||'').slice(0,1200),appHidden:document.querySelector('#appView')?.hidden,mancerHidden:document.querySelector('#mancerWorkspace')?.hidden,loginHidden:document.querySelector('#loginView')?.hidden,mancerApi:!!window.anomancerMancer,workspaceApi:!!window.anomancerWorkspaces,currentWorkspace:window.anomancerWorkspaces?.current?.()?.id,mancerActive:window.anomancerMancer?.isActive?.(),section:window.anomancerMancer?.activeSection?.(),panel:(document.querySelector('#mancerPanel')?.innerHTML||'').slice(0,500)})`);}catch{}throw new Error(`Timeout: ${label} :: ${debug}`);}
let passed=0;const ok=name=>{passed++;console.log(`✓ ${name}`)};
try{
 await waitFor(`!document.querySelector('#mancerWorkspace')?.hidden && !!document.querySelector('.mancer-code-workbench')`,'code workbench');
 const desktop=await value(`(()=>{const w=document.querySelector('.mancer-code-workbench'),s=getComputedStyle(w);return{columns:s.gridTemplateColumns,files:document.querySelectorAll('.mancer-item-index button').length,inspect:document.querySelector('.mancer-workbench-inspector')?.innerText||'',overflow:document.documentElement.scrollWidth-innerWidth}})()`);
 assert.equal(desktop.files,2);assert.equal(desktop.columns.split(' ').length,3);assert.match(desktop.inspect,/Repository-write/);assert.ok(desktop.overflow<=1);ok('Koodi renderöityy kolmipaneelisena file-tree → editor → inspector -työpöytänä');
 await value(`document.querySelectorAll('.mancer-item-index button')[1].click();true`);await waitFor(`document.querySelector('[data-mancer-path="content"]')?.value.includes('function render')`,'second file selected');assert.match(await value(`document.querySelector('.mancer-focus-head strong')?.textContent||''`),/src\/ui\.js/);ok('tiedostopuun valinta vaihtaa fokusoitua editori-itemiä');
 await value(`(()=>{const e=document.querySelector('[data-mancer-path="content"]');e.value+='// dirty\\n';e.dispatchEvent(new Event('input',{bubbles:true}));return !document.querySelector('#mancerSave').disabled})()`);assert.equal(await value(`document.querySelector('#mancerDirty')?.dataset.dirty`),'true');ok('code-editor käyttää samaa dirty/save-sopimusta kuin muu Core');
 await value(`window.anomancerMancer.selectSection('tasks')`);await waitFor(`!!document.querySelector('.mancer-task-board')`,'task board');assert.equal(await value(`document.querySelectorAll('.mancer-task-column').length`),4);ok('Tehtävät renderöityvät neljän tilan tehtävätauluksi');
 await value(`window.anomancerMancer.selectSection('tests')`);await waitFor(`!!document.querySelector('.mancer-test-summary')`,'test list');assert.equal(await value(`document.querySelectorAll('.mancer-test-card[data-tone="ok"]').length`),2);ok('Testit näyttävät tulosstatuksen ja evidenssin erikoispintana');
 await value(`window.anomancerMancer.selectSection('review')`);await waitFor(`!!document.querySelector('.mancer-review-grid')`,'review');const review=await value(`({add:document.querySelectorAll('.mancer-diff-view [data-kind="add"]').length,remove:document.querySelectorAll('.mancer-diff-view [data-kind="remove"]').length,evidence:document.querySelector('.mancer-review-evidence')?.innerText||''})`);assert.equal(review.add,1);assert.equal(review.remove,1);assert.match(review.evidence,/2\/2 läpi/);assert.match(review.evidence,/approved/);ok('Tarkistus sitoo diff-viewn, testitilan ja ihmisen päätöksen samaan pintaan');
 await value(`window.anomancerMancer.selectSection('release')`);await waitFor(`!!document.querySelector('.mancer-release-gates')`,'release gates');assert.equal(await value(`document.querySelectorAll('.mancer-release-gates>div').length`),4);assert.equal(await value(`document.querySelectorAll('.mancer-release-gates>div[data-tone="ok"]').length`),4);assert.match(await value(`document.querySelector('.mancer-release-layout .mancer-workbench-inspector')?.innerText||''`),/ei suorita Git-pushia/i);ok('Julkaisu näyttää neljä eksplisiittistä gatea ilman deploy-sivuvaikutusta');
 await value(`window.anomancerMancer.selectSection('documentation')`);await waitFor(`!!document.querySelector('.mancer-document-preview')`,'documentation');assert.match(await value(`document.querySelector('.mancer-document-preview article')?.innerText||''`),/Workbench/);await value(`(()=>{const e=document.querySelector('[data-mancer-path="body"]');e.value='# Päivitetty\\n\\nPreview elää.';e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);await waitFor(`/Preview elää/.test(document.querySelector('.mancer-document-preview article')?.innerText||'')`,'live doc preview');ok('Dokumentaatio tarjoaa item-listan, editorin ja turvallisen live-previewn');
 await send('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true},sessionId);await value(`window.anomancerMancer.selectSection('code')`);await waitFor(`!!document.querySelector('.mancer-code-workbench')`,'mobile code');const mobile=await value(`(()=>{const w=document.querySelector('.mancer-code-workbench'),e=document.querySelector('.mancer-code-editor textarea');return{cols:getComputedStyle(w).gridTemplateColumns,overflow:document.documentElement.scrollWidth-innerWidth,font:getComputedStyle(e).fontSize,indexDisplay:getComputedStyle(document.querySelector('.mancer-item-index')).display}})()`);assert.equal(mobile.cols.split(' ').length,1);assert.ok(mobile.overflow<=1,`overflow ${mobile.overflow}`);assert.ok(parseFloat(mobile.font)>=16);assert.equal(mobile.indexDisplay,'flex');ok('360×800 reflowaa yhteen työpalstaan ilman vaakavuotoa tai iOS-zoomiansaa');
}finally{await send('Target.closeTarget',{targetId}).catch(()=>{});ws.close();const exited=new Promise(r=>chrome.once('exit',r));chrome.kill('SIGTERM');await Promise.race([exited,new Promise(r=>setTimeout(r,800))]);try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:80});}catch{}}
console.log(`\n${passed}/${passed} CODEMANCER WORKBENCH 1.18.3 browser checks passed.`);
