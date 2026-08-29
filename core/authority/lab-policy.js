const REMOTE_ENVIRONMENTS=new Set(['preview','production']);

export function lighthouseEnvironment(env=process.env){
  const vercelEnvironment=String(env.VERCEL_ENV||'').trim().toLowerCase();
  if(vercelEnvironment)return vercelEnvironment;
  return String(env.NODE_ENV||'').trim().toLowerCase()==='production'
    ?'production'
    :'development';
}

export function lighthouseLabAllowed(env=process.env){
  const override=String(env.ANOMANCER_LIGHTHOUSE_LAB||'').trim();
  if(override==='0')return false;
  if(override==='1')return true;
  return !REMOTE_ENVIRONMENTS.has(lighthouseEnvironment(env));
}

export function lighthouseLabRequiresAuth(env=process.env){
  return REMOTE_ENVIRONMENTS.has(lighthouseEnvironment(env));
}
