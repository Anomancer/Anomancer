import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const read=(p)=>fs.readFileSync(path.join(ROOT,p),'utf8');
const readPublic=(p)=>fs.readFileSync(path.join(ROOT,'public',p),'utf8');
const json=(p)=>JSON.parse(read(p));
const publicJson=(p)=>JSON.parse(readPublic(p));
let passed=0;
function ok(cond,msg){ if(!cond) throw new Error(`✗ ${msg}`); passed++; console.log(`✓ ${msg}`); }

const policy=json('discovery-policy.json');
const robots=readPublic('robots.txt');
const llms=readPublic('llms.txt');
const manifest=publicJson('discovery-manifest.json');
const content=publicJson('content-manifest.json');

ok(policy.version==='anomancer.discovery/v1','policy version');
ok(/User-agent: OAI-SearchBot[\s\S]*?Allow: \/[\s\S]*?Disallow: \/admin[\s\S]*?Disallow: \/api\/admin\//.test(robots),'OAI-SearchBot saa julkisen sisällön mutta ei adminia');
ok(/User-agent: GPTBot\s+Disallow: \//.test(robots),'GPTBot training-opt-out on eksplisiittinen');
ok(/User-agent: \*[\s\S]*?Allow: \/[\s\S]*?Disallow: \/admin[\s\S]*?Disallow: \/api\/admin\//.test(robots),'yleiset hakurobotit saavat julkisen sisällön');
ok(robots.includes('Sitemap: https://anomancer.com/sitemap.xml'),'robots osoittaa canonical sitemapiin');
ok(llms.startsWith('# Anomancer\n'),'llms.txt on selkeä Markdown-entrypoint');
ok(llms.includes('https://anomancer.com/evidence-manifest.json')&&llms.includes('https://anomancer.com/content-manifest.json'),'llms linkittää koneelliset manifestit');
ok(content.published.every(p=>llms.includes(p.url)),'llms sisältää kaikki julkaistut canonical URL:t');
ok(manifest.site==='https://anomancer.com'&&manifest.publishedArticles===content.published.length,'discovery manifest canonical + article count');
ok(manifest.search?.openai?.userAgent==='OAI-SearchBot'&&manifest.training?.openai?.userAgent==='GPTBot','discovery manifest erottaa haun ja koulutuksen');
ok(!fs.existsSync(path.join(ROOT,'llms.txt'))&&!fs.existsSync(path.join(ROOT,'robots.txt')),'discovery-output ei vuoda projektin rootiin');

console.log(`\n${passed}/11 DISCOVERY LAYER`);
