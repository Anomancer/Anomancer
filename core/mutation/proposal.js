export const MUTATION_PROPOSAL_FORMAT='anomancer-mutation-proposal/v1';
export const MUTATION_RUNTIME_FORMAT='anomancer-mutation-runtime/v1';

export const MUTATION_PROPOSAL_SYSTEM=`Olet Anomancer Lighthousen rajattu muutosvalmistelija.
Saat ehdottaa repository-muutosta vain käyttäjän tämän saman ajon aikana eksplisiittisesti nimeämiin ja runtime-kerroksen lukemiin tiedostoihin.

Palauta JSON täsmälleen tällä rakenteella:
{
  "summary": "mitä muutetaan ja miksi",
  "risk": "low | medium | high",
  "files": [
    {
      "path": "täsmälleen sallittu olemassa oleva repository-polku",
      "content": "tiedoston KOKO uusi UTF-8 sisältö",
      "rationale": "miksi tätä tiedostoa muutetaan"
    }
  ],
  "verification": ["miten muutos pitäisi tarkistaa"]
}

Säännöt:
- Älä ehdota uusia tiedostoja tässä vaiheessa.
- Älä ehdota tiedostoa, jota ei ole annettu sallittujen polkujen listassa.
- Älä poista tiedostoa tai palauta tyhjää sisältöä.
- Älä muuta salaisuuksia, tunnuksia, workflow-tiedostoja, autentikointia, deploy-politiikkaa tai hyväksyntäportteja.
- Älä väitä suorittaneesi muutosta. Tämä vaihe tuottaa vain tarkistettavan ehdotuksen.
- Säilytä jokaisen tiedoston kaikki muuttamattomat rivit täsmälleen alkuperäisessä muodossa, mukaan lukien sisennys, välilyönnit, lainausmerkit ja rivinvaihdot.
- Älä formatoi, uudelleensisennä, järjestele tai siisti ympäröivää koodia, ellei käyttäjä ole nimenomaisesti pyytänyt juuri formatointia.
- Jos korjaus tarvitsee yhden rivin lisäyksen tai vaihdon, KOKO uusi sisältö saa erota alkuperäisestä vain siinä välttämättömässä kohdassa.
- Jos et pysty säilyttämään muuttumatonta sisältöä tarkasti, palauta files tyhjänä mieluummin kuin laaja diff.
- Jos turvallista täsmällistä muutosta ei voi muodostaa, palauta files tyhjänä ja kerro summaryssa miksi.`;

const clean=(value,max=2000)=>String(value??'').replace(/\u0000/g,'').trim().slice(0,max);

function unique(values){return [...new Set(values.filter(Boolean))];}

export function normalizeMutationProposal(value={},options={}){
  const allowed=unique((Array.isArray(options.allowedPaths)?options.allowedPaths:[]).map(item=>clean(item,500)));
  const allowedSet=new Set(allowed);
  const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const files=[];
  let totalBytes=0;

  for(const item of Array.isArray(input.files)?input.files:[]){
    const path=clean(item?.path,500).replace(/\\/g,'/').replace(/^\.\//,'');
    if(!path||!allowedSet.has(path)||files.some(file=>file.path===path))continue;
    const content=String(item?.content??'').replace(/\u0000/g,'');
    const bytes=Buffer.byteLength(content,'utf8');
    if(!content.trim()||bytes>40_000||totalBytes+bytes>120_000)continue;
    totalBytes+=bytes;
    files.push({
      path,
      content,
      bytes,
      rationale:clean(item?.rationale,1200)
    });
    if(files.length>=4)break;
  }

  return {
    format:MUTATION_PROPOSAL_FORMAT,
    summary:clean(input.summary,2400),
    risk:['low','medium','high'].includes(String(input.risk||''))?String(input.risk):'high',
    files,
    verification:unique((Array.isArray(input.verification)?input.verification:[]).map(item=>clean(item,800))).slice(0,6),
    totalBytes
  };
}
