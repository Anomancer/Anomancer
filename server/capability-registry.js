import { CORE_VERSION, digest } from './core-registry.js';

export const CAPABILITY_PLUGIN_FORMAT='anomancer-capability-plugin/v1';
export const CAPABILITY_RESULT_FORMAT='anomancer-capability-result/v1';
const clone=value=>JSON.parse(JSON.stringify(value));
const deepFreeze=value=>{if(!value||typeof value!=='object'||Object.isFrozen(value))return value;for(const child of Object.values(value))deepFreeze(child);return Object.freeze(value);};

const RAW_CAPABILITIES=[{
  id:'nanomancer',name:'Nanomancer',version:'1.0.0',type:'analysis-capability',description:'Vain luku -analyysimikroskooppi rakenteisen datan, arkisto-objektien ja ajohistorian vertailuun.',
  operations:['compare','diff','consistency','deviation','cross-run'],
  inputs:['archive-object','run-record','structured-json'],outputs:['anomancer-nanomancer-analysis/v1'],supportedWorkspaces:['*'],
  permissions:{archive:'read-granted',runs:'read-own-workspace',artifactStore:'none',workspaceWrite:'none',archiveWrite:'none',modelAccess:'none',toolAccess:'none'},
  sideEffects:false,requiresApproval:false,humanApprovalForPersistence:true,deterministic:true,costClass:'local-deterministic',maxInputs:8,maxChanges:240
}];
function finalize(input){const plugin={format:CAPABILITY_PLUGIN_FORMAT,coreVersion:CORE_VERSION,...clone(input)};const hashable=clone(plugin);delete hashable.coreVersion;delete hashable.pluginHash;plugin.pluginHash=digest(hashable);return deepFreeze(plugin);}
export const CAPABILITY_REGISTRY=deepFreeze(RAW_CAPABILITIES.map(finalize));
const MAP=new Map(CAPABILITY_REGISTRY.map(x=>[x.id,x]));
export function getCapabilityPlugin(id){const item=MAP.get(String(id||''));return item?clone(item):null;}
export function listCapabilityPlugins(){return CAPABILITY_REGISTRY.map(clone);}
export function validateCapabilityInvocation({pluginId,operation,inputCount=0}={}){const plugin=getCapabilityPlugin(pluginId);if(!plugin)return{ok:false,error:'CAPABILITY_UNKNOWN',message:'Capability-pluginia ei löytynyt.'};if(!plugin.operations.includes(String(operation||'')))return{ok:false,error:'CAPABILITY_OPERATION_UNKNOWN',message:'Capability-plugin ei tue pyydettyä operaatiota.'};if(inputCount<2)return{ok:false,error:'CAPABILITY_INPUT_MIN',message:'Nanomancer tarvitsee vähintään kaksi vertailtavaa syötettä.'};if(inputCount>plugin.maxInputs)return{ok:false,error:'CAPABILITY_INPUT_MAX',message:`Nanomancer hyväksyy enintään ${plugin.maxInputs} syötettä kerralla.`};return{ok:true,plugin};}
