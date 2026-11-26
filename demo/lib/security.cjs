"use strict";
const configured=e=>Boolean(/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(e.CHINGU_SUPABASE_URL||"")&&e.CHINGU_SUPABASE_PUBLISHABLE_KEY);
const quotaConfigured=e=>configured(e)&&Boolean(e.CHINGU_SUPABASE_SERVICE_KEY);
const originOK=(req,e)=>!req.headers.origin||req.headers.origin===(e.CHINGU_ORIGIN||"https://falvorn-chingu.vercel.app");
const cookie="__Host-chingu-session";
const bodyOf=(req,max=70000)=>{let b=req.body;if(typeof b==="string"){if(b.length>max)throw Error("large");b=JSON.parse(b)}if(!b||typeof b!=="object"||Array.isArray(b)||JSON.stringify(b).length>max)throw Error("invalid");return b};
async function supa(e,f,path,opts={},token=null,admin=false){if(!configured(e))throw Error("unconfigured");const key=admin?e.CHINGU_SUPABASE_SERVICE_KEY:e.CHINGU_SUPABASE_PUBLISHABLE_KEY;return f(e.CHINGU_SUPABASE_URL+path,{...opts,headers:{apikey:key,...(token||admin?{Authorization:"Bearer "+(token||key)}:{}),"Content-Type":"application/json",...opts.headers},redirect:"error",signal:AbortSignal.timeout(5000)})}
async function identity(e,f,req){const t=String(req.headers.cookie||"").split(";").map(s=>s.trim()).find(s=>s.startsWith(cookie+"="))?.slice(cookie.length+1);if(!configured(e)||!t||t.length>4096)return null;try{const r=await supa(e,f,"/auth/v1/user",{},t);if(!r.ok)return null;const u=await r.json();return u.id&&!u.is_anonymous?{id:u.id,email:u.email,token:t}:null}catch{return null}}
async function reserve(e,f,units){const r=await supa(e,f,"/rest/v1/rpc/chingu_reserve_quota",{method:"POST",body:JSON.stringify({p_units:units,p_daily:Math.min(500,Math.max(6,Number(e.CHINGU_DAILY_CALL_CAP)||100))})},null,true);if(!r.ok)throw Error("quota unavailable");return await r.json()===true}
module.exports={configured,quotaConfigured,originOK,cookie,bodyOf,supa,identity,reserve};
