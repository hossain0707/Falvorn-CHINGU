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
 const {agent,prompt,access,provider="groq",apiKey,consent}=body;
 if(typeof access!=="string"||access.length>256||!timingSafeEqual(hash(access),hash(code)))return send(401,{error:"Valid demo access code required."});
 if(!Number.isInteger(agent)||!roles[agent]||typeof prompt!=="string"||!prompt.trim()||prompt.length>4000)return send(400,{error:"Select an agent and enter 1–4000 characters."});
 if(!["groq","openai","anthropic"].includes(provider))return send(400,{error:"Unsupported provider."});
 if(provider!=="groq"&&(consent!==true||typeof apiKey!=="string"||apiKey.length>512||!/^sk-[A-Za-z0-9_-]{10,}$/.test(apiKey)||apiKey.startsWith("sk-ant-oat")))return send(400,{error:"Use a valid provider API key and explicitly authorize API billing. Subscription tokens are not accepted."});
 const slot=Math.floor(clock()/60000);if(slot!==minute){minute=slot;used=0;}
 if(used>=6||active>=2)return send(429,{error:"Demo busy. Try again in a minute."});
 used++;active++;
 try{
 const instructions="You are CHINGU by Falvorn AI. Specialist role: "+roles[agent]+". Be helpful and accurate. You have no browser, files or external app access. Do not claim actions you have not performed. Distinguish evidence from uncertainty.";
 let url,headers,payload,selectedModel;
 if(provider==="openai"){
 selectedModel="gpt-6.1-terra";url="https://api.openai.com/v1/responses";headers={Authorization:"Bearer "+apiKey,"Content-Type":"application/json"};payload={model:selectedModel,instructions,input:prompt.trim(),max_output_tokens:1024,store:false};
 }else if(provider==="anthropic"){
 selectedModel="claude-haiku-5-5";url="https://api.anthropic.com/v1/messages";headers={"x-api-key":apiKey,"anthropic-version":"2023-06-01","Content-Type":"application/json"};payload={model:selectedModel,system:instructions,messages:[{role:"user",content:prompt.trim()}],max_tokens:1024};
 }else{
 selectedModel=model;url="https://api.groq.com/openai/v1/chat/completions";headers={Authorization:"Bearer "+key,"Content-Type":"application/json"};payload={model,messages:[{role:"system",content:instructions},{role:"user",content:prompt.trim()}],max_completion_tokens:1024,reasoning_effort:"low",stream:false};
 }
 const result=await fetcher(url,{method:"POST",headers,body:JSON.stringify(payload),redirect:"error",signal:AbortSignal.timeout(25000)});
 if(result.status===429)return send(429,{error:"The selected provider quota is busy or exhausted. No fallback was attempted."});
 if(result.status===401||result.status===403)return send(403,{error:"The selected provider rejected the credentials or model access."});
 if(!result.ok)return send(503,{error:"Selected provider unavailable or account quota insufficient. No fallback was attempted."});
 const data=await result.json();
 const answer=provider==="openai"?(Array.isArray(data.output)?data.output.flatMap(o=>o.type==="message"&&Array.isArray(o.content)?o.content.filter(c=>c.type==="output_text").map(c=>c.text):[]).join("\n"):""):provider==="anthropic"?(Array.isArray(data.content)?data.content.filter(c=>c.type==="text").map(c=>c.text).join("\n"):""):data?.choices?.[0]?.message?.content;
 if(typeof answer!=="string"||!answer.trim())return send(502,{error:"No answer returned. Try a shorter prompt."});
 return send(200,{text:answer.slice(0,16000),model:selectedModel,provider});
 }catch{return send(503,{error:"Hosted AI temporarily unavailable."});}finally{active--;}
 };
}
module.exports=createHandler();module.exports.createHandler=createHandler;
