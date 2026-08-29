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

function workspaceFor(problem={}){
  if(problem.domain==='software'&&['debug','audit','plan'].includes(problem.taskType)){
    return {id:'codemancer',label:'Ohjelmistotyötila'};
  }
  return null;
}

export function recommendWork({problem={},profile={},capabilities={}}={}){
  const [title,summary]=LABELS[problem.taskType]||LABELS.general;
  const unresolved=Array.isArray(capabilities.unresolved)?capabilities.unresolved:[];
  const hasSearchGap=unresolved.some(item=>item.id==='research.search');
  const steps=Math.max(1,Number(profile.passes)||1)+2;

  return {
    format:RECOMMENDATION_FORMAT,
    title,
    summary,
    estimatedStages:steps,
    workspace:workspaceFor(problem),
    requiresApproval:profile.externalActionRequested===true,
    limitations:hasSearchGap
      ?['Verkkohaku ei ole vielä kytketty tähän Lighthouse-rakennusvaiheeseen.']
      :[],
    startLabel:'Käynnistä'
  };
}
