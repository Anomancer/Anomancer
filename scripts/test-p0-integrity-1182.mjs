import assert from 'node:assert/strict';
import fs from 'node:fs';

let ok=0;
const test=(name,fn)=>{fn();ok++;console.log(`✓ ${name}`);};
const read=file=>fs.readFileSync(file,'utf8');

test('yhteinen dirty-rekisteri vartioi poistumisen ja uloskirjautumisen',()=>{
  const admin=read('admin.js'),workspaces=read('admin-workspaces.js');
  assert.match(admin,/window\.anomancerDirty=\{register:registerDirtySource,sources:getDirtySources,hasAny:hasAnyUnsavedChanges\}/);
  assert.match(admin,/beforeunload[\s\S]{0,160}hasAnyUnsavedChanges\(\)/);
  assert.match(admin,/logout\.onclick[\s\S]{0,240}confirmDiscard/);
  assert.match(workspaces,/window\.anomancerDirty\?\.hasAny/);
  assert.match(read('admin-mancer.js'),/register\?\.\('mancer','Mancer-työtila',dirty\)/);
  assert.match(read('admin-narramancer.js'),/register\?\.\('narramancer','Romancer',dirty\)/);
});

test('Mancer-konflikti säilyttää paikallisen työn ja tarjoaa eksplisiittiset ratkaisut',()=>{
  const mancer=read('admin-mancer.js');
  assert.match(mancer,/MANCER_ARTIFACT_REVISION_CONFLICT/);
  assert.match(mancer,/conflict=\{local,remote:/);
  assert.match(mancer,/data-mancer-conflict="backup"/);
  assert.match(mancer,/data-mancer-conflict="remote"/);
  assert.match(mancer,/data-mancer-conflict="local"/);
  assert.doesNotMatch(mancer,/MANCER_ARTIFACT_REVISION_CONFLICT'\)await loadArtifact\(\)/);
});

test('Romancer-konflikti säilyttää käsikirjoituksen ja tuottaa turvakopion',()=>{
  const narramancer=read('admin-narramancer.js');
  assert.match(narramancer,/ARTIFACT_REVISION_CONFLICT/);
  assert.match(narramancer,/anomancer-narramancer-conflict-backup\/v1/);
  assert.match(narramancer,/data-narramancer-conflict="backup"/);
  assert.match(narramancer,/data-narramancer-conflict="remote"/);
  assert.match(narramancer,/data-narramancer-conflict="local"/);
  assert.doesNotMatch(narramancer,/ARTIFACT_REVISION_CONFLICT'\)await loadArtifact\(\)/);
});

test('työtilakohtaiset async-pyynnöt voidaan perua ja vanhat vastaukset hylätään',()=>{
  for(const file of ['admin-mancer.js','admin-narramancer.js','admin-nanomancer.js']){
    const source=read(file);
    assert.match(source,/workspaceEpoch/);
    assert.match(source,/new AbortController\(\)/);
    assert.match(source,/workspace\(\)?\.?id===ctx\.workspaceId|workspace\?\.id===ctx\.workspaceId/);
    assert.match(source,/error\.name==='AbortError'|error\.name!=='AbortError'/);
  }
  const admin=read('admin.js');
  assert.match(admin,/postsRequestId/);
  assert.match(admin,/postsController\?\.abort\(\)/);
  assert.match(admin,/selectedWorkspaceId\(\)!==workspaceId/);
});

test('Nanomancer tyhjentää tuloksen ja sitoo analyysin työtilaan',()=>{
  const nano=read('admin-nanomancer.js');
  assert.match(nano,/if\(!analysis\)\{[\s\S]{0,220}host\.innerHTML=/);
  assert.match(nano,/analysisWorkspaceId=ctx\.workspaceId/);
  assert.match(nano,/analysisWorkspaceId!==workspace\(\)\.id/);
  assert.match(nano,/function applyWorkspace\(\)\{invalidateWorkspaceRequests\(\);analysis=null;analysisWorkspaceId=''/);
});

test('juuri- ja public-adminlähteet pysyvät identtisinä',()=>{
  for(const file of ['admin.js','admin-workspaces.js','admin-mancer.js','admin-narramancer.js','admin-nanomancer.js']){
    assert.equal(read(file),read(`public/${file}`),`${file} poikkeaa public-peilistä`);
  }
});

console.log(`\n${ok}/${ok} P0 INTEGRITY HARDENING -testiä läpi`);
