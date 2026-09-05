export const RECOMMENDATION_FORMAT='anomancer-work-recommendation/v1';

const LABELS={
  debug:['Perusteellinen vianrajaus','Rajataan todennäköiset syyt, muodostetaan korjaus ja tarkistetaan regressioriski.'],
  audit:['Perusteellinen tarkistus','Käydään väitteet, rajat, riskit ja ristiriidat järjestelmällisesti läpi.'],
  compare:['Vertailu ja riskitarkistus','Erotetaan olennaiset erot, riskit ja päätöksen kannalta tärkeät epävarmuudet.'],
  plan:['Suunniteltu työ','Jäsennetään tavoite vaiheiksi ja tarkistetaan riippuvuudet ennen lopputulosta.'],
  research:['Selvitys nykyisellä aineistolla','Erotetaan havainnot, epävarmuudet ja se, mitä pitäisi vielä varmistaa ulkoisista lähteistä.'],
  write:['Kirjoitustyö','Muodostetaan käyttökelpoinen teksti annetun tavoitteen ja aineiston pohjalta.'],
  transform:['Aineiston muunnos','Käsitellään annettu aineisto tavoitteen mukaiseen muotoon.'],
  general:['Suora työ','Ratkaistaan nykyinen tavoite mahdollisimman suoraviivaisesti.']
};

const SEARCH_CAPABILITIES=new Set([
  'research.search','source.search','academic.search','news.search'
]);
const ENSEMBLE_CAPABILITIES=new Set([
  'model.compare','model.disagreement','model.merge','uncertainty.calibrate'
]);


function workspaceFor(problem={}){
  if(problem.domain==='software'&&['debug','audit','plan'].includes(problem.taskType)){
    return {id:'codemancer',label:'Ohjelmistotyötila'};
  }
  if(problem.domain==='editorial')return {id:'toimituskone',label:'Toimituskone'};
  if(problem.domain==='narrative')return {id:'romancer',label:'Romancer'};
  return null;
}

export function recommendWork({problem={},profile={},capabilities={}}={}){
  const [title,summary]=LABELS[problem.taskType]||LABELS.general;
  const unresolved=Array.isArray(capabilities.unresolved)?capabilities.unresolved:[];
  const hasSearchGap=unresolved.some(item=>SEARCH_CAPABILITIES.has(item.id));
  const hasEnsembleGap=unresolved.some(item=>ENSEMBLE_CAPABILITIES.has(item.id));
  const hasRepoGap=unresolved.some(item=>item.id==='repository.read');
  const hasWriteGap=unresolved.some(item=>item.id==='repository.propose'||item.id==='repository.write');
  const matched=Array.isArray(capabilities.matched)?capabilities.matched:[];
  const matchedIds=new Set(matched.map(item=>item.id));
  const dataNotice=[
    [...SEARCH_CAPABILITIES].some(id=>matchedIds.has(id))?'Hakukysely voidaan lähettää hakupalvelulle ja hakutulokset välitetään mallikontekstiin.':'',
    matchedIds.has('web.fetch')?'Nimeämäsi julkinen verkkosivu luetaan ja sen tekstisisältö välitetään mallikontekstiin.':'',
    matchedIds.has('repository.read')?'Nimeämäsi projektitiedostot voidaan lukea paikallisesta lähdepuusta ja välittää mallikontekstiin.':''
  ].filter(Boolean).join(' ');
  const steps=Math.max(1,Number(profile.passes)||1)+2;

  return {
    format:RECOMMENDATION_FORMAT,
    title,
    summary,
    estimatedStages:steps,
    workspace:workspaceFor(problem),
    requiresApproval:profile.externalActionRequested===true,
    limitations:[
      ...(hasSearchGap?['Yksi tai useampi pyydetty lähdehaku ei ole käytettävissä tässä ympäristössä.']:[]),
      ...(hasEnsembleGap?['Monimalliajo on määritelty kyvykkyydeksi, mutta ensemble-runtime ei ole vielä käytettävissä.']:[]),
      ...(hasRepoGap?['Repository-yhteys ei ole käytettävissä tässä ympäristössä, joten kooditiedostoja ei voida lukea automaattisesti.']:[]),
      ...(problem.constraints?.externalSideEffectsRequested&&hasWriteGap?['Kirjoittava repository-portti ei ole käytettävissä tässä ympäristössä. Ehdotus voidaan silti analysoida ilman muutosta.']:[])
    ],
    dataNotice,
    startLabel:'Käynnistä'
  };
}
