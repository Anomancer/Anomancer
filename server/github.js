const API = 'https://api.github.com';

function config() {
  const token = process.env.GITHUB_CONTENT_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!token || !repo || !repo.includes('/')) throw Object.assign(new Error('GitHub-sisältöyhteys ei ole konfiguroitu.'), { code:'GITHUB_CONFIG', statusCode:503 });
  return { token, repo, branch };
}

async function gh(path, options={}) {
  const { token } = config();
  const r = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Accept':'application/vnd.github+json',
      'Authorization':`Bearer ${token}`,
      'X-GitHub-Api-Version':'2022-11-28',
      'User-Agent':'anomancer-admin-v14',
      ...(options.headers || {}),
    },
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message:text }; }
  if (!r.ok) {
    const err = new Error(data?.message || `GitHub ${r.status}`);
    err.statusCode = r.status === 404 ? 404 : (r.status === 409 || r.status === 422 ? 409 : 502);
    err.code = `GITHUB_${r.status}`;
    err.details = data;
    throw err;
  }
  return data;
}

export function githubConfigStatus() {
  return {
    repo: process.env.GITHUB_REPO || '',
    branch: process.env.GITHUB_BRANCH || 'main',
    configured: Boolean(process.env.GITHUB_CONTENT_TOKEN && process.env.GITHUB_REPO),
  };
}

export async function listDir(dir) {
  const { repo, branch } = config();
  const data = await gh(`/repos/${repo}/contents/${encodeURI(dir)}?ref=${encodeURIComponent(branch)}`);
  return Array.isArray(data) ? data.filter(x=>x.type==='file' && x.name.endsWith('.md')) : [];
}

export async function getFile(filePath) {
  const { repo, branch } = config();
  const data = await gh(`/repos/${repo}/contents/${encodeURI(filePath)}?ref=${encodeURIComponent(branch)}`);
  return {
    path: data.path,
    sha: data.sha,
    content: Buffer.from(String(data.content || '').replace(/\n/g,''), 'base64').toString('utf8'),
    htmlUrl: data.html_url || '',
  };
}

export async function listPosts() {
  const dirs = ['content/fi','content/en'];
  const entries = (await Promise.all(dirs.map(async d => {
    try { return await listDir(d); }
    catch (e) { if (e.statusCode === 404) return []; throw e; }
  }))).flat();
  const files = await Promise.all(entries.map(e=>getFile(e.path)));
  return files;
}

export async function putFile(filePath, content, { sha, message } = {}) {
  const { repo, branch } = config();
  const body = {
    message: message || `content: update ${filePath}`,
    content: Buffer.from(content,'utf8').toString('base64'),
    branch,
  };
  if (sha) body.sha = sha;
  const data = await gh(`/repos/${repo}/contents/${encodeURI(filePath)}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  return { sha:data?.content?.sha || '', commitSha:data?.commit?.sha || '', htmlUrl:data?.content?.html_url || '' };
}


export async function putBase64File(filePath, base64Content, { message } = {}) {
  const { repo, branch } = config();
  if (!/^[A-Za-z0-9._\/-]+$/.test(filePath) || filePath.includes('..')) throw Object.assign(new Error('Virheellinen media-polku.'), { statusCode:400 });
  const data = await gh(`/repos/${repo}/contents/${encodeURI(filePath)}`, {
    method:'PUT', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ message:message || `media: add ${filePath}`, content:String(base64Content||''), branch }),
  });
  return { sha:data?.content?.sha || '', commitSha:data?.commit?.sha || '', htmlUrl:data?.content?.html_url || '' };
}

export async function deleteFile(filePath, sha, { message } = {}) {
  const { repo, branch } = config();
  if (!sha) throw Object.assign(new Error('SHA puuttuu poistosta.'), { statusCode:400 });
  const data = await gh(`/repos/${repo}/contents/${encodeURI(filePath)}`, {
    method:'DELETE', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ message:message || `content: delete ${filePath}`, sha, branch }),
  });
  return { commitSha:data?.commit?.sha || '' };
}

export async function repoInfo() {
  const { repo } = config();
  const data = await gh(`/repos/${repo}`);
  return { fullName:data.full_name, private:Boolean(data.private), defaultBranch:data.default_branch, htmlUrl:data.html_url };
}

function safeOperationBranch(value){const branch=String(value||'');if(!/^anomancer\/op-[a-z0-9-]{8,80}$/.test(branch))throw Object.assign(new Error('Operation-haaran nimi ei ole sallittu.'),{statusCode:400,code:'GITHUB_OPERATION_BRANCH'});return branch;}
function safeSha(value){const sha=String(value||'').toLowerCase();if(!/^[a-f0-9]{40}$/.test(sha))throw Object.assign(new Error('Git commit SHA ei ole kelvollinen.'),{statusCode:400,code:'GITHUB_OPERATION_SHA'});return sha;}
function safeWorkflowMode(value){const mode=String(value||'');if(!['tests','preview','production','rollback'].includes(mode))throw Object.assign(new Error('Workflow-tila ei ole sallittu.'),{statusCode:400,code:'GITHUB_WORKFLOW_MODE'});return mode;}
function safeOperationFile(item){const path=String(item?.path||'').replace(/\\/g,'/'),content=String(item?.content??''),bytes=Buffer.byteLength(content,'utf8');if(!path||path.length>500||path.startsWith('/')||path.split('/').some(part=>!part||part==='.'||part==='..')||!/^[A-Za-z0-9._@+\/-]+$/.test(path)||/(^|\/)(?:\.git|\.vercel|node_modules)(?:\/|$)|(^|\/)\.env(?:\.|$)/i.test(path))throw Object.assign(new Error('Operation-tiedoston polku ei ole sallittu.'),{statusCode:400,code:'GITHUB_OPERATION_FILE_PATH'});if(bytes>300_000)throw Object.assign(new Error('Operation-tiedosto ylittää kokorajan.'),{statusCode:413,code:'GITHUB_OPERATION_FILE_SIZE'});return{path,content,bytes};}
export function validateDeploymentRollbackTarget(value){const target=String(value||'').trim();if(!/^(?:https:\/\/(?:[a-z0-9-]+\.)*vercel\.app\/?|https:\/\/vercel\.com\/[A-Za-z0-9._\/-]{1,250}|dpl_[A-Za-z0-9]{8,200})$/i.test(target))throw Object.assign(new Error('Rollback-kohteen pitää olla Vercel deployment -URL tai dpl_-id.'),{statusCode:400,code:'GITHUB_WORKFLOW_ROLLBACK_TARGET'});return target;}

export function githubOperationStatus(){const status=githubConfigStatus();return{...status,adapter:'github-git-data/v1',defaultBranchOnly:false,operationBranches:'anomancer/op-*',directDefaultBranchWrite:false,workflowFile:process.env.ANOMANCER_CAPABILITY_WORKFLOW||'anomancer-capability-gate.yml'};}

export async function getRepositoryHead() {
  const { repo, branch } = config();
  const data=await gh(`/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  return{repo,branch,sha:safeSha(data?.object?.sha),htmlUrl:`https://github.com/${repo}/tree/${encodeURIComponent(branch)}`};
}

export async function getOperationBranch(branchName){
  const {repo}=config(),branch=safeOperationBranch(branchName);
  const data=await gh(`/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  return{branch,sha:safeSha(data?.object?.sha)};
}
export async function findOperationBranch(branchName){try{return await getOperationBranch(branchName);}catch(error){if(error.statusCode===404)return null;throw error;}}

export async function createOperationCommit({branchName,baseSha,files,message}){
  const {repo,branch:baseBranch}=config(),branch=safeOperationBranch(branchName),parent=safeSha(baseSha),items=(Array.isArray(files)?files:[]).map(safeOperationFile);
  if(!items.length||items.length>20)throw Object.assign(new Error('Repository-operaatio tarvitsee 1–20 tiedostoa.'),{statusCode:400,code:'GITHUB_OPERATION_FILES'});
  if(items.reduce((sum,item)=>sum+item.bytes,0)>1_000_000)throw Object.assign(new Error('Operation-tiedostot ylittävät kokonaiskokorajan.'),{statusCode:413,code:'GITHUB_OPERATION_TOTAL_SIZE'});
  const current=await getRepositoryHead();if(current.sha!==parent)throw Object.assign(new Error('Repositoryn pohjahaara muuttui suunnitelman jälkeen.'),{statusCode:409,code:'GITHUB_OPERATION_STALE_BASE',currentSha:current.sha,plannedSha:parent});
  const parentCommit=await gh(`/repos/${repo}/git/commits/${parent}`),treeEntries=[];
  for(const item of items){
    const blob=await gh(`/repos/${repo}/git/blobs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:String(item.content??''),encoding:'utf-8'})});
    treeEntries.push({path:String(item.path),mode:'100644',type:'blob',sha:blob.sha});
  }
  const tree=await gh(`/repos/${repo}/git/trees`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base_tree:parentCommit?.tree?.sha,tree:treeEntries})}),commit=await gh(`/repos/${repo}/git/commits`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:String(message||'codemancer: approved repository operation').slice(0,240),tree:tree.sha,parents:[parent]})});
  await gh(`/repos/${repo}/git/refs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:`refs/heads/${branch}`,sha:commit.sha})});
  return{repo,baseBranch,baseSha:parent,branch,commitSha:safeSha(commit.sha),treeSha:safeSha(tree.sha),compareUrl:`https://github.com/${repo}/compare/${encodeURIComponent(baseBranch)}...${encodeURIComponent(branch)}`,branchUrl:`https://github.com/${repo}/tree/${encodeURIComponent(branch)}`};
}

export async function deleteOperationBranch({branchName,expectedHeadSha}){
  const {repo}=config(),branch=safeOperationBranch(branchName),expected=safeSha(expectedHeadSha),current=await getOperationBranch(branch);
  if(current.sha!==expected)throw Object.assign(new Error('Operation-haara on muuttunut soveltamisen jälkeen; automaattinen palautus estettiin.'),{statusCode:409,code:'GITHUB_ROLLBACK_BRANCH_MOVED',currentSha:current.sha,expectedSha:expected});
  await gh(`/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,{method:'DELETE'});
  return{repo,branch,deleted:true,restoredTo:'unpublished-operation-branch-removed'};
}

export async function createOperationPullRequest({branchName,title,body}){
  const {repo,branch:base}=config(),head=safeOperationBranch(branchName),existing=await findOperationPullRequest(head);if(existing)return existing;
  const data=await gh(`/repos/${repo}/pulls`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:String(title||'Codemancer operation').slice(0,240),head,base,body:String(body||'').slice(0,20_000),draft:false})});
  return{repo,number:Number(data.number),state:String(data.state||'open'),merged:Boolean(data.merged),head,base,url:String(data.html_url||'')};
}

export async function findOperationPullRequest(branchName){
  const {repo,branch:base}=config(),head=safeOperationBranch(branchName),owner=repo.split('/')[0],data=await gh(`/repos/${repo}/pulls?state=all&head=${encodeURIComponent(`${owner}:${head}`)}&base=${encodeURIComponent(base)}&per_page=10`),item=Array.isArray(data)?data[0]:null;
  if(!item)return null;
  return{repo,number:Number(item.number),state:String(item.state||''),merged:Boolean(item.merged||item.merged_at),mergeable:item.mergeable===null?null:Boolean(item.mergeable),head,base,headSha:String(item.head?.sha||''),baseSha:String(item.base?.sha||''),mergeCommitSha:String(item.merge_commit_sha||''),url:String(item.html_url||''),mergedAt:String(item.merged_at||'')};
}

export async function getOperationPullRequest(number){
  const {repo}=config(),id=Number(number);if(!Number.isInteger(id)||id<1)throw Object.assign(new Error('Pull request -numero puuttuu.'),{statusCode:400,code:'GITHUB_PR_NUMBER'});
  const data=await gh(`/repos/${repo}/pulls/${id}`);
  return{repo,number:id,state:String(data.state||''),merged:Boolean(data.merged),mergeable:data.mergeable===null?null:Boolean(data.mergeable),headSha:String(data.head?.sha||''),baseSha:String(data.base?.sha||''),mergeCommitSha:String(data.merge_commit_sha||''),url:String(data.html_url||''),mergedAt:String(data.merged_at||'')};
}

export async function dispatchCapabilityWorkflow({operationId,mode,sourceRef='',rollbackTarget=''}){
  const {repo,branch}=config(),workflow=process.env.ANOMANCER_CAPABILITY_WORKFLOW||'anomancer-capability-gate.yml',selected=safeWorkflowMode(mode),id=String(operationId||'');
  if(!/^op-[a-z0-9-]{8,100}$/.test(id))throw Object.assign(new Error('Operation id ei kelpaa workflow-ajoon.'),{statusCode:400,code:'GITHUB_WORKFLOW_OPERATION'});
  const ref=selected==='production'?safeSha(sourceRef):(selected==='rollback'?branch:safeOperationBranch(sourceRef)),target=selected==='rollback'?validateDeploymentRollbackTarget(rollbackTarget):'';
  await gh(`/repos/${repo}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:branch,inputs:{operation_id:id,mode:selected,source_ref:ref,rollback_target:selected==='rollback'?target:''}})});
  return{repo,workflow,mode:selected,sourceRef:ref,dispatched:true,actionsUrl:`https://github.com/${repo}/actions/workflows/${encodeURIComponent(workflow)}`};
}

export async function findCapabilityWorkflowRun(operationId){
  const {repo}=config(),workflow=process.env.ANOMANCER_CAPABILITY_WORKFLOW||'anomancer-capability-gate.yml',id=String(operationId||'');
  const data=await gh(`/repos/${repo}/actions/workflows/${encodeURIComponent(workflow)}/runs?event=workflow_dispatch&per_page=50`),run=(data?.workflow_runs||[]).find(item=>String(item.display_title||item.name||'').includes(id));
  if(!run)return null;
  return{runId:Number(run.id),status:String(run.status||''),conclusion:String(run.conclusion||''),headSha:String(run.head_sha||''),createdAt:String(run.created_at||''),updatedAt:String(run.updated_at||''),url:String(run.html_url||'')};
}
