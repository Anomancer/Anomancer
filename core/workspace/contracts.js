export const WORKSPACE_CONTEXT_FORMAT='anomancer-workspace-context/v1';

function clean(value,max=8000){
  return String(value||'').trim().slice(0,max);
}

export function normalizeWorkspaceContext(value={}){
  const materials=(Array.isArray(value.materials)?value.materials:[])
    .map(item=>({
      title:clean(item?.title,160),
      content:clean(item?.content,8000)
    }))
    .filter(item=>item.title||item.content)
    .slice(0,12);

  return {
    format:WORKSPACE_CONTEXT_FORMAT,
    id:clean(value.id,120),
    title:clean(value.title,180),
    materials
  };
}
