import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const BROWSER_FILES=new Set([
  'tests/full-app-e2e/admin-workspace-story.mjs','tests/ui-browser/core-roadmap.mjs','tests/archive-capabilities/nanomancer-ui.mjs','tests/mancer-codemancer/ui.mjs','tests/archive-capabilities/archive-ui.mjs','tests/mancer-codemancer/codemancer-workbench-ui.mjs','tests/archive-capabilities/archive-curator-ui.mjs','tests/ui-browser/visual-system.mjs','tests/ui-browser/native-dialogs.mjs','tests/ui-browser/accessibility-matrix.mjs','tests/lighthouse/browser-e2e.mjs','tests/lighthouse/ui-ux-audit-hardening.mjs'
]);
const CONTENT_FILES=new Set([
  'tests/content-editorial/editorial-quality.mjs','tests/content-editorial/editorial-gate-calibration.mjs','tests/content-editorial/evidence-boundary-hygiene.mjs','tests/content-editorial/evidence-presentation.mjs','tests/content-editorial/public-ui.mjs','tests/content-editorial/public-clarity.mjs','tests/content-editorial/language-boundaries.mjs','tests/content-editorial/entity-core.mjs','tests/content-editorial/evidence-layer.mjs','tests/content-editorial/evidence-integrity.mjs','tests/content-editorial/discovery-layer.mjs','scripts/build-blog.mjs','scripts/domain-migration-check.mjs','seo-check.mjs'
]);
const LIGHTHOUSE_FILES=new Set([
  'tests/lighthouse/construction-mode.mjs',
  'tests/lighthouse/work-surface.mjs',
  'tests/lighthouse/visual-polish.mjs',
  'tests/lighthouse/frontend-consolidation.mjs',
  'tests/lighthouse/trust-surface.mjs',
  'tests/lighthouse/workspace.mjs',
  'tests/lighthouse/orchestra.mjs',
  'tests/lighthouse/intelligence.mjs',
  'tests/lighthouse/ux-architecture-v2.mjs',
  'tests/lighthouse/intent-routing.mjs',
  'tests/lighthouse/compute-task-graph.mjs',
  'tests/lighthouse/hands.mjs',
  'tests/lighthouse/actuator.mjs',
  'tests/lighthouse/machine-room.mjs',
  'tests/lighthouse/core.mjs',
  'tests/lighthouse/depth-accordion.mjs',
  'tests/lighthouse/responsive-shell.mjs',
  'tests/lighthouse/fixed-inspector.mjs',
  'tests/lighthouse/responsive-qa.mjs',
  'tests/lighthouse/api-boundary.mjs',
  'tests/lighthouse/browser-e2e.mjs',
  'tests/lighthouse/unification-shell.mjs',
  'tests/lighthouse/stable-house.mjs',
  'tests/lighthouse/focus-layers.mjs'
  ,'tests/lighthouse/ui-ux-audit-hardening.mjs'
]);

const STEPS = [
  [
    "tests/integrity-security/frontend-runtime-boundary.mjs"
  ],
  [
    "tests/integrity-security/build-source-boundary.mjs"
  ],
  [
    "tests/integrity-security/vcs-independence.mjs"
  ],
  [
    "tests/integrity-security/workspace-integrity.mjs"
  ],
  [
    "tests/mancer-codemancer/visual-contract.mjs"
  ],
  [
    "tests/ui-browser/interaction-navigation.mjs"
  ],
  [
    "tests/mancer-codemancer/codemancer-workbench.mjs"
  ],
  [
    "tests/mancer-codemancer/codemancer-workbench-ui.mjs"
  ],
  [
    "tests/ui-browser/interaction-pwa-regression.mjs"
  ],
  [
    "tests/full-app-e2e/admin-workspace-story.mjs"
  ],
  [
    "tests/ui-browser/app-split-pwa.mjs"
  ],
  [
    "tests/ui-browser/machine-room.mjs"
  ],
  [
    "tests/integrity-security/security-ui-invariants.mjs"
  ],
  [
    "tests/content-editorial/editorial-quality.mjs"
  ],
  [
    "tests/content-editorial/editorial-gate-calibration.mjs"
  ],
  [
    "tests/content-editorial/evidence-boundary-hygiene.mjs"
  ],
  [
    "tests/ui-browser/mobile-workspace.mjs"
  ],
  [
    "tests/ui-browser/mobile-control-plane-reflow.mjs"
  ],
  [
    "tests/public-api-boundary/public-boundary.mjs"
  ],
  [
    "tests/public-api-boundary/api-surface.mjs"
  ],
  [
    "tests/content-editorial/evidence-presentation.mjs"
  ],
  [
    "tests/content-editorial/admin.mjs"
  ],
  [
    "tests/content-editorial/contact.mjs"
  ],
  [
    "tests/content-editorial/public-ui.mjs"
  ],
  [
    "tests/ui-browser/brand-system.mjs"
  ],
  [
    "tests/public-api-boundary/public-core.mjs"
  ],
  [
    "tests/public-api-boundary/public-core-v3.mjs"
  ],
  [
    "tests/core-runtime/agent-contracts.mjs"
  ],
  [
    "tests/ui-browser/ui-semantics.mjs"
  ],
  [
    "tests/ui-browser/legacy-layout-invariants.mjs"
  ],
  [
    "tests/ui-browser/filter-layout-invariants.mjs"
  ],
  [
    "tests/ui-browser/orchestra-flow.mjs"
  ],
  [
    "scripts/build-blog.mjs",
    "--check"
  ],
  [
    "tests/content-editorial/public-clarity.mjs"
  ],
  [
    "tests/content-editorial/language-boundaries.mjs"
  ],
  [
    "tests/content-editorial/entity-core.mjs"
  ],
  [
    "tests/content-editorial/evidence-layer.mjs"
  ],
  [
    "tests/content-editorial/evidence-integrity.mjs"
  ],
  [
    "tests/content-editorial/discovery-layer.mjs"
  ],
  [
    "tests/core-runtime/core-foundation.mjs"
  ],
  [
    "tests/core-runtime/runtime-profiles.mjs"
  ],
  [
    "tests/core-runtime/custom-orchestras.mjs"
  ],
  [
    "tests/core-runtime/run-explorer.mjs"
  ],
  [
    "tests/core-runtime/workspace-foundation.mjs"
  ],
  [
    "tests/core-runtime/browser-local-fallback.mjs"
  ],
  [
    "tests/archive-capabilities/archive-core.mjs"
  ],
  [
    "tests/archive-capabilities/archive-ui.mjs"
  ],
  [
    "tests/archive-capabilities/nanomancer.mjs"
  ],
  [
    "tests/archive-capabilities/nanomancer-ui.mjs"
  ],
  [
    "tests/archive-capabilities/archive-curator.mjs"
  ],
  [
    "tests/archive-capabilities/archive-curator-ui.mjs"
  ],
  [
    "tests/mancer-codemancer/runtime.mjs"
  ],
  [
    "tests/mancer-codemancer/ui.mjs"
  ],
  [
    "tests/mancer-codemancer/semantic-workbench.mjs"
  ],
  [
    "tests/ui-browser/native-dialogs.mjs"
  ],
  [
    "tests/integrity-security/platform-hardening.mjs"
  ],
  [
    "tests/integrity-security/export-allowlist.mjs"
  ],
  [
    "tests/ui-browser/core-roadmap.mjs"
  ],
  [
    "tests/ui-browser/navigation-shell.mjs"
  ],
  [
    "tests/ui-browser/navigation-shell-visual.mjs"
  ],
  [
    "tests/ui-browser/core-shell-semantics.mjs"
  ],
  [
    "tests/ui-browser/responsive-workspace-navigation.mjs"
  ],
  [
    "tests/narramancer/authoring.mjs"
  ],
  [
    "tests/content-editorial/evidence-interaction.mjs"
  ],
  [
    "tests/ui-browser/visual-system.mjs"
  ],
  [
    "tests/narramancer/vertical-slice.mjs"
  ],
  [
    "tests/core-runtime/agent-pool-control.mjs"
  ],
  [
    "tests/core-runtime/tool-broker.mjs"
  ],
  [
    "tests/core-runtime/model-router.mjs"
  ],
  [
    "tests/core-runtime/agent-layer.mjs"
  ],
  [
    "tests/core-runtime/orchestrator.mjs"
  ],
  [
    "scripts/domain-migration-check.mjs"
  ],
  [
    "seo-check.mjs"
  ],
  [
    "scripts/check-source.mjs"
  ],
  [
    "tests/ui-browser/accessibility-matrix.mjs"
  ],
  [
    "tests/lighthouse/unification-shell.mjs"
  ],
  [
    "tests/lighthouse/focus-layers.mjs"
  ],
  [
    "tests/lighthouse/construction-mode.mjs"
  ],
  [
    "tests/lighthouse/work-surface.mjs"
  ],
  [
    "tests/lighthouse/visual-polish.mjs"
  ],
  [
    "tests/lighthouse/frontend-consolidation.mjs"
  ],
  [
    "tests/lighthouse/trust-surface.mjs"
  ],
  [
    "tests/lighthouse/workspace.mjs"
  ],
  [
    "tests/lighthouse/orchestra.mjs"
  ],
  [
    "tests/lighthouse/intelligence.mjs"
  ],
  [
    "tests/lighthouse/intent-routing.mjs"
  ],
  [
    "tests/lighthouse/compute-task-graph.mjs"
  ],
  [
    "tests/lighthouse/ux-architecture-v2.mjs"
  ],
  [
    "tests/lighthouse/hands.mjs"
  ],
  [
    "tests/lighthouse/actuator.mjs"
  ],
  [
    "tests/lighthouse/machine-room.mjs"
  ],
  [
    "tests/lighthouse/core.mjs"
  ],
  [
    "tests/lighthouse/depth-accordion.mjs"
  ],
  [
    "tests/lighthouse/responsive-shell.mjs"
  ],
  [
    "tests/lighthouse/fixed-inspector.mjs"
  ],
  [
    "tests/lighthouse/responsive-qa.mjs"
  ],
  [
    "tests/lighthouse/api-boundary.mjs"
  ],
  [
    "tests/lighthouse/browser-e2e.mjs"
  ],
  [
    "tests/lighthouse/ui-ux-audit-hardening.mjs"
  ]
];

const requested=(process.argv.find(arg=>arg.startsWith('--group='))||'--group=all').slice('--group='.length);
if(!['all','static','browser','content','lighthouse'].includes(requested))throw new Error(`Tuntematon release gate -ryhmä: ${requested}`);
const selected=STEPS.filter(args=>requested==='all'||requested==='browser'&&BROWSER_FILES.has(args[0])||requested==='static'&&!BROWSER_FILES.has(args[0])||requested==='content'&&CONTENT_FILES.has(args[0])||requested==='lighthouse'&&LIGHTHOUSE_FILES.has(args[0]));
let browserEvidence=null;
if(selected.some(args=>BROWSER_FILES.has(args[0]))){
  const {chromium}=await import('playwright');
  let executable=process.env.CHROMIUM_BIN&&fs.existsSync(process.env.CHROMIUM_BIN)?process.env.CHROMIUM_BIN:chromium.executablePath();
  if(!fs.existsSync(executable)){const install=spawnSync(process.execPath,[path.resolve('node_modules/playwright/cli.js'),'install','chromium'],{stdio:'inherit'});if(install.status!==0)process.exit(install.status||1);executable=chromium.executablePath();}
  if(!fs.existsSync(executable))throw new Error(`Chromiumia ei löytynyt: ${executable}`);
  const headlessShell=executable.replace(/chromium-(\d+)[\\/]chrome-linux[\\/]chrome$/,process.platform==='win32'?'chromium_headless_shell-$1\\chrome-win\\headless_shell.exe':'chromium_headless_shell-$1/chrome-linux/headless_shell');
  const browserExecutable=fs.existsSync(headlessShell)?headlessShell:executable;
  process.env.CHROMIUM_BIN=browserExecutable;const version=spawnSync(browserExecutable,['--version'],{encoding:'utf8'}).stdout.trim(),playwrightVersion=JSON.parse(fs.readFileSync(path.resolve('node_modules/playwright/package.json'),'utf8')).version;browserEvidence={provider:'playwright',playwrightVersion,executable:browserExecutable,version};console.log(`\nBrowser gate: Playwright ${browserEvidence.playwrightVersion} · ${version} · ${browserExecutable}`);
}


function runVcsIndependenceFromSourceBundle(){
  const exportResult=spawnSync(
    process.execPath,
    ['scripts/export-bundle.mjs','source'],
    {stdio:'inherit',env:process.env}
  );
  if(exportResult.status!==0)return exportResult.status||1;

  const dist=path.resolve('dist');
  const bundles=fs.readdirSync(dist)
    .filter(name=>/^anomancer-source-.*\.tar\.gz$/.test(name))
    .sort();

  if(!bundles.length){
    console.error('✗ source-vientipakettia ei löytynyt dist/-hakemistosta');
    return 1;
  }

  const stage=fs.mkdtempSync(
    path.join(os.tmpdir(),'anomancer-vcs-boundary-')
  );

  try{
    const archive=path.join(dist,bundles.at(-1));

    const extractResult=spawnSync(
      'tar',
      ['-xzf',archive,'-C',stage],
      {stdio:'inherit',env:process.env}
    );

    if(extractResult.status!==0)return extractResult.status||1;

    const testResult=spawnSync(
      process.execPath,
      ['tests/integrity-security/vcs-independence.mjs'],
      {
        cwd:stage,
        stdio:'inherit',
        env:process.env
      }
    );

    return testResult.status||0;
  } finally {
    fs.rmSync(stage,{recursive:true,force:true});
  }
}

for (const [index,args] of selected.entries()) {
  const label=args.join(' ');
  console.log(`\n[${String(index+1).padStart(2,'0')}/${selected.length}] ${label}`);
  const result=args[0]==='tests/integrity-security/vcs-independence.mjs'
    ? {status:runVcsIndependenceFromSourceBundle()}
    : spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});
  if(result.error) throw result.error;
  if(result.status!==0){
    fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/release-gate-failure.json',`${JSON.stringify({failedAt:new Date().toISOString(),group:requested,step:index+1,total:selected.length,label,status:result.status,browser:browserEvidence},null,2)}\n`);
    console.error(`\nRelease gate failed: ${label}`);
    process.exit(result.status||1);
  }
}
console.log(`\n✓ Release gate complete: ${selected.length}/${selected.length} ${requested} steps passed`);
