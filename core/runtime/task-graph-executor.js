import {TASK_GRAPH_FORMAT} from './task-graph.js';

export const TASK_GRAPH_EXECUTOR_FORMAT='anomancer-task-graph-executor/v1';

function cleanId(value){return String(value||'').trim().slice(0,160);}
function positiveInt(value,fallback,min=1,max=32){
  const n=Number(value);
  return Number.isInteger(n)&&n>=min&&n<=max?n:fallback;
}

function withTimeout(promise,timeoutMs,id){
  const timeout=positiveInt(timeoutMs,30_000,250,120_000);
  let timer=null;
  return Promise.race([
    promise,
    new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(Object.assign(new Error(`Task ${id} aikakatkaistiin.`),{code:'TASK_TIMEOUT',taskId:id})),timeout);
    })
  ]).finally(()=>{if(timer)clearTimeout(timer);});
}

async function runNode(node,runner,{timeoutMs=30_000,retry=0}={}){
  const id=cleanId(node?.id);
  const startedAt=Date.now();
  let attempts=0;
  let lastError=null;
  while(attempts<=retry){
    attempts+=1;
    try{
      const result=await withTimeout(Promise.resolve().then(()=>runner(node)),timeoutMs,id);
      return {id,status:'completed',attempts,durationMs:Date.now()-startedAt,result};
    }catch(error){
      lastError=error;
      if(attempts>retry)break;
    }
  }
  return {id,status:'failed',attempts,durationMs:Date.now()-startedAt,error:String(lastError?.code||lastError?.message||'TASK_FAILED').slice(0,180)};
}

export async function executeTaskGraph(graph,{runner,concurrency=4,timeoutMs=30_000,retry=0,shouldRun}={}){
  if(String(graph?.format||'')!==TASK_GRAPH_FORMAT){
    throw Object.assign(new Error('Tuntematon Task Graph -formaatti.'),{code:'TASK_GRAPH_FORMAT'});
  }
  if(typeof runner!=='function')throw Object.assign(new Error('Task Graph -executor tarvitsee runner-funktion.'),{code:'TASK_RUNNER_MISSING'});

  const stages=Array.isArray(graph?.stages)?graph.stages:[];
  const nodesById=new Map((Array.isArray(graph?.nodes)?graph.nodes:[]).map(node=>[cleanId(node.id),node]));
  const bounded=positiveInt(concurrency,4,1,16);
  const all=[];

  for(const stage of stages){
    const candidateIds=Array.isArray(stage?.capabilityIds)?stage.capabilityIds.map(cleanId).filter(Boolean):[];
    const runnable=candidateIds
      .map(id=>nodesById.get(id))
      .filter(Boolean)
      .filter(node=>node.blocked!==true)
      .filter(node=>shouldRun?shouldRun(node):true);

    const stageStarted=Date.now();
    const results=[];
    for(let i=0;i<runnable.length;i+=bounded){
      const batch=runnable.slice(i,i+bounded);
      const batchResults=await Promise.all(batch.map(node=>runNode(node,runner,{timeoutMs,retry})));
      results.push(...batchResults);
    }

    const stageResult={
      index:Number(stage?.index)||0,
      capabilityIds:runnable.map(node=>cleanId(node.id)),
      parallel:runnable.length>1,
      status:results.some(item=>item.status==='failed')?'degraded':runnable.length?'completed':'skipped',
      durationMs:Date.now()-stageStarted,
      results:results.map(({result,...meta})=>({resultMeta:result, ...meta}))
    };
    all.push(stageResult);
  }

  const results=all.flatMap(stage=>stage.results);
  return Object.freeze({
    format:TASK_GRAPH_EXECUTOR_FORMAT,
    graphFormat:TASK_GRAPH_FORMAT,
    concurrency:bounded,
    timeoutMs:positiveInt(timeoutMs,30_000,250,120_000),
    retry:positiveInt(retry,0,0,3),
    stages:all,
    results,
    completed:results.filter(item=>item.status==='completed').length,
    failed:results.filter(item=>item.status==='failed').length,
    degraded:results.some(item=>item.status==='failed'),
    durationMs:all.length?Math.max(...all.map(stage=>stage.durationMs)):0
  });
}
