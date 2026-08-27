import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import coreGateway from '../api/admin/core.js';
import authGateway from '../api/admin/auth.js';
import contentGateway from '../api/admin/content.js';

let ok=0;const test=async(name,fn)=>{await fn();ok++;console.log(`✓ ${name}`)};
function allJs(dir){const out=[];for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())out.push(...allJs(p));else if(ent.isFile()&&p.endsWith('.js'))out.push(p.replace(/\\/g,'/'));}return out.sort();}
function req(url='/api/admin/core?resource=unknown'){const r=new EventEmitter();r.method='GET';r.url=url;r.headers={};return r;}
function res(){return{statusCode:200,headers:{},body:'',setHeader(k,v){this.headers[String(k).toLowerCase()]=v},end(v=''){this.body+=v}}}

await test('Vercel API-pinta on neljä entrypointtia',()=>{assert.deepEqual(allJs('api'),['api/admin/auth.js','api/admin/content.js','api/admin/core.js','api/contact.js']);});
await test('gatewayt ovat ohuita ja server/admin-routes säilyttää domain-erottelun',()=>{for(const file of ['api/admin/auth.js','api/admin/content.js','api/admin/core.js']){const src=fs.readFileSync(file,'utf8');assert.match(src,/server\/admin-routes/);assert.doesNotMatch(src,/process\.env\.(?:DEEPSEEK|GITHUB|ADMIN_PASSWORD)/);}for(const file of ['agents','archive','capabilities','core','login','logout','media','orchestras','posts','runs','runtime','session','status'])assert.equal(fs.existsSync(`server/admin-routes/${file}.js`),true);});
await test('tuntematon gateway-resource fail-closed 404',async()=>{for(const [handler,url] of [[coreGateway,'/api/admin/core?resource=nope'],[authGateway,'/api/admin/auth?resource=nope'],[contentGateway,'/api/admin/content?resource=nope']]){const response=res();await handler(req(url),response);assert.equal(response.statusCode,404);assert.equal(JSON.parse(response.body).error,'ADMIN_RESOURCE_UNKNOWN');}});
await test('admin-JS käyttää vain uusia gateway-reittejä',()=>{const files=['admin.js','admin-agents.js','admin-core.js','admin-orchestras.js','admin-orchestrator.js','admin-workspaces.js','admin-archive.js','admin-nanomancer.js'];const raw=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');for(const old of ['/api/admin/agents','/api/admin/login','/api/admin/logout','/api/admin/media','/api/admin/orchestras','/api/admin/posts','/api/admin/runs','/api/admin/runtime','/api/admin/session','/api/admin/status'])assert.equal(raw.includes(old),false,`legacy endpoint remains: ${old}`);assert.match(raw,/\/api\/admin\/auth\?resource=session/);assert.match(raw,/\/api\/admin\/content\?resource=posts/);assert.match(raw,/\/api\/admin\/core\?resource=agents/);assert.match(raw,/\/api\/admin\/core\?resource=runtime/);assert.match(raw,/\/api\/admin\/core\?resource=runs/);assert.match(raw,/\/api\/admin\/core\?resource=capabilities/);});
await test('vanhat API-entrypointit on poistettu fyysisesti',()=>{for(const old of ['agents','login','logout','media','orchestras','posts','runs','runtime','session','status'])assert.equal(fs.existsSync(`api/admin/${old}.js`),false);});
console.log(`\n${ok}/${ok} API SURFACE -testiä läpi`);
