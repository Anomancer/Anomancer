import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';

const PUBLIC=path.resolve('public');
const AXE=path.resolve('node_modules/axe-core/axe.min.js');

if(!fs.existsSync('public/lab.html')){
  const build=spawnSync(process.execPath,['scripts/build-lighthouse.mjs'],{
    encoding:'utf8',
    env:{
      ...process.env,
      VERCEL_ENV:'development',
      ANOMANCER_LIGHTHOUSE_LAB:'1'
    }
  });
  assert.equal(build.status,0,build.stderr||build.stdout);
}

for(const file of [
  'public/lab.html',
  'public/lighthouse/lab.js',
  'public/lighthouse/lab.css',
  AXE
]){
  assert.ok(fs.existsSync(file),`Puuttuva Lighthouse browser fixture: ${file}`);
}

const types={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.png':'image/png',
  '.webp':'image/webp',
  '.svg':'image/svg+xml'
};

const server=http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://127.0.0.1').pathname;
  const relative=pathname.replace(/^\/+/, '')||'lab.html';
  const target=path.resolve(PUBLIC,relative);

  if(!target.startsWith(`${PUBLIC}${path.sep}`)||!fs.existsSync(target)){
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  response.writeHead(200,{
    'Content-Type':types[path.extname(target)]||'application/octet-stream'
  });
  fs.createReadStream(target).pipe(response);
});

await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const address=server.address();
const base=`http://127.0.0.1:${address.port}/lab.html`;

const payload={
  ok:true,
  result:{
    state:'completed',
    title:'Lighthouse browser gate',
    answer:'Tulos renderöityi oikean D0 → D1 -polun kautta.',
    questions:[],
    nextSteps:['Tarkista luottamuskerros.'],
    uncertainty:'',
    trust:{
      basis:['Käyttäjän antamat tiedot','Mallin päättely'],
      sources:[],
      assumptions:[],
      confidence:{level:'high',reason:'Deterministinen selainfixture.'}
    }
  },
  runtime:{
    capability:'llm.reasoning',
    provider:'fixture',
    model:'fixture-model',
    durationMs:42,
    orchestration:{
      format:'anomancer-orchestration/v1',
      mode:'direct',
      name:'Suora työpolku',
      summary:'Selainfixture',
      router:{mode:'fixed',status:'construction-mode',reason:'Selainfixture'},
      capabilities:[{id:'llm.reasoning',label:'Päättely',purpose:'Testi'}],
      mancers:[],
      mancerNote:'Ei Mancereita.',
      stages:[
        {id:'intent',label:'Pyyntö jäsennettiin',status:'completed',detail:'Valmis'},
        {id:'reasoning',label:'Päättely suoritettiin',status:'completed',detail:'Valmis'}
      ]
    },
    machine:{
      format:'anomancer-machine-runtime/v1',
      execution:{capability:'llm.reasoning',provider:'fixture',model:'fixture-model',latencyMs:42,transport:'test'},
      usage:{available:true,inputTokens:10,outputTokens:5,totalTokens:15},
      cost:{available:false,note:'Ei kustannusta.'},
      tools:[],
      toolSummary:'Ei työkaluja.',
      connections:{externalProvider:false,providerApiUsed:false,webSearchUsed:false},
      dataFlow:{workspaceContextSent:true,workspaceTitleSent:true,materialsSent:0,historyTurnsSent:0,destination:'fixture'},
      permissions:[]
    },
    core:{
      format:'anomancer-core-snapshot/v1',
      authority:{humanFinalAuthority:true,note:'Ihminen päättää.'},
      policy:{mode:'construction-mode',environment:{name:'development',labAllowed:true,authRequired:false},automaticModelMemory:false,automaticPublication:false,automaticExternalActions:false},
      storage:{workspaceStore:'browser-localStorage',automaticWorkspaceSave:true,synchronized:false,serverArchive:false,limits:{workspaces:12,materialsPerWorkspace:12,versionsPerWorkspace:20},note:'Paikallinen.'},
      contracts:[{layer:'D0/D1',name:'Intent',format:'anomancer-intent/v1'}],
      boundaries:{externalProviderUsed:false,webSearchUsed:false,workspaceContextSent:true,materialsSent:0,destination:'fixture',workspaceMaterialsAvailable:0},
      provenance:{traceCompleteness:{trust:true,workspace:true,orchestration:true,machine:true}}
    }
  }
};

function violations(result){
  return result.violations.map(item=>({
    id:item.id,
    impact:item.impact,
    targets:item.nodes.map(node=>node.target)
  }));
}

async function axe(page){
  if(!await page.evaluate(()=>Boolean(globalThis.axe))){
    await page.addScriptTag({path:AXE});
  }
  return page.evaluate(async()=>axe.run(document,{resultTypes:['violations']}));
}

async function prepare(page){
  await page.route('**/api/admin/auth?resource=session',route=>route.fulfill({
    status:200,
    contentType:'application/json',
    body:JSON.stringify({ok:true,authenticated:false})
  }));
  await page.route('**/api/lab/intent',route=>route.fulfill({
    status:200,
    contentType:'application/json',
    body:JSON.stringify(payload)
  }));
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'networkidle'});
}

async function submit(page){
  await page.locator('#q').fill('Testaa Lighthouse-polku selaimessa.');
  await page.locator('#go').click();
  await page.locator('#work').waitFor({state:'visible'});
}

const executable=process.env.CHROMIUM_BIN||chromium.executablePath();
let browser;

try{
  browser=await chromium.launch({headless:true,executablePath:executable});
  const desktop=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await desktop.newPage();
  await prepare(page);

  assert.deepEqual(violations(await axe(page)),[],'D0 accessibility');
  await submit(page);

  assert.equal(await page.locator('#title').evaluate(node=>node.tagName),'H1');
  assert.equal(await page.locator('#statePill').evaluate(node=>getComputedStyle(node).display),'none');
  assert.equal(await page.locator('#title').textContent(),'Lighthouse browser gate');

  const before=await page.locator('#resultCard').boundingBox();
  await page.locator('#desktopDepthTabs [data-depth-target="workspaceDetails"]').click();
  await page.locator('#materialTitle').fill('Selainmateriaali');
  await page.locator('#materialContent').fill('Aineisto säilyy paikallisessa työtilassa.');
  await page.locator('#materialForm button[type="submit"]').click();
  assert.equal(await page.locator('#materialCount').textContent(),'1');
  await page.locator('#saveVersion').click();
  assert.equal(await page.locator('#versionCount').textContent(),'1');

  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('anomancer:lighthouse:workspaces:v1')));
  assert.equal(stored.items.length,1);
  assert.equal(stored.items[0].materials.length,1);
  assert.equal(stored.items[0].versions.length,1);

  await page.locator('#desktopDepthTabs [data-depth-target="trustDetails"]').click();
  const after=await page.locator('#resultCard').boundingBox();
  assert.equal(Math.round(after.x),Math.round(before.x));
  assert.equal(Math.round(after.width),Math.round(before.width));
  assert.equal(await page.locator('#depthInspector').getAttribute('aria-modal'),null);
  assert.deepEqual(violations(await axe(page)),[],'desktop D1 + D2 accessibility');
  await desktop.close();

  const mobile=await browser.newContext({viewport:{width:390,height:844}});
  const phone=await mobile.newPage();
  await prepare(phone);
  await submit(phone);

  const width=await phone.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(width.scroll-width.inner<=1,`Mobiili vuotaa vaakasuunnassa: ${JSON.stringify(width)}`);
  assert.equal(await phone.locator('#statePill').evaluate(node=>getComputedStyle(node).display),'none');

  const depthButton=phone.locator('#mobileDepthNav [data-depth-target="trustDetails"]');
  await depthButton.click();
  assert.equal(await phone.locator('#depthInspector').isVisible(),true);
  assert.equal(await phone.locator('#resultCard').isVisible(),false);
  assert.equal(await phone.locator('#depthInspector').getAttribute('aria-modal'),null);
  assert.deepEqual(violations(await axe(phone)),[],'mobile D2 accessibility');

  await phone.locator('#depthBack').click();
  assert.equal(await phone.locator('#resultCard').isVisible(),true);
  await phone.waitForFunction(
    ()=>document.activeElement?.dataset?.depthTarget==='trustDetails'
  );
  assert.equal(
    await phone.evaluate(()=>document.activeElement?.dataset?.depthTarget||''),
    'trustDetails'
  );

  const controlHeights=await phone.evaluate(()=>[...document.querySelectorAll('button,input,textarea,select')]
    .filter(node=>{
      const style=getComputedStyle(node),box=node.getBoundingClientRect();
      return style.display!=='none'&&style.visibility!=='hidden'&&box.width>0&&box.height>0;
    })
    .map(node=>node.getBoundingClientRect().height));
  assert.ok(Math.min(...controlHeights)>=44);
  await mobile.close();

  console.log('✓ Lighthouse browser E2E · D0 → D1 → D2/D3 · desktop + mobile + axe');
}finally{
  await browser?.close();
  await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}
