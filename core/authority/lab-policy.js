const REMOTE_ENVIRONMENTS=new Set(['preview','production']);

export function lighthouseEnvironment(env=process.env){
  const vercelEnvironment=String(env.VERCEL_ENV||'').trim().toLowerCase();
  if(vercelEnvironment)return vercelEnvironment;
  return String(env.NODE_ENV||'').trim().toLowerCase()==='production'
    ?'production'
    :'development';
}

// Lighthouse is no longer an experimental Lab surface. The legacy LAB flag is
// intentionally retained as a compatibility switch while deployments migrate.
export function lighthouseAppAllowed(env=process.env){
  const appOverride=String(env.ANOMANCER_LIGHTHOUSE_APP||'').trim();
  if(appOverride==='0')return false;
  if(appOverride==='1')return true;

  const legacyOverride=String(env.ANOMANCER_LIGHTHOUSE_LAB||'').trim();
  if(legacyOverride==='0')return false;
  if(legacyOverride==='1')return true;

  return true;
}

export function lighthouseLabAllowed(env=process.env){
  return lighthouseAppAllowed(env);
}

export function lighthouseLabRequiresAuth(env=process.env){
  return REMOTE_ENVIRONMENTS.has(lighthouseEnvironment(env));
}
