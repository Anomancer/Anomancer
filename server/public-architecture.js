import {
  CAPABILITY_PACKAGE_FORMAT,
  compileCapabilityDescriptors
} from './capability-package-registry.js';
import {computeRuntimePublicProfile} from './compute-runtime.js';
import {taskGraphPublicProfile} from '../core/runtime/task-graph.js';

export const PUBLIC_ARCHITECTURE_FORMAT='anomancer-public-architecture/v1';

const clone=value=>JSON.parse(JSON.stringify(value));

function familySummary(packages){
  const counts=new Map();
  for(const item of packages){
    const family=String(item.family||'other');
    counts.set(family,(counts.get(family)||0)+1);
  }
  return [...counts.entries()]
    .map(([id,count])=>({id,count}))
    .sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id));
}

export function createPublicArchitectureView(){
  const {descriptors}=compileCapabilityDescriptors();

  const packages=descriptors.map(capability=>Object.freeze({
    id:capability.id,
    name:capability.label||capability.id,
    purpose:capability.purpose||'',
    version:capability.package?.version||'',
    family:capability.providerClass||'other',
    mode:capability.mode||'',
    routing:capability.routing||'unrouted',
    availability:capability.available===true
      ?'ready'
      :capability.runtimeAvailable===true
        ?'runtime'
        :'disabled',
    adapterKind:capability.package?.adapterKind||'',
    runtimeAdapter:capability.runtimeAdapter||null,
    requiresHumanApproval:capability.requiresApproval===true,
    dataEgress:capability.dataEgress||'none'
  }));

  const compute=computeRuntimePublicProfile();
  const taskGraph=taskGraphPublicProfile();
  const modelEnsemble=packages
    .filter(item=>['model.compare','model.disagreement','model.merge','uncertainty.calibrate'].includes(item.id))
    .map(item=>({id:item.id,availability:item.availability}));

  return Object.freeze({
    format:PUBLIC_ARCHITECTURE_FORMAT,
    capabilityPackages:Object.freeze({
      format:CAPABILITY_PACKAGE_FORMAT,
      count:packages.length,
      families:familySummary(packages),
      packages:clone(packages)
    }),
    execution:Object.freeze({
      ingress:'ProblemModel',
      matching:'Capability Registry',
      graph:taskGraph.format,
      router:'Capability Router',
      hands:'Lighthouse Hands',
      trace:'Evidence + runtime trace',
      finalAuthority:'human',
      routings:[...taskGraph.routings]
    }),
    compute,
    taskGraph,
    sourceRuntime:Object.freeze({
      readOnly:true,
      externalSideEffects:false,
      capabilities:packages
        .filter(item=>item.family==='source'&&item.routing==='read-only')
        .map(item=>item.id)
    }),
    ensemble:Object.freeze({
      status:modelEnsemble.length&&modelEnsemble.every(item=>item.availability==='disabled')
        ?'declared-not-executable'
        :'partial-or-ready',
      capabilities:modelEnsemble
    }),
    publicBoundary:Object.freeze({
      allowlistOnly:true,
      packageContractsPublished:false,
      packagePermissionsPublished:false,
      providerConfigurationPublished:false,
      promptsPublished:false,
      workspaceDataPublished:false,
      runContentPublished:false
    })
  });
}
