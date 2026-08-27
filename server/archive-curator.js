import { CORE_VERSION, digest } from './core-registry.js';
import { loadArchiveState, verifyArchiveObjectIntegrity } from './archive-store.js';

export const ARCHIVE_GOVERNANCE_AGENT_FORMAT='anomancer-archive-governance-agent/v1';
export const ARCHIVE_GOVERNANCE_REPORT_FORMAT='anomancer-archive-governance-report/v1';
export const ARCHIVE_GOVERNANCE_PROPOSAL_FORMAT='anomancer-archive-governance-proposal/v1';

const clone=value=>JSON.parse(JSON.stringify(value));
const clean=value=>String(value??'').trim();
const safeId=value=>clean(value).toLowerCase().replace(/[^a-z0-9._:-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);
const countBy=(rows,keyFn)=>{const out={};for(const row of rows){const key=clean(keyFn(row))||'—';out[key]=(out[key]||0)+1;}return Object.fromEntries(Object.entries(out).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])));};
const unique=items=>[...new Set(items.filter(Boolean))];
const relationKey=(a,b)=>[a,b].sort().join('::');
const proposalId=(kind,parts=[])=>`care-${kind}-${digest([kind,...parts]).slice(0,16)}`;
const ageDays=(iso,nowMs)=>{const t=Date.parse(iso||'');return Number.isFinite(t)?Math.max(0,(nowMs-t)/86400000):0;};
const tokenize=value=>new Set(clean(value).toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}_-]{3,}/gu)?.slice(0,1200)||[]);
const jaccard=(a,b)=>{if(!a.size||!b.size)return 0;let both=0;for(const x of a)if(b.has(x))both++;return both/(a.size+b.size-both);};
const previewText=object=>[object.title,object.summary,object.content?.text,object.projectId,...(object.tags||[])].filter(Boolean).join(' ').slice(0,12000);

export const ARCHIVE_CURATOR_CONTRACT=Object.freeze({
  format:ARCHIVE_GOVERNANCE_AGENT_FORMAT,
  coreVersion:CORE_VERSION,
  id:'archive-curator',
  label:'Arkistonhoitaja',
  version:'1.0.0',
  role:'archive-governance',
  description:'Deterministinen Archive Governance Agent, joka indeksoi muistikerrosta ja tuottaa järjestely-, relation-, retention- ja eheystarkastusehdotuksia ilman itsenäisiä sivuvaikutuksia.',
  authority:{
    read:['archive.metadata','archive.integrity','archive.local-content-fingerprint'],
    write:['governanceReport','suggestions'],
    deny:['archive.object.write','archive.object.delete','archive.grant','evidence.verify','publish','model.context.export']
  },
  modelAccess:'none',
  networkAccess:'none',
  sideEffects:false,
  suggestionsOnly:true,
  humanApprovalRequiredForMutation:true,
  automaticRetentionActions:false,
  crossWorkspaceMutation:false
});

function addProposal(list,{kind,severity='info',title,message,objectIds=[],workspaceId='',projectId='',recommendation=''}){
  const ids=unique(objectIds.map(safeId)).sort();
  const proposal={format:ARCHIVE_GOVERNANCE_PROPOSAL_FORMAT,kind,severity,id:proposalId(kind,[...ids,workspaceId,projectId,title]),title:clean(title).slice(0,180),message:clean(message).slice(0,1200),objectIds:ids,workspaceId:safeId(workspaceId),projectId:safeId(projectId),recommendation:clean(recommendation).slice(0,1200),mutationAllowed:false,humanDecisionRequired:true};
  proposal.proposalHash=digest(proposal);
  list.push(proposal);
}

function buildIndex(objects){
  const tags={};for(const object of objects)for(const tag of object.tags||[])tags[tag]=(tags[tag]||0)+1;
  return {
    objectCount:objects.length,
    byType:countBy(objects,x=>x.type),
    byWorkspace:countBy(objects,x=>x.workspaceId),
    byProject:countBy(objects,x=>x.projectId||'ei-projektia'),
    byStatus:countBy(objects,x=>x.status),
    topTags:Object.fromEntries(Object.entries(tags).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,40))
  };
}

export function archiveCuratorStatus(){return clone(ARCHIVE_CURATOR_CONTRACT);}

export async function runArchiveCurator({workspaceId='',maxProposals=80,nowIso=''}={}){
  const state=await loadArchiveState();
  const scope=safeId(workspaceId);
  const objects=(scope?state.objects.filter(x=>x.workspaceId===scope):state.objects).map(clone);
  const objectMap=new Map(objects.map(x=>[x.id,x]));
  const proposals=[];
  const nowMs=Date.parse(nowIso)||Date.now();
  const integrityFailures=[];
  const danglingRelations=[];
  const orphaned=[];
  const retentionDue=[];

  for(const object of objects){
    if(!verifyArchiveObjectIntegrity(object)){
      integrityFailures.push(object.id);
      addProposal(proposals,{kind:'integrity',severity:'critical',title:'Eheystarkistus epäonnistui',message:`${object.title}: tallennetun objektin hash ei vastaa normalisoitua sisältöä.`,objectIds:[object.id],workspaceId:object.workspaceId,projectId:object.projectId,recommendation:'Älä käytä objektia uutena kontekstina ennen ihmisen tarkistusta. Vertaa provenancea ja aiempaa snapshotia.'});
    }
    for(const rel of object.relations||[])if(rel.targetId&&!objectMap.has(rel.targetId))danglingRelations.push({objectId:object.id,targetId:rel.targetId,type:rel.type});
    if(!object.projectId&&!(object.relations||[]).length&&object.type!=='project')orphaned.push(object.id);
    const reviewAt=Date.parse(object.retention?.reviewAfter||'');
    const temporaryOld=object.retention?.policy==='temporary'&&ageDays(object.updatedAt||object.createdAt,nowMs)>=30;
    const reviewExpired=object.retention?.policy==='review'&&Number.isFinite(reviewAt)&&reviewAt<=nowMs;
    if(temporaryOld||reviewExpired){retentionDue.push(object.id);addProposal(proposals,{kind:'retention',severity:'warn',title:'Säilytyspolitiikka vaatii ihmisen tarkistuksen',message:`${object.title}: ${temporaryOld?'väliaikainen objekti on yli 30 päivää vanha':'reviewAfter-ajankohta on saavutettu'}.`,objectIds:[object.id],workspaceId:object.workspaceId,projectId:object.projectId,recommendation:'Tarkista objekti ja päätä säilytetäänkö se, merkitäänkö historialliseksi vai poistetaanko se. Arkistonhoitaja ei tee päätöstä.'});}
  }

  for(const item of danglingRelations){
    const object=objectMap.get(item.objectId);addProposal(proposals,{kind:'relation-missing-target',severity:'warn',title:'Suhteen kohde puuttuu',message:`${object?.title||item.objectId}: ${item.type} → ${item.targetId}, mutta kohdetta ei löydy tästä Archive-skoopista.`,objectIds:[item.objectId,item.targetId],workspaceId:object?.workspaceId,projectId:object?.projectId,recommendation:'Tarkista onko kohde poistettu, eri työtilassa vai väärällä tunnisteella. Älä luo korvaavaa linkkiä automaattisesti.'});
  }

  const exactGroups=new Map();
  for(const object of objects){const hash=object.integrity?.contentHash;if(!hash)continue;const group=exactGroups.get(hash)||[];group.push(object);exactGroups.set(hash,group);}
  const duplicateGroups=[];
  for(const [hash,group] of exactGroups){if(group.length<2)continue;duplicateGroups.push(group.map(x=>x.id));addProposal(proposals,{kind:'duplicate-exact',severity:'warn',title:'Täsmälleen sama sisältö useassa objektissa',message:`${group.length} Archive Objectia jakaa saman content hashin ${hash.slice(0,12)}…`,objectIds:group.map(x=>x.id),workspaceId:group.every(x=>x.workspaceId===group[0].workspaceId)?group[0].workspaceId:'',projectId:group.every(x=>x.projectId===group[0].projectId)?group[0].projectId:'',recommendation:'Valitse ihmisenä pääversio. Muut voidaan myöhemmin merkitä historiallisiksi tai säilyttää provenance-syistä.'});}

  const nearDuplicates=[];
  const tokenCache=new Map(objects.map(o=>[o.id,tokenize(previewText(o))]));
  const maxPairs=Math.min(objects.length,220);
  for(let i=0;i<maxPairs;i++)for(let j=i+1;j<maxPairs;j++){
    const a=objects[i],b=objects[j];
    if(a.workspaceId!==b.workspaceId)continue;
    if(a.integrity?.contentHash&&a.integrity.contentHash===b.integrity?.contentHash)continue;
    if(a.projectId&&b.projectId&&a.projectId!==b.projectId)continue;
    const ta=tokenCache.get(a.id),tb=tokenCache.get(b.id);if(ta.size<8||tb.size<8)continue;
    const score=jaccard(ta,tb);if(score<0.90)continue;
    nearDuplicates.push({a:a.id,b:b.id,score:Number(score.toFixed(3))});
    addProposal(proposals,{kind:'duplicate-near',severity:'info',title:'Mahdollinen lähes-duplikaatti',message:`${a.title} ↔ ${b.title}: deterministinen token-similariteetti ${(score*100).toFixed(1)} %.`,objectIds:[a.id,b.id],workspaceId:a.workspaceId,projectId:a.projectId&&a.projectId===b.projectId?a.projectId:'',recommendation:'Vertaa objektit ennen yhdistämistä. Similariteetti on seulonta, ei semanttinen totuus.'});
  }

  const existingRelations=new Set();
  for(const object of objects)for(const rel of object.relations||[])existingRelations.add(relationKey(object.id,rel.targetId));
  const byProject=new Map();
  for(const object of objects)if(object.projectId){const key=`${object.workspaceId}::${object.projectId}`;const group=byProject.get(key)||[];group.push(object);byProject.set(key,group);}
  const relationSuggestions=[];
  for(const group of byProject.values()){
    if(group.length<2)continue;
    const sorted=[...group].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
    for(let i=1;i<Math.min(sorted.length,8);i++){
      const a=sorted[0],b=sorted[i],key=relationKey(a.id,b.id);if(existingRelations.has(key))continue;
      relationSuggestions.push({from:a.id,to:b.id,type:'project-related'});
      addProposal(proposals,{kind:'relation',severity:'info',title:'Projektisuhde puuttuu',message:`${a.title} ja ${b.title} kuuluvat samaan projektiin ${a.projectId}, mutta niiden välillä ei ole relation-linkkiä.`,objectIds:[a.id,b.id],workspaceId:a.workspaceId,projectId:a.projectId,recommendation:'Harkitse project-related- tai derived-from-suhdetta, jos yhteys on sisällöllisesti oikea. Arkistonhoitaja ei lisää linkkiä itse.'});
    }
  }

  for(const id of orphaned.slice(0,30)){
    const object=objectMap.get(id);addProposal(proposals,{kind:'orphan',severity:'info',title:'Objekti on irrallaan muistiverkosta',message:`${object.title}: ei projectId:tä eikä relation-linkkejä.`,objectIds:[id],workspaceId:object.workspaceId,recommendation:'Jos objekti kuuluu projektiin tai toiseen artefaktiin, lisää yhteys ihmisen tarkistuksen jälkeen.'});
  }

  const selected=proposals.slice(0,Math.max(1,Math.min(200,Number(maxProposals)||80)));
  const issueWeight=integrityFailures.length*30+danglingRelations.length*8+duplicateGroups.length*5+retentionDue.length*4+orphaned.length*1;
  const healthScore=Math.max(0,Math.min(100,100-issueWeight));
  const report={
    format:ARCHIVE_GOVERNANCE_REPORT_FORMAT,coreVersion:CORE_VERSION,id:`care-report-${digest([state.revision,scope,objects.map(x=>x.integrity?.objectHash)]) .slice(0,20)}`,
    generatedAt:new Date(nowMs).toISOString(),scope:{workspaceId:scope||'',mode:scope?'workspace':'human-global-archive'},storeRevision:state.revision,
    agent:archiveCuratorStatus(),index:buildIndex(objects),health:{score:healthScore,status:integrityFailures.length?'critical':healthScore<85?'attention':'healthy',integrityFailures,missingRelationTargets:danglingRelations.length,exactDuplicateGroups:duplicateGroups.length,nearDuplicatePairs:nearDuplicates.length,retentionDue:retentionDue.length,orphanedObjects:orphaned.length},
    diagnostics:{duplicateGroups,nearDuplicates,relationSuggestions,danglingRelations,retentionDue,orphaned},proposals:selected,proposalCount:selected.length,mutationPerformed:false,notes:['Arkistonhoitaja tuottaa ehdotuksia vain serverin sisällä.','Raportti ei muuta Archive Objecteja, käyttöoikeuksia, evidenssistatuksia tai retention-politiikkaa.','Lähes-duplikaatti perustuu deterministiseen token-similariteettiin eikä semanttiseen mallipäätelmään.'],integrity:{algorithm:'sha256',reportHash:''}
  };
  const hashable=clone(report);delete hashable.coreVersion;delete hashable.integrity;report.integrity.reportHash=digest(hashable);
  return report;
}
