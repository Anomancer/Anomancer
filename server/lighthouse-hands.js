import dns from 'node:dns/promises';
import net from 'node:net';
import https from 'node:https';
import {getLighthouseFile,lighthouseGithubStatus,githubOperationStatus} from './github.js';
import {getMancerPackage} from './mancer-registry.js';
import {getCapability,listCapabilities} from '../core/capabilities/registry.js';
import {createComputeSession,executeComputeCapability} from './compute-runtime.js';

export const HANDS_EXECUTION_FORMAT='anomancer-hands-execution/v1';

const MAX_URLS=3;
const MAX_FETCH_BYTES=260_000;
const MAX_SOURCE_CHARS=12_000;
const MAX_REPO_FILES=4;
const SAFE_REPO_EXT=/\.(?:js|mjs|cjs|ts|tsx|jsx|json|md|css|html|yml|yaml|toml|txt|sh)$/i;
const DENIED_REPO_PATH=/(^|\/)(?:\.git|\.vercel|node_modules)(?:\/|$)|(^|\/)\.env(?:\.|$)|(?:secret|credential|private[-_]?key|id_rsa)/i;

function compact(value,max=MAX_SOURCE_CHARS){
  return String(value||'').replace(/\u0000/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim().slice(0,max);
}

function uniqueBy(items,keyFn){
  const seen=new Set();
  return items.filter(item=>{const key=keyFn(item);if(!key||seen.has(key))return false;seen.add(key);return true;});
}

function isBlockedIp(ip){
  if(net.isIP(ip)===4){
    const p=ip.split('.').map(Number);
    return p[0]===10||p[0]===127||p[0]===0||
      (p[0]===169&&p[1]===254)||(p[0]===172&&p[1]>=16&&p[1]<=31)||
      (p[0]===192&&p[1]===168)||(p[0]===100&&p[1]>=64&&p[1]<=127)||
      p[0]>=224;
  }
  if(net.isIP(ip)===6){
    const v=ip.toLowerCase();
    return v==='::'||v==='::1'||v.startsWith('fc')||v.startsWith('fd')||v.startsWith('fe8')||v.startsWith('fe9')||v.startsWith('fea')||v.startsWith('feb');
  }
  return true;
}

async function resolvePublicUrl(raw){
  const url=new URL(String(raw));
  if(url.protocol!=='https:')throw Object.assign(new Error('Vain HTTPS-lähteet ovat sallittuja.'),{code:'LIGHTHOUSE_URL_PROTOCOL'});
  if(url.username||url.password)throw Object.assign(new Error('URL-tunnistetiedot eivät ole sallittuja.'),{code:'LIGHTHOUSE_URL_CREDENTIALS'});
  if(['localhost','localhost.localdomain'].includes(url.hostname.toLowerCase()))throw Object.assign(new Error('Paikallisia osoitteita ei haeta.'),{code:'LIGHTHOUSE_URL_PRIVATE'});
  const addresses=await dns.lookup(url.hostname,{all:true,verbatim:true});
  if(!addresses.length||addresses.some(item=>isBlockedIp(item.address)))throw Object.assign(new Error('Osoite ei kuulu julkiseen verkkoon.'),{code:'LIGHTHOUSE_URL_PRIVATE'});
  return {url,address:addresses[0].address,family:addresses[0].family};
}

function pinnedHttpsRead(resolved){
  const {url,address,family}=resolved;
  return new Promise((resolve,reject)=>{
    const request=https.request({
      protocol:'https:',hostname:address,family,port:url.port||443,
      path:`${url.pathname}${url.search}`,servername:url.hostname,
      method:'GET',rejectUnauthorized:true,
      headers:{Host:url.host,'User-Agent':'Anomancer-Lighthouse/1.21','Accept':'text/html,text/plain,application/json;q=0.9,*/*;q=0.1'}
    },response=>{
      const chunks=[];let bytes=0;
      response.on('data',chunk=>{
        bytes+=chunk.length;
        if(bytes>MAX_FETCH_BYTES){request.destroy(Object.assign(new Error('Lähde ylitti Lighthouse-lukurajan.'),{code:'LIGHTHOUSE_FETCH_TOO_LARGE'}));return;}
        chunks.push(chunk);
      });
      response.on('end',()=>resolve({
        status:Number(response.statusCode)||0,
        headers:response.headers,
        body:Buffer.concat(chunks).toString('utf8')
      }));
    });
    request.setTimeout(10_000,()=>request.destroy(Object.assign(new Error('Lähteen luku aikakatkaistiin.'),{code:'LIGHTHOUSE_FETCH_TIMEOUT'})));
    request.on('error',reject);
    request.end();
  });
}

function extractUrls(text){
  const matches=String(text||'').match(/https:\/\/[^\s<>{}\[\]"']+/gi)||[];
  return uniqueBy(matches.map(value=>value.replace(/[),.;!?]+$/,'')),value=>value).slice(0,MAX_URLS);
}

function extractRepoPaths(text){
  const candidates=String(text||'').match(/(?:^|[\s`'"(])([A-Za-z0-9._@+-]+(?:\/[A-Za-z0-9._@+-]+)+\.(?:js|mjs|cjs|ts|tsx|jsx|json|md|css|html|yml|yaml|toml|txt|sh))(?:$|[\s`'"),:;])/g)||[];
  return uniqueBy(candidates.map(value=>{
    const match=value.match(/([A-Za-z0-9._@+-]+(?:\/[A-Za-z0-9._@+-]+)+\.[A-Za-z0-9]+)$/);
    return match?.[1]||value.trim().replace(/^[`'"(]+|[`'"),:;]+$/g,'');
  }).filter(path=>path.length<320&&SAFE_REPO_EXT.test(path)&&!path.includes('..')&&!DENIED_REPO_PATH.test(path)),value=>value).slice(0,MAX_REPO_FILES);
}

function stripHtml(text){
  return compact(String(text||'')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&lt;/gi,'<')
    .replace(/&gt;/gi,'>')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;/gi,"'"));
}

async function fetchPublicText(raw){
  let resolved=await resolvePublicUrl(raw);
  for(let redirect=0;redirect<=3;redirect++){
    const response=await pinnedHttpsRead(resolved);
    if([301,302,303,307,308].includes(response.status)){
      const location=response.headers.location;
      if(!location)throw Object.assign(new Error('Uudelleenohjauksesta puuttui kohde.'),{code:'LIGHTHOUSE_FETCH_REDIRECT'});
      resolved=await resolvePublicUrl(new URL(location,resolved.url).href);
      continue;
    }
    if(response.status<200||response.status>=300)throw Object.assign(new Error(`Lähde vastasi HTTP ${response.status}.`),{code:'LIGHTHOUSE_FETCH_HTTP'});
    const type=String(response.headers['content-type']||'').toLowerCase();
    if(!/(text\/|application\/json|application\/ld\+json)/.test(type))throw Object.assign(new Error('Lähde ei ollut tekstimuotoinen.'),{code:'LIGHTHOUSE_FETCH_CONTENT_TYPE'});
    const length=Number(response.headers['content-length']||0);
    if(length>MAX_FETCH_BYTES)throw Object.assign(new Error('Lähde ylitti Lighthouse-lukurajan.'),{code:'LIGHTHOUSE_FETCH_TOO_LARGE'});
    const rawText=response.body;
    const title=type.includes('html')?(rawText.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||resolved.url.hostname):resolved.url.hostname;
    return {url:resolved.url.href,title:stripHtml(title).slice(0,180)||resolved.url.hostname,text:type.includes('html')?stripHtml(rawText):compact(rawText)};
  }
  throw Object.assign(new Error('Liian monta uudelleenohjausta.'),{code:'LIGHTHOUSE_FETCH_REDIRECT_LIMIT'});
}

async function braveSearch(query,{freshness=''}={}){
  const key=String(process.env.BRAVE_SEARCH_API_KEY||'').trim();
  if(!key)throw Object.assign(new Error('Hakupalvelua ei ole konfiguroitu.'),{code:'LIGHTHOUSE_SEARCH_CONFIG',statusCode:503});
  const url=new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q',compact(query,500));
  url.searchParams.set('count','5');
  url.searchParams.set('safesearch','moderate');
  if(freshness)url.searchParams.set('freshness',freshness);
  const response=await fetch(url,{headers:{'Accept':'application/json','X-Subscription-Token':key,'User-Agent':'Anomancer-Lighthouse/1.21'}});
  if(!response.ok)throw Object.assign(new Error(`Hakupalvelu vastasi HTTP ${response.status}.`),{code:'LIGHTHOUSE_SEARCH_HTTP'});
  const data=await response.json();
  return (data?.web?.results||[]).slice(0,5).map(item=>({
    url:String(item.url||''),
    title:compact(item.title,180),
    text:compact(item.description,1200)
  })).filter(item=>item.url&&item.title);
}

const PACKAGE_SEARCH_ADAPTERS=new Set([
  'search.web','search.academic','search.news'
]);

function runtimeAdapterAvailable(adapter,env=process.env){
  if(PACKAGE_SEARCH_ADAPTERS.has(String(adapter||''))){
    return Boolean(String(env.BRAVE_SEARCH_API_KEY||'').trim());
  }
  return false;
}

function runtimeSearchRequest(adapter,text){
  const cleanText=compact(text,500);
  if(adapter==='search.academic'){
    return {
      query:`${cleanText} (research paper OR study) (site:arxiv.org OR site:doi.org OR site:pubmed.ncbi.nlm.nih.gov OR site:semanticscholar.org)`,
      freshness:''
    };
  }
  if(adapter==='search.news'){
    return {query:cleanText,freshness:'pw'};
  }
  if(adapter==='search.web'){
    return {query:cleanText,freshness:''};
  }
  return null;
}

function selectMancerOrchestra(pkg,problem={}){
  const orchestras=Array.isArray(pkg?.orchestraRegistry?.orchestras)?pkg.orchestraRegistry.orchestras:[];
  if(!orchestras.length)return null;
  const mancerId=String(pkg?.manifest?.id||'');
  let preferred='';
  if(mancerId==='codemancer')preferred=problem.taskType==='audit'||problem.taskType==='debug'?'code-review':problem.taskType==='plan'?'release-readiness':'';
  else if(mancerId==='toimituskone')preferred=problem.constraints?.externalSideEffectsRequested?'publication-readiness':problem.taskType==='audit'?'editorial-review':'editorial-workflow';
  else if(mancerId==='romancer')preferred=problem.taskType==='audit'?'continuity-review':problem.taskType==='write'||problem.taskType==='transform'?'chapter-draft':'story-development';
  const selected=orchestras.find(item=>item.id===preferred)||orchestras[0];
  return selected?{
    id:selected.id,
    name:selected.name,
    executable:selected.executable===true,
    stages:Array.isArray(selected.stages)?selected.stages:[],
    approvalGates:Array.isArray(selected.approvalGates)?selected.approvalGates:[]
  }:null;
}

function contextBlock(kind,label,content,meta={}){
  return {kind,label,content:compact(content),meta};
}

export function capabilityAvailability(env=process.env){
  const github=lighthouseGithubStatus(env);
  const operation=githubOperationStatus();
  const mutationReady=operation.configured&&operation.repoGuard?.allowed!==false;
  const availability={
    'research.search':Boolean(env.BRAVE_SEARCH_API_KEY),
    'repository.read':github.configured,
    'repository.propose':mutationReady,
    'repository.write':mutationReady,
    'web.fetch':true,
    'mancer.activate':true,
    'document.read':true
  };

  for(const capability of listCapabilities()){
    if(!capability?.runtimeAvailable||!capability?.runtimeAdapter)continue;
    if(Object.prototype.hasOwnProperty.call(availability,capability.id))continue;
    availability[capability.id]=runtimeAdapterAvailable(capability.runtimeAdapter,env);
  }

  return availability;
}

export async function executeLighthouseHands({intent={},route={},capabilityRoute={},taskGraph=null}={}){
  const startedAt=Date.now();
  const repository=lighthouseGithubStatus();
  const events=[];
  const context=[];
  const sources=[];
  const tools=[];
  const mancers=[];
  const failures=[];
  let searchedWeb=false;
  let searchQuerySent=false;
  let webFetchUsed=false;
  let repositoryReadUsed=false;
  let computeUsed=false;
  const computeArtifacts=[];

  async function run(id,fn,{adapter=id,external=false}={}){
    const start=Date.now();
    try{
      const value=await fn();
      events.push({id,status:'completed',adapter,external,durationMs:Date.now()-start});
      tools.push({id,label:id,status:'used'});
      return value;
    }catch(error){
      const failure={id,status:'failed',adapter,external,durationMs:Date.now()-start,error:String(error.code||error.message||'failed').slice(0,180)};
      events.push(failure);failures.push(failure);return null;
    }
  }

  const requested=new Set(capabilityRoute.readOnly||[]);
  const computeRequested=[...new Set(capabilityRoute.compute||[])];

  if(requested.has('document.read')&&intent.workspace?.materials?.length){
    await run('document.read',async()=>{
      // Workspace material is already present in the canonical user context.
      // This event records the read capability without duplicating the material into the prompt.
      return intent.workspace.materials.length;
    },{adapter:'workspace-context',external:false});
  }

  if(computeRequested.length){
    let session=null,error=null;
    try{session=createComputeSession(intent.workspace?.materials||[]);}catch(cause){error=cause;}
    for(const id of computeRequested){
      await run(id,async()=>{
        if(error)throw error;
        const artifact=executeComputeCapability(id,session);
        computeArtifacts.push({capabilityId:artifact.capabilityId,adapter:artifact.adapter,deterministic:true,datasetCount:artifact.datasetCount});
        context.push(contextBlock('compute',`Compute · ${id}`,JSON.stringify(artifact),{capabilityId:id,adapter:artifact.adapter,computed:true,untrusted:true}));
        computeUsed=true;
        return artifact;
      },{adapter:'compute.tabular.v1',external:false});
    }
  }

  if(requested.has('web.fetch')){
    const urls=extractUrls(intent.text);
    if(urls.length){
      await run('web.fetch',async()=>{
        for(const raw of urls){
          const item=await fetchPublicText(raw);
          sources.push({type:'web-page',title:item.title,url:item.url});
          context.push(contextBlock('web',item.title,item.text,{url:item.url,untrusted:true}));
        }
        webFetchUsed=true;
      },{adapter:'public-web-read/v1',external:true});
    }
  }

  if(requested.has('research.search')){
    searchQuerySent=true;
    await run('research.search',async()=>{
      const results=await braveSearch(intent.text);
      searchedWeb=true;
      for(const item of results){
        sources.push({type:'search-result',title:item.title,url:item.url});
        context.push(contextBlock('search',item.title,item.text,{url:item.url,untrusted:true}));
      }
    },{adapter:'brave-search/v1',external:true});
  }

  for(const id of requested){
    const capability=getCapability(id);
    const adapter=String(capability?.runtimeAdapter||'');
    if(!PACKAGE_SEARCH_ADAPTERS.has(adapter))continue;

    const searchRequest=runtimeSearchRequest(adapter,intent.text);
    if(!searchRequest)continue;

    searchQuerySent=true;
    await run(id,async()=>{
      const results=await braveSearch(searchRequest.query,{freshness:searchRequest.freshness});
      searchedWeb=true;
      for(const item of results){
        sources.push({
          type:'search-result',
          capabilityId:id,
          title:item.title,
          url:item.url
        });
        context.push(contextBlock(
          'search',
          item.title,
          item.text,
          {url:item.url,capabilityId:id,untrusted:true}
        ));
      }
    },{adapter,external:true});
  }

  if(requested.has('repository.read')){
    const paths=extractRepoPaths(intent.text);
    if(paths.length){
      await run('repository.read',async()=>{
        for(const path of paths){
          const file=await getLighthouseFile(path);
          sources.push({type:'repository-file',title:file.path,url:file.htmlUrl||'',path:file.path,sha:file.sha,ref:file.ref||repository.ref});
          context.push(contextBlock('repository',file.path,file.content,{path:file.path,url:file.htmlUrl||'',sha:file.sha,ref:file.ref||repository.ref,untrusted:true}));
        }
        repositoryReadUsed=true;
      },{adapter:'github-content-read/v1',external:true});
    }
  }

  const workspaceId=route.recommendation?.workspace?.id;
  if(requested.has('mancer.activate')&&workspaceId){
    await run('mancer.activate',async()=>{
      const pkg=getMancerPackage(workspaceId);
      if(!pkg)throw Object.assign(new Error('Suositeltua Mancer-pakettia ei löytynyt.'),{code:'LIGHTHOUSE_MANCER_NOT_FOUND'});
      const orchestra=selectMancerOrchestra(pkg,route.problem||{});
      const mancer={
        id:pkg.manifest.id,
        name:pkg.manifest.name,
        version:pkg.manifest.version,
        purpose:pkg.manifest.purpose,
        contractHash:pkg.contractHash,
        orchestra,
        humanFinalAuthority:pkg.approvalModel?.humanFinalAuthority===true
      };
      mancers.push(mancer);
      context.push(contextBlock('mancer',`${mancer.name} ${mancer.version}`,
        [`Tarkoitus: ${mancer.purpose}`,orchestra?`Työmenetelmä: ${orchestra.name}`:'',orchestra?`Vaiheet: ${orchestra.stages.join(', ')}`:'',orchestra?.approvalGates?.length?`Hyväksymisportit: ${orchestra.approvalGates.join(', ')}`:''].filter(Boolean).join('\n'),
        {trustedInternal:true,contractHash:mancer.contractHash}
      ));
    },{adapter:'mancer-package-registry/v1',external:false});
  }

  return {
    format:HANDS_EXECUTION_FORMAT,
    events,
    context,
    sources:uniqueBy(sources,item=>`${item.type}:${item.url||item.title}`).slice(0,12),
    tools:uniqueBy(tools,item=>item.id).slice(0,16),
    mancers,
    failures,
    searchedWeb,
    searchQuerySent,
    webFetchUsed,
    repositoryReadUsed,
    computeUsed,
    computeArtifacts,
    taskGraph,
    repositoryRef:repository.ref,
    repositoryRefSource:repository.refSource,
    externalReadUsed:events.some(event=>event.external&&event.status==='completed'),
    durationMs:Date.now()-startedAt
  };
}
