import {profileIntent} from '../intelligence/lighthouse-intelligence.js';

export const PROBLEM_MODEL_FORMAT='anomancer-problem-model/v1';

const DOMAIN_RULES=[
  ['software',/(?:\bkoodi\w*|\bcode\b|repo\w*|github|vercel|css\b|javascript|typescript|node\b|api\b|bugi\w*|debug|testi\w*|arkkitehtuur\w*|(?:^|[\s`'"(])[A-Za-z0-9._@+-]+(?:\/[A-Za-z0-9._@+-]+)+\.(?:js|mjs|cjs|ts|tsx|jsx|json|css|html|sh)\b)/i],
  ['narrative',/(?:\bromancer\w*|\bnarramancer\w*|romaani\w*|novelli\w*|tarina\w*|käsikirjoitu\w*|hahmo\w*|juoni\w*|kaanon\w*|kohtau\w*|luku\w*|jatkuvu\w*|maailmanrakenn\w*)/i],
  ['editorial',/(?:toimituskone\w*|lähetyskone\w*|toimituks\w*|anomancer(?:in)?\s+lähety\w*|artikkeli\w*|blogi\w*|postaus\w*|väite\w*|evidens\w*)/i],
  ['document',/(?:asiakirj\w*|kirje\w*|pdf\b|sopimu\w*|tarjou\w*|dokument\w*)/i],
  ['research',/(?:tutki\w*|selvitä\w*|lähte\w*|research|tutkim\w*|uusin\w*|latest\b)/i],
  ['writing',/(?:kirjoita\w*|luonnos\w*|teksti\w*|postaus\w*|artikkeli\w*|rewrite|muotoile\w*)/i],
  ['planning',/(?:suunnitel\w*|roadmap|strateg\w*|vaiheista\w*|architecture)/i]
];

function domainFor(text){
  for(const [domain,rule] of DOMAIN_RULES){
    if(rule.test(text))return domain;
  }
  return 'general';
}

function unique(values){
  return [...new Set(values.filter(Boolean))];
}

function needsFor({taskType,domain,hasMaterials,text,externalActionRequested=false}){
  const needs=['llm.reasoning'];

  if(hasMaterials)needs.push('document.read');
  if(/https:\/\//i.test(String(text||'')))needs.push('web.fetch');
  if(domain==='software'&&['debug','audit','plan'].includes(taskType))needs.push('repository.read');
  if(domain==='software'&&externalActionRequested)needs.push('repository.read','repository.propose','repository.write');

  if(domain==='editorial'){
    if(taskType==='plan')needs.push('editorial.plan','claims.inspect','evidence.map','publication.prepare');
    else if(taskType==='audit')needs.push('editorial.edit','claims.inspect','evidence.map','evidence.validate');
    else needs.push('editorial.write','editorial.edit','claims.inspect','evidence.map','publication.prepare');
    if(externalActionRequested)needs.push('publication.publish');
  }
  if(domain==='narrative'){
    if(taskType==='plan')needs.push('story.plan','story.world','story.character','story.plot','story.canon');
    else if(taskType==='audit')needs.push('story.continuity','story.canon','story.voice','contradiction.check');
    else if(taskType==='write'||taskType==='transform')needs.push('story.draft','story.voice','story.continuity','story.canon');
    else needs.push('story.plan','story.character','story.plot','story.continuity');
    if(externalActionRequested)needs.push('story.export');
  }

  switch(taskType){
    case 'debug':
      needs.push('code.inspect','architecture.analyze','contradiction.check','evidence.trace');
      break;
    case 'audit':
      needs.push('evidence.validate','contradiction.check','risk.analysis','evidence.trace');
      if(domain==='software')needs.push('code.inspect','architecture.analyze');
      break;
    case 'compare':
      needs.push('comparison','risk.analysis','evidence.trace');
      break;
    case 'research':
      needs.push('research.search','evidence.validate','contradiction.check','evidence.trace');
      break;
    case 'write':
      needs.push('llm.writer');
      break;
    case 'transform':
      needs.push('document.read','llm.writer');
      break;
    case 'plan':
      needs.push('llm.analysis','risk.analysis');
      break;
    default:
      needs.push('llm.analysis');
  }

  return unique(needs);
}

function goalFor(taskType){
  return ({
    debug:'diagnose_and_fix',
    audit:'evaluate_and_verify',
    compare:'compare_options',
    plan:'plan_work',
    research:'investigate',
    write:'create_text',
    transform:'transform_material',
    general:'answer_or_solve'
  })[taskType]||'answer_or_solve';
}

export function buildProblemModel(intent={},profile=profileIntent(intent)){
  const text=String(intent?.text||'').trim();
  const materials=Array.isArray(intent?.workspace?.materials)?intent.workspace.materials:[];
  const history=Array.isArray(intent?.history)?intent.history:[];
  const domain=domainFor(text);

  const inputs=[];
  if(text)inputs.push('user_text');
  if(materials.length)inputs.push('workspace_materials');
  if(history.length)inputs.push('work_history');

  const needs=needsFor({
    taskType:profile.taskType,
    domain,
    hasMaterials:materials.length>0,
    text,
    externalActionRequested:profile.externalActionRequested===true
  });
  if(profile.externalActionRequested===true&&!['software','editorial','narrative'].includes(domain))needs.push('external.execute');

  return {
    format:PROBLEM_MODEL_FORMAT,
    goal:goalFor(profile.taskType),
    taskType:profile.taskType,
    domain,
    inputs,
    needs:unique(needs),
    constraints:{
      externalSideEffectsRequested:profile.externalActionRequested===true,
      materialsCount:materials.length,
      historyTurns:history.length
    }
  };
}
