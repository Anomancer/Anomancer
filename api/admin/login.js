import { verifyPassword, signSession, sessionCookie } from '../../server/auth.js';
import { json, readJson, sameOrigin } from '../../server/http.js';

export default async function handler(req,res) {
  if (req.method !== 'POST') return json(res,405,{ok:false,error:'METHOD'});
  if (!sameOrigin(req)) return json(res,403,{ok:false,error:'ORIGIN'});
  try {
    const { password='' } = await readJson(req, 20_000);
    const hash = process.env.ADMIN_PASSWORD_HASH || '';
    const secret = process.env.ADMIN_SESSION_SECRET || '';
    if (!hash || !secret) return json(res,503,{ok:false,error:'ADMIN_CONFIG',message:'Admin-ympäristömuuttujat puuttuvat.'});
    if (!verifyPassword(password, hash)) {
      await new Promise(r=>setTimeout(r,350));
      return json(res,401,{ok:false,error:'LOGIN'});
    }
    const token = signSession(secret);
    res.setHeader('Set-Cookie', sessionCookie(token));
    return json(res,200,{ok:true});
  } catch (e) {
    return json(res,e.statusCode||500,{ok:false,error:'LOGIN_ERROR',message:e.message});
  }
}
