import {GENERATED_CAPABILITY_DEFINITIONS} from './packages.generated.js';

const builtinDefinitions=[
  {id:'llm.reasoning',providerClass:'llm',mode:'native',available:true,executionCapability:'llm.reasoning'},
  {id:'llm.analysis',providerClass:'llm',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'llm.writer',providerClass:'llm',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'llm.critic',providerClass:'llm',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'document.read',providerClass:'context',mode:'local-context',available:true,executionCapability:'llm.reasoning'},
  {id:'web.fetch',providerClass:'tool',mode:'public-web-read',available:true,executionCapability:null,readOnly:true},
  {id:'research.search',providerClass:'tool',mode:'runtime-search',available:false,runtimeAvailable:true,executionCapability:null,readOnly:true},
  {id:'repository.read',providerClass:'tool',mode:'local-project-read',available:false,runtimeAvailable:true,executionCapability:null,readOnly:true},
  {id:'repository.propose',providerClass:'tool',mode:'bounded-mutation-proposal',available:false,runtimeAvailable:true,executionCapability:null,proposalOnly:true},
  {id:'repository.write',providerClass:'tool',mode:'human-approved-operation-branch',available:false,runtimeAvailable:true,executionCapability:null,requiresApproval:true},
  {id:'mancer.activate',providerClass:'mancer',mode:'package-context',available:true,executionCapability:null,readOnly:true},
  {id:'risk.analysis',providerClass:'reasoning',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'evidence.trace',providerClass:'trust',mode:'runtime-trace',available:true,executionCapability:'llm.reasoning'},
  {id:'evidence.validate',providerClass:'reasoning',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'contradiction.check',providerClass:'reasoning',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'code.inspect',providerClass:'reasoning',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'architecture.analyze',providerClass:'reasoning',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},

  {id:'editorial.plan',label:'Toimitussuunnittelu',purpose:'Jäsentää aiheen, yleisön ja toimituksellisen työpolun.',providerClass:'editorial',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'editorial.write',label:'Toimituksellinen kirjoitus',purpose:'Laatii luonnoksen käyttäjän tavoitteen pohjalta.',providerClass:'editorial',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'editorial.edit',label:'Toimituksellinen editointi',purpose:'Selkeyttää rakennetta ja ääntä muuttamatta evidenssin tilaa.',providerClass:'editorial',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'claims.inspect',label:'Väitteiden tarkistus',purpose:'Tunnistaa tarkistettavat väitteet ja riskit.',providerClass:'editorial',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'evidence.map',label:'Väite–evidenssi-kartta',purpose:'Yhdistää väitteet evidenssiin ja jättää aukot näkyviin.',providerClass:'editorial',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'publication.prepare',label:'Julkaisuvalmistelu',purpose:'Valmistelee julkaisupaketin ilman julkaisua.',providerClass:'editorial',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'publication.publish',label:'Julkaisu',purpose:'Julkaisu vaatii aina erillisen ihmishyväksynnän.',providerClass:'tool',mode:'human-gated-publication',available:true,executionCapability:null,requiresApproval:true},

  {id:'story.plan',label:'Tarinan suunnittelu',purpose:'Jäsentää premissin ja kehityssuunnan.',providerClass:'narrative',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'story.world',label:'Maailmanrakennus',purpose:'Kehittää maailman sääntöjä ja seurauksia.',providerClass:'narrative',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'story.character',label:'Hahmoarkkitehtuuri',purpose:'Kehittää hahmojen tavoitteita, ristiriitoja ja ääntä.',providerClass:'narrative',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'story.plot',label:'Juonisuunnittelu',purpose:'Rakentaa juonen, beatit ja käännekohdat.',providerClass:'narrative',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'story.draft',label:'Luku- ja kohtausluonnos',purpose:'Kirjoittaa rajatun luvun tai kohtauksen.',providerClass:'narrative',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'story.continuity',label:'Jatkuvuusvahti',purpose:'Tarkistaa aikajanan, hahmotiedon ja maailman säännöt.',providerClass:'narrative',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'story.voice',label:'Kerronnan ääni',purpose:'Tarkistaa rytmin, näkökulman ja hahmoäänen.',providerClass:'narrative',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'story.canon',label:'Kaanonin tarkistus',purpose:'Erottelee kaanonin ehdotuksista ja tunnistaa konfliktit.',providerClass:'narrative',mode:'reasoning-proxy',available:true,executionCapability:'llm.reasoning'},
  {id:'story.export',label:'Käsikirjoitusvienti',purpose:'Vienti vaatii ihmisen nimenomaisen toiminnon.',providerClass:'tool',mode:'human-gated-local-export',available:true,executionCapability:null,requiresApproval:true},

  {id:'tests.run',providerClass:'tool',mode:'not-wired',available:false,executionCapability:null,requiresApproval:true},
  {id:'external.execute',providerClass:'tool',mode:'human-gated',available:false,executionCapability:null,requiresApproval:true}
];

const definitions=[...builtinDefinitions,...GENERATED_CAPABILITY_DEFINITIONS];
const seenCapabilityIds=new Set();
for(const item of definitions){
  if(seenCapabilityIds.has(item.id))throw new Error(`Duplicate capability id: ${item.id}`);
  seenCapabilityIds.add(item.id);
}

const C=Object.freeze(Object.fromEntries(definitions.map(item=>[
  item.id,
  Object.freeze({...item})
])));

export const getCapability=id=>C[String(id||'')]||null;
export const listCapabilities=()=>Object.values(C);
