import {getCapability} from './registry.js';

export const CAPABILITY_RESOLUTION_FORMAT='anomancer-capability-resolution/v1';

export function matchCapabilities(problem={}){
  const requested=Array.isArray(problem?.needs)?problem.needs:[];
  const matched=[];
  const unresolved=[];
  const execution=[];

  for(const id of requested){
    const descriptor=getCapability(id);
    if(!descriptor||descriptor.available!==true){
      unresolved.push({
        id:String(id),
        reason:descriptor?'not-wired':'unknown-capability'
      });
      continue;
    }

    matched.push(descriptor);
    if(descriptor.executionCapability){
      execution.push(descriptor.executionCapability);
    }
  }

  return {
    format:CAPABILITY_RESOLUTION_FORMAT,
    requested:[...requested],
    matched,
    unresolved,
    execution:[...new Set(execution)]
  };
}
