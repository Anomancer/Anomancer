import {deepseekChatJson} from '../../server/deepseek.js';

function phaseSettings(phase){
  switch(String(phase||'work')){
    case 'plan':
      return {maxTokens:2200,thinking:false,model:process.env.DEEPSEEK_MODEL};
    case 'review':
      return {maxTokens:5200,thinking:true,model:process.env.DEEPSEEK_CRITIC_MODEL||process.env.DEEPSEEK_MODEL};
    default:
      return {maxTokens:6000,thinking:true,model:process.env.DEEPSEEK_MODEL};
  }
}

export async function deepseekReasoner({
  system,
  user,
  phase='work',
  signal
}={}){
  const settings=phaseSettings(phase);
  const response=await deepseekChatJson({
    system,
    user,
    model:settings.model,
    maxTokens:settings.maxTokens,
    thinking:settings.thinking,
    signal
  });

  return {
    result:response?.result,
    meta:{
      provider:'deepseek',
      model:String(response?.meta?.model||''),
      phase:String(phase||'work'),
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
