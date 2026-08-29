import {getCapability} from './registry.js';

export const CAPABILITY_RESOLUTION_FORMAT='anomancer-capability-resolution/v1';

export function matchCapabilities(problem={},options={}){
  const requested=Array.isArray(problem?.needs)?problem.needs:[];
  const availability=options&&typeof options.availability==='object'?options.availability:{};
  const matched=[];
  const unresolved=[];
  const execution=[];

  for(const id of requested){
    const descriptor=getCapability(id);
    const dynamic=Object.prototype.hasOwnProperty.call(availability,id)
      ?availability[id]===true
      :undefined;
    const available=dynamic===undefined?descriptor?.available===true:dynamic;

    if(!descriptor||!available){
      unresolved.push({
        id:String(id),
        reason:descriptor?.runtimeAvailable?'runtime-unavailable':descriptor?'not-wired':'unknown-capability'
      });
      continue;
    }

    const resolved={...descriptor,available:true,runtimeResolved:dynamic!==undefined};
    matched.push(resolved);
    if(resolved.executionCapability)execution.push(resolved.executionCapability);
  }

  return {
    format:CAPABILITY_RESOLUTION_FORMAT,
    requested:[...requested],
    matched,
    unresolved,
    execution:[...new Set(execution)]
  };
}
