const C=Object.freeze({'llm.reasoning':Object.freeze({id:'llm.reasoning',providerClass:'llm'})});
export const getCapability=id=>C[String(id||'')]||null;
export const listCapabilities=()=>Object.values(C);
