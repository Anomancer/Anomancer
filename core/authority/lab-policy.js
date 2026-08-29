export function lighthouseLabAllowed(env=process.env){
  return String(env.ANOMANCER_LIGHTHOUSE_LAB||'')==='1'||String(env.VERCEL_ENV||'development')!=='production';
}
