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
      'User-Agent':'anomancer-admin-v13',
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
