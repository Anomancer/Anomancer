import { digest } from './core-registry.js';
import { getWorkspaceTemplate } from './workspace-templates.js';

export const ARTIFACT_BOUNDARY_FORMAT='anomancer-artifact-boundary/v1';
const clone=value=>JSON.parse(JSON.stringify(value));

export function artifactBoundaryForWorkspace(workspace={}){
  const template=getWorkspaceTemplate(workspace.templateId);
  const capabilities=[...(template?.capabilities||[])];
  const boundary={
    format:ARTIFACT_BOUNDARY_FORMAT,workspaceId:String(workspace.id||''),workspaceHash:String(workspace.workspaceHash||''),
    templateId:String(template?.id||workspace.templateId||''),templateHash:String(template?.templateHash||workspace.templateHash||''),
    artifactStoreId:String(template?.artifactStoreId||workspace.artifactStoreId||''),
    contentAdapterId:String(template?.contentAdapterId||workspace.contentAdapterId||''),
    outputAdapterId:String(template?.outputAdapterId||workspace.outputAdapterId||''),
    capabilities,contentReadable:capabilities.includes('content.read'),contentWritable:capabilities.includes('content.write'),
    mediaWritable:capabilities.includes('media.write'),publicationEnabled:capabilities.includes('publication.publish'),
    privateArtifactReadable:capabilities.includes('artifact.private.read'),privateArtifactWritable:capabilities.includes('artifact.private.write'),
    exportEnabled:capabilities.includes('artifact.export'),isolated:!capabilities.includes('content.read'),serverAuthoritative:true
  };
  const hashable=clone(boundary);delete hashable.boundaryHash;
  boundary.boundaryHash=digest(hashable);
  return boundary;
}

export function requireArtifactCapability(workspace,capability){
  const boundary=artifactBoundaryForWorkspace(workspace);
  if(!boundary.capabilities.includes(capability))throw Object.assign(new Error('Valitulla työtilalla ei ole tätä artefakti- tai julkaisuoikeutta. Työtilojen rajoja ei avattu.'),{statusCode:409,code:'WORKSPACE_ARTIFACT_CAPABILITY_DENIED',capability,boundary});
  return boundary;
}
