import { AUDIENCE_DEPTHS, CATEGORIES } from './agent-prompts.js';
import { stableSourceId } from './content.js';

const CLAIM_STATUSES=new Set(['supported','interpretation','open']);
const SEVERITIES=new Set(['high','medium','low']);
const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const text=(value,max=10_000)=>String(value??'').trim().slice(0,max);
const list=(value,max=20)=>Array.isArray(value)?value.slice(0,max):[];
const strings=(value,max=20,itemMax=600)=>list(value,max).map(x=>text(x,itemMax)).filter(Boolean);
const url=value=>{try{const parsed=new URL(String(value||''));return ['http:','https:'].includes(parsed.protocol)?parsed.href:'';}catch{return '';}};

function normalizeClaims(value,post){
  const sources=new Map((post.sources||[]).map(source=>[url(source.url),source]));
  return list(value,40).map(item=>{
    const raw=object(item);
    const evidence=[...new Set(list(raw.evidence,12).map(url).filter(link=>sources.has(link)))];
    let status=CLAIM_STATUSES.has(raw.status)?raw.status:'open';
    let note=text(raw.note,800);
    if(status==='supported'&&!evidence.some(link=>sources.get(link)?.verification==='verified')){
      status='open';
      const warning=post.lang==='en'?'Agent evidence still needs human verification.':'Agentin evidenssi odottaa ihmisen tarkistusta.';
      note=[note,warning].filter(Boolean).join(' ').slice(0,800);
    }
    return {status,text:text(raw.text,600),evidence,note};
  }).filter(claim=>claim.text);
}

function normalizeSources(value,post,{candidate=false}={}){
  const existing=new Map((post.sources||[]).map(source=>[url(source.url),source]));
  const seen=new Set();
  return list(value,30).map(item=>{
    const raw=object(item),link=url(raw.url);
    if(!link||seen.has(link))return null;
    seen.add(link);
    if(!candidate&&existing.has(link))return existing.get(link);
    if(!candidate)return null;
    return {
      id:stableSourceId(link),title:text(raw.title||link,220),url:link,publisher:text(raw.publisher,160),date:text(raw.date,20),
      origin:'source-agent',verification:'candidate',retrievedAt:new Date().toISOString(),
      why:text(raw.why,500),supports:text(raw.supports,800),challenges:text(raw.challenges,800),
    };
  }).filter(Boolean);
}

export function validateAgentResult(agent,value,post){
  const raw=object(value);
  if(agent==='source') return {
    summary:text(raw.summary,900),searchQueries:strings(raw.searchQueries,6,240),
    candidateSources:normalizeSources(raw.candidateSources,post,{candidate:true}).slice(0,6),
    gaps:strings(raw.gaps,4,450),warnings:strings(raw.warnings,4,450),
    ...(text(raw.rawResponse,30_000)?{rawResponse:text(raw.rawResponse,30_000)}:{}),
  };
  if(agent==='claims') return {answer:text(raw.answer,1200),claims:normalizeClaims(raw.claims,post),warnings:strings(raw.warnings,12,600)};
  if(agent==='structure') return {
    opening:text(raw.opening,1500),
    outline:list(raw.outline,16).map(item=>({heading:text(object(item).heading,180),purpose:text(object(item).purpose,700)})).filter(x=>x.heading),
    closing:text(raw.closing,1500),notes:strings(raw.notes,12,700),
  };
  if(agent==='writer') return {body:text(raw.body,500_000),titleSuggestions:strings(raw.titleSuggestions,8,180),description:text(raw.description,220),answer:text(raw.answer,1200),notes:strings(raw.notes,12,700)};
  if(agent==='critic') return {
    verdict:text(raw.verdict,1800),
    issues:list(raw.issues,30).map(item=>{const v=object(item);return {severity:SEVERITIES.has(v.severity)?v.severity:'medium',type:text(v.type,120),excerpt:text(v.excerpt,500),problem:text(v.problem,900),fix:text(v.fix,900)};}).filter(x=>x.problem),
    strengths:strings(raw.strengths,16,700),questions:strings(raw.questions,16,700),
  };
  if(agent==='audience') return {body:text(raw.body,500_000),adaptationSummary:strings(raw.adaptationSummary,20,700),audienceFit:text(raw.audienceFit,1200),preservedCore:strings(raw.preservedCore,20,700),warnings:strings(raw.warnings,20,700)};
  if(agent==='voice') return {body:text(raw.body,500_000),changes:strings(raw.changes,30,700),warnings:strings(raw.warnings,20,700)};
  if(agent==='package'){
    const category=CATEGORIES.includes(raw.category)?raw.category:post.category;
    // Packaging may suggest presentation metadata, but audience intent and Evidence Layer
    // are canonical human-controlled state by this point in the pipeline.
    const sources=(post.sources||[]).map(source=>({...source}));
    const claims=normalizeClaims(post.claims,post);
    const audience=Array.isArray(post.audience)&&post.audience.length?[...post.audience]:['all'];
    const audienceDepth=AUDIENCE_DEPTHS.includes(post.audienceDepth)?post.audienceDepth:'general';
    return {
      title:text(raw.title||post.title,180),description:text(raw.description||post.description,220),slug:text(raw.slug||post.slug,100),answer:text(raw.answer||post.answer,1200),category,
      audience,audienceDepth,claims,sources,notes:strings(raw.notes,20,700),
    };
  }
  throw Object.assign(new Error('Tuntematon agenttitulos.'),{statusCode:400,code:'AGENT_RESULT_UNKNOWN'});
}
