import {
  INTENT_FORMAT,
  RESULT_FORMAT
} from '../intent/contracts.js';

import {
  WORKSPACE_CONTEXT_FORMAT
} from '../workspace/contracts.js';

import {
  ORCHESTRATION_FORMAT
} from '../orchestration/lighthouse-plan.js';

import {
  MACHINE_RUNTIME_FORMAT
} from '../runtime/lighthouse-machine.js';

import {
  lighthouseEnvironment,
  lighthouseLabAllowed,
  lighthouseLabRequiresAuth
} from '../authority/lab-policy.js';

export const CORE_SNAPSHOT_FORMAT='anomancer-core-snapshot/v1';

function environmentSnapshot(environment={}){
  const vercelEnv=lighthouseEnvironment(environment);
  const explicitLab=String(environment.ANOMANCER_LIGHTHOUSE_LAB||'')==='1';

  return {
    name:vercelEnv,
    labAllowed:lighthouseLabAllowed(environment),
    authRequired:lighthouseLabRequiresAuth(environment),
    explicitLabOverride:explicitLab,
    remoteDefaultLocked:['preview','production'].includes(vercelEnv)&&!explicitLab,
    productionDefaultLocked:vercelEnv==='production'&&!explicitLab
  };
}

export function createCoreSnapshot({
  environment={},
  intent={},
  result={},
  machine={},
  orchestration={}
}={}){
  const workspace=intent.workspace||{};
  const materials=Array.isArray(workspace.materials)?workspace.materials:[];

  return {
    format:CORE_SNAPSHOT_FORMAT,

    authority:{
      finalAuthority:'human',
      humanFinalAuthority:true,
      modelMaySuggest:true,
      modelMayPublish:false,
      modelMayExecuteExternalSideEffects:false,
      approvalRequiredForExternalEffects:true,
      note:'Lighthouse voi muodostaa ehdotuksia ja vastauksia, mutta tämä lab-polku ei anna mallille itsenäistä julkaisu- tai sivuvaikutusvaltaa.'
    },

    policy:{
      mode:'construction-mode',
      environment:environmentSnapshot(environment),
      automaticModelMemory:false,
      automaticPublication:false,
      automaticExternalActions:false
    },

    storage:{
      workspaceStore:'browser-localStorage',
      automaticWorkspaceSave:true,
      synchronized:false,
      serverArchive:false,
      limits:{
        workspaces:12,
        materialsPerWorkspace:12,
        versionsPerWorkspace:20
      },
      note:'D3 Construction Mode -työtilat säilyvät vain nykyisen selaimen paikallisessa tallennustilassa.'
    },

    contracts:[
      {
        layer:'D0/D1',
        name:'Intent',
        format:INTENT_FORMAT
      },
      {
        layer:'D1/D2',
        name:'Work result',
        format:RESULT_FORMAT
      },
      {
        layer:'D3',
        name:'Workspace context',
        format:WORKSPACE_CONTEXT_FORMAT
      },
      {
        layer:'D4',
        name:'Orchestration',
        format:ORCHESTRATION_FORMAT
      },
      {
        layer:'D5',
        name:'Machine runtime',
        format:MACHINE_RUNTIME_FORMAT
      },
      {
        layer:'D6',
        name:'Core snapshot',
        format:CORE_SNAPSHOT_FORMAT
      }
    ],

    boundaries:{
      externalProviderUsed:machine?.connections?.externalProvider===true,
      webSearchUsed:machine?.connections?.webSearchUsed===true,
      workspaceContextSent:machine?.dataFlow?.workspaceContextSent===true,
      materialsSent:Number(machine?.dataFlow?.materialsSent)||0,
      destination:String(machine?.dataFlow?.destination||'runtime'),
      workspaceMaterialsAvailable:materials.length
    },

    provenance:{
      resultState:String(result.state||'completed'),
      trustRecorded:Boolean(result.trust),
      orchestrationRecorded:Boolean(orchestration?.format),
      machineRuntimeRecorded:Boolean(machine?.format),
      workspaceId:String(workspace.id||''),
      traceCompleteness:{
        trust:Boolean(result.trust),
        workspace:Boolean(workspace.id),
        orchestration:Boolean(orchestration?.format),
        machine:Boolean(machine?.format)
      }
    }
  };
}

export function runtimeEnvironment(){
  if(typeof process!=='undefined'&&process?.env){
    return process.env;
  }
  return {};
}
