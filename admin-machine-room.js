const q=s=>globalThis.document?.querySelector(s)||null,qa=s=>globalThis.document?[...document.querySelectorAll(s)]:[];

const MODE_KEY='anomancer.machine-room.mode.v16.3';
const MODES=new Set(['quiet','living','oe']);
export const MAX_EVENTS=8;
export const STAGE_LABELS={source:'Lähdeagentti',structure:'Rakenneagentti',writer:'Kirjoitusagentti',critic:'Kriitikko',audience:'Yleisöadapteri',voice:'Äänieditori',claims:'Väitevahti',visualization:'Visualisointivahti',package:'Julkaisupaketti'};
export const SAFE_DETAIL_KEYS=new Set(['stage','label','step','stepCount','count','supported','open','warnings','issues','placements','elapsedMs','httpStatus','parallelCount']);

export const LIVING_COPY={
  RUN_STARTED:'Toimitusputki käynnistyi.',RUN_COMPLETED:'Kaikki koneelliset vaiheet ovat valmiit.',RUN_STOPPED:'Ajo pysäytettiin tarkistuspisteeseen.',
  STAGE_STARTED:'Vaihe käynnistyi.',STAGE_COMPLETED:'Vaihe valmistui.',STAGE_SKIPPED:'Vaihe ohitettiin ajoprofiilin mukaisesti.',
  SOURCE_FOUND:'Lähde-ehdokkaita löytyi tarkistettavaksi.',SOURCE_EMPTY:'Lähdevaihe ei löytänyt käyttökelpoisia ehdokkaita.',
  CRITIC_FLAGS:'Kriitikko löysi tarkistettavia kohtia.',CLAIMS_CHECKED:'Väitteiden evidenssikytkennät tarkistettiin.',PARTIAL_SOURCE_SUPPORT:'Osa väitteistä jäi avoimeksi tai tulkinnaksi.',
  PACKAGE_READY:'Julkaisupaketti valmisteli metadatan ja viitesijoitukset.',MODEL_RETRY:'Vaihe yrittää uudelleen hallitusti.',API_ERROR:'Vaihe pysähtyi tekniseen virheeseen.',
  TOOL_DENIED:'Työkalukutsu estettiin käyttöoikeussäännöllä.',PARALLEL_STARTED:'Rinnakkaisvaiheen agentit saivat saman jäädytetyn syötteen.',PARALLEL_MERGED:'Rinnakkaisvaiheen tulokset yhdistettiin deterministisesti.',
  HUMAN_APPLIED:'Ihminen siirsi orkesterituloksen editoriin. Mitään ei julkaistu.',AGENT_DISAGREEMENT:'Agenttien tuloksissa on ristiriita, joka vaatii tarkistuksen.'
};
export const EVENT_CODES=new Set(Object.keys(LIVING_COPY));
const DETAIL_LIMITS={step:100,stepCount:100,count:100000,supported:100000,open:100000,warnings:100000,issues:100000,placements:100000,elapsedMs:86400000,httpStatus:599,parallelCount:3};

const OE_STAGE_START={source:'Katotaan nyt perkele löytyykö tälle väitteelle mitään.',structure:'Luuranko pöydälle.',writer:'Nyt tehdään tästä teksti eikä lomaketta.',critic:'Suurennuslasi esiin. Liian sileä ei käy.',audience:'Kuka tätä joutuu lukemaan?',voice:'Kuunnellaan kuulostaako tämä PowerPointilta.',claims:'Väitteet tiskille. Lähdepaperit viereen.',visualization:'Numeroita näkyvissä. Viivain esiin.',package:'Leimasin käteen.'};
const LIVING_STAGE_START={source:'Lähdeagentti etsii varmennettavaa aineistoa.',structure:'Rakenneagentti järjestää havaintojen rungon.',writer:'Kirjoitusagentti rakentaa luonnosta.',critic:'Kriitikko stressitestaa luonnosta.',audience:'Yleisöadapteri sovittaa kehystä valitulle lukijalle.',voice:'Äänieditori tarkistaa proosan äänen.',claims:'Väitevahti tarkistaa evidenssikytkennät.',visualization:'Visualisointivahti tarkistaa varmennettua dataa.',package:'Julkaisupaketti kokoaa metadatan ja viitteet.'};

export const OE_COPY={
  RUN_STARTED:'Karvainen laatupäällikkö saapui vuoroon.',RUN_COMPLETED:'Kone hiljeni. Ihminen päättää mitä tästä seuraa.',RUN_STOPPED:'Kahvitauko. Tarkistuspiste jäi talteen.',
  STAGE_STARTED:'Clipboard auki. Katsotaan mitä putkesta tulee.',STAGE_COMPLETED:'Leima pöytään. Seuraava.',STAGE_SKIPPED:'Tämä luukku pysyy tänään kiinni.',
  SOURCE_FOUND:'Katotaan nyt perkele löytyykö tälle väitteelle mitään.',SOURCE_EMPTY:'Kaivettiin. Pohjalla oli lähinnä pölyä.',
  CRITIC_FLAGS:'Liian sileää. Epäilyttävää.',CLAIMS_CHECKED:'Lähdepaperit pöydälle. Väitevahti laskee sormet.',PARTIAL_SOURCE_SUPPORT:'Lähde ei sano ihan noin.',
  PACKAGE_READY:'87 % riittää. Ulos.',MODEL_RETRY:'Kone yskäisi. Uusi yritys, yksi kappale.',API_ERROR:'Perkele.',
  TOOL_DENIED:'Ei lupaa. Ovi pysyy kiinni.',PARALLEL_STARTED:'Kaksi käytävää auki. Kukaan ei kurki toisen paperia.',PARALLEL_MERGED:'Rinnakkaiset paperit niputettiin ilmoitetussa järjestyksessä.',
  HUMAN_APPLIED:'Ihminen otti paperit pöydältä. Julkaisunappi on edelleen ihmisellä.',AGENT_DISAGREEMENT:'ONTOLOGINEN RIITA.'
};

export function safeDetail(input={}){
  const out={};
  for(const [key,value] of Object.entries(input||{})){
    if(!SAFE_DETAIL_KEYS.has(key))continue;
    if(typeof value==='string')out[key]=value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').slice(0,120);
    else if(typeof value==='number'&&Number.isFinite(value))out[key]=Math.min(DETAIL_LIMITS[key]??100000,Math.max(0,Math.trunc(value)));
    else if(typeof value==='boolean')out[key]=value;
  }
  return out;
}
export function safeEventCode(value=''){const code=String(value).replace(/[^A-Z0-9_]/g,'').slice(0,48);return EVENT_CODES.has(code)?code:'STATUS';}
function stageLabel(detail={}){return detail.label||STAGE_LABELS[detail.stage]||'Vaihe';}
export function factualLine(code,detail={}){
  const label=stageLabel(detail),step=detail.step&&detail.stepCount?`${detail.step}/${detail.stepCount} · `:'';
  switch(code){
    case 'STAGE_STARTED':return `${step}${label} · käynnissä`;
    case 'STAGE_COMPLETED':return `${step}${label} · valmis${detail.elapsedMs?` · ${(detail.elapsedMs/1000).toFixed(1)} s`:''}`;
    case 'STAGE_SKIPPED':return `${step}${label} · pois käytöstä`;
    case 'SOURCE_FOUND':return `${label} · ${detail.count||0} lähde-ehdokasta · ihmisen varmennus vaaditaan`;
    case 'SOURCE_EMPTY':return `${label} · 0 lähde-ehdokasta`;
    case 'CRITIC_FLAGS':return `${label} · ${detail.issues||0} havaintoa`;
    case 'CLAIMS_CHECKED':return `${label} · ${detail.supported||0} tuettua · ${detail.open||0} avointa/tulkintaa`;
    case 'PARTIAL_SOURCE_SUPPORT':return `${label} · ${detail.open||0} väitettä ei ole supported-tilassa`;
    case 'PACKAGE_READY':return `${label} · ${detail.placements||0} hyväksyttäväksi ehdotettua viitesijoitusta · ei julkaistu`;
    case 'MODEL_RETRY':return `${label} · automaattinen uusintayritys 1/1`;
    case 'API_ERROR':return `${label} · tekninen virhe${detail.httpStatus?` · HTTP ${detail.httpStatus}`:''} · tarkistuspiste säilyy`;
    case 'TOOL_DENIED':return `${label} · työkalukutsu estetty`;
    case 'PARALLEL_STARTED':return `${detail.parallelCount||0} agenttia rinnakkain · sama jäädytetty syöte`;
    case 'PARALLEL_MERGED':return `Rinnakkaisvaihe yhdistetty deterministisesti`;
    case 'RUN_STARTED':return `Orkesteriajo käynnissä · ihmisen lopullinen päätösvalta säilyy`;
    case 'RUN_COMPLETED':return `Orkesteriajo valmis · ihmisen hyväksyntä vaaditaan`;
    case 'RUN_STOPPED':return `Ajo pysäytetty · mitään ei sovellettu editoriin`;
    case 'HUMAN_APPLIED':return `Lopputulos editorissa · ei tallennettu eikä julkaistu`;
    case 'AGENT_DISAGREEMENT':return `Ristiriitainen agenttihavainto · ihmisen tarkistus vaaditaan`;
    default:return `${label} · tilatapahtuma`;
  }
}
export function copyFor(code,mode,detail={}){
  if(code==='STAGE_STARTED'&&detail.stage){if(mode==='oe'&&OE_STAGE_START[detail.stage])return OE_STAGE_START[detail.stage];if(mode==='living'&&LIVING_STAGE_START[detail.stage])return LIVING_STAGE_START[detail.stage];}
  if(mode==='oe')return OE_COPY[code]||LIVING_COPY[code]||'Konehuone rekisteröi tapahtuman.';
  return LIVING_COPY[code]||'Konehuone rekisteröi tapahtuman.';
}
function storedMode(){try{const v=localStorage.getItem(MODE_KEY);return MODES.has(v)?v:'living';}catch{return'living';}}

const root=q('#machineRoom');
if(root){
  const comment=q('#machineRoomComment'),fact=q('#machineRoomFact'),raccoon=q('#machineRoomRaccoon'),raccoonPeer=q('#machineRoomRaccoonPeer'),history=q('#machineRoomHistory'),wall=q('#machineRoomWall');
  let mode=storedMode(),events=[];
  function setMode(next,{announce=true}={}){
    mode=MODES.has(next)?next:'living';root.dataset.mode=mode;if(globalThis.document?.documentElement)document.documentElement.dataset.machineMode=mode;
    qa('button[data-machine-mode]').forEach(btn=>{const on=btn.dataset.machineMode===mode;btn.setAttribute('aria-pressed',String(on));btn.dataset.active=on?'true':'false';});
    try{localStorage.setItem(MODE_KEY,mode);}catch{}
    if(announce){comment.textContent=mode==='quiet'?'Työrauha. Vain koneen fakta näkyy.':mode==='oe'?'OE-tila. Karvainen laadunvalvonta näkyy, päätösvalta ei muutu.':'Elävä konehuone. Hillitty prosessikursori käytössä.';fact.textContent='Esitystila ei muuta agentteja, malleja, evidenssikynnystä eikä julkaisupäätöstä.';}
  }
  function renderHistory(){const nodes=events.slice(-MAX_EVENTS).reverse().map(item=>{const li=document.createElement('li'),time=document.createElement('span'),factLine=document.createElement('strong');time.textContent=item.time;factLine.textContent=item.fact;li.append(time,factLine);return li;});history.replaceChildren(...nodes);}
  function emit(raw={}){
    const code=safeEventCode(raw.code);
    const detail=safeDetail(raw.detail||{}),factText=factualLine(code,detail),copy=copyFor(code,mode,detail);
    root.dataset.event=code;root.dataset.stage=detail.stage||'';
    wall.hidden=code!=='API_ERROR';
    raccoonPeer.hidden=code!=='AGENT_DISAGREEMENT';
    if(mode==='quiet')comment.textContent='';else comment.textContent=copy;
    fact.textContent=factText;
    raccoon.setAttribute('aria-label',`${stageLabel(detail)} · ${code}`);
    events.push({code,fact:factText,time:new Date().toLocaleTimeString('fi-FI',{hour:'2-digit',minute:'2-digit',second:'2-digit'})});
    if(events.length>MAX_EVENTS*2)events=events.slice(-MAX_EVENTS);
    renderHistory();
  }
  qa('[data-machine-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.machineMode)));
  window.addEventListener('anomancer:telemetry',event=>emit(event.detail||{}));
  window.anomancerMachineRoom={emit,setMode,getMode:()=>mode,safeDetail};
  setMode(mode,{announce:false});
  comment.textContent=mode==='quiet'?'':mode==='oe'?'Karvainen laatupäällikkö odottaa ajoa.':'Konehuone odottaa ajoa.';
  fact.textContent='Ei ajoa · telemetria näyttää vain turvallisia tilatapahtumia.';
}
