import crypto from 'node:crypto';

export const COOKIE_NAME = 'anomancer_admin';
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}
function fromB64url(input) {
  return Buffer.from(String(input), 'base64url').toString('utf8');
}
export function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export function hashPassword(password, { salt = crypto.randomBytes(16).toString('hex'), cost = 16384, blockSize = 8, parallelization = 1 } = {}) {
  if (!password || String(password).length < 12) throw new Error('Salasanan pitää olla vähintään 12 merkkiä.');
  const key = crypto.scryptSync(String(password), salt, 64, { N: cost, r: blockSize, p: parallelization, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${cost}$${blockSize}$${parallelization}$${salt}$${key.toString('hex')}`;
}

export function verifyPassword(password, encoded) {
  try {
    const [kind, n, r, p, salt, hex] = String(encoded || '').split('$');
    if (kind !== 'scrypt' || !salt || !hex || !/^[a-f0-9]+$/i.test(hex) || hex.length % 2) return false;
    const N=Number(n),block=Number(r),parallel=Number(p);
    if(!Number.isInteger(N)||N<16384||N>262144||(N&(N-1))!==0) return false;
    if(!Number.isInteger(block)||block<1||block>32||!Number.isInteger(parallel)||parallel<1||parallel>8) return false;
    const expected = Buffer.from(hex, 'hex');
    if(expected.length<32||expected.length>128)return false;
    const actual = crypto.scryptSync(String(password || ''), salt, expected.length, {
      N, r:block, p:parallel, maxmem: 128 * 1024 * 1024,
    });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function signSession(secret, { now = Date.now(), ttlSeconds = SESSION_TTL_SECONDS, nonce = crypto.randomBytes(12).toString('hex') } = {}) {
  if (!secret || String(secret).length < 32) throw new Error('ADMIN_SESSION_SECRET puuttuu tai on liian lyhyt.');
  const payload = { v: 1, iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + ttlSeconds, nonce };
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySession(secret, token, { now = Date.now() } = {}) {
  try {
    if (!secret || !token) return null;
    const [body, sig] = String(token).split('.');
    if (!body || !sig) return null;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    if (!safeEqual(sig, expected)) return null;
    const payload = JSON.parse(fromB64url(body));
    if (payload.v !== 1 || !payload.exp || payload.exp <= Math.floor(now / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function csrfForSession(secret, session) {
  if (!secret || !session?.nonce) return '';
  return crypto.createHmac('sha256', secret).update(`csrf:${session.nonce}`).digest('base64url');
}

export function parseCookies(req) {
  const raw = req.headers?.cookie || '';
  const out = {};
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const name=part.slice(0,i).trim();if(!name)continue;
    try{out[name]=decodeURIComponent(part.slice(i+1).trim());}catch{}
  }
  return out;
}

export function getSession(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  return verifySession(process.env.ADMIN_SESSION_SECRET, token);
}

export function sessionCookie(token, { clear = false } = {}) {
  const secure = Boolean(process.env.VERCEL_ENV || process.env.NODE_ENV === 'production');
  const attrs = [
    `${COOKIE_NAME}=${clear ? '' : encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    ...(secure ? ['Secure'] : []),
    'SameSite=Strict',
    clear ? 'Max-Age=0' : `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  return attrs.join('; ');
}

export function requireCsrf(req, session) {
  const expected = csrfForSession(process.env.ADMIN_SESSION_SECRET, session);
  const actual = req.headers?.['x-csrf-token'] || '';
  return Boolean(expected) && safeEqual(actual, expected);
}
