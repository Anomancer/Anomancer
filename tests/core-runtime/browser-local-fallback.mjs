import assert from 'node:assert/strict';
import fs from 'node:fs';
import { requireWorkspace } from '../../server/workspace-store.js';
import { stateBackendStatus } from '../../server/state-backend.js';
import { validateWorkspaceOrchestra } from '../../server/orchestra-store.js';
import { createRuntimeSnapshot, verifyRuntimeSnapshot } from '../../server/runtime-store.js';

process.env.ADMIN_SESSION_SECRET='l'.repeat(64);
let ok=0;const test=async(name,fn)=>{await fn();ok++;console.log(`✓ ${name}`)};

await test('browser-local Codemancer ja Romancer syntetisoidaan vain asennetusta työtilatemplatesta',async()=>{
  const code=await requireWorkspace('local-codemancer--test-1234');
  const story=await requireWorkspace('local-romancer--test-5678');
  assert.equal(code.source,'browser-local');
  assert.equal(code.templateId,'codemancer/development-workbench/1.0.0');
  assert.equal(story.templateId,'romancer/story-studio/1.0.0');
  await assert.rejects(()=>requireWorkspace('local-evil--test-9999'),e=>e.code==='WORKSPACE_NOT_FOUND');
});

await test('browser-local työtilan state-polku ei koske Blob-tallennusta',()=>{
  const st=stateBackendStatus('runtime/local-codemancer--test-1234.json');
  assert.equal(st.mode,'memory');assert.equal(st.durable,false);assert.equal(st.serverAuthoritative,false);assert.equal(st.browserLocalWorkspace,true);
});

await test('selaimeen tallennettu custom-orkesteri voidaan validoida ja sitoa allekirjoitettuun runtime snapshotiin',async()=>{
  const workspaceId='local-codemancer--test-1234',orchestra=await validateWorkspaceOrchestra({id:'custom-local-review-test',name:'Paikallinen katselmus',source:'custom',steps:[{mode:'sequential',agents:['source']},{mode:'sequential',agents:['structure']}]},workspaceId);
  const snap=await createRuntimeSnapshot('browser-local-run',orchestra.id,workspaceId,orchestra);
  const verified=verifyRuntimeSnapshot(snap.token,{orchestraRunId:'browser-local-run',workspaceId});
  assert.equal(verified.orchestra.id,'custom-local-review-test');
  assert.equal(verified.workspace.templateId,'codemancer/development-workbench/1.0.0');
  assert.equal(verified.artifact.isolated,true);
});

await test('frontendissa on Blob-vikatilan selainvaratila ilman raw 403 -virheen pakottamista käyttäjälle',()=>{
  const workspaces=fs.readFileSync('admin-workspaces.js','utf8'),orchestras=fs.readFileSync('admin-orchestras.js','utf8'),mancer=fs.readFileSync('admin-mancer.js','utf8'),romancer=fs.readFileSync('admin-narramancer.js','utf8');
  assert.match(workspaces,/LOCAL_WORKSPACES_KEY/);assert.match(workspaces,/browser-local/);assert.match(workspaces,/Vercel Blob ei ole käytettävissä/);
  assert.match(orchestras,/LOCAL_PREFIX/);assert.match(orchestras,/AbortController/);assert.match(orchestras,/12000/);assert.match(orchestras,/custom-local-/);
  assert.match(mancer,/LOCAL_ARTIFACT_PREFIX/);assert.match(romancer,/LOCAL_ARTIFACT_PREFIX/);
});

await test('light theme sulkee Nanomancer- ja visualisointipinnat ja mobiiliohjaimet pysyvät kompakteina',()=>{
  const css=fs.readFileSync('lighthouse-ui-constitution.css','utf8'),responsive=fs.readFileSync('admin-responsive.css','utf8');
  assert.match(css,/html\[data-theme="light"\] \.nanomancer-disclosure/);assert.match(css,/html\[data-theme="light"\] \.nanomancer-lab/);assert.match(css,/html\[data-theme="light"\] \.evidence-secondary-disclosure/);assert.match(css,/html\[data-theme="light"\] \.visualization-card/);assert.match(css,/html\[data-theme="light"\] \.preview-chart/);
  assert.match(responsive,/\.pin-field input\[type="checkbox"\]/);assert.match(responsive,/\.source-composer button\{[\s\S]*?width:auto/);assert.equal((responsive.match(/@media\(max-width:760px\)/g)||[]).length,1);
});

console.log(`\n${ok}/${ok} BROWSER-LOCAL FALLBACK + THEME CLOSURE -testiä läpi`);
