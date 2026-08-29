const definitions=[
  {id:'llm.reasoning',providerClass:'llm',mode:'native',available:true,executionCapability:'llm.reasoning'},
  {id:'llm.analysis',providerClass:'llm',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'llm.writer',providerClass:'llm',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'llm.critic',providerClass:'llm',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'document.read',providerClass:'context',mode:'local-context',available:true,executionCapability:'llm.reasoning'},
  {id:'web.fetch',providerClass:'tool',mode:'public-web-read',available:true,executionCapability:null,readOnly:true},
  {id:'research.search',providerClass:'tool',mode:'runtime-search',available:false,runtimeAvailable:true,executionCapability:null,readOnly:true},
  {id:'repository.read',providerClass:'tool',mode:'github-content-read',available:false,runtimeAvailable:true,executionCapability:null,readOnly:true},
  {id:'mancer.activate',providerClass:'mancer',mode:'package-context',available:true,executionCapability:null,readOnly:true},
  {id:'comparison',providerClass:'reasoning',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'risk.analysis',providerClass:'reasoning',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'evidence.trace',providerClass:'trust',mode:'runtime-trace',available:true,executionCapability:'llm.reasoning'},
  {id:'evidence.validate',providerClass:'reasoning',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'contradiction.check',providerClass:'reasoning',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'code.inspect',providerClass:'reasoning',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'architecture.analyze',providerClass:'reasoning',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'tests.run',providerClass:'tool',mode:'not-wired',available:false,executionCapability:null,requiresApproval:true},
  {id:'external.execute',providerClass:'tool',mode:'human-gated',available:false,executionCapability:null,requiresApproval:true}
];

const C=Object.freeze(Object.fromEntries(definitions.map(item=>[
  item.id,
  Object.freeze({...item})
])));

export const getCapability=id=>C[String(id||'')]||null;
export const listCapabilities=()=>Object.values(C);
