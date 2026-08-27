import crypto from 'node:crypto';

export const NARRAMANCER_PROJECT_FORMAT='narramancer-project/v1';
export const NARRAMANCER_ARTIFACT_STATE_FORMAT='anomancer-private-artifact-state/v1';

const text=(value,max=20_000)=>String(value??'').trim().slice(0,max);
const list=(value,max=100)=>Array.isArray(value)?value.slice(0,max):[];
const clone=value=>JSON.parse(JSON.stringify(value));
const safeId=(value,prefix='item')=>{
  const raw=text(value,90).toLowerCase().normalize('NFKD').replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64);
  return raw||`${prefix}-${crypto.randomBytes(3).toString('hex')}`;
};
const uniqueIdFactory=()=>{const seen=new Set();return(value,prefix)=>{let id=safeId(value,prefix),base=id,n=2;while(seen.has(id))id=`${base}-${n++}`.slice(0,72);seen.add(id);return id;};};

export function emptyNarramancerProject(workspaceId=''){
  return {
    format:NARRAMANCER_PROJECT_FORMAT,
    workspaceId:text(workspaceId,80),
    project:{title:'',premise:'',genre:'',pointOfView:'',tone:'',language:'fi',notes:''},
    world:{summary:'',rules:'',locations:'',notes:''},
    characters:[],
    plot:{summary:'',beats:'',ending:'',notes:''},
    chapters:[],
    timeline:[],
    canon:[],
    orchestra:{instruction:'',lastRunId:'',lastRunAt:'',notes:''}
  };
}

export function normalizeNarramancerProject(input={},workspaceId=''){
  const raw=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  const ids=uniqueIdFactory();
  const project=raw.project&&typeof raw.project==='object'?raw.project:{};
  const world=raw.world&&typeof raw.world==='object'?raw.world:{};
  const plot=raw.plot&&typeof raw.plot==='object'?raw.plot:{};
  const orchestra=raw.orchestra&&typeof raw.orchestra==='object'?raw.orchestra:{};
  const normalized={
    format:NARRAMANCER_PROJECT_FORMAT,
    workspaceId:text(workspaceId||raw.workspaceId,80),
    project:{
      title:text(project.title,180),premise:text(project.premise,12_000),genre:text(project.genre,180),
      pointOfView:text(project.pointOfView,180),tone:text(project.tone,500),language:project.language==='en'?'en':'fi',notes:text(project.notes,20_000)
    },
    world:{summary:text(world.summary,40_000),rules:text(world.rules,30_000),locations:text(world.locations,30_000),notes:text(world.notes,30_000)},
    characters:list(raw.characters,80).map((item,index)=>{const x=item&&typeof item==='object'?item:{};return{
      id:ids(x.id||x.name||`character-${index+1}`,'character'),name:text(x.name,180),role:text(x.role,260),summary:text(x.summary,12_000),
      goal:text(x.goal,8_000),conflict:text(x.conflict,8_000),voice:text(x.voice,8_000),notes:text(x.notes,12_000)
    };}).filter(item=>item.name||item.summary||item.notes),
    plot:{summary:text(plot.summary,40_000),beats:text(plot.beats,40_000),ending:text(plot.ending,20_000),notes:text(plot.notes,30_000)},
    chapters:list(raw.chapters,160).map((item,index)=>{const x=item&&typeof item==='object'?item:{},number=Math.max(1,Math.min(999,Number(x.number)||index+1));return{
      id:ids(x.id||x.title||`chapter-${number}`,'chapter'),number,title:text(x.title,220),summary:text(x.summary,12_000),body:text(x.body,180_000),
      status:['idea','draft','revised','locked'].includes(x.status)?x.status:'draft',notes:text(x.notes,20_000),updatedAt:text(x.updatedAt,40)
    };}).sort((a,b)=>a.number-b.number),
    timeline:list(raw.timeline,240).map((item,index)=>{const x=item&&typeof item==='object'?item:{};return{
      id:ids(x.id||`timeline-${index+1}`,'timeline'),when:text(x.when,220),event:text(x.event,8_000),chapterRef:text(x.chapterRef,90),notes:text(x.notes,8_000)
    };}).filter(item=>item.when||item.event||item.notes),
    canon:list(raw.canon,320).map((item,index)=>{const x=item&&typeof item==='object'?item:{};return{
      id:ids(x.id||`canon-${index+1}`,'canon'),statement:text(x.statement,8_000),status:['candidate','accepted','retired'].includes(x.status)?x.status:'accepted',
      source:text(x.source,300),notes:text(x.notes,8_000)
    };}).filter(item=>item.statement||item.notes),
    orchestra:{instruction:text(orchestra.instruction,12_000),lastRunId:text(orchestra.lastRunId,120),lastRunAt:text(orchestra.lastRunAt,40),notes:text(orchestra.notes,30_000)}
  };
  const bytes=Buffer.byteLength(JSON.stringify(normalized),'utf8');
  if(bytes>1_500_000)throw Object.assign(new Error('Narramancer-projekti on liian suuri yhdelle tallennukselle (max 1.5 MB).'),{statusCode:413,code:'NARRAMANCER_PROJECT_TOO_LARGE'});
  return normalized;
}

export function projectSummaryForAgent(project={}){
  const p=normalizeNarramancerProject(project,project.workspaceId||'');
  return {
    ...clone(p),
    chapters:p.chapters.map(chapter=>({...chapter,body:chapter.body.slice(0,120_000)})),
  };
}
