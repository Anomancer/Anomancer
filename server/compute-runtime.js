export const COMPUTE_RUNTIME_FORMAT='anomancer-compute-runtime/v1';

const MAX_DATASETS=3;
const MAX_ROWS=20000;
const MAX_COLUMNS=200;
const MAX_CHARS=1000000;
const clean=v=>String(v??'').trim();
const finite=Number.isFinite;
const round=(v,d=6)=>finite(v)?Math.round(v*10**d)/10**d:null;

function delimiter(text){
  const first=String(text||'').split(/\r?\n/,1)[0]||'';
  return [[',',(first.match(/,/g)||[]).length],['\t',(first.match(/\t/g)||[]).length],[';',(first.match(/;/g)||[]).length]]
    .sort((a,b)=>b[1]-a[1])[0][0];
}

function csvRows(text,sep){
  const out=[];let row=[],field='',quoted=false;
  const src=String(text||'').slice(0,MAX_CHARS);
  for(let i=0;i<src.length;i++){
    const ch=src[i];
    if(quoted){
      if(ch==='"'&&src[i+1]==='"'){field+='"';i++;}
      else if(ch==='"')quoted=false;
      else field+=ch;
      continue;
    }
    if(ch==='"'){quoted=true;continue;}
    if(ch===sep){row.push(field);field='';continue;}
    if(ch==='\n'){
      row.push(field.replace(/\r$/,''));field='';
      if(row.some(v=>clean(v)))out.push(row);
      row=[];
      if(out.length>=MAX_ROWS+1)break;
      continue;
    }
    field+=ch;
  }
  if(field||row.length){row.push(field.replace(/\r$/,''));if(row.some(v=>clean(v)))out.push(row);}
  return out;
}

function scalar(v){
  const s=clean(v);
  if(!s)return null;
  if(/^(true|false)$/i.test(s))return s.toLowerCase()==='true';
  if(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(s)){
    const n=Number(s);if(finite(n))return n;
  }
  return s;
}

function headers(raw){
  const seen=new Map();
  return raw.slice(0,MAX_COLUMNS).map((v,i)=>{
    const base=clean(v)||`column_${i+1}`;
    const n=(seen.get(base)||0)+1;seen.set(base,n);
    return n===1?base:`${base}_${n}`;
  });
}

function fromCsv(material){
  const rows=csvRows(material.content,delimiter(material.content));
  if(rows.length<2)throw Object.assign(new Error('CSV-aineistossa ei ollut datarivejä.'),{code:'COMPUTE_CSV_EMPTY'});
  const names=headers(rows[0]);
  const data=rows.slice(1,MAX_ROWS+1).map(values=>Object.fromEntries(names.map((name,i)=>[name,scalar(values[i])])));
  return {id:clean(material.id)||clean(material.title)||'dataset',title:clean(material.title)||'CSV-aineisto',format:'csv',rows:data,truncated:rows.length>MAX_ROWS};
}

function fromJson(material){
  let value;try{value=JSON.parse(String(material.content||'').slice(0,MAX_CHARS));}
  catch{throw Object.assign(new Error('JSON-aineisto ei ollut kelvollista JSONia.'),{code:'COMPUTE_JSON_INVALID'});}
  let raw=Array.isArray(value)?value:null;
  if(!raw&&value&&typeof value==='object')raw=Object.values(value).find(v=>Array.isArray(v))||[value];
  if(!raw?.length)throw Object.assign(new Error('JSON-aineistossa ei ollut rivejä.'),{code:'COMPUTE_JSON_EMPTY'});
  const keys=[];const seen=new Set();
  for(const row of raw.slice(0,200)){
    if(!row||typeof row!=='object'||Array.isArray(row))continue;
    for(const key of Object.keys(row)){if(seen.size>=MAX_COLUMNS)break;if(!seen.has(key)){seen.add(key);keys.push(key);}}
  }
  if(!keys.length)throw Object.assign(new Error('JSON-aineisto ei ollut taulukkomuotoista.'),{code:'COMPUTE_JSON_TABULAR'});
  return {id:clean(material.id)||clean(material.title)||'dataset',title:clean(material.title)||'JSON-aineisto',format:'json',rows:raw.slice(0,MAX_ROWS).map(row=>Object.fromEntries(keys.map(key=>[key,row?.[key]??null]))),truncated:raw.length>MAX_ROWS};
}

function parseMaterial(material){
  const title=clean(material?.title).toLowerCase(),content=String(material?.content||'');
  if(!content.trim())return null;
  const limited={...material,content:content.slice(0,MAX_CHARS)};
  if(title.endsWith('.json')||/^\s*[\[{]/.test(content)){
    try{return fromJson(limited);}catch(error){if(title.endsWith('.json'))throw error;}
  }
  if(title.endsWith('.csv')||title.endsWith('.tsv')||title.endsWith('.txt')||/[,;\t]/.test(content.split(/\r?\n/,1)[0]||''))return fromCsv(limited);
  return null;
}

function names(dataset){
  const out=[];const seen=new Set();
  for(const row of dataset.rows.slice(0,200))for(const key of Object.keys(row||{}))if(!seen.has(key)&&seen.size<MAX_COLUMNS){seen.add(key);out.push(key);}
  return out;
}
function typeOf(values){
  const p=values.filter(v=>v!==null&&v!==undefined&&v!=='');
  if(!p.length)return 'empty';
  if(p.filter(v=>typeof v==='number'&&finite(v)).length/p.length>=.9)return 'number';
  if(p.filter(v=>typeof v==='boolean').length/p.length>=.9)return 'boolean';
  if(p.filter(v=>typeof v==='string'&&finite(Date.parse(v))).length/p.length>=.9)return 'date';
  return 'string';
}
function profile(dataset){
  const columns=names(dataset).map(name=>{
    const values=dataset.rows.map(r=>r?.[name]??null),present=values.filter(v=>v!==null&&v!==undefined&&v!=='');
    const uniq=[...new Set(present.slice(0,5000).map(v=>typeof v==='object'?JSON.stringify(v):String(v)))];
    return {name,type:typeOf(values),nonNull:present.length,missing:values.length-present.length,unique:uniq.length,sample:present.slice(0,5)};
  });
  return {datasetId:dataset.id,title:dataset.title,format:dataset.format,rowCount:dataset.rows.length,columnCount:columns.length,truncated:dataset.truncated===true,columns};
}
function nums(dataset,name){return dataset.rows.map(r=>r?.[name]).filter(v=>typeof v==='number'&&finite(v));}
function q(sorted,p){
  if(!sorted.length)return null;if(sorted.length===1)return sorted[0];
  const pos=(sorted.length-1)*p,b=Math.floor(pos),r=pos-b;
  return sorted[b+1]!==undefined?sorted[b]+r*(sorted[b+1]-sorted[b]):sorted[b];
}
function describe(values){
  if(!values.length)return null;
  const s=[...values].sort((a,b)=>a-b),n=s.length,sum=s.reduce((a,b)=>a+b,0),mean=sum/n;
  const variance=n>1?s.reduce((t,v)=>t+(v-mean)**2,0)/(n-1):0;
  return {count:n,min:round(s[0]),q1:round(q(s,.25)),median:round(q(s,.5)),q3:round(q(s,.75)),max:round(s.at(-1)),mean:round(mean),stddev:round(Math.sqrt(variance))};
}
function stats(dataset){return profile(dataset).columns.filter(c=>c.type==='number').slice(0,25).map(c=>({name:c.name,...describe(nums(dataset,c.name))}));}
function corr(dataset,a,b){
  const pairs=dataset.rows.map(r=>[r?.[a],r?.[b]]).filter(([x,y])=>typeof x==='number'&&finite(x)&&typeof y==='number'&&finite(y));
  if(pairs.length<3)return null;
  const mx=pairs.reduce((s,p)=>s+p[0],0)/pairs.length,my=pairs.reduce((s,p)=>s+p[1],0)/pairs.length;
  let num=0,dx=0,dy=0;for(const [x,y] of pairs){const ax=x-mx,ay=y-my;num+=ax*ay;dx+=ax*ax;dy+=ay*ay;}
  return dx&&dy?{a,b,n:pairs.length,r:round(num/Math.sqrt(dx*dy))}:null;
}
function correlations(dataset){
  const n=profile(dataset).columns.filter(c=>c.type==='number').slice(0,12).map(c=>c.name),out=[];
  for(let i=0;i<n.length;i++)for(let j=i+1;j<n.length;j++){const c=corr(dataset,n[i],n[j]);if(c)out.push(c);}
  return out.sort((a,b)=>Math.abs(b.r)-Math.abs(a.r)).slice(0,20);
}
function anomaly(dataset){
  const out=[];
  for(const c of profile(dataset).columns.filter(c=>c.type==='number').slice(0,25)){
    const v=nums(dataset,c.name).sort((a,b)=>a-b);if(v.length<4)continue;
    const q1=q(v,.25),q3=q(v,.75),iqr=q3-q1,low=q1-1.5*iqr,high=q3+1.5*iqr,sample=[];
    dataset.rows.forEach((r,i)=>{const x=r?.[c.name];if(typeof x==='number'&&finite(x)&&(x<low||x>high)&&sample.length<10)sample.push({row:i+1,value:x});});
    if(sample.length)out.push({column:c.name,method:'iqr-1.5',lower:round(low),upper:round(high),sample});
  }
  return out;
}
function compare(dataset){
  const p=profile(dataset),cat=p.columns.find(c=>c.type==='string'&&c.unique>=2&&c.unique<=12),numeric=p.columns.filter(c=>c.type==='number').slice(0,6);
  if(!cat||!numeric.length)return {available:false,reason:'Sopivaa ryhmittelysaraketta ja numeerista mittaria ei löytynyt.'};
  const groups=new Map();
  for(const row of dataset.rows){const key=clean(row?.[cat.name]);if(!key)continue;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
  return {available:true,groupBy:cat.name,groups:[...groups.entries()].slice(0,12).map(([group,rows])=>({group,count:rows.length,metrics:numeric.map(c=>({name:c.name,...(describe(rows.map(r=>r?.[c.name]).filter(v=>typeof v==='number'&&finite(v)))||{count:0})}))}))};
}
function series(dataset){
  const p=profile(dataset),date=p.columns.find(c=>c.type==='date'),numeric=p.columns.filter(c=>c.type==='number').slice(0,8);
  if(!date||!numeric.length)return {available:false,reason:'Päivämääräsaraketta ja numeerista sarjaa ei löytynyt.'};
  const rows=dataset.rows.map(r=>({date:Date.parse(r?.[date.name]),row:r})).filter(x=>finite(x.date)).sort((a,b)=>a.date-b.date);
  if(rows.length<2)return {available:false,reason:'Aikasarjassa oli liian vähän havaintoja.'};
  return {available:true,dateColumn:date.name,series:numeric.map(c=>{
    const pts=rows.map(x=>({date:x.date,value:x.row?.[c.name]})).filter(x=>typeof x.value==='number'&&finite(x.value));if(pts.length<2)return null;
    const first=pts[0],last=pts.at(-1),change=last.value-first.value,n=pts.length,mx=(n-1)/2,my=pts.reduce((s,p)=>s+p.value,0)/n;
    let num=0,den=0;for(let i=0;i<n;i++){num+=(i-mx)*(pts[i].value-my);den+=(i-mx)**2;}
    return {name:c.name,points:n,first:{date:new Date(first.date).toISOString(),value:first.value},last:{date:new Date(last.date).toISOString(),value:last.value},absoluteChange:round(change),percentChange:first.value?round(change/Math.abs(first.value)*100):null,slopePerObservation:den?round(num/den):0};
  }).filter(Boolean)};
}
function visual(dataset){
  const p=profile(dataset),date=p.columns.find(c=>c.type==='date'),numeric=p.columns.filter(c=>c.type==='number'),cat=p.columns.find(c=>c.type==='string'&&c.unique>=2&&c.unique<=30),specs=[];
  if(date&&numeric.length)specs.push({kind:'line',x:date.name,y:numeric[0].name,purpose:'Aikasarjan kehitys'});
  if(cat&&numeric.length)specs.push({kind:'bar',x:cat.name,y:numeric[0].name,aggregate:'mean',purpose:'Ryhmien vertailu'});
  if(numeric.length)specs.push({kind:'histogram',x:numeric[0].name,purpose:'Jakauman tarkistus'});
  if(!specs.length)specs.push({kind:'table',columns:p.columns.slice(0,8).map(c=>c.name),purpose:'Rakenteinen aineistonäkymä'});
  return {rendererRequired:true,rendered:false,specs:specs.slice(0,3)};
}
function uncertainty(dataset){
  const p=profile(dataset),cells=Math.max(1,p.rowCount*p.columnCount),missing=p.columns.reduce((s,c)=>s+c.missing,0),notes=[];
  if(p.rowCount<30)notes.push('Aineistossa on alle 30 riviä.');
  if(missing/cells>.1)notes.push('Yli 10 % tarkastelluista soluista puuttuu.');
  if(p.truncated)notes.push(`Runtime rajasi analyysin enintään ${MAX_ROWS} riviin.`);
  return {rowCount:p.rowCount,missingRatio:round(missing/cells),truncated:p.truncated,notes};
}

export function createComputeSession(materials=[]){
  const datasets=[],parseErrors=[];
  for(const material of Array.isArray(materials)?materials:[]){
    if(datasets.length>=MAX_DATASETS)break;
    try{const d=parseMaterial(material);if(d)datasets.push(d);}catch(error){parseErrors.push({title:clean(material?.title)||'Aineisto',error:String(error.code||error.message)});}
  }
  if(!datasets.length)throw Object.assign(new Error('Compute Runtime ei löytänyt työtilasta CSV- tai taulukkomuotoista JSON-aineistoa.'),{code:'COMPUTE_NO_TABULAR_MATERIAL',details:parseErrors});
  return Object.freeze({format:COMPUTE_RUNTIME_FORMAT,datasets,parseErrors,limits:{maxDatasets:MAX_DATASETS,maxRows:MAX_ROWS,maxColumns:MAX_COLUMNS,maxChars:MAX_CHARS}});
}

function calculate(id,dataset){
  if(id==='data.profile')return profile(dataset);
  if(id==='statistics.describe')return {datasetId:dataset.id,columns:stats(dataset)};
  if(id==='data.anomaly.detect')return {datasetId:dataset.id,findings:anomaly(dataset)};
  if(id==='data.compare')return {datasetId:dataset.id,...compare(dataset)};
  if(id==='timeseries.analyze')return {datasetId:dataset.id,...series(dataset)};
  if(id==='data.visualize')return {datasetId:dataset.id,...visual(dataset)};
  if(id==='statistics.uncertainty')return {datasetId:dataset.id,...uncertainty(dataset)};
  if(id==='data.analyze')return {datasetId:dataset.id,profile:profile(dataset),descriptiveStatistics:stats(dataset),correlations:correlations(dataset),uncertainty:uncertainty(dataset)};
  throw Object.assign(new Error(`Compute-adapteri ei tue kyvykkyyttä ${id}.`),{code:'COMPUTE_CAPABILITY_UNSUPPORTED'});
}

export function executeComputeCapability(capabilityId,session){
  const id=clean(capabilityId),datasets=Array.isArray(session?.datasets)?session.datasets:[];
  if(!datasets.length)throw Object.assign(new Error('Compute-session aineisto puuttuu.'),{code:'COMPUTE_SESSION_EMPTY'});
  return Object.freeze({format:'anomancer-compute-artifact/v1',capabilityId:id,adapter:'compute.tabular.v1',deterministic:true,externalSideEffects:false,datasetCount:datasets.length,results:datasets.map(d=>calculate(id,d))});
}
