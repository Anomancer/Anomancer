export const SIGNAL_FORMAT='anomancer-signal/v1';

const TYPES=new Set(['user','url','rss','trend','github','web','system']);
const CLEAN=(v,max)=>String(v??'').trim().slice(0,max);

function first(...values){
  return values.map(v=>String(v??'').trim()).find(Boolean)||'';
}

export function normalizeSignal(value={}){
  const type=TYPES.has(String(value?.type||''))?String(value.type):'user';
  const title=CLEAN(value?.title,240);
  const summary=CLEAN(value?.summary,4000);
  const url=CLEAN(value?.url,2000);
  const source=CLEAN(first(value?.source,value?.provider,value?.origin),240);
  const detectedAt=CLEAN(value?.detectedAt,80);
  const tags=Array.isArray(value?.tags)
    ?value.tags.map(tag=>CLEAN(tag,80)).filter(Boolean).slice(0,12)
    :[];
  const payload=value?.payload&&typeof value.payload==='object'
    ?JSON.parse(JSON.stringify(value.payload))
    :null;

  return Object.freeze({
    format:SIGNAL_FORMAT,
    type,
    title,
    summary,
    url,
    source,
    tags,
    detectedAt,
    payload
  });
}

export function signalToIntent(signal={},options={}){
  const normalized=normalizeSignal(signal);
  const parts=[];
  if(normalized.title)parts.push(normalized.title);
  if(normalized.summary)parts.push(normalized.summary);
  if(normalized.url)parts.push(`Lähde: ${normalized.url}`);
  if(normalized.tags.length)parts.push(`Tunnisteet: ${normalized.tags.join(', ')}`);
  const text=CLEAN(first(options.text,parts.join('\n\n')),12000);
  if(!text){
    throw Object.assign(new Error('Signaali ei sisällä käsiteltävää tavoitetta.'),{statusCode:400,code:'LIGHTHOUSE_SIGNAL_EMPTY'});
  }
  return {
    text,
    signal:normalized,
    locale:String(options.locale||'fi').slice(0,16),
    history:Array.isArray(options.history)?options.history:[],
    workspace:options.workspace||{}
  };
}

export function signalIntentMetadata(signal){
  const normalized=normalizeSignal(signal);
  return Object.freeze({
    format:SIGNAL_FORMAT,
    type:normalized.type,
    title:normalized.title,
    source:normalized.source,
    url:normalized.url,
    tags:normalized.tags,
    detectedAt:normalized.detectedAt
  });
}
