import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const CAPABILITY_PACKAGE_FORMAT='anomancer-capability-package/v1';
export const CAPABILITY_CONTRACT_FORMAT='anomancer-capability-contract/v1';
export const CAPABILITY_PERMISSIONS_FORMAT='anomancer-capability-permissions/v1';
export const CAPABILITY_ADAPTER_FORMAT='anomancer-capability-adapter/v1';

const REQUIRED_FILES=['manifest.json','contract.json','permissions.json','adapter.json'];
const ROUTINGS=new Set(['read-only','reasoning','proposal','approval']);
const AVAILABILITY=new Set(['ready','runtime','disabled']);
const ADAPTER_KINDS=new Set(['reasoning-proxy','context','runtime-tool','proposal','human-gated']);
const DATA_EGRESS=new Set(['none','reasoner','public-network','configured-provider']);
const clone=value=>JSON.parse(JSON.stringify(value));
const clean=value=>String(value??'').trim();
const here=path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_CAPABILITY_ROOT=path.resolve(here,'..','capabilities');
export const DEFAULT_GENERATED_REGISTRY=path.resolve(here,'..','core','capabilities','packages.generated.js');

function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function assert(condition,message,code='CAPABILITY_PACKAGE_INVALID'){
  if(!condition)throw Object.assign(new Error(message),{code,statusCode:500});
}
function digest(value){
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
function validId(value){
  return /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(clean(value));
}
function validVersion(value){
  return /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(clean(value));
}

export function validateCapabilityPackageDocuments(pkg={}){
  const {manifest,contract,permissions,adapter}=pkg;
  assert(manifest?.format===CAPABILITY_PACKAGE_FORMAT,'Capability manifest format is invalid.');
  assert(validId(manifest.id),'Capability id is invalid.');
  assert(validVersion(manifest.version),'Capability version is invalid.');
  for(const key of ['name','purpose','providerClass','mode','routing','availability']){
    assert(clean(manifest[key]),`Capability manifest missing ${key}.`);
  }
  assert(ROUTINGS.has(manifest.routing),'Capability routing is invalid.');
  assert(AVAILABILITY.has(manifest.availability),'Capability availability is invalid.');

  assert(contract?.format===CAPABILITY_CONTRACT_FORMAT,'Capability contract format is invalid.');
  assert(contract.capabilityId===manifest.id,'Capability contract id does not match manifest.');
  assert(clean(contract.summary),'Capability contract summary is missing.');
  assert(Array.isArray(contract.inputs),'Capability contract inputs must be an array.');
  assert(Array.isArray(contract.outputs),'Capability contract outputs must be an array.');
  assert(Array.isArray(contract.guarantees),'Capability contract guarantees must be an array.');

  assert(permissions?.format===CAPABILITY_PERMISSIONS_FORMAT,'Capability permissions format is invalid.');
  assert(permissions.capabilityId===manifest.id,'Capability permissions id does not match manifest.');
  assert(typeof permissions.writesExternalState==='boolean','Capability writesExternalState must be boolean.');
  assert(typeof permissions.requiresHumanApproval==='boolean','Capability requiresHumanApproval must be boolean.');
  assert(DATA_EGRESS.has(permissions.dataEgress),'Capability dataEgress is invalid.');
  assert(Array.isArray(permissions.allowedScopes),'Capability allowedScopes must be an array.');

  assert(adapter?.format===CAPABILITY_ADAPTER_FORMAT,'Capability adapter format is invalid.');
  assert(adapter.capabilityId===manifest.id,'Capability adapter id does not match manifest.');
  assert(ADAPTER_KINDS.has(adapter.kind),'Capability adapter kind is invalid.');
  assert(!Object.hasOwn(adapter,'module')&&!Object.hasOwn(adapter,'path'),'Executable package adapters are not allowed in Capability Package v1.');

  if(adapter.executionCapability!==null&&adapter.executionCapability!==undefined){
    assert(validId(adapter.executionCapability),'Capability executionCapability is invalid.');
  }
  if(adapter.runtimeAdapter!==null&&adapter.runtimeAdapter!==undefined){
    assert(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(clean(adapter.runtimeAdapter)),'Capability runtimeAdapter is invalid.');
  }

  if(adapter.kind==='reasoning-proxy'){
    assert(clean(adapter.executionCapability),'Reasoning proxy requires executionCapability.');
    assert(manifest.routing==='reasoning','Reasoning proxy must use reasoning routing.');
  }
  if(manifest.routing==='read-only'){
    assert(permissions.writesExternalState===false,'Read-only capability cannot write external state.');
  }
  if(manifest.routing==='proposal'){
    assert(permissions.writesExternalState===false,'Proposal capability cannot write external state.');
  }
  if(manifest.routing==='approval'){
    assert(permissions.requiresHumanApproval===true,'Approval-routed capability must require human approval.');
  }
  if(permissions.writesExternalState===true){
    assert(permissions.requiresHumanApproval===true,'Capability writes external state without human approval.');
    assert(manifest.routing==='approval','External write capability must use approval routing.');
  }
  if(permissions.requiresHumanApproval===true){
    assert(['approval','proposal'].includes(manifest.routing),'Human-approved capability must use approval or proposal routing.');
  }
  if(manifest.availability==='runtime'){
    assert(clean(adapter.runtimeAdapter),'Runtime capability must name a registered runtimeAdapter.');
  }
  return true;
}

export function loadCapabilityPackage(dir){
  const files={};
  for(const name of REQUIRED_FILES){
    const file=path.join(dir,name);
    assert(fs.existsSync(file),`Capability package missing ${name}.`,'CAPABILITY_PACKAGE_FILE_MISSING');
    files[name]=file;
  }
  const pkg={
    manifest:readJson(files['manifest.json']),
    contract:readJson(files['contract.json']),
    permissions:readJson(files['permissions.json']),
    adapter:readJson(files['adapter.json'])
  };
  validateCapabilityPackageDocuments(pkg);
  const packageDir=path.basename(dir);
  assert(packageDir===pkg.manifest.id,`Capability package directory must equal capability id (${pkg.manifest.id}).`);
  const contractHash=digest(pkg);
  return Object.freeze({...clone(pkg),packageDir,contractHash,installed:true,enabled:true,health:'ok'});
}

export function discoverCapabilityPackages({rootDir=DEFAULT_CAPABILITY_ROOT}={}){
  if(!fs.existsSync(rootDir))return [];
  const packages=[];
  const entries=fs.readdirSync(rootDir,{withFileTypes:true}).filter(entry=>entry.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name));
  for(const entry of entries){
    try{packages.push(loadCapabilityPackage(path.join(rootDir,entry.name)));}
    catch(error){
      packages.push(Object.freeze({
        packageDir:entry.name,installed:true,enabled:false,health:'invalid',
        error:error.message,code:error.code||'CAPABILITY_PACKAGE_INVALID'
      }));
    }
  }
  return packages;
}

export function descriptorFromCapabilityPackage(pkg){
  assert(pkg?.health==='ok','Cannot compile invalid capability package.');
  const {manifest,permissions,adapter}=pkg;
  const routing=manifest.routing;
  return Object.freeze({
    id:manifest.id,
    label:manifest.name,
    purpose:manifest.purpose,
    providerClass:manifest.providerClass,
    mode:manifest.mode,
    routing,
    available:manifest.availability==='ready',
    runtimeAvailable:manifest.availability==='runtime',
    executionCapability:adapter.executionCapability||null,
    runtimeAdapter:adapter.runtimeAdapter||null,
    readOnly:routing==='read-only',
    proposalOnly:routing==='proposal',
    requiresApproval:permissions.requiresHumanApproval===true,
    dataEgress:permissions.dataEgress,
    package:Object.freeze({
      format:CAPABILITY_PACKAGE_FORMAT,
      id:manifest.id,
      version:manifest.version,
      contractHash:pkg.contractHash,
      adapterKind:adapter.kind
    })
  });
}

export function compileCapabilityDescriptors({rootDir=DEFAULT_CAPABILITY_ROOT}={}){
  const packages=discoverCapabilityPackages({rootDir});
  const invalid=packages.filter(pkg=>pkg.health!=='ok');
  if(invalid.length){
    const details=invalid.map(item=>`${item.packageDir}: ${item.error}`).join('; ');
    throw Object.assign(new Error(`Invalid capability package(s): ${details}`),{
      code:'CAPABILITY_PACKAGE_SET_INVALID',statusCode:500
    });
  }
  const descriptors=packages.map(descriptorFromCapabilityPackage);
  const ids=new Set();
  for(const descriptor of descriptors){
    assert(!ids.has(descriptor.id),`Duplicate capability package id: ${descriptor.id}.`);
    ids.add(descriptor.id);
  }
  return {packages,descriptors};
}

function generatedModule(descriptors){
  return `// GENERATED by scripts/sync-capability-packages.mjs. DO NOT EDIT.\n`+
    `export const GENERATED_CAPABILITY_DEFINITIONS=${JSON.stringify(descriptors,null,2)};\n`;
}

export function syncCapabilityPackageRegistry({
  rootDir=DEFAULT_CAPABILITY_ROOT,
  targetFile=DEFAULT_GENERATED_REGISTRY
}={}){
  const {packages,descriptors}=compileCapabilityDescriptors({rootDir});
  const next=generatedModule(descriptors);
  const previous=fs.existsSync(targetFile)?fs.readFileSync(targetFile,'utf8'):'';
  const changed=previous!==next;
  if(changed){
    fs.mkdirSync(path.dirname(targetFile),{recursive:true});
    fs.writeFileSync(targetFile,next);
  }
  return {packages:packages.map(clone),descriptors:descriptors.map(clone),targetFile,changed};
}

export function validateCapabilityPackageDir(dir){
  return loadCapabilityPackage(dir);
}
