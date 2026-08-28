import fs from 'node:fs';

const required=['GITHUB_CONTENT_TOKEN','GITHUB_REPO','GITHUB_BRANCH','ANOMANCER_OPERATION_REPO_ALLOWLIST','VERCEL_TOKEN','VERCEL_ORG_ID','VERCEL_PROJECT_ID'];
const missing=required.filter(key=>!String(process.env[key]||'').trim());
const repo=String(process.env.GITHUB_REPO||'').trim();
const allowlist=String(process.env.ANOMANCER_OPERATION_REPO_ALLOWLIST||'').split(',').map(v=>v.trim()).filter(Boolean);
const requireLock=String(process.env.ANOMANCER_OPERATION_REQUIRE_ALLOWLIST||'')==='1';
const workflow='.github/workflows/anomancer-capability-gate.yml';
const failures=[];
if(missing.length)failures.push(`Puuttuvat ympäristömuuttujat: ${missing.join(', ')}`);
if(!requireLock)failures.push('ANOMANCER_OPERATION_REQUIRE_ALLOWLIST pitää olla 1 live-canaryssa.');
if(repo&&!allowlist.includes(repo))failures.push(`GITHUB_REPO ${repo} ei kuulu ANOMANCER_OPERATION_REPO_ALLOWLIST-listaan.`);
if(!fs.existsSync(workflow))failures.push(`Capability-workflow puuttuu: ${workflow}`);
if(repo&&!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))failures.push('GITHUB_REPO ei ole owner/repo-muodossa.');

console.log('ANOMANCER 1.18.5 LIVE PATH PREFLIGHT');
console.log(`Repository: ${repo||'PUUTTUU'}`);
console.log(`Repo-lukko: ${requireLock?'PAKOLLINEN':'EI PAKOLLINEN'}`);
console.log(`Allowlist-osuma: ${repo&&allowlist.includes(repo)?'KYLLÄ':'EI'}`);
console.log(`Workflow: ${fs.existsSync(workflow)?'LÖYTYY':'PUUTTUU'}`);
console.log('Preview-suoja: --target=preview + --skip-domain');
if(failures.length){for(const item of failures)console.error(`✗ ${item}`);process.exitCode=1;}else console.log('✓ Preflight GREEN. Operation Console voidaan avata plan-vaiheeseen.');
