import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const read=file=>fs.readFileSync(file,'utf8');
const html=read('app/lighthouse/lab.html');
const css=read('app/lighthouse/lab.css');
const admin=read('admin.html');
const shell=read('admin-shell.js');
const adminRuntime=read('admin.js');
const nanomancer=read('admin-nanomancer.js');
const workbenchCss=[read('admin-shell.css'),read('lighthouse-workbench.css'),read('admin-responsive.css')].join('\n');

assert.doesNotMatch(html,/🎙|📎|Mancerit ja ajot|> Orkestra</);
assert.match(html,/data-voice-label/);
assert.match(html,/id="workbenchHandoff"/);
assert.match(admin,/id="mobileActionStrip"/);
assert.match(admin,/id="lightWorkHandoff"/);
assert.match(admin,/login-lighthouse-mark/);
assert.match(shell,/LIGHT_WORKSPACE_KEY='anomancer:lighthouse:workspaces:v1'/);
assert.match(shell,/data-mobile-command="publish"/);
assert.match(adminRuntime,/importLightWorkspace/);
assert.match(nanomancer,/if\(announce\|\|kind==='error'\)/);
assert.match(nanomancer,/status\('Nanomancerin rekisteriä ladataan…'\)/);

const chromiumExecutable=chromium.executablePath();
const headlessShell=chromiumExecutable.replace(/chromium-(\d+)[\\/]chrome-linux[\\/]chrome$/,process.platform==='win32'?'chromium_headless_shell-$1\\chrome-win\\headless_shell.exe':'chromium_headless_shell-$1/chrome-linux/headless_shell');
const browserExecutable=process.env.CHROMIUM_BIN||(fs.existsSync(headlessShell)?headlessShell:chromiumExecutable);
const browser=await chromium.launch({headless:true,executablePath:browserExecutable});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.setContent(`<style>${css}</style><nav class="lighthouse-mode-switch"><a class="mode-chip active"><span><strong>Kevyt tila</strong><small>Kerro tavoite</small></span></a><a class="mode-chip"><span><strong>Työpöytä</strong><small>Hallitut työtilat</small></span></a></nav><article class="result-card"><h1>käyttöliittymäkatselmus</h1></article>`);
  const light=await page.evaluate(()=>({
    modeHeight:document.querySelector('.mode-chip').getBoundingClientRect().height,
    overflowWrap:getComputedStyle(document.querySelector('.result-card h1')).overflowWrap,
    wordBreak:getComputedStyle(document.querySelector('.result-card h1')).wordBreak
  }));
  assert.ok(light.modeHeight>=44,`mode switch target ${light.modeHeight}px`);
  assert.equal(light.overflowWrap,'normal');
  assert.equal(light.wordBreak,'normal');

  await page.setContent(`<style>${workbenchCss}</style><header class="core-shell"><div class="core-shell-brand"><span class="core-shell-mark"></span><span><strong>LIGHTHOUSE</strong><small>Työpöytä</small></span></div><nav class="core-shell-nav"><a class="lighthouse-shell-mode-link">Kevyt tila</a></nav><div class="core-shell-status"><button class="core-settings-button">Asetukset</button></div></header><nav class="mobile-action-strip" data-editorial="true"><span class="mobile-action-state">TALLENTAMATON</span><button>Tallenna</button><button>Esikatsele</button><button>Julkaise</button></nav><nav class="mobile-dock"><button><span>•</span><small>Esikatselu</small></button></nav>`);
  const mobile=await page.evaluate(()=>({
    brand:getComputedStyle(document.querySelector('.core-shell-brand')).display,
    labelWhiteSpace:getComputedStyle(document.querySelector('.mobile-dock small')).whiteSpace,
    actionDisplay:getComputedStyle(document.querySelector('.mobile-action-strip')).display,
    actionHeight:document.querySelector('.mobile-action-strip button').getBoundingClientRect().height
  }));
  assert.notEqual(mobile.brand,'none');
  assert.equal(mobile.labelWhiteSpace,'normal');
  assert.equal(mobile.actionDisplay,'grid');
  assert.ok(mobile.actionHeight>=44,`mobile action target ${mobile.actionHeight}px`);

  await page.setContent(`<style>${workbenchCss}</style><main class="login-shell"><form class="login-card"><h1>Kirjaudu Lighthouseen</h1><label>Salasana<input></label><button>Kirjaudu sisään</button><div class="login-runtime"><span>Palvelu tavoitettavissa</span><button class="install-app-button">Asennusohje</button></div><p class="login-security">Suojattu 12 tunnin istunto · älä kirjaudu yhteiskäyttöisellä laitteella.</p></form></main>`);
  const login=await page.evaluate(()=>({
    viewport:innerWidth,
    scrollWidth:document.documentElement.scrollWidth,
    cardWidth:document.querySelector('.login-card').getBoundingClientRect().width
  }));
  assert.ok(login.scrollWidth-login.viewport<=1,`mobile login overflows: ${JSON.stringify(login)}`);
  assert.ok(login.cardWidth<=login.viewport-32,`mobile login card ${login.cardWidth}px`);
}finally{
  await browser.close();
}

console.log('✓ Lighthouse 1.24.6 UI/UX audit hardening · computed desktop/mobile contracts');
