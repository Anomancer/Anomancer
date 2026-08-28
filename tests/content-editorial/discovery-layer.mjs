import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const read=(p)=>fs.readFileSync(path.join(ROOT,p),'utf8');
const json=(p)=>JSON.parse(read(p));
let passed=0;
function ok(cond,msg){ if(!cond) throw new Error(`✗ ${msg}`); passed++; console.log(`✓ ${msg}`); }

const policy=json('discovery-policy.json');
const robots=read('robots.txt');
const llms=read('llms.txt');
const manifest=json('discovery-manifest.json');
const content=json('content-manifest.json');

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
ok(read('public/llms.txt')===llms&&read('public/robots.txt')===robots,'Vercel public-output sisältää discovery-tiedostot');

console.log(`\n${passed}/11 DISCOVERY LAYER`);
