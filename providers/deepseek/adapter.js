import {deepseekChatJson} from '../../server/deepseek.js';

export async function deepseekReasoner({
  system,
  user,
  signal
}={}){
  const response=await deepseekChatJson({
    system,
    user,
    maxTokens:5000,
    thinking:true,
    signal
  });

  return {
    result:response?.result,
    meta:{
      provider:'deepseek',
      model:String(response?.meta?.model||''),
      usage:response?.meta?.usage||null,
      searchedWeb:response?.meta?.searchedWeb===true,
      sources:Array.isArray(response?.meta?.sources)
        ?response.meta.sources
        :[],
      tools:Array.isArray(response?.meta?.tools)
        ?response.meta.tools
        :[],
      cost:response?.meta?.cost||null,
      externalProvider:true,
      transport:'api'
    }
  };
}
