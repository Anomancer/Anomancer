export function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export async function readJson(req, maxBytes = 1_500_000) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
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
  const origin = req.headers?.origin;
  if (!origin) return true;
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
  const proto = req.headers?.['x-forwarded-proto'] || 'https';
  try { return new URL(origin).origin === `${proto}://${host}`; }
  catch { return false; }
}

export function method(req, allowed) {
  if (allowed.includes(req.method)) return true;
  return false;
}
