"use strict";
const {timingSafeEqual,createHash}=require("node:crypto");
const roles=["Personal planning and writing","Business deliverables and plans","Software engineering guidance","Research analysis of supplied evidence","Agent and workflow design","Organizational operations and policy drafts"];
const model="openai/gpt-oss-20b";
const hash=x=>createHash("sha256").update(x).digest();
function createHandler(env=process.env,fetcher=globalThis.fetch,clock=Date.now){
 let minute=-1,used=0,active=0;
 return async function handler(req,res){
 const send=(n,x)=>{res.setHeader("Cache-Control","no-store");return res.status(n).json(x);};
 const key=env.GROQ_API_KEY,code=env.CHINGU_DEMO_CODE;
 const enabled=Boolean(key&&code&&code.length>=16&&env.CHINGU_AI_ENABLED==="true");
 if(req.method==="GET")return send(200,{available:enabled});
 if(req.method!=="POST")return send(405,{error:"Method not allowed."});
 if(!enabled)return send(503,{error:"Hosted AI is not configured."});
 if(!String(req.headers["content-type"]||"").startsWith("application/json"))return send(415,{error:"JSON required."});
 if(Number(req.headers["content-length"]||0)>18000)return send(413,{error:"Request too large."});
 let body=req.body;try{if(typeof body==="string")body=JSON.parse(body);}catch{return send(400,{error:"Invalid JSON."});}
 if(!body||typeof body!=="object"||Array.isArray(body))return send(400,{error:"Invalid request."});
 const {agent,prompt,access}=body;
 if(typeof access!=="string"||access.length>256||!timingSafeEqual(hash(access),hash(code)))return send(401,{error:"Valid demo access code required."});
 if(!Number.isInteger(agent)||!roles[agent]||typeof prompt!=="string"||!prompt.trim()||prompt.length>4000)return send(400,{error:"Select an agent and enter 1–4000 characters."});
 const slot=Math.floor(clock()/60000);if(slot!==minute){minute=slot;used=0;}
 if(used>=6||active>=2)return send(429,{error:"Demo busy. Try again in a minute."});
 used++;active++;
 try{
 const result=await fetcher("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model,messages:[{role:"system",content:"You are CHINGU by Falvorn AI. Specialist role: "+roles[agent]+". Be helpful and accurate. You have no browser, files or external app access. Do not claim actions you have not performed. Distinguish evidence from uncertainty."},{role:"user",content:prompt.trim()}],max_completion_tokens:1024,reasoning_effort:"low",stream:false}),signal:AbortSignal.timeout(25000)});
 if(result.status===429)return send(429,{error:"The provider quota is busy or exhausted. Local workflows remain available."});
 if(!result.ok)return send(503,{error:"Hosted AI temporarily unavailable."});
 const data=await result.json();const answer=data?.choices?.[0]?.message?.content;
 if(typeof answer!=="string"||!answer.trim())return send(502,{error:"No answer returned. Try a shorter prompt."});
 return send(200,{text:answer.slice(0,16000),model});
 }catch{return send(503,{error:"Hosted AI temporarily unavailable."});}finally{active--;}
 };
}
module.exports=createHandler();module.exports.createHandler=createHandler;
