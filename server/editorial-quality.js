const RULES=[
  {
    code:'EDITORIAL_META_STRICTNESS',severity:'error',
    pattern:/\b(?:absurdin\s+(?:tiukka|tarkka|yksinkertainen)|tiukka\s+(?:argumentti|tulkinta|versio|johtopäätös|esimerkki)|sama\s+tiukkuus)\b/giu,
    message:'Toimituksen työohje näkyy proosassa. Tee perustelusta täsmällinen nimeämättä sitä tiukaksi tai absurdiksi.',
  },
  {
    code:'EDITORIAL_SOURCE_DEBT',severity:'error',
    pattern:/\b(?:kandidaattilähde|lähde-ehdokas)\b/giu,
    message:'Julkaisutekstissä näkyy toimituksen sisäinen lähdestatus. Varmista lähde tai poista workflow-leima julkaisuproosasta.',
  },
  {
    code:'EDITORIAL_EPISTEMIC_UNCERTAINTY',severity:'warning',
    pattern:/\b(?:toistaiseksi\s+varmistamaton|ei\s+ole\s+(?:tässä\s+yhteydessä\s+)?pystytty\s+vahvistamaan)\b/giu,
    message:'Teksti ilmaisee avoimen epävarmuuden. Tämä ei estä julkaisua; varmista, että muotoilu vastaa evidenssin tilaa.',
  },
  {
    code:'EDITORIAL_PIPELINE_VOICE',severity:'error',
    pattern:/\b(?:kriitikkoagentti|äänieditori|yleisöadapteri|orkesterin\s+(?:ohje|työohje|vaihe)|agentin\s+työohje)\b/giu,
    message:'Agentti- tai orkesteriprosessin sisäinen sanasto ei kuulu valmiiseen artikkeliin.',
  },
];

function count(text,pattern){return [...String(text||'').matchAll(pattern)].length;}

export function editorialQualityReport(post={}){
  const title=String(post.title||'').trim(),body=String(post.body||'').trim(),issues=[];
  for(const rule of RULES){
    const matches=[...body.matchAll(rule.pattern)];
    if(matches.length)issues.push({code:rule.code,severity:rule.severity,count:matches.length,message:rule.message,excerpt:String(matches[0][0]).slice(0,120)});
  }
  const contrastCount=count(body,/\bei\b[^\n.!?]{0,180}\bvaan\b/giu)+count(body,/\bnot\b[^\n.!?]{0,180}\bbut\b/giu);
  if(contrastCount>7)issues.push({code:'EDITORIAL_CONTRAST_CADENCE',severity:'error',count:contrastCount,message:'“Ei X vaan Y” -vastakkainasettelu toistuu niin usein, että tekstille syntyy koneellinen rytmi.',excerpt:'ei … vaan …'});
  else if(contrastCount>4)issues.push({code:'EDITORIAL_CONTRAST_CADENCE',severity:'warning',count:contrastCount,message:'“Ei X vaan Y” -vastakkainasettelu toistuu. Vaihtele perustelun rakennetta ennen julkaisua.',excerpt:'ei … vaan …'});
  const conclusionCount=count(body,/\b(?:tästä\s+seuraa|tämä\s+ero\s+on\s+tärkeä|kyse\s+ei\s+ole|kysymys\s+ei\s+(?:siis\s+)?ole)\b/giu);
  if(conclusionCount>5)issues.push({code:'EDITORIAL_CONCLUSION_CADENCE',severity:'error',count:conclusionCount,message:'Sama johtopäätöksen johdantokaava toistuu liian usein.',excerpt:'tästä seuraa / tämä ero / kyse ei ole'});
  else if(conclusionCount>3)issues.push({code:'EDITORIAL_CONCLUSION_CADENCE',severity:'warning',count:conclusionCount,message:'Johtopäätösten johdantokaava alkaa toistua. Poista metapuhetta ja anna päätelmän kantaa.',excerpt:'tästä seuraa / tämä ero / kyse ei ole'});
  if(title.length>110)issues.push({code:'EDITORIAL_TITLE_LENGTH',severity:title.length>140?'error':'warning',count:title.length,message:'Otsikko on pitkä. Nimeä artikkelin varsinainen pääaihe ja siirrä sivuteema ingressiin.',excerpt:title.slice(0,120)});
  return {ok:!issues.some(issue=>issue.severity==='error'),issues};
}

export function editorialQualityWarnings(post={}){
  return editorialQualityReport(post).issues.map(issue=>`[${issue.code}] ${issue.message} (${issue.count})`);
}

export function assertEditorialPublishQuality(post={}){
  const report=editorialQualityReport(post),errors=report.issues.filter(issue=>issue.severity==='error');
  if(errors.length){
    const error=new Error(`Toimituksellinen julkaisuportti pysäytti tekstin: ${errors.map(issue=>issue.message).join(' ')}`);
    error.statusCode=400;error.code='EDITORIAL_QUALITY';error.issues=report.issues;throw error;
  }
  return report;
}
