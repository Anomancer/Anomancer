import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {readLighthouseCss} from '../../scripts/read-lighthouse-css.mjs';

const read=file=>fs.readFileSync(file,'utf8');
const html=read('app/lighthouse/lab.html');
const css=readLighthouseCss();
const admin=read('admin.html');
const shell=read('admin-shell.js');
const adminRuntime=read('admin.js');
const nanomancer=read('admin-nanomancer.js');
const adminOrchestras=read('admin-orchestras.js');
const adminWorkspaces=read('admin-workspaces.js');
const workbenchCss=[read('ui-tokens.css'),read('admin-shell.css'),read('admin-workspace.css'),read('admin-editorial.css'),read('admin-nanomancer.css'),read('admin-control-plane.css'),read('lighthouse-workbench.css'),read('lighthouse-ui-constitution.css'),read('admin-responsive.css')].join('\n');

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
assert.match(adminOrchestras,/dialog\?\.closest\('\.editor-grid'\)\)document\.body\.append\(dialog\)/);
assert.match(adminOrchestras,/AbortController/);
assert.match(adminWorkspaces,/LOCAL_WORKSPACES_KEY='anomancer\.local\.workspaces\.v1'/);
assert.match(adminWorkspaces,/store\?\.degraded/);

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

  await page.setContent(`<style>${workbenchCss}</style><header class="workspace-context-bar"><div class="editor-title"><div><p class="kicker">TYÖTILA / ANOMANCER</p><strong id="editingLabel">Uusi lähetys</strong><small id="workspaceContextPurpose">Kirjoita, tarkista ja julkaise Anomancerin lähetyksiä.</small></div></div></header><nav class="mobile-action-strip"><button>Tallenna</button><button>Julkaise</button></nav><nav class="mobile-dock"><button><span>◇</span><small>Mancerit</small></button></nav>`);
  const density=await page.evaluate(()=>({
    workspaceHeight:document.querySelector('.workspace-context-bar').getBoundingClientRect().height,
    dockHeight:document.querySelector('.mobile-dock').getBoundingClientRect().height,
    actionHeight:document.querySelector('.mobile-action-strip').getBoundingClientRect().height,
    dockTarget:document.querySelector('.mobile-dock button').getBoundingClientRect().height
  }));
  assert.ok(density.workspaceHeight<=70,`workspace header too tall: ${density.workspaceHeight}px`);
  assert.ok(density.dockHeight<=62,`mobile dock too tall: ${density.dockHeight}px`);
  assert.ok(density.actionHeight<=48,`mobile action strip too tall: ${density.actionHeight}px`);
  assert.ok(density.dockTarget>=44,`mobile dock target ${density.dockTarget}px`);

  await page.setContent(`<style>${workbenchCss}</style><article class="workspace-home-card"><div class="workspace-home-card-main"><span>ANOMANCER</span><strong>Anomancer</strong><p>Toimitustyö ja julkaisut.</p></div></article><fieldset class="audience-field"><div class="audience-options"><label><input type="checkbox" checked><span>Kaikille</span></label></div></fieldset><aside class="preview-panel"><div class="preview-head"><span>LUONNOS</span></div><article class="preview"><h1>Otsikko</h1><p>Leipäteksti</p></article></aside><dialog class="core-agent-dialog" open><div class="core-agent-dialog-head"><div><h3>Yleisöadapteri</h3><p class="core-agent-dialog-id">audience</p></div><button>×</button></div><div class="core-agent-dialog-actions"><button>Palauta oletukset</button><div><button>Peruuta</button><button>Tallenna työtila</button></div></div></dialog><footer class="lighthouse-menu-footer"><span class="connection-state">Palvelu tavoitettavissa</span><a class="lighthouse-shell-mode-link">Kevyt tila</a><small>Lighthouse v1.27.0</small></footer>`);
  await page.evaluate(()=>document.documentElement.dataset.theme='light');
  const contrast=await page.evaluate(()=>{
    const card=document.querySelector('.workspace-home-card'),chip=document.querySelector('.audience-options span'),preview=document.querySelector('.preview'),previewTitle=document.querySelector('.preview h1'),dialogTitle=document.querySelector('.core-agent-dialog-head h3'),dialogClose=document.querySelector('.core-agent-dialog-head>button'),pair=[...document.querySelector('.core-agent-dialog-actions>div').children].map(e=>e.getBoundingClientRect()),mode=document.querySelector('.lighthouse-shell-mode-link');
    return {
      cardBg:getComputedStyle(card).backgroundColor,cardText:getComputedStyle(card.querySelector('strong')).color,
      chipBg:getComputedStyle(chip).backgroundColor,chipText:getComputedStyle(chip).color,
      previewBg:getComputedStyle(preview).backgroundColor,previewTitle:getComputedStyle(previewTitle).color,
      dialogTitle:getComputedStyle(dialogTitle).color,dialogClose:dialogClose.getBoundingClientRect().height,
      paired:pair.length===2&&Math.abs(pair[0].top-pair[1].top)<1,
      modePseudo:getComputedStyle(mode,'::after').content,modeFont:getComputedStyle(mode).fontSize
    };
  });
  assert.equal(contrast.cardBg,'rgb(255, 255, 255)');
  assert.notEqual(contrast.cardText,contrast.cardBg);
  assert.notEqual(contrast.chipText,contrast.chipBg);
  assert.equal(contrast.previewBg,'rgb(9, 5, 15)');
  assert.equal(contrast.previewTitle,'rgb(244, 239, 250)');
  assert.equal(contrast.dialogTitle,contrast.cardText,'light dialog title should use the light-theme primary text token');
  assert.ok(contrast.dialogClose>=44,`dialog close target ${contrast.dialogClose}px`);
  assert.equal(contrast.paired,true,'dialog cancel/save should share a row at 390px');
  assert.ok(contrast.modePseudo==='none'||contrast.modePseudo==='normal',`duplicate mode pseudo label: ${contrast.modePseudo}`);
  assert.notEqual(contrast.modeFont,'0px');

  await page.setContent(`<style>${workbenchCss}</style><dialog class="workspace-mobile-sheet" open><section class="workspace-mobile-sheet-section"><div class="workspace-mobile-more-nav"><button><strong>Lähetykset</strong><small>Avaa työtilassa</small></button></div></section></dialog><section class="orchestra-desk"><div class="orchestra-head"><div><h3>Koko toimitusputki</h3></div><span class="orchestra-lock">IHMINEN PÄÄTTÄÄ LOPULLISESTI</span></div><details class="focus-contract-disclosure"><summary><span>Miten orkesteri toimii?</span></summary></details></section><article class="core-agent-card"><div><span>source</span><strong>Lähdeagentti</strong></div><p>Etsii lähteitä.</p><dl><div><dt>Rooli</dt><dd>research-source-scout</dd></div></dl></article><article class="core-tool-policy-grid"><article><div><span>web.search</span><strong>Web Search</strong></div><p>Hakee lähteitä.</p></article></article><dialog class="core-agent-dialog" open><div class="core-agent-dialog-head"><div><h3>Lähdeagentti</h3><p class="core-agent-dialog-id">source</p></div></div><div class="core-runtime-controls"><label class="core-toggle-row"><span><strong>Aktiivinen</strong><small>POIS ohittaa agentin.</small></span></label></div><div class="core-agent-dialog-actions"><button>Peruuta</button></div></dialog>`);
  await page.evaluate(()=>document.documentElement.dataset.theme='light');
  const parity=await page.evaluate(()=>{
    const toolButton=document.querySelector('.workspace-mobile-more-nav button');
    const strong=toolButton.querySelector('strong'),small=toolButton.querySelector('small');
    const card=document.querySelector('.core-agent-card'),tool=document.querySelector('.core-tool-policy-grid article'),orchestra=document.querySelector('.orchestra-desk'),dialog=document.querySelector('.core-agent-dialog'),runtime=document.querySelector('.core-toggle-row');
    return {
      sheetStrongDisplay:getComputedStyle(strong).display,
      sheetSmallDisplay:getComputedStyle(small).display,
      sheetSeparated:small.getBoundingClientRect().top>=strong.getBoundingClientRect().bottom-1,
      cardBg:getComputedStyle(card).backgroundColor,
      toolBg:getComputedStyle(tool).backgroundColor,
      orchestraBg:getComputedStyle(orchestra).backgroundColor,
      dialogBg:getComputedStyle(dialog).backgroundColor,
      runtimeBg:getComputedStyle(runtime).backgroundColor,
      cardText:getComputedStyle(card.querySelector('strong')).color
    };
  });
  assert.equal(parity.sheetStrongDisplay,'block');
  assert.equal(parity.sheetSmallDisplay,'block');
  assert.equal(parity.sheetSeparated,true,'mobile tool helper must render on its own row');
  for(const [key,value] of Object.entries(parity)){
    if(key.endsWith('Bg')) assert.equal(value,'rgb(255, 255, 255)',`${key}: ${value}`);
  }
  assert.notEqual(parity.cardText,parity.cardBg);

  await page.setContent(`<style>${workbenchCss}</style><div class="reference-soft"></div><section class="nanomancer-lab"><div class="nanomancer-head"><div><h2>Analyysimikroskooppi</h2><p>Vertaa dataa.</p></div><span class="nanomancer-readonly">VAIN LUKU</span></div><div class="nanomancer-contract"><span>plugin 1.0.0</span></div><fieldset class="nanomancer-source"><legend>Analyysi</legend><select><option>Vertaa</option></select></fieldset><article class="nanomancer-comparison"><strong>Vertailu</strong></article></section><article class="visualization-card"><h4>Visualisointi</h4><p>Kaavio</p></article><label class="pin-field"><input type="checkbox"><span><strong>Pinnaa lähetys</strong><small>Nostaa alkuun.</small></span></label><div class="source-actions"><button type="button">Varmenna</button><a href="#">Avaa lähde</a></div>`);
  await page.evaluate(()=>document.documentElement.dataset.theme='light');
  const closure=await page.evaluate(()=>{
    const soft=document.querySelector('.reference-soft');soft.style.background='var(--lhc-panel-soft)';
    const nano=document.querySelector('.nanomancer-lab'),viz=document.querySelector('.visualization-card'),pin=document.querySelector('.pin-field'),check=pin.querySelector('input'),source=document.querySelector('.source-actions button');
    return {
      softBg:getComputedStyle(soft).backgroundColor,
      nanoBg:getComputedStyle(nano).backgroundColor,
      nanoText:getComputedStyle(nano.querySelector('h2')).color,
      vizBg:getComputedStyle(viz).backgroundColor,
      vizText:getComputedStyle(viz.querySelector('h4')).color,
      pinHeight:pin.getBoundingClientRect().height,
      checkboxHeight:check.getBoundingClientRect().height,
      sourceHeight:source.getBoundingClientRect().height
    };
  });
  assert.equal(closure.nanoBg,closure.softBg,'Nanomancer should use the light soft surface');
  assert.equal(closure.vizBg,closure.softBg,'Visualization should use the light soft surface');
  assert.notEqual(closure.nanoText,closure.nanoBg);
  assert.notEqual(closure.vizText,closure.vizBg);
  assert.ok(closure.pinHeight<=60,`pin control too tall: ${closure.pinHeight}px`);
  assert.ok(closure.checkboxHeight<=24,`pin checkbox too large: ${closure.checkboxHeight}px`);
  assert.ok(closure.sourceHeight>=38&&closure.sourceHeight<=44,`source action density ${closure.sourceHeight}px`);

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

console.log('✓ Lighthouse functional + theme closure · light surfaces + mobile controls + dialog contracts');
