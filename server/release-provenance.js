import fs from 'node:fs';
import path from 'node:path';
import { CORE_VERSION, AGENT_REGISTRY, ORCHESTRA_REGISTRY, TOOL_REGISTRY, digest } from './core-registry.js';
import { publicCoreSchemaHash } from './public-core.js';

const ROOT=process.cwd();

function packageVersion(){
  try{return JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8')).version||CORE_VERSION;}
  catch{return CORE_VERSION;}
}
function sourceRevision(){
  const env=String(process.env.ANOMANCER_RELEASE_REVISION||process.env.VERCEL_DEPLOYMENT_ID||'').trim();
  return /^[a-z0-9_-]{7,128}$/i.test(env)?env:null;
}
function registryHash(items,hashKey){
  return digest(items.map(item=>({id:item.id,version:item.version,hash:item[hashKey]})));
}

export function createReleaseProvenance({publicCore,apiFunctionCount,builtAt=new Date().toISOString()}={}){
  return {
    format:'anomancer-release-provenance/v1',
    release:packageVersion(),
    coreVersion:CORE_VERSION,
    builtAt,
    sourceRevision:sourceRevision(),
    publicSchemaHash:publicCoreSchemaHash(publicCore),
    registryHashes:{
      agents:registryHash(AGENT_REGISTRY,'contractHash'),
      orchestras:registryHash(ORCHESTRA_REGISTRY,'orchestraHash'),
      tools:registryHash(TOOL_REGISTRY,'toolHash'),
    },
    apiSurface:{
      functionCount:Number(apiFunctionCount||0),
      gateways:['/api/admin/auth','/api/admin/content','/api/admin/core','/api/contact'],
    },
    disclosureBoundary:{
      mode:'explicit-allowlist',
      privateByDefault:true,
      rawPrompts:false,
      rawOutputs:false,
      runHistory:false,
      providerConfiguration:false,
      runtimeProfiles:false,
    },
  };
}
