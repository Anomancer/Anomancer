import {deepseekChatJson} from '../../server/deepseek.js';
export async function deepseekReasoner({system,user,signal}={}){
  const r=await deepseekChatJson({system,user,maxTokens:5000,thinking:true,signal});
  return {result:r.result,meta:{provider:'deepseek',model:r.meta?.model||'',usage:r.meta?.usage||null}};
}
