import { CORE_VERSION, digest, listAgentIds } from './core-registry.js';
import { listInstalledMancerPackages, getMancerPackageByTemplateId, MANCER_PACKAGE_FORMAT } from './mancer-registry.js';

export const WORKSPACE_TEMPLATE_FORMAT='anomancer-workspace-template/v1';
export const CONSTITUTION_FORMAT='anomancer-constitution/v1';
export const ANOMANCER_TEMPLATE_ID='anomancer/editorial-platform/1.0.0';
export const BLANK_PRIVATE_TEMPLATE_ID='core/blank-private/1.0.0';
export const NARRAMANCER_TEMPLATE_ID='narramancer/story-studio/1.0.0';

const clone=value=>JSON.parse(JSON.stringify(value));
const deepFreeze=value=>{if(!value||typeof value!=='object'||Object.isFrozen(value))return value;for(const child of Object.values(value))deepFreeze(child);return Object.freeze(value);};

function finalizeConstitution(input){
  const contract={format:CONSTITUTION_FORMAT,coreVersion:CORE_VERSION,...clone(input),humanFinalAuthority:true};
  const hashable=clone(contract);delete hashable.coreVersion;delete hashable.constitutionHash;
  contract.constitutionHash=digest(hashable);
  return deepFreeze(contract);
}

const LEGACY_CONSTITUTION_REGISTRY=[
  finalizeConstitution({
    id:'anomancer/editorial-constitution/1.0.0',name:'Anomancer Editorial Constitution',version:'1.0.0',
    purpose:'Tutkiva, yleisölle hyödyllinen julkaisu, jossa kirjoittajan ääni, evidenssin tila ja ihmisen julkaisupäätös säilyvät.',
    protectedProperties:['author-voice','evidence-status','audience-contract','human-publication-authority'],
    forbiddenTransformations:['candidate-to-verified','agent-publish','silent-claim-strengthening','public-workflow-leak'],
    truthPolicy:'Lähde-ehdokas ei ole varmennettu evidenssi. Supported-väite vaatii ihmisen tarkistaman lähteen.',
    continuityPolicy:'Legacy default -työtilan id, tag-refit, ajot ja julkaisuhistoria säilyvät paikoillaan.',
    requiredGates:['source.verify','claims.recheck','editorial.quality','human.publish'],
    completionDefinition:'Julkaisupaketti on tarkistettu ja ihminen hyväksyy lähetyksen eetteriin.'
  }),
  finalizeConstitution({
    id:'narramancer/story-constitution/1.0.0',name:'Narramancer Story Constitution',version:'1.0.0',
    purpose:'Yksityinen tarinatyötila, jossa tekijän intentio, kaanon, jatkuvuus, hahmojen identiteetti ja ihmisen lopullinen kirjoitusvalta säilyvät.',
    protectedProperties:['author-intent','canon-integrity','character-identity','continuity-history','workspace-isolation','human-application-authority'],
    forbiddenTransformations:['cross-workspace-read','cross-workspace-write','silent-canon-rewrite','silent-character-merge','agent-save','agent-publish','implicit-publication-target'],
    truthPolicy:'Narratiivinen kaanon ei ole ulkoinen faktaväite. Agentti saa ehdottaa muutoksia, mutta hyväksytty kaanon muuttuu vain ihmisen soveltamana ja tallentamana.',
    continuityPolicy:'Aikajana, hahmot, luvut ja kaanon kuuluvat samaan workspace-id:hen. Toisen työtilan tarina-aineistoa ei lueta tai yhdistetä.',
    requiredGates:['artifact.private.write','continuity.review','human.apply','human.export'],
    completionDefinition:'Käsikirjoituspaketti on ehdotettu, ihminen on tarkistanut muutokset ja vienti tapahtuu vain nimenomaisella paikallisella vientitoiminnolla.'
  }),
  finalizeConstitution({
    id:'core/blank-private-constitution/1.0.0',name:'Blank Private Constitution',version:'1.0.0',
    purpose:'Turvallinen, eristetty pohja uudelle työtilatyypille ilman Anomancerin sisältöä tai julkaisukohdetta.',
    protectedProperties:['workspace-isolation','human-authority','artifact-provenance'],
    forbiddenTransformations:['cross-workspace-read','cross-workspace-write','implicit-publication-target','agent-publish'],
    truthPolicy:'Uusi työtila ei peri väitteitä, lähteitä tai varmennustilaa toisesta työtilasta.',
    continuityPolicy:'Työtilan omat runtime-, orkesteri- ja ajotagit pysyvät workspace-id:n alla.',
    requiredGates:['artifact-adapter.bind','output-adapter.bind','human.publish'],
    completionDefinition:'Työtilatyypille on sidottu oma artefaktisäilö ja nimenomainen ulostuloadapteri.'
  })
];

const MANCER_PACKAGES=listInstalledMancerPackages();
const PACKAGE_CONSTITUTIONS=MANCER_PACKAGES.map(pkg=>finalizeConstitution(pkg.constitution));
export const CONSTITUTION_REGISTRY=deepFreeze([...LEGACY_CONSTITUTION_REGISTRY,...PACKAGE_CONSTITUTIONS]);
const CONSTITUTION_MAP=new Map(CONSTITUTION_REGISTRY.map(item=>[item.id,item]));
const allAgents=listAgentIds();
const editorialAgents=allAgents.filter(id=>!id.startsWith('narrative-'));
const narrativeAgents=allAgents.filter(id=>id.startsWith('narrative-'));

const NARRAMANCER_EDITOR_DEFINITION=deepFreeze({
  format:'anomancer-workspace-editor-definition/v1',
  navigation:{
    format:'anomancer-workspace-navigation/v1',
    mobilePrimary:[
      {id:'project',label:'Projekti',icon:'⌂',target:'section'},
      {id:'characters',label:'Hahmot',icon:'◎',target:'section'},
      {id:'chapters',label:'Luvut',icon:'≡',target:'section'},
      {id:'orchestra',label:'Orkesteri',icon:'⬡',target:'section'}
    ],
    groups:[
      {id:'create',label:'Luo',items:['project','world','characters','plot']},
      {id:'write',label:'Kirjoita',items:['chapters','timeline','canon']},
      {id:'refine',label:'Jalosta',items:['orchestra']},
      {id:'out',label:'Ulos',items:['export']}
    ]
  },
  sections:[
    {id:'project',label:'Projekti',kind:'form',fields:[
      {path:'project.title',label:'Projektin nimi',type:'text',maxLength:180},
      {path:'project.language',label:'Kieli',type:'select',options:[{value:'fi',label:'Suomi'},{value:'en',label:'English'}]},
      {path:'project.premise',label:'Premissi',type:'textarea',rows:8,maxLength:12000},
      {path:'project.genre',label:'Genre / muoto',type:'text',maxLength:180},
      {path:'project.pointOfView',label:'Kertoja / näkökulma',type:'text',maxLength:180},
      {path:'project.tone',label:'Sävy ja rytmi',type:'textarea',rows:4,maxLength:500},
      {path:'project.notes',label:'Projektimuistiinpanot',type:'textarea',rows:8,maxLength:20000}
    ]},
    {id:'world',label:'Maailma',kind:'form',fields:[
      {path:'world.summary',label:'Maailman yleiskuva',type:'textarea',rows:10,maxLength:40000},
      {path:'world.rules',label:'Maailman säännöt',type:'textarea',rows:8,maxLength:30000},
      {path:'world.locations',label:'Paikat',type:'textarea',rows:8,maxLength:30000},
      {path:'world.notes',label:'Muistiinpanot',type:'textarea',rows:8,maxLength:30000}
    ]},
    {id:'characters',label:'Hahmot',kind:'characters'},
    {id:'plot',label:'Juoni',kind:'form',fields:[
      {path:'plot.summary',label:'Juonen ydin',type:'textarea',rows:10,maxLength:40000},
      {path:'plot.beats',label:'Beatit / käännekohdat',type:'textarea',rows:12,maxLength:40000},
      {path:'plot.ending',label:'Loppu / ratkaisu',type:'textarea',rows:8,maxLength:20000},
      {path:'plot.notes',label:'Juonimuistiinpanot',type:'textarea',rows:8,maxLength:30000}
    ]},
    {id:'chapters',label:'Luvut',kind:'chapters'},
    {id:'timeline',label:'Aikajana',kind:'timeline'},
    {id:'canon',label:'Kaanon',kind:'canon'},
    {id:'orchestra',label:'Orkesteri',kind:'narrative-orchestra'},
    {id:'export',label:'Vienti',kind:'export'}
  ]
});

function finalizeTemplate(input){
  const constitution=CONSTITUTION_MAP.get(input.constitutionId);
  if(!constitution)throw new Error(`Unknown constitution: ${input.constitutionId}`);
  const template={
    format:WORKSPACE_TEMPLATE_FORMAT,coreVersion:CORE_VERSION,...clone(input),
    constitutionHash:constitution.constitutionHash,
    humanFinalAuthority:true
  };
  const hashable=clone(template);delete hashable.coreVersion;delete hashable.templateHash;
  template.templateHash=digest(hashable);
  return deepFreeze(template);
}

const LEGACY_WORKSPACE_TEMPLATE_REGISTRY=[
  finalizeTemplate({
    id:ANOMANCER_TEMPLATE_ID,name:'Anomancer',version:'1.0.0',kind:'editorial-platform',instancePolicy:'singleton-default',
    description:'Nykyinen Lähetyskone, Anomancer-julkaisut ja toimituksellinen orkesterikerros.',
    purpose:'Kirjoita, tarkista ja julkaise Anomancerin lähetyksiä.',
    constitutionId:'anomancer/editorial-constitution/1.0.0',
    allowedAgentIds:editorialAgents,builtInOrchestraIds:['editorial'],defaultOrchestraId:'editorial',
    artifactStoreId:'anomancer/github-markdown-content/v1',contentAdapterId:'anomancer/github-markdown/v1',
    outputAdapterId:'anomancer/vercel-publication/v1',uiProfileId:'anomancer/editorial-ui/v1',
    editorDefinition:{
      format:'anomancer-workspace-editor-definition/v1',
      navigation:{format:'anomancer-workspace-navigation/v1',mobilePrimary:[
        {id:'write',label:'Kirjoita',icon:'✎',target:'section'},
        {id:'evidence',label:'Evidenssi',icon:'◈',target:'section'},
        {id:'orchestra',label:'Orkesteri',icon:'⬡',target:'section'},
        {id:'preview',label:'Esikatselu',icon:'▣',target:'command'}
      ],groups:[
        {id:'work',label:'Työ',items:['dispatches','write']},
        {id:'verify',label:'Tarkista',items:['evidence','agents','orchestra']},
        {id:'out',label:'Ulos',items:['publish','materials']}
      ]},
      sections:[
        {id:'dispatches',label:'Lähetykset',kind:'editor-action'},
        {id:'write',label:'Kirjoita',kind:'editor-tab'},
        {id:'evidence',label:'Evidenssi',kind:'editor-tab'},
        {id:'agents',label:'Agentit',kind:'editor-tab'},
        {id:'orchestra',label:'Orkesteriajo',kind:'editor-anchor'},
        {id:'publish',label:'Julkaisu',kind:'editor-action'},
        {id:'materials',label:'Aineisto & ulostulo',kind:'shell-surface'}
      ]
    },
    capabilities:['content.read','content.write','media.write','publication.publish','runtime.manage','orchestra.custom','runs.read']
  }),
  finalizeTemplate({
    id:NARRAMANCER_TEMPLATE_ID,name:'Narramancer',version:'1.0.0',kind:'narrative-authoring',instancePolicy:'multiple',
    description:'Yksityinen tarina- ja käsikirjoitustyötila omalla kaanonilla, luvuilla, orkesterilla ja vientirajalla.',
    purpose:'Rakenna maailma, hahmot, juoni, luvut, aikajana ja kaanon erillään Anomancerin julkaisuista.',
    constitutionId:'narramancer/story-constitution/1.0.0',
    allowedAgentIds:narrativeAgents,builtInOrchestraIds:['narramancer'],defaultOrchestraId:'narramancer',
    artifactStoreId:'narramancer/private-project-store/v1',contentAdapterId:'narramancer/story-project-json/v1',
    outputAdapterId:'narramancer/local-export-only/v1',uiProfileId:'narramancer/story-editor-ui/v1',editorDefinition:NARRAMANCER_EDITOR_DEFINITION,
    capabilities:['artifact.private.read','artifact.private.write','artifact.export','runtime.manage','orchestra.custom','runs.read']
  }),
  finalizeTemplate({
    id:BLANK_PRIVATE_TEMPLATE_ID,name:'Tyhjä eristetty työtila',version:'1.0.0',kind:'blank-private',instancePolicy:'multiple',
    description:'Pohja uudelle koneelle. Ei peri Anomancerin Markdownia, orkesteria tai julkaisukohdetta.',
    purpose:'Rakenna uusi työtilatyyppi turvallisen artefakti- ja ulostulorajan taakse.',
    constitutionId:'core/blank-private-constitution/1.0.0',
    allowedAgentIds:allAgents,builtInOrchestraIds:[],defaultOrchestraId:'',
    artifactStoreId:'workspace/private-isolated/v1',contentAdapterId:'workspace/unbound-private/v1',
    outputAdapterId:'workspace/no-publication/v1',uiProfileId:'workspace/blank-private-ui/v1',
    capabilities:['runtime.manage','orchestra.custom','runs.read']
  })
];

function packageTemplateInput(pkg){
  const m=pkg.manifest,bindings=pkg.agentBindings||{},orchestras=pkg.orchestraRegistry?.orchestras||[];
  return{
    id:m.templateId,name:m.name,version:m.version,kind:m.kind,instancePolicy:m.instancePolicy||'multiple',description:m.description,purpose:m.purpose,constitutionId:m.constitutionId,
    allowedAgentIds:(bindings.sharedAgentIds||[]).filter(id=>allAgents.includes(id)),builtInOrchestraIds:[],defaultOrchestraId:'',
    packageOrchestraIds:orchestras.map(x=>x.id),artifactStoreId:m.artifactStoreId,contentAdapterId:m.contentAdapterId,outputAdapterId:m.outputAdapterId,uiProfileId:m.uiProfileId,
    editorDefinition:{format:'anomancer-workspace-editor-definition/v1',renderer:pkg.uiSchema.renderer,navigation:pkg.uiSchema.navigation,sections:pkg.uiSchema.sections},
    capabilities:m.capabilities||[],mancerPackage:{format:MANCER_PACKAGE_FORMAT,id:m.id,version:m.version,contractHash:pkg.contractHash,approvalModel:pkg.approvalModel,artifactBoundary:pkg.artifactBoundary,agentBindings:pkg.agentBindings,orchestraRegistry:pkg.orchestraRegistry,archivePolicy:pkg.archivePolicy}
  };
}
const PACKAGE_TEMPLATES=MANCER_PACKAGES.map(pkg=>finalizeTemplate(packageTemplateInput(pkg)));
export const WORKSPACE_TEMPLATE_REGISTRY=deepFreeze([...LEGACY_WORKSPACE_TEMPLATE_REGISTRY,...PACKAGE_TEMPLATES]);

const TEMPLATE_MAP=new Map(WORKSPACE_TEMPLATE_REGISTRY.map(item=>[item.id,item]));

export function getWorkspaceTemplate(id){const item=TEMPLATE_MAP.get(String(id||''));return item?clone(item):null;}
export function requireWorkspaceTemplate(id){const item=getWorkspaceTemplate(id);if(!item)throw Object.assign(new Error('Tuntematon tai poistettu työtilatyyppi.'),{statusCode:400,code:'WORKSPACE_TEMPLATE_UNKNOWN'});return item;}
export function getConstitution(id){const item=CONSTITUTION_MAP.get(String(id||''));return item?clone(item):null;}
export function listWorkspaceTemplates(){return WORKSPACE_TEMPLATE_REGISTRY.map(clone);}
export function listConstitutions(){return CONSTITUTION_REGISTRY.map(clone);}
export function defaultTemplateIdFor(source='custom'){return source==='built-in'?ANOMANCER_TEMPLATE_ID:BLANK_PRIVATE_TEMPLATE_ID;}
export function workspaceTemplateBinding(templateId){
  const template=requireWorkspaceTemplate(templateId),constitution=getConstitution(template.constitutionId);
  return{
    templateId:template.id,templateHash:template.templateHash,constitutionId:constitution.id,constitutionHash:constitution.constitutionHash,
    enabledOrchestraIds:[...template.builtInOrchestraIds],defaultOrchestraId:template.defaultOrchestraId,
    artifactStoreId:template.artifactStoreId,contentAdapterId:template.contentAdapterId,
    outputAdapterId:template.outputAdapterId,uiProfileId:template.uiProfileId
  };
}

export function getMancerPackageForTemplate(templateId){return getMancerPackageByTemplateId(templateId);}
