import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const MANCER_PACKAGE_FORMAT='anomancer-mancer-package/v1';
export const MANCER_UI_SCHEMA_FORMAT='anomancer-mancer-ui-schema/v1';
export const MANCER_APPROVAL_MODEL_FORMAT='anomancer-mancer-approval-model/v1';
export const MANCER_ARTIFACT_BOUNDARY_FORMAT='anomancer-mancer-artifact-boundary/v1';
export const MANCER_AGENT_BINDINGS_FORMAT='anomancer-mancer-agent-bindings/v1';
export const MANCER_ORCHESTRA_REGISTRY_FORMAT='anomancer-mancer-orchestra-registry/v1';
export const MANCER_ARCHIVE_POLICY_FORMAT='anomancer-mancer-archive-policy/v1';
export const MANCER_RENDERER_CAPABILITIES=Object.freeze(['file-tree','code-editor','diff-view','task-board','test-run-list','approval-review','release-gate','document-preview']);
const MANCER_SECTION_RENDERERS=new Set(['form','collection','run-explorer','code-editor','task-board','test-run-list','approval-review','release-gate','document-preview']);

const REQUIRED_FILES=['manifest.json','constitution.json','artifact-boundary.json','ui-schema.json','approval-model.json','agent-bindings.json','orchestra-registry.json','archive-policy.json'];
const clone=v=>JSON.parse(JSON.stringify(v));
const clean=v=>String(v??'').trim();
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const here=path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT=path.resolve(here,'..','mancers');

function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function safeDirName(v=''){return clean(v).toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'');}
function assert(cond,message,code='MANCER_PACKAGE_INVALID'){if(!cond)throw Object.assign(new Error(message),{code,statusCode:500});}
function validateFields(pkg){
  const {manifest,constitution,artifactBoundary,uiSchema,approvalModel,agentBindings,orchestraRegistry,archivePolicy}=pkg;
  assert(manifest?.format===MANCER_PACKAGE_FORMAT,'Mancer manifest format is invalid.');
  assert(safeDirName(manifest.id)===manifest.id,'Mancer id is invalid.');
  for(const key of ['templateId','name','version','kind','constitutionId','artifactStoreId','contentAdapterId','outputAdapterId','uiProfileId'])assert(clean(manifest[key]),`Mancer manifest missing ${key}.`);
  assert(constitution?.format==='anomancer-constitution/v1','Mancer constitution format is invalid.');
  assert(constitution.id===manifest.constitutionId,'Mancer constitution id does not match manifest.');
  assert(artifactBoundary?.format===MANCER_ARTIFACT_BOUNDARY_FORMAT,'Mancer artifact boundary format is invalid.');
  assert(uiSchema?.format===MANCER_UI_SCHEMA_FORMAT,'Mancer UI schema format is invalid.');
  assert(uiSchema.renderer==='schema-workbench','Unsupported Mancer UI renderer.');
  assert(Array.isArray(uiSchema.sections)&&uiSchema.sections.length>0,'Mancer UI schema needs sections.');
  const rendererCapabilities=Array.isArray(uiSchema.rendererCapabilities)?uiSchema.rendererCapabilities:[];
  for(const capability of rendererCapabilities)assert(MANCER_RENDERER_CAPABILITIES.includes(capability),`Unsupported Mancer renderer capability: ${capability}`);
  assert(approvalModel?.format===MANCER_APPROVAL_MODEL_FORMAT,'Mancer approval model format is invalid.');
  assert(approvalModel.humanFinalAuthority===true,'Mancer approval model must preserve human final authority.');
  assert(agentBindings?.format===MANCER_AGENT_BINDINGS_FORMAT,'Mancer agent bindings format is invalid.');
  assert(orchestraRegistry?.format===MANCER_ORCHESTRA_REGISTRY_FORMAT,'Mancer orchestra registry format is invalid.');
  assert(archivePolicy?.format===MANCER_ARCHIVE_POLICY_FORMAT,'Mancer archive policy format is invalid.');
  assert(archivePolicy.automaticModelMemory===false,'Mancer archive policy cannot enable automatic model memory.');
  const ids=new Set();for(const section of uiSchema.sections){assert(clean(section.id),'Mancer UI section id missing.');assert(!ids.has(section.id),'Duplicate Mancer UI section id.');ids.add(section.id);const renderer=clean(section.renderer||section.kind||'form');assert(MANCER_SECTION_RENDERERS.has(renderer),`Unsupported Mancer section renderer: ${renderer}`);}
  const navItems=(uiSchema.navigation?.groups||[]).flatMap(group=>group.items||[]);for(const id of navItems)assert(ids.has(id),`Mancer UI navigation points to unknown section: ${id}`);
  return true;
}

export function loadMancerPackage(dir){
  const files={};for(const name of REQUIRED_FILES){const file=path.join(dir,name);assert(fs.existsSync(file),`Mancer package missing ${name}.`,'MANCER_PACKAGE_FILE_MISSING');files[name]=file;}
  const pkg={
    manifest:readJson(files['manifest.json']),constitution:readJson(files['constitution.json']),artifactBoundary:readJson(files['artifact-boundary.json']),
    uiSchema:readJson(files['ui-schema.json']),approvalModel:readJson(files['approval-model.json']),agentBindings:readJson(files['agent-bindings.json']),
    orchestraRegistry:readJson(files['orchestra-registry.json']),archivePolicy:readJson(files['archive-policy.json'])
  };
  validateFields(pkg);
  const contractHash=digest(pkg);
  return Object.freeze({...clone(pkg),packageDir:path.basename(dir),contractHash,installed:true,enabled:true,health:'ok'});
}

export function discoverMancerPackages({rootDir=DEFAULT_ROOT}={}){
  if(!fs.existsSync(rootDir))return[];
  const packages=[];
  for(const entry of fs.readdirSync(rootDir,{withFileTypes:true}).filter(x=>x.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))){
    try{packages.push(loadMancerPackage(path.join(rootDir,entry.name)));}
    catch(error){packages.push(Object.freeze({packageDir:entry.name,installed:true,enabled:false,health:'invalid',error:error.message,code:error.code||'MANCER_PACKAGE_INVALID'}));}
  }
  return packages;
}

const INSTALLED=discoverMancerPackages();
export function listInstalledMancerPackages(){return INSTALLED.filter(x=>x.health==='ok').map(clone);}
export function listMancerPackageHealth(){return INSTALLED.map(clone);}
export function getMancerPackage(id){const item=INSTALLED.find(x=>x.health==='ok'&&x.manifest?.id===String(id||''));return item?clone(item):null;}
export function getMancerPackageByTemplateId(templateId){const item=INSTALLED.find(x=>x.health==='ok'&&x.manifest?.templateId===String(templateId||''));return item?clone(item):null;}
export function validateMancerPackageDir(dir){return loadMancerPackage(dir);}
