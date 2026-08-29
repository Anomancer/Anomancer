export const INTELLIGENCE_FORMAT='anomancer-lighthouse-intelligence/v1';
export const PLAN_FORMAT='anomancer-reasoning-plan/v1';
export const REVIEW_FORMAT='anomancer-reasoning-review/v1';

const TYPE_RULES=[
  ['debug',/(?:\bdebug\b|\bbugi\w*|\bvirhe\w*|\berror\b|\bexception\b|\bstack\b|\btrace\b|ei\s+toimi|jumitta\w*|rikki|korjaa\w*|fix\w*)/i],
  ['audit',/(?:audit\w*|katselmus|tarkasta\w*|tarkistus|review\w*|qa\b|laadunvarmist)/i],
  ['compare',/(?:vertaa\w*|vertail\w*|\bvs\.?\b|compare\w*|difference\w*|ero(?:t|ja)?\b)/i],
  ['plan',/(?:suunnitel\w*|suunnittele\w*|roadmap|arkkitehtuur\w*|architecture|strateg\w*|vaiheista\w*)/i],
  ['research',/(?:\btutki\w*|\betsi\w*|selvitä\w*|lähte\w*|source\w*|research\w*|latest\b|uusin\w*)/i],
  ['write',/(?:kirjoita\w*|luonnos\w*|draft\w*|rewrite\w*|muotoile\w*|postaus\w*|teksti\w*)/i],
  ['transform',/(?:käännä\w*|translate\w*|tiivistä\w*|summari[sz]e\w*|lyhennä\w*|muunna\w*)/i]
];

const HIGH_REASONING_TYPES=new Set(['debug','audit','compare','plan']);

function boundedList(values,{maxItems=8,maxLength=500}={}){
  return (Array.isArray(values)?values:[])
    .map(value=>String(value||'').trim().slice(0,maxLength))
    .filter(Boolean)
    .slice(0,maxItems);
}

function classifyTask(text){
  for(const [type,rule] of TYPE_RULES){
    if(rule.test(text))return type;
  }
  return 'general';
}

function sideEffectIntent(text){
  return /(?:julkaise\w*|deploy\w*|push\w*|lähetä\w*|poista\w*|delete\w*|muuta\s+(?:repoa|tiedostoa|asetusta)|kirjoita\s+(?:githubiin|verceliin)|execute\w*|suorita\w*)/i.test(text);
}

function multiPartIntent(text){
  const conjunctions=(text.match(/(?:\bja\b|\bsekä\b|\bsitten\b|\bmyös\b|\band\b|\bthen\b)/gi)||[]).length;
  const enumerated=/(?:^|\n)\s*(?:\d+[.)]|[-*])\s+/m.test(text);
  return enumerated||conjunctions>=3;
}

export function profileIntent(intent={}){
  const text=String(intent?.text||'').trim();
  const taskType=classifyTask(text);
  const materials=Array.isArray(intent?.workspace?.materials)?intent.workspace.materials:[];
  const history=Array.isArray(intent?.history)?intent.history:[];

  let score=0;
  if(text.length>500)score+=1;
  if(text.length>1800)score+=1;
  if(materials.length)score+=1;
  if(materials.length>=3)score+=1;
  if(history.length>=4)score+=1;
  if(multiPartIntent(text))score+=1;
  if(HIGH_REASONING_TYPES.has(taskType))score+=1;
  if(taskType==='research')score+=1;

  const complexity=score>=4?'high':score>=2?'medium':'low';
  const planning=complexity!=='low'||HIGH_REASONING_TYPES.has(taskType)||taskType==='research';
  const review=complexity==='high'||taskType==='debug'||taskType==='audit'||taskType==='compare';
  const externalActionRequested=sideEffectIntent(text);
  const strategy=review?'reviewed':planning?'planned':'direct';
  const passes=1+(planning?1:0)+(review?1:0);

  const rationale=[];
  if(HIGH_REASONING_TYPES.has(taskType))rationale.push(`Tehtävä tunnistettiin tyypiksi ${taskType}.`);
  if(materials.length)rationale.push(`Työtilassa on ${materials.length} aineistoa.`);
  if(history.length>=4)rationale.push('Aiempi keskustelukonteksti kasvattaa riippuvuuksia.');
  if(multiPartIntent(text))rationale.push('Pyyntö sisältää useita osia tai vaiheita.');
  if(externalActionRequested)rationale.push('Pyyntö viittaa mahdolliseen ulkoiseen sivuvaikutukseen, mutta Lighthouse ei saa siihen itsenäistä valtaa.');
  if(!rationale.length)rationale.push('Pyyntö voidaan käsitellä suoralla reasoning-polulla.');

  return {
    format:INTELLIGENCE_FORMAT,
    taskType,
    complexity,
    strategy,
    planning,
    review,
    passes,
    externalActionRequested,
    rationale:rationale.slice(0,5)
  };
}

export function normalizeReasoningPlan(value={},profile={}){
  const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  return {
    format:PLAN_FORMAT,
    taskType:String(input.taskType||profile.taskType||'general').trim().slice(0,60),
    objective:String(input.objective||'Ratkaise käyttäjän nykyinen tavoite mahdollisimman hyödyllisesti.').trim().slice(0,1000),
    deliverable:String(input.deliverable||'Selkeä käyttökelpoinen vastaus.').trim().slice(0,800),
    steps:boundedList(input.steps,{maxItems:7,maxLength:500}),
    constraints:boundedList(input.constraints,{maxItems:7,maxLength:500}),
    unknowns:boundedList(input.unknowns,{maxItems:6,maxLength:500}),
    verification:boundedList(input.verification,{maxItems:6,maxLength:500})
  };
}

export function normalizeReview(value={}){
  const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const verdict=['accept','revise'].includes(String(input.verdict||''))
    ?String(input.verdict)
    :'accept';

  return {
    format:REVIEW_FORMAT,
    verdict,
    issues:boundedList(input.issues,{maxItems:6,maxLength:500}),
    improvements:boundedList(input.improvements,{maxItems:6,maxLength:500}),
    result:input.result&&typeof input.result==='object'&&!Array.isArray(input.result)
      ?input.result
      :null
  };
}

export function planForPrompt(plan={}){
  const lines=[
    `Tavoite: ${String(plan.objective||'').trim()}`,
    `Tuotos: ${String(plan.deliverable||'').trim()}`
  ];
  if(plan.steps?.length)lines.push(`Työvaiheet:\n- ${plan.steps.join('\n- ')}`);
  if(plan.constraints?.length)lines.push(`Rajoitteet:\n- ${plan.constraints.join('\n- ')}`);
  if(plan.unknowns?.length)lines.push(`Avoimet epävarmuudet:\n- ${plan.unknowns.join('\n- ')}`);
  if(plan.verification?.length)lines.push(`Tarkistus:\n- ${plan.verification.join('\n- ')}`);
  return lines.filter(Boolean).join('\n\n');
}
