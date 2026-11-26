"use strict";
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.ChinguEngine=api;})(typeof globalThis==="object"?globalThis:this,function(){
const F=(key,label,value,type="text")=>({key,label,value,type});
const agents=[
{name:"Personal CHINGU",role:"PERSONAL",icon:"◉",description:"Organize your day and remember what matters.",flows:[
{id:"day",title:"Daily planner",fields:[F("start","Start time","09:00","time"),F("minutes","Available minutes","360","number"),F("tasks","Tasks — one per line","Focused project work\nEmail and administration\nExercise\nPrepare tomorrow","textarea")]},
{id:"note",title:"Remember a preference",fields:[F("note","Preference to remember","I prefer morning meetings.","textarea")]}]},
{name:"Work CHINGU",role:"WORK",icon:"▣",description:"Turn professional goals into useful deliverables.",flows:[
{id:"budget",title:"Project budget",fields:[F("hours","Work hours","12","number"),F("rate","Hourly rate","25","number"),F("overhead","Overhead (%)","10","number"),F("currency","Currency label","USD")]},
{id:"meeting",title:"Meeting brief",fields:[F("topic","Meeting topic","Product launch"),F("items","Discussion items — one per line","Scope and milestones\nOwners and responsibilities\nLaunch risks","textarea")]}]},
{name:"Dev CHINGU",role:"DEVELOPMENT",icon:"⌘",description:"Inspect and transform technical inputs safely.",flows:[
{id:"json",title:"JSON inspector",fields:[F("payload","Paste JSON",'{"project":"CHINGU","agents":6,"enabled":true}',"textarea")]},
{id:"test",title:"API test checklist",fields:[F("endpoint","Endpoint","/api/tasks"),F("method","HTTP method","POST")]}]},
{name:"Research CHINGU",role:"RESEARCH",icon:"◎",description:"Structure evidence and analyze supplied information.",flows:[
{id:"text",title:"Text analysis",fields:[F("text","Paste text for analysis","Local AI agents can use tools and preserve privacy. Agent reliability depends on tool validation and testing. Reliable execution requires clear approval policies.","textarea")]},
{id:"protocol",title:"Research protocol",fields:[F("question","Research question","How reliably do local AI agents follow tool schemas?"),F("metrics","Evaluation metrics — one per line","Task completion\nValid tool calls\nLatency","textarea")]}]},
{name:"Studio CHINGU",role:"STUDIO",icon:"◇",description:"Design an agent and build an exportable workflow specification.",flows:[
{id:"studio",title:"Agent designer",fields:[F("name","Agent name","Meeting Summary"),F("goal","Objective","Summarize a meeting and extract action items."),F("steps","Workflow steps — one per line","Read supplied transcript\nSummarize decisions\nExtract action items\nRequest human review","textarea")]}]},
{name:"Enterprise CHINGU",role:"ENTERPRISE",icon:"▥",description:"Assess operational risks and create structured action plans.",flows:[
{id:"risk",title:"Risk assessment",fields:[F("risk","Risk","Unauthorized data access"),F("likelihood","Likelihood (1–5)","3","number"),F("impact","Impact (1–5)","5","number"),F("owner","Responsible role","Security lead")]},
{id:"onboard",title:"Onboarding plan",fields:[F("role","New employee role","AI Engineer"),F("items","Required actions — one per line","Create approved accounts\nAssign equipment\nComplete security training","textarea")]}]}
];
function clean(x,max=8000){const s=String(x??"").trim();if(!s||s.length>max)throw Error("Enter a value within the allowed length.");return s;}
function lines(x){const a=clean(x).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(a.length>30)throw Error("Use at most 30 lines.");return a;}
function num(x,min,max){const s=clean(x,50),n=Number(s);if(!Number.isFinite(n)||n<min||n>max)throw Error("Number must be between "+min+" and "+max+".");return n;}
const list=a=>a.map((s,i)=>(i+1)+". "+s).join("\n");
const result=(steps,text)=>({steps,text});
function run(id,v){
 switch(id){
 case "day":{const tasks=lines(v.tasks),minutes=num(v.minutes,15,1440),m=String(v.start).match(/^([01]\d|2[0-3]):([0-5]\d)$/);if(!m||!Number.isInteger(minutes))throw Error("Enter a valid start time and whole minutes.");const start=Number(m[1])*60+Number(m[2]);if(minutes<tasks.length*5)throw Error("Allow at least five minutes per task.");const block=Math.floor(minutes/tasks.length);const fmt=n=>String(Math.floor(n%1440/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")+(n>=1440?" (+1 day)":"");return result(["Read "+tasks.length+" tasks","Allocate "+minutes+" minutes","Construct time blocks"],tasks.map((s,i)=>fmt(start+i*block)+"–"+fmt(start+(i===tasks.length-1?minutes:(i+1)*block))+"  "+s).join("\n"));}
 case "note":{const note=clean(v.note,1000);return {steps:["Read preference","Prepare a workspace note","Request human approval"],note};}
 case "budget":{const h=num(v.hours,0,1e6),r=num(v.rate,0,1e6),o=num(v.overhead,0,1000),c=clean(v.currency,12),base=h*r,extra=base*o/100,fmt=n=>n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})+" "+c;return result(["Validate numeric inputs","Calculate base cost and overhead","Generate budget breakdown"],"Base cost: "+fmt(base)+"\nOverhead ("+o+"%): "+fmt(extra)+"\nTotal: "+fmt(base+extra));}
 case "meeting":{const t=clean(v.topic,300),a=lines(v.items);return result(["Read meeting topic","Organize agenda items","Generate a structured brief"],"MEETING BRIEF — "+t+"\n\nObjective: align on "+t+" and agree on next steps.\n\nAgenda\n"+list(a)+"\n\nCapture decisions, owners, deadlines and unresolved questions.");}
 case "json":{const val=JSON.parse(clean(v.payload));const type=Array.isArray(val)?"array":val===null?"null":typeof val;return result(["Parse JSON without executing code","Identify top-level type","Format valid JSON"],"Valid JSON · "+type+"\n\n"+JSON.stringify(val,null,2));}
 case "test":{const ep=clean(v.endpoint,300),m=clean(v.method,12).toUpperCase();if(!["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"].includes(m))throw Error("Enter a standard HTTP method.");return result(["Validate HTTP method","Build endpoint-specific test plan"],m+" "+ep+"\n\n"+list(["Expected success response and schema","Missing or invalid inputs","Authentication and authorization failures","Resource not found or conflict","Rate limits and unexpected errors",m==="GET"?"Read-only behavior":"Idempotency and unintended side effects"])+"\n\nChecklist only — no network request was sent.");}
 case "text":{const t=clean(v.text),words=t.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[],stop=new Set("the a an and or of to in is are can for on with by from as it that this be".split(" ")),counts=new Map();for(const w of words)if(w.length>2&&!stop.has(w))counts.set(w,(counts.get(w)||0)+1);const top=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,10);return result(["Tokenize supplied text","Count recurring terms","Prepare descriptive analysis"],"Words: "+words.length+"\nCharacters: "+t.length+"\n\nFrequent terms\n"+top.map(([w,n])=>w+": "+n).join("\n")+"\n\nThis is descriptive text analysis, not factual verification.");}
 case "protocol":{const q=clean(v.question,500),a=lines(v.metrics);return result(["Read research question","Organize evaluation measures","Generate protocol template"],"RESEARCH PROTOCOL\nQuestion: "+q+"\n\nMetrics\n"+list(a)+"\n\nMethod: define a baseline, fixed test set and reproducible environment. Record failures and uncertainty.\nNo external sources were retrieved.");}
 case "studio":{const spec={name:clean(v.name,100),objective:clean(v.goal,1000),steps:lines(v.steps),approval_required_for_external_actions:true};return result(["Validate agent definition","Build structured workflow specification","Apply approval-first policy"],JSON.stringify(spec,null,2));}
 case "risk":{const l=num(v.likelihood,1,5),i=num(v.impact,1,5);if(!Number.isInteger(l)||!Number.isInteger(i))throw Error("Use whole numbers from 1 to 5.");const score=l*i;return result(["Validate risk ratings","Calculate likelihood × impact","Classify priority"],"Risk: "+clean(v.risk,500)+"\nOwner: "+clean(v.owner,150)+"\nScore: "+score+"/25\nPriority: "+(score>=16?"High":score>=8?"Medium":"Low")+"\n\nNext: document mitigations, review residual risk and assign a review date.\nIllustrative scoring model; not a compliance determination.");}
 case "onboard":{const role=clean(v.role,100),a=lines(v.items);return result(["Read role requirements","Structure onboarding actions","Generate checklist"],"ONBOARDING — "+role+"\n\n"+a.map(s=>"☐ "+s).join("\n")+"\n\nConfirm responsible owners, approval and completion dates.");}
 default:throw Error("Unknown workflow.");
 }
}
return {agents,run};
});