import { CORE_VERSION, digest } from './core-registry.js';
import { getCapabilityPlugin, validateCapabilityInvocation } from './capability-registry.js';
import { createContextReceipt } from './archive-store.js';
import { getRun } from './run-store.js';

export const NANOMANCER_ANALYSIS_FORMAT='anomancer-nanomancer-analysis/v1';
const MAX_INLINE_CHARS=200_000;
const MAX_STRING=4_000;
const clone=v=>JSON.parse(JSON.stringify(v));
const clean=v=>String(v??'').trim();
const safeId=v=>clean(v).toLowerCase().replace(/[^a-z0-9._:-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);
const scalar=v=>v===null||['string','number','boolean'].includes(typeof v);
function compactValue(value){if(typeof value==='string')return value.length>MAX_STRING?`${value.slice(0,MAX_STRING)}…`:value;if(value===undefined)return null;return value;}
function flat(value,path='$',out=new Map(),depth=0){if(depth>18){out.set(path,'[depth-limit]');return out;}if(scalar(value)){out.set(path,compactValue(value));return out;}if(Array.isArray(value)){if(!value.length)out.set(path,[]);for(let i=0;i<value.length;i++)flat(value[i],`${path}[${i}]`,out,depth+1);return out;}if(value&&typeof value==='object'){const keys=Object.keys(value).sort();if(!keys.length)out.set(path,{});for(const key of keys)flat(value[key],`${path}.${key}`,out,depth+1);return out;}out.set(path,compactValue(String(value)));return out;}
function numericDelta(before,after){if(typeof before!=='number'||typeof after!=='number'||!Number.isFinite(before)||!Number.isFinite(after))return null;const delta=after-before;return{delta,percent:before===0?(after===0?0:null):(delta/Math.abs(before))*100};}
function comparePair(left,right,{maxChanges=240,numericOnly=false}={}){const a=flat(left),b=flat(right),paths=[...new Set([...a.keys(),...b.keys()])].sort(),changes=[];let equal=0,added=0,removed=0,changed=0,numericChanges=0;for(const path of paths){const hasA=a.has(path),hasB=b.has(path),before=a.get(path),after=b.get(path);if(hasA&&hasB&&JSON.stringify(before)===JSON.stringify(after)){equal++;continue;}let kind='changed';if(!hasA){kind='added';added++;}else if(!hasB){kind='removed';removed++;}else changed++;const numeric=numericDelta(before,after);if(numeric)numericChanges++;if(numericOnly&&!numeric)continue;if(changes.length<maxChanges)changes.push({path,kind,before:hasA?before:null,after:hasB?after:null,...(numeric?{numeric}: {})});}
  const largestNumericDeviation=changes.filter(x=>x.numeric&&x.numeric.percent!==null).sort((x,y)=>Math.abs(y.numeric.percent)-Math.abs(x.numeric.percent))[0]||null;
  return{comparedPaths:paths.length,equalPaths:equal,changedPaths:changed,addedPaths:added,removedPaths:removed,numericChanges,largestNumericDeviation:largestNumericDeviation?{path:largestNumericDeviation.path,...largestNumericDeviation.numeric}:null,changes};
}
function runComparable(run={}){return{status:run.status||'',orchestra:{id:run.orchestra?.id||'',name:run.orchestra?.name||'',version:run.orchestra?.version||''},usage:run.usage||{},degradedStages:run.degradedStages||[],disabledStages:run.disabledStages||[],error:run.error||null,humanApproval:run.humanApproval||null,receiptCount:run.receiptCount||run.receipts?.length||0,receipts:(run.receipts||[]).map(r=>({agent:r.agent?.id||'',model:{provider:r.model?.provider||'',id:r.model?.id||r.model?.model||''},usage:r.usage||{},status:r.status||'',outputHash:r.outputHash||''}))};}
function archiveComparable(object={}){if(object.content?.json!==null&&object.content?.json!==undefined)return object.content.json;if(object.content?.text)return object.content.text;return{title:object.title,summary:object.summary,tags:object.tags,relations:object.relations};}
function inlineInput(raw,index){let value=raw?.value;const encoded=JSON.stringify(value);if(encoded===undefined||encoded.length>MAX_INLINE_CHARS)throw Object.assign(new Error('Nanomancerin inline-syöte on liian suuri tai virheellinen.'),{statusCode:413,code:'NANOMANCER_INLINE_LIMIT'});return{descriptor:{kind:'structured-json',id:safeId(raw?.id)||`inline-${index+1}`,label:clean(raw?.label).slice(0,180)||`Inline ${index+1}`,hash:digest(value)},value:clone(value)};}
async function resolveInputs(inputs=[],workspaceId='default',context={}){
  const archiveIds=inputs.filter(x=>x?.kind==='archive').map(x=>safeId(x.id)).filter(Boolean),archiveById=new Map();let contextReceipt=null;
  if(archiveIds.length){const result=await createContextReceipt({workspaceId,runId:context.orchestraRunId||'',purpose:`Nanomancer ${context.operation||'analysis'}`,query:'',objectIds:archiveIds});contextReceipt=result.receipt;for(const object of result.context.objects)archiveById.set(object.id,object);if(result.context.notAccessed.length){const denied=result.context.notAccessed.map(x=>`${x.id}:${x.reason}`).join(', ');throw Object.assign(new Error(`Nanomancer ei saanut kaikkia pyydettyjä Archive-objekteja: ${denied}`),{statusCode:403,code:'NANOMANCER_ARCHIVE_CONTEXT_DENIED',contextReceipt});}}
  const resolved=[];
  for(const [index,raw] of inputs.entries()){
    const kind=String(raw?.kind||'inline');
    if(kind==='archive'){
      const id=safeId(raw.id),object=archiveById.get(id);if(!object)throw Object.assign(new Error('arkisto-objektia ei löytynyt Nanomancerille.'),{statusCode:404,code:'NANOMANCER_ARCHIVE_NOT_FOUND'});
      resolved.push({descriptor:{kind:'archive-object',id:object.id,label:object.title,type:object.type,workspaceId:object.workspaceId,hash:object.integrity?.objectHash||digest(object)},value:archiveComparable(object)});continue;
    }
    if(kind==='run'){
      const id=safeId(raw.id),run=await getRun(id,workspaceId);if(!run)throw Object.assign(new Error(`Ajoa ${id||'(tyhjä)'} ei löytynyt tästä työtilasta.`),{statusCode:404,code:'NANOMANCER_RUN_NOT_FOUND'});
      resolved.push({descriptor:{kind:'run-record',id:run.id,label:run.orchestra?.name||run.id,workspaceId,hash:run.runHash||digest(runComparable(run))},value:runComparable(run)});continue;
    }
    resolved.push(inlineInput(raw,index));
  }
  return{resolved,contextReceipt};
}
function pairFindings(pair,labels=[]){const findings=[];if(pair.changedPaths||pair.addedPaths||pair.removedPaths)findings.push({severity:'info',code:'DIFFERENCE_FOUND',message:`${pair.changedPaths+pair.addedPaths+pair.removedPaths} poikkeavaa polkua: ${labels[0]||'A'} ↔ ${labels[1]||'B'}.`});else findings.push({severity:'ok',code:'NO_DIFFERENCE',message:'Vertailtavat rakenteet ovat samoilta poluilta yhtenevät.'});if(pair.largestNumericDeviation)findings.push({severity:'info',code:'NUMERIC_DEVIATION',message:`Suurin suhteellinen numeerinen muutos: ${pair.largestNumericDeviation.path} (${pair.largestNumericDeviation.percent?.toFixed?.(2)??pair.largestNumericDeviation.percent} %).`});return findings;}
export async function runNanomancer({operation='compare',inputs=[],workspaceId='default',orchestraRunId='',stageId='',maxChanges=240}={}){
  const checked=validateCapabilityInvocation({pluginId:'nanomancer',operation,inputCount:inputs.length});if(!checked.ok)throw Object.assign(new Error(checked.message),{statusCode:400,code:checked.error});const plugin=checked.plugin,limit=Math.max(1,Math.min(plugin.maxChanges,Number(maxChanges)||plugin.maxChanges));
  const {resolved,contextReceipt}=await resolveInputs(inputs,workspaceId,{orchestraRunId,operation});
  if(operation==='cross-run'&&resolved.some(x=>x.descriptor.kind!=='run-record'))throw Object.assign(new Error('Ajojen vertailu hyväksyy vain ajotietueita.'),{statusCode:400,code:'NANOMANCER_CROSS_RUN_INPUT'});
  const base=resolved[0],comparisons=[];for(let i=1;i<resolved.length;i++){const pair=comparePair(base.value,resolved[i].value,{maxChanges:limit,numericOnly:operation==='deviation'});comparisons.push({leftId:base.descriptor.id,rightId:resolved[i].descriptor.id,...pair});}
  const totals=comparisons.reduce((a,x)=>{for(const key of ['comparedPaths','equalPaths','changedPaths','addedPaths','removedPaths','numericChanges'])a[key]+=Number(x[key])||0;return a;},{comparedPaths:0,equalPaths:0,changedPaths:0,addedPaths:0,removedPaths:0,numericChanges:0});
  const findings=comparisons.flatMap((x,i)=>pairFindings(x,[resolved[0].descriptor.label,resolved[i+1].descriptor.label]));
  if(operation==='consistency'){const conflicts=comparisons.reduce((n,x)=>n+x.changedPaths+x.addedPaths+x.removedPaths,0);findings.unshift({severity:conflicts?'warning':'ok',code:conflicts?'CONSISTENCY_CONFLICT':'CONSISTENT',message:conflicts?`${conflicts} rakenteellista ristiriitaa tai puuttuvaa arvoa havaittiin.`:'Rakenteellisessa vertailussa ei havaittu ristiriitoja.'});}
  if(operation==='cross-run'){const left=resolved[0].value,right=resolved[1].value;const costA=Number(left.usage?.estimatedCostEuro)||0,costB=Number(right.usage?.estimatedCostEuro)||0,tokensA=Number(left.usage?.totalTokens)||0,tokensB=Number(right.usage?.totalTokens)||0;findings.unshift({severity:'info',code:'CROSS_RUN_DELTA',message:`Ajojen token-ero ${tokensB-tokensA >=0?'+':''}${tokensB-tokensA}; arvioitu kustannusero ${(costB-costA)>=0?'+':''}${(costB-costA).toFixed(4)} €.`});}
  const identitySeed={pluginHash:plugin.pluginHash,operation,workspaceId:safeId(workspaceId)||'default',inputHashes:resolved.map(x=>x.descriptor.hash)};
  const analysis={format:NANOMANCER_ANALYSIS_FORMAT,coreVersion:CORE_VERSION,id:`nano-${digest(identitySeed).slice(0,20)}`,plugin:{id:plugin.id,version:plugin.version,pluginHash:plugin.pluginHash,deterministic:true,modelUsed:false,sideEffects:false},operation,workspaceId:safeId(workspaceId)||'default',orchestraContext:{runId:safeId(orchestraRunId),stageId:safeId(stageId)},inputs:resolved.map(x=>x.descriptor),summary:{...totals,comparisonCount:comparisons.length,inputCount:resolved.length},comparisons,findings,contextReceiptId:contextReceipt?.id||'',generatedAt:new Date().toISOString(),integrity:{algorithm:'sha256',analysisHash:''}};
  analysis.integrity.analysisHash=digest({pluginHash:plugin.pluginHash,operation,workspaceId:analysis.workspaceId,inputs:analysis.inputs,summary:analysis.summary,comparisons:analysis.comparisons,findings:analysis.findings});return analysis;
}
export function nanomancerStatus(){const plugin=getCapabilityPlugin('nanomancer');return{plugin,format:NANOMANCER_ANALYSIS_FORMAT,deterministic:true,modelUsed:false,automaticPersistence:false};}
