export function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.end(JSON.stringify(data));
}

export async function readJson(req, maxBytes = 1_500_000) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    let encoded;
    try { encoded = JSON.stringify(req.body); }
    catch { throw Object.assign(new Error('Virheellinen JSON.'), { statusCode: 400 }); }
    if (Buffer.byteLength(encoded) > maxBytes) throw Object.assign(new Error('Payload too large'), { statusCode: 413 });
    return req.body;
  }
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > maxBytes) throw Object.assign(new Error('Payload too large'), { statusCode: 413 });
  }
  if (!body.trim()) return {};
  try { return JSON.parse(body); }
  catch { throw Object.assign(new Error('Virheellinen JSON.'), { statusCode: 400 }); }
}

export function sameOrigin(req) {
  const origin=String(req.headers?.origin||'').trim();
  if(!origin)return false;
  const host=String(req.headers?.['x-forwarded-host']||req.headers?.host||'').trim().toLowerCase();
  const proto=String(req.headers?.['x-forwarded-proto']||'https').split(',')[0].trim().toLowerCase();
  if(!host||/[\s\x00-\x1f]/.test(host)||!['http','https'].includes(proto))return false;
  try {
    const parsed=new URL(origin);
    return (parsed.protocol==='http:'||parsed.protocol==='https:')&&parsed.origin===`${proto}://${host}`;
  } catch { return false; }
}

export function method(req, allowed) {
  if (allowed.includes(req.method)) return true;
  return false;
}
