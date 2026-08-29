import crypto from 'node:crypto';

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 3;
const MAX_BODY_BYTES = 20_000;
const MIN_FILL_MS = 2_500;
const MAX_FILL_MS = 2 * 60 * 60 * 1000;

const rateStore = globalThis.__anomancerContactRateStore || new Map();
globalThis.__anomancerContactRateStore = rateStore;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.end(JSON.stringify(body));
}

function normalize(value, max = 200) {
  return String(value ?? '').replace(/\r/g, '').trim().slice(0, max);
}

function validEmail(value) {
  if (!value || value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clientIp(req) {
  const raw = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  return String(raw).split(',')[0].trim().slice(0, 96);
}

function sameOrigin(req) {
  const origin=String(req.headers.origin||'').trim();
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'').trim().toLowerCase();
  const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim().toLowerCase();
  if(!origin||!host||/[\s\x00-\x1f]/.test(host)||!['http','https'].includes(proto))return false;
  try {
    const parsed=new URL(origin);
    return (parsed.protocol==='http:'||parsed.protocol==='https:')&&parsed.origin===`${proto}://${host}`;
  } catch { return false; }
}


function memoryRateAllowed(ip, now) {
  const entries = (rateStore.get(ip) || []).filter(ts => now - ts < RATE_WINDOW_MS);
  if (entries.length >= RATE_MAX) {
    rateStore.set(ip, entries);
    return false;
  }
  entries.push(now);
  rateStore.set(ip, entries);
  if (rateStore.size > 500) {
    for (const [key, list] of rateStore) {
      const fresh = list.filter(ts => now - ts < RATE_WINDOW_MS);
      if (fresh.length) rateStore.set(key, fresh);
      else rateStore.delete(key);
    }
  }
  return true;
}

function sharedRateConfig(){
  const url=String(process.env.CONTACT_RATE_LIMIT_REST_URL||process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL||'').replace(/\/$/,'');
  const token=String(process.env.CONTACT_RATE_LIMIT_REST_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN||'');
  return url&&token?{url,token}:null;
}

async function rateAllowed(ip,now){
  const config=sharedRateConfig();
  const production=process.env.VERCEL_ENV==='production'||process.env.NODE_ENV==='production';
  if(!config)return production?{allowed:false,unavailable:true}:{allowed:memoryRateAllowed(ip,now),shared:false};
  const bucket=Math.floor(now/RATE_WINDOW_MS),salt=process.env.CONTACT_RATE_LIMIT_SALT||process.env.CONTACT_TO_EMAIL||'anomancer-contact';
  const identity=crypto.createHash('sha256').update(`${salt}\0${ip}`).digest('hex');
  const key=`anomancer:contact:${bucket}:${identity}`;
  const script='local c=redis.call("INCR",KEYS[1]);if c==1 then redis.call("PEXPIRE",KEYS[1],ARGV[1]) end;return c';
  try{
    const response=await fetch(config.url,{method:'POST',headers:{Authorization:`Bearer ${config.token}`,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',script,'1',key,String(RATE_WINDOW_MS)])});
    if(!response.ok)throw new Error(`rate-store-${response.status}`);
    const payload=await response.json();const count=Number(payload?.result);
    if(!Number.isFinite(count))throw new Error('rate-store-invalid');
    return{allowed:count<=RATE_MAX,shared:true};
  }catch(error){
    console.error('Anomancer contact rate store unavailable',error?.message||'Error');
    return{allowed:false,unavailable:true};
  }
}

function buildMessage({ name, email, subject, message, language }) {
  const who = name || '(ei nimeä)';
  return [
    'Anomancer · YHTEYDENOTTO',
    '',
    `Nimi: ${who}`,
    `Sähköposti: ${email}`,
    `Aihe: ${subject || '(ei erillistä aihetta)'}`,
    `Kieli: ${language || 'fi'}`,
    '',
    'Viesti:',
    message,
    '',
    '---',
    'Lähetetty Anomancerin yhteydenottolomakkeella.',
    'Tietoja ei tallenneta Anomancerissa uutiskirjettä tai markkinointia varten.'
  ].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  if (!sameOrigin(req)) {
    return json(res, 403, { ok: false, error: 'ORIGIN_DENIED' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength && contentLength > MAX_BODY_BYTES) {
    return json(res, 413, { ok: false, error: 'MESSAGE_TOO_LARGE' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  let encodedBody='';
  try{encodedBody=JSON.stringify(body);}catch{return json(res,400,{ok:false,error:'BODY_INVALID'});}
  if(Buffer.byteLength(encodedBody)>MAX_BODY_BYTES)return json(res,413,{ok:false,error:'MESSAGE_TOO_LARGE'});

  // Honeypot. Botille näytetään onnistuminen, mutta mitään ei lähetetä.
  if (normalize(body.company, 120)) {
    return json(res, 200, { ok: true });
  }

  const now = Date.now();
  const startedAt = Number(body.startedAt || 0);
  if (!Number.isFinite(startedAt) || startedAt <= 0 || now - startedAt < MIN_FILL_MS || now - startedAt > MAX_FILL_MS) {
    return json(res, 400, { ok: false, error: 'FORM_TIMING_INVALID' });
  }

  const name = normalize(body.name, 120);
  const email = normalize(body.email, 254).toLowerCase();
  const subject = normalize(body.subject, 160).replace(/\n/g, ' ');
  const message = normalize(body.message, 6000);
  const language = normalize(body.language, 8) || 'fi';

  if (!validEmail(email)) {
    return json(res, 400, { ok: false, error: 'EMAIL_INVALID' });
  }
  if (message.length < 10) {
    return json(res, 400, { ok: false, error: 'MESSAGE_TOO_SHORT' });
  }

  const ip = clientIp(req);
  const rate=await rateAllowed(ip, now);
  if(rate.unavailable){
    return json(res,503,{ok:false,error:'RATE_LIMIT_UNAVAILABLE'});
  }
  if (!rate.allowed) {
    return json(res, 429, { ok: false, error: 'RATE_LIMITED' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || 'alakhapositu@proton.me';
  const from = process.env.CONTACT_FROM_EMAIL || 'Anomancer <contact@anomancer.com>';

  if (!apiKey) {
    return json(res, 503, { ok: false, error: 'CONTACT_NOT_CONFIGURED' });
  }

  const mailSubject = `[Anomancer] ${subject || 'Uusi yhteydenotto'}`.slice(0, 200);
  const payload = {
    from,
    to: [to],
    reply_to: email,
    subject: mailSubject,
    text: buildMessage({ name, email, subject, message, language })
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Anomancer-Contact/16.3.5',
        'Idempotency-Key': `anomancer-contact-${now}-${Math.random().toString(36).slice(2, 10)}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // Viestin sisältöä ei logata.
      console.error('Anomancer contact delivery failed', response.status);
      return json(res, 502, { ok: false, error: 'DELIVERY_FAILED' });
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('Anomancer contact transport failed', error?.name || 'Error');
    return json(res, 502, { ok: false, error: 'DELIVERY_FAILED' });
  }
}
