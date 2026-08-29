import assert from 'node:assert/strict';
import handler from '../../api/contact.js';

function mockReq(body={}, headers={}) {
  return {
    method: 'POST',
    headers: { host: 'anomancer.com', origin: 'https://anomancer.com', ...headers },
    body
  };
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(k,v){ this.headers[k.toLowerCase()] = v; },
    end(v=''){ this.body = v; }
  };
}

async function run(name, fn) {
  try { await fn(); console.log('✓', name); }
  catch (err) { console.error('✗', name); throw err; }
}

const valid = () => ({
  name: 'Testi',
  email: 'test@example.com',
  subject: 'Testi',
  message: 'Tämä on riittävän pitkä testiviesti.',
  company: '',
  startedAt: Date.now() - 5000,
  language: 'fi'
});

await run('honeypot ei lähetä viestiä', async () => {
  let called = false;
  globalThis.fetch = async () => { called = true; return { ok:true, status:200 }; };
  const res = mockRes();
  await handler(mockReq({ ...valid(), company:'spam inc' }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(called, false);
});

await run('väärä origin torjutaan', async () => {
  const res = mockRes();
  await handler(mockReq(valid(), { origin:'https://evil.example' }), res);
  assert.equal(res.statusCode, 403);
});

await run('virheellinen sähköposti torjutaan', async () => {
  const res = mockRes();
  await handler(mockReq({ ...valid(), email:'nope' }), res);
  assert.equal(res.statusCode, 400);
});

await run('tuotanto fail-closed ilman jaettua rate limit -tallennusta', async () => {
  process.env.VERCEL_ENV='production';
  delete process.env.CONTACT_RATE_LIMIT_REST_URL;
  delete process.env.CONTACT_RATE_LIMIT_REST_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  const res=mockRes();
  await handler(mockReq(valid(),{'x-forwarded-for':`test-rate-missing-${Math.random()}`}),res);
  assert.equal(res.statusCode,503);
  assert.equal(JSON.parse(res.body).error,'RATE_LIMIT_UNAVAILABLE');
  delete process.env.VERCEL_ENV;
});

await run('Upstash-rate limit käyttää hajautettua tunnistetta eikä raakaa IP-osoitetta', async () => {
  process.env.VERCEL_ENV='production';
  process.env.UPSTASH_REDIS_REST_URL='https://rate.example';
  process.env.UPSTASH_REDIS_REST_TOKEN='rate_test';
  process.env.RESEND_API_KEY='re_test';
  const ip='203.0.113.42',requests=[];
  globalThis.fetch=async(url,options)=>{requests.push({url,options});return url==='https://rate.example'?{ok:true,json:async()=>({result:1})}:{ok:true,status:200};};
  const res=mockRes();await handler(mockReq(valid(),{'x-forwarded-for':ip}),res);
  assert.equal(res.statusCode,200);
  assert.equal(requests[0].url,'https://rate.example');
  assert.equal(requests[0].options.body.includes(ip),false);
  delete process.env.VERCEL_ENV;delete process.env.UPSTASH_REDIS_REST_URL;delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

await run('puuttuva Resend-avain fail-closed', async () => {
  delete process.env.RESEND_API_KEY;
  const res = mockRes();
  await handler(mockReq(valid(), { 'x-forwarded-for':`test-missing-${Math.random()}` }), res);
  assert.equal(res.statusCode, 503);
});

await run('kelvollinen viesti lähetetään serveriltä', async () => {
  process.env.RESEND_API_KEY = 're_test';
  process.env.CONTACT_TO_EMAIL = 'owner@example.com';
  process.env.CONTACT_FROM_EMAIL = 'ANOMANCER <onboarding@resend.dev>';
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok:true, status:200 };
  };
  const res = mockRes();
  await handler(mockReq(valid(), { 'x-forwarded-for':`test-ok-${Math.random()}` }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(request.url, 'https://api.resend.com/emails');
  const payload = JSON.parse(request.options.body);
  assert.equal(payload.reply_to, 'test@example.com');
  assert.deepEqual(payload.to, ['owner@example.com']);
  assert.equal(payload.text.includes('Tämä on riittävän pitkä testiviesti.'), true);
});

console.log('✓ Contact Gate 7/7');
