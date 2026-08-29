import { normalizeNarramancerProject } from './narramancer-project.js';

const object=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const list=(v,max=40)=>Array.isArray(v)?v.slice(0,max):[];
const text=(v,max=20_000)=>String(v??'').trim().slice(0,max);
const strings=(v,max=30,itemMax=1200)=>list(v,max).map(x=>text(x,itemMax)).filter(Boolean);
const severity=v=>['high','medium','low'].includes(v)?v:'medium';

const common=`You are operating inside Romancer (legacy internal id: narramancer), a private story-writing workspace. You are an assistant, never an autonomous author, saver, exporter or publisher. The human writer is final authority. Treat the project JSON as the only story context available to you. Never claim that you saved, locked, accepted canon, exported or published anything. Never silently erase existing canon, characters, chapters or timeline events. If story constraints conflict, report the conflict instead of pretending it is resolved. Preserve deliberate strangeness, humor, ambiguity and authorial intent. Do not turn prose into generic screenwriting, marketing copy or formulaic story advice. Return JSON only.`;
const langRule=project=>project.project?.language==='en'?'Write all prose fields in English.':'Write all prose fields in Finnish.';
const ctx=(project,custom,activeChapterId)=>`\nPROJECT JSON:\n${JSON.stringify(project)}\nACTIVE CHAPTER ID: ${JSON.stringify(activeChapterId||'')}\n${custom?`Additional human instruction: ${custom}`:''}`;

export function promptForNarrativeAgent(agent,rawProject,custom='',activeChapterId=''){
  const project=normalizeNarramancerProject(rawProject,rawProject?.workspaceId||'');
  const context=ctx(project,custom,activeChapterId);
  const prefix=`${common}\n${langRule(project)}`;
  if(agent==='narrative-premise')return{
    system:`${prefix} You are the PREMISE EDITOR. Identify the story's central promise, pressure and question from the existing material. You may sharpen the premise, but you may not invent a completely different project or overwrite established canon.`,
    user:`Return JSON with keys premise, projectNotes, questions, warnings. premise is one proposed replacement for project.premise. projectNotes, questions and warnings are string arrays. Do not rewrite chapters.${context}`
  };
  if(agent==='narrative-world')return{
    system:`${prefix} You are the WORLD BUILDER. Strengthen consequences, constraints, locations and internal rules. Treat accepted canon as binding unless you explicitly flag a contradiction. Candidate canon is only a proposal.`,
    user:`Return JSON with keys worldPatch, canonCandidates, warnings. worldPatch has optional keys summary, rules, locations, notes. canonCandidates is an array of short proposed facts. Do not modify chapters.${context}`
  };
  if(agent==='narrative-character')return{
    system:`${prefix} You are the CHARACTER ARCHITECT. Deepen goals, contradictions, relationships, behavioral logic and distinct voice. Preserve existing character ids and names unless the human instruction explicitly requests a rename. Never merge or delete characters.`,
    user:`Return JSON with keys characterUpdates, characterCandidates, warnings. characterUpdates is an array of {id,name,role,summary,goal,conflict,voice,notes}; include only characters you actually improve and preserve their id. characterCandidates is an array of new optional characters using the same fields without id.${context}`
  };
  if(agent==='narrative-plot')return{
    system:`${prefix} You are the PLOT ARCHITECT. Build causal pressure and meaningful turns from the existing premise, world and characters. Existing chapters are material, not disposable scaffolding. Do not delete or silently reorder them.`,
    user:`Return JSON with keys plotPatch, chapterPlan, warnings. plotPatch has optional keys summary, beats, ending, notes. chapterPlan is an array of {number,title,summary}; it may propose missing chapters but must not contain chapter bodies.${context}`
  };
  if(agent==='narrative-scene')return{
    system:`${prefix} You are the SCENE WRITER. Write or continue exactly one active chapter. Obey accepted canon, timeline, character knowledge and established world rules. Preserve useful existing prose when the chapter already contains text. Do not write other chapters.`,
    user:`Return JSON with keys chapterId, title, summary, body, notes, warnings. chapterId must equal ACTIVE CHAPTER ID when provided; otherwise use the first chapter id. body is Markdown prose for that chapter only.${context}`
  };
  if(agent==='narrative-continuity')return{
    system:`${prefix} You are the CONTINUITY WATCHER. Audit, do not rewrite. Search for contradictions in chronology, character knowledge, names, locations, causal order, world rules and accepted canon. Distinguish a real conflict from intentional ambiguity.`,
    user:`Return JSON with keys issues, canonConflicts, timelineConflicts, warnings. issues is an array of {severity,location,problem,fix}. canonConflicts and timelineConflicts are string arrays. Do not return rewritten prose.${context}`
  };
  if(agent==='narrative-voice')return{
    system:`${prefix} You are the NARRATIVE VOICE EDITOR. Edit exactly the active chapter for rhythm, diction, repetition, point of view and character voice while preserving events and canon. Do not make the prose generically polished.`,
    user:`Return JSON with keys chapterId, body, changes, warnings. chapterId must equal ACTIVE CHAPTER ID when provided; otherwise use the first chapter id. body is the revised Markdown of that chapter only.${context}`
  };
  if(agent==='narrative-critic')return{
    system:`${prefix} You are the ADVERSARIAL STORY CRITIC. Be useful rather than agreeable. Test tension, scene purpose, character logic, exposition, pacing, stakes, emotional causality, cliché and whether the premise is actually being paid off. Do not rewrite the manuscript.`,
    user:`Return JSON with keys verdict, issues, strengths, questions. issues is an array of {severity,type,location,problem,fix}. strengths and questions are string arrays.${context}`
  };
  if(agent==='narrative-package')return{
    system:`${prefix} You are the MANUSCRIPT PACKAGER. Prepare export metadata only. You may suggest chapter order and front matter, but you may not rewrite chapters, save the project, export files or publish.`,
    user:`Return JSON with keys manuscriptTitle, chapterOrder, frontMatter, exportNotes, warnings. chapterOrder is an array of existing chapter ids in proposed order. frontMatter and exportNotes are strings. Never invent chapter ids.${context}`
  };
  throw Object.assign(new Error('Tuntematon Romancer-agentti.'),{statusCode:400,code:'NARRATIVE_AGENT_UNKNOWN'});
}

export function validateNarrativeAgentResult(agent,value,rawProject,{activeChapterId=''}={}){
  const raw=object(value),project=normalizeNarramancerProject(rawProject,rawProject?.workspaceId||''),chapterIds=new Set(project.chapters.map(x=>x.id));
  if(agent==='narrative-premise')return{premise:text(raw.premise,12_000),projectNotes:strings(raw.projectNotes,20,1400),questions:strings(raw.questions,20,1400),warnings:strings(raw.warnings,20,1400)};
  if(agent==='narrative-world'){const p=object(raw.worldPatch);return{worldPatch:{summary:text(p.summary,40_000),rules:text(p.rules,30_000),locations:text(p.locations,30_000),notes:text(p.notes,30_000)},canonCandidates:strings(raw.canonCandidates,30,4000),warnings:strings(raw.warnings,20,1400)};}
  if(agent==='narrative-character')return{
    characterUpdates:list(raw.characterUpdates,80).map(item=>{const x=object(item),id=text(x.id,80);return{id,name:text(x.name,180),role:text(x.role,260),summary:text(x.summary,12_000),goal:text(x.goal,8000),conflict:text(x.conflict,8000),voice:text(x.voice,8000),notes:text(x.notes,12_000)};}).filter(x=>x.id&&project.characters.some(c=>c.id===x.id)),
    characterCandidates:list(raw.characterCandidates,20).map(item=>{const x=object(item);return{name:text(x.name,180),role:text(x.role,260),summary:text(x.summary,12_000),goal:text(x.goal,8000),conflict:text(x.conflict,8000),voice:text(x.voice,8000),notes:text(x.notes,12_000)};}).filter(x=>x.name),warnings:strings(raw.warnings,20,1400)
  };
  if(agent==='narrative-plot'){const p=object(raw.plotPatch);return{plotPatch:{summary:text(p.summary,40_000),beats:text(p.beats,40_000),ending:text(p.ending,20_000),notes:text(p.notes,30_000)},chapterPlan:list(raw.chapterPlan,160).map((item,index)=>{const x=object(item);return{number:Math.max(1,Math.min(999,Number(x.number)||index+1)),title:text(x.title,220),summary:text(x.summary,12_000)};}).filter(x=>x.title||x.summary),warnings:strings(raw.warnings,20,1400)};}
  if(agent==='narrative-scene'){let id=text(raw.chapterId,80);if(activeChapterId&&chapterIds.has(activeChapterId))id=activeChapterId;else if(!chapterIds.has(id))id=project.chapters[0]?.id||'';return{chapterId:id,title:text(raw.title,220),summary:text(raw.summary,12_000),body:text(raw.body,180_000),notes:strings(raw.notes,30,1400),warnings:strings(raw.warnings,20,1400)};}
  if(agent==='narrative-continuity')return{issues:list(raw.issues,80).map(item=>{const x=object(item);return{severity:severity(x.severity),location:text(x.location,300),problem:text(x.problem,2400),fix:text(x.fix,2400)};}).filter(x=>x.problem),canonConflicts:strings(raw.canonConflicts,50,2200),timelineConflicts:strings(raw.timelineConflicts,50,2200),warnings:strings(raw.warnings,20,1400)};
  if(agent==='narrative-voice'){let id=text(raw.chapterId,80);if(activeChapterId&&chapterIds.has(activeChapterId))id=activeChapterId;else if(!chapterIds.has(id))id=project.chapters[0]?.id||'';return{chapterId:id,body:text(raw.body,180_000),changes:strings(raw.changes,40,1400),warnings:strings(raw.warnings,20,1400)};}
  if(agent==='narrative-critic')return{verdict:text(raw.verdict,5000),issues:list(raw.issues,80).map(item=>{const x=object(item);return{severity:severity(x.severity),type:text(x.type,180),location:text(x.location,300),problem:text(x.problem,2400),fix:text(x.fix,2400)};}).filter(x=>x.problem),strengths:strings(raw.strengths,40,1800),questions:strings(raw.questions,40,1800)};
  if(agent==='narrative-package'){const order=list(raw.chapterOrder,200).map(x=>text(x,80)).filter(id=>chapterIds.has(id));return{manuscriptTitle:text(raw.manuscriptTitle||project.project.title,220),chapterOrder:[...new Set(order)],frontMatter:text(raw.frontMatter,20_000),exportNotes:text(raw.exportNotes,20_000),warnings:strings(raw.warnings,20,1400)};}
  throw Object.assign(new Error('Tuntematon Romancer-agenttitulos.'),{statusCode:400,code:'NARRATIVE_RESULT_UNKNOWN'});
}
