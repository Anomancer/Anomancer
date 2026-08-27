import {
  CORE_VERSION,
  AGENT_REGISTRY,
  ORCHESTRA_REGISTRY,
  TOOL_REGISTRY,
  MODEL_ROUTE_REGISTRY,
  digest,
} from './core-registry.js';

export const PUBLIC_CORE_FORMAT='anomancer-core-public/v2';
export const PUBLIC_BOUNDARY_VERSION='1.0';

const clone=value=>JSON.parse(JSON.stringify(value));

export function createPublicCoreView(){
  return {
    format:PUBLIC_CORE_FORMAT,
    version:CORE_VERSION,
    boundary:{
      version:PUBLIC_BOUNDARY_VERSION,
      mode:'explicit-allowlist',
      publicPrinciple:'architecture-without-control-plane-secrets',
      privateByDefault:true,
    },
    humanFinalAuthority:true,
    privacy:{
      containsRawPrompt:false,
      containsRawOutput:false,
      containsRunHistory:false,
      containsWorkspaceData:false,
      containsProviderConfiguration:false,
      containsRuntimeProfiles:false,
      containsPolicyImplementation:false,
      adminApiUsed:false,
    },
    agents:AGENT_REGISTRY.map(agent=>({
      id:agent.id,
      label:agent.label,
      version:agent.version,
      role:agent.role,
      description:agent.description,
      modelRoute:agent.modelRoute,
      tools:[...(agent.tools||[])],
      humanApprovalRequired:Boolean(agent.humanApproval?.length),
      publishAuthority:false,
      contractHash:agent.contractHash,
    })),
    orchestras:ORCHESTRA_REGISTRY.map(orchestra=>({
      id:orchestra.id,
      name:orchestra.name,
      version:orchestra.version,
      description:orchestra.description,
      mode:orchestra.mode,
      steps:(orchestra.steps||[]).map(step=>({mode:step.mode,agents:[...(step.agents||[])]})),
      humanFinalAuthority:Boolean(orchestra.humanFinalAuthority),
      evidencePolicy:orchestra.evidencePolicy,
      audiencePolicy:orchestra.audiencePolicy,
      orchestraHash:orchestra.orchestraHash,
    })),
    tools:TOOL_REGISTRY.map(tool=>({
      id:tool.id,
      label:tool.label,
      version:tool.version,
      kind:tool.kind,
      description:tool.description,
      risk:tool.risk,
      actor:tool.actor,
      humanApproval:Boolean(tool.humanApproval),
      sideEffects:Boolean(tool.sideEffects),
      toolHash:tool.toolHash,
    })),
    toolBroker:{
      format:'anomancer-tool-policy/v1',
      enforcement:'server-side-fail-closed',
      implicitTools:false,
      humanOnlyActionsRemainHumanOnly:true,
      implementationDetails:'private',
    },
    modelRoutes:MODEL_ROUTE_REGISTRY.map(route=>({
      id:route.id,
      label:route.label,
      requires:[...(route.requires||[])],
      routeHash:route.routeHash,
    })),
    modelRouter:{
      format:'anomancer-model-router-public/v1',
      routeIds:MODEL_ROUTE_REGISTRY.map(route=>route.id),
      providerDetails:'private',
      targetDetails:'private',
      fallbackDetails:'private',
    },
    runReceipt:{
      format:'anomancer-run-receipt/v1',
      publicShape:'hashes-and-boundaries-only',
      containsRawPrompt:false,
      containsRawOutput:false,
      realRuns:'private',
    },
    usagePolicy:{
      contractBudgets:'private',
      actualUsage:'private',
      providerCosts:'private',
      publicReceipt:'hashes-and-boundaries-only',
    },
    workspaceControl:{
      format:'anomancer-workspace/v2',
      templateFormat:'anomancer-workspace-template/v1',
      constitutionFormat:'anomancer-constitution/v1',
      artifactBoundaryFormat:'anomancer-artifact-boundary/v1',
      defaultWorkspace:'default',
      defaultWorkspaceName:'Anomancer',
      shared:['agent-contracts','tool-registry','model-router'],
      scoped:['runtime-profiles','custom-orchestras','runs','usage','artifact-store','content-adapter','output-adapter'],
      contentScope:'workspace-artifact-adapter',
      multiUserAcl:false,
      workspaceNames:'private',
    },
    releaseProvenance:'/release-provenance.json',
  };
}

export function publicCoreSchemaHash(view=createPublicCoreView()){
  const stableView=clone(view);
  return digest(stableView);
}
