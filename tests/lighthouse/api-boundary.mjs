import assert from 'node:assert/strict';

import handler from '../../api/lab/intent.js';
import {
  lighthouseEnvironment,
  lighthouseLabAllowed,
  lighthouseLabRequiresAuth
} from '../../core/authority/lab-policy.js';
import {
  csrfForSession,
  signSession,
  verifySession
} from '../../server/auth.js';

const SESSION_SECRET='lighthouse-test-session-secret-0123456789abcdef';

function request({method='POST',body={},headers={}}={}){
  return {
    method,
    url:'/api/lab/intent',
    body,
    headers:{
      origin:'https://preview.example',
      host:'preview.example',
      'x-forwarded-proto':'https',
      'content-type':'application/json',
      'x-real-ip':'192.0.2.1',
      ...headers
    }
  };
}

function response(){
  return {
    statusCode:200,
    headers:{},
    body:'',
    setHeader(name,value){
      this.headers[String(name).toLowerCase()]=String(value);
    },
    end(value=''){
      this.body+=String(value);
    }
  };
}

async function call(options){
  const res=response();
  await handler(request(options),res);
  let body={};
  try{body=JSON.parse(res.body||'{}');}catch{}
  return {res,body};
}

function setEnvironment(values={}){
  for(const key of [
    'VERCEL_ENV',
    'NODE_ENV',
    'ANOMANCER_LIGHTHOUSE_APP',
    'ANOMANCER_LIGHTHOUSE_LAB',
    'ADMIN_SESSION_SECRET'
  ]){
    if(Object.hasOwn(values,key))process.env[key]=values[key];
    else delete process.env[key];
  }
}

const original=Object.fromEntries(
  ['VERCEL_ENV','NODE_ENV','ANOMANCER_LIGHTHOUSE_APP','ANOMANCER_LIGHTHOUSE_LAB','ADMIN_SESSION_SECRET']
    .map(key=>[key,process.env[key]])
);

try{
  assert.equal(lighthouseEnvironment({VERCEL_ENV:'preview'}),'preview');
  assert.equal(lighthouseEnvironment({NODE_ENV:'production'}),'production');
  assert.equal(lighthouseLabAllowed({VERCEL_ENV:'development'}),true);
  assert.equal(lighthouseLabAllowed({VERCEL_ENV:'preview'}),true);
  assert.equal(lighthouseLabAllowed({VERCEL_ENV:'production'}),true);
  assert.equal(
    lighthouseLabAllowed({VERCEL_ENV:'preview',ANOMANCER_LIGHTHOUSE_APP:'0'}),
    false
  );
  assert.equal(lighthouseLabRequiresAuth({VERCEL_ENV:'preview'}),true);
  assert.equal(lighthouseLabRequiresAuth({VERCEL_ENV:'development'}),false);

  setEnvironment({VERCEL_ENV:'production'});
  let result=await call();
  assert.equal(result.res.statusCode,401);
  assert.equal(result.body.error,'AUTH');

  setEnvironment({VERCEL_ENV:'production',ANOMANCER_LIGHTHOUSE_APP:'0'});
  result=await call();
  assert.equal(result.res.statusCode,404);

  setEnvironment({
    VERCEL_ENV:'preview',
    ADMIN_SESSION_SECRET:SESSION_SECRET
  });

  result=await call({headers:{origin:'https://evil.example'}});
  assert.equal(result.res.statusCode,403);
  assert.equal(result.body.error,'ORIGIN_DENIED');

  result=await call();
  assert.equal(result.res.statusCode,401);
  assert.equal(result.body.error,'AUTH');

  const token=signSession(SESSION_SECRET,{nonce:'lighthouse-api-test'});
  const session=verifySession(SESSION_SECRET,token);
  const cookie=`anomancer_admin=${encodeURIComponent(token)}`;

  result=await call({headers:{cookie}});
  assert.equal(result.res.statusCode,403);
  assert.equal(result.body.error,'CSRF');

  const csrf=csrfForSession(SESSION_SECRET,session);
  const authenticated={
    cookie,
    'x-csrf-token':csrf,
    'x-real-ip':'192.0.2.2'
  };

  result=await call({headers:authenticated});
  assert.equal(result.res.statusCode,400);
  assert.equal(result.body.code,'LIGHTHOUSE_INTENT_EMPTY');

  result=await call({
    headers:{...authenticated,'content-type':'text/plain'}
  });
  assert.equal(result.res.statusCode,415);
  assert.equal(result.body.error,'CONTENT_TYPE');

  result=await call({
    body:{text:'x'.repeat(70_000)},
    headers:{...authenticated,'x-real-ip':'192.0.2.3'}
  });
  assert.equal(result.res.statusCode,413);

  setEnvironment({VERCEL_ENV:'development'});
  result=await call({headers:{'x-real-ip':'192.0.2.4'}});
  assert.equal(result.res.statusCode,400);

  const vercel=JSON.parse(
    await import('node:fs').then(({default:fs})=>fs.readFileSync('vercel.json','utf8'))
  );
  assert.equal(vercel.git?.deploymentEnabled,true);
  assert.ok(vercel.headers.some(item=>item.source==='/api/lab/(.*)'));

  console.log('✓ Lighthouse API boundary · Vercel availability, auth, CSRF, origin and size limits');
}finally{
  for(const [key,value] of Object.entries(original)){
    if(value===undefined)delete process.env[key];
    else process.env[key]=value;
  }
}
