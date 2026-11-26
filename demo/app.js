"use strict";
const $=id=>document.getElementById(id),{agents,run}=ChinguEngine;
let a=0,f=0,busy=false,pending=null,history=[],notes=[],current="",epoch=0;
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function btn(text,cls,fn){const b=node("button",text,cls);b.type="button";b.onclick=fn;return b;}
function status(t){$("state").textContent=t;}
function feedback(t){$("feedback").textContent=t;}
function clearOutput(){pending=null;current="";$("events").replaceChildren(node("p","Your workflow activity will appear here.","muted"));$("approval").hidden=true;$("result-wrap").hidden=true;$("step-count").textContent="0 STEPS";feedback("");status("Ready");}
function choose(i,j=0,scroll=false){if(busy)return;a=i;f=j;clearOutput();render();if(scroll)$("workspace").scrollIntoView({behavior:reduced.matches?"auto":"smooth"});}
function render(){
 const agent=agents[a],flow=agent.flows[f];
 $("agents").replaceChildren(...agents.map((x,i)=>{const b=btn("", "agent",()=>choose(i));b.append(node("span",x.icon),document.createTextNode(x.name));b.setAttribute("aria-pressed",String(i===a));b.disabled=busy;return b;}));
 $("role").textContent=agent.role;$("agent-title").textContent=agent.name;$("agent-description").textContent=agent.description;
 $("examples").replaceChildren(...agent.flows.map((x,i)=>{const b=btn(x.title,"",()=>choose(a,i));b.setAttribute("aria-pressed",String(i===f));b.disabled=busy;return b;}));
 $("fields").replaceChildren(...flow.fields.map(x=>{const wrap=node("div",undefined,"field"),label=node("label",x.label),input=node(x.type==="textarea"?"textarea":"input");input.id="field-"+x.key;label.htmlFor=input.id;input.name=x.key;input.required=true;input.maxLength=8000;if(x.type!=="textarea"){input.type=x.type;if(x.type==="number")input.step="any";}input.value=x.value;input.disabled=busy;wrap.append(label,input);return wrap;}));
 setBusy(busy);
}
function setBusy(v){busy=v;$("run").disabled=v;$("reset").disabled=v;$("clear").disabled=v;for(const b of document.querySelectorAll("#agents button,#examples button,#cards button,#fields input,#fields textarea"))b.disabled=v;}
function event(t){$("events").append(node("div",t,"event"));$("step-count").textContent=$("events").children.length+" STEPS";}
function showResult(text){current=text;$("result").textContent=text;$("result-wrap").hidden=false;}
function drawHistory(){ $("history").replaceChildren(...(history.length?history.map(h=>btn(h.name+" · "+h.flow,"history-item",()=>{if(busy)return;choose(h.a,h.f);for(const [k,v] of Object.entries(h.values))$("field-"+k).value=v;$("events").replaceChildren();h.steps.forEach(event);showResult(h.text);status("History");})):[node("p","No workflows yet.","muted")]));$("notes").replaceChildren(...(notes.length?notes.map(n=>node("p",n,"note")):[node("p","No approved notes.","muted")]));}
function finish(text,record){showResult(text);status("Complete");$("approval").hidden=true;pending=null;history.unshift({...record,text,steps:[...$("events").children].map(n=>n.textContent)});history=history.slice(0,20);setBusy(false);drawHistory();}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
$("task-form").onsubmit=async e=>{e.preventDefault();if(busy)return;const agent=agents[a],flow=agent.flows[f],values=Object.fromEntries(new FormData(e.currentTarget));clearOutput();$("events").replaceChildren();let outcome;try{outcome=run(flow.id,values);}catch(err){status("Check input");feedback(err.message);return;}const record={a,f,name:agent.name,flow:flow.title,values};setBusy(true);status("Running");const token=++epoch;for(const step of outcome.steps){if(!reduced.matches)await wait(170);if(token!==epoch)return;event(step);}if(outcome.note){pending={outcome,record};$("approval-text").textContent=outcome.note;$("approval").hidden=false;status("Awaiting approval");return;}finish(outcome.text,record);};
$("approve").onclick=()=>{if(!pending)return;const {outcome,record}=pending;notes.unshift(outcome.note);notes=notes.slice(0,20);event("Approved note saved in this session");finish("Saved preference: "+outcome.note,record);};
$("reject").onclick=()=>{if(!pending)return;const {record}=pending;event("Rejected — nothing saved");finish("Note was not saved.",record);};
$("reset").onclick=()=>choose(a,f);
$("clear").onclick=()=>{if(busy)return;history=[];notes=[];clearOutput();drawHistory();feedback("Session cleared.");};
$("copy").onclick=async()=>{if(!current)return;try{await navigator.clipboard.writeText(current);feedback("Copied.");}catch{feedback("Copy unavailable. Select the result text to copy manually.");}};
$("download").onclick=()=>{if(!current)return;const url=URL.createObjectURL(new Blob([current],{type:"text/plain;charset=utf-8"}));const link=node("a");link.href=url;link.download="chingu-deliverable.txt";document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback("Download requested.");};
$("cards").replaceChildren(...agents.map((x,i)=>{const b=btn("","agent-card",()=>choose(i,0,true));b.append(node("div",x.icon,"agent-icon"),node("h3",x.name),node("p",x.description),node("span","↗","arrow"));return b;}));
render();drawHistory();
// Dependency-free 3D projection: rotating spherical point cloud and orbital nodes.
const canvas=$("orb"),ctx=canvas.getContext("2d");if(ctx){
 let w=0,h=0,angle=.4,tilt=.22,targetX=0,targetY=0,frame=0,last=0,visible=true;
 const points=Array.from({length:420},(_,i)=>{const y=1-2*(i+.5)/420,r=Math.sqrt(1-y*y),t=i*2.39996323;return [r*Math.cos(t),y,r*Math.sin(t)];});
 function resize(){const rect=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=rect.width;h=rect.height;canvas.width=Math.max(1,Math.round(w*d));canvas.height=Math.max(1,Math.round(h*d));ctx.setTransform(d,0,0,d,0,0);if(reduced.matches)draw(0);}
 function project(p){const x=p[0]*Math.cos(angle)+p[2]*Math.sin(angle),z=-p[0]*Math.sin(angle)+p[2]*Math.cos(angle),y=p[1]*Math.cos(tilt)-z*Math.sin(tilt),zz=p[1]*Math.sin(tilt)+z*Math.cos(tilt),scale=3.8/(3.8-zz),r=Math.min(w,h)*.255;return [w*.5+x*r*scale,h*.48+y*r*scale,zz,scale];}
 function draw(t){if(!w||!h)return;ctx.clearRect(0,0,w,h);const cx=w*.5,cy=h*.48,r=Math.min(w,h)*.255;const glow=ctx.createRadialGradient(cx-r*.3,cy-r*.3,0,cx,cy,r*1.55);glow.addColorStop(0,"#b2fff24d");glow.addColorStop(.45,"#5279bd25");glow.addColorStop(1,"#0b122000");ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);for(let ring=0;ring<3;ring++){ctx.beginPath();for(let j=0;j<=100;j++){const u=j/100*Math.PI*2,rr=1.45+ring*.16,q=project([rr*Math.cos(u),rr*Math.sin(u)*Math.sin(.6+ring*.55),rr*Math.sin(u)*Math.cos(.6+ring*.55)]);if(j===0)ctx.moveTo(q[0],q[1]);else ctx.lineTo(q[0],q[1]);}ctx.strokeStyle=["#7ce9d44d","#93b3ff42","#a8b5ff25"][ring];ctx.lineWidth=1;ctx.stroke();}
 const ps=points.map(project).sort((a,b)=>a[2]-b[2]);for(const p of ps){const alpha=.18+(p[2]+1)*.35;ctx.beginPath();ctx.arc(p[0],p[1],1.25*p[3],0,Math.PI*2);ctx.fillStyle="rgba("+ (p[2]>.1?"139,244,225":"134,162,255")+","+alpha+")";ctx.fill();}
 for(let i=0;i<6;i++){const u=i*Math.PI/3+t*.00015,q=project([1.64*Math.cos(u),1.64*Math.sin(u)*.53,1.64*Math.sin(u)*.85]);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(q[0],q[1]);ctx.strokeStyle="#8fbbd525";ctx.stroke();ctx.beginPath();ctx.arc(q[0],q[1],5*q[3],0,Math.PI*2);ctx.fillStyle=i%2?"#a4b6ff":"#9df3d9";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=13;ctx.fill();ctx.shadowBlur=0;}
 ctx.textAlign="center";ctx.font="600 "+Math.max(22,r*.28)+"px system-ui";ctx.fillStyle="#e9fff8";ctx.fillText("친구",cx,cy+8);ctx.font="600 10px system-ui";ctx.fillStyle="#9ddfd8";ctx.fillText("C H I N G U",cx,cy+29);}
 function tick(t){if(!visible||reduced.matches){frame=0;return;}const dt=last?Math.min(t-last,40):16;last=t;angle+=dt*.00035+targetX*.012;tilt+=(.22+targetY*.35-tilt)*.045;draw(t);frame=requestAnimationFrame(tick);}
 function start(){if(!frame&&visible&&!reduced.matches){last=0;frame=requestAnimationFrame(tick);}else if(reduced.matches)draw(0);}
 canvas.addEventListener("pointermove",e=>{const b=canvas.getBoundingClientRect();targetX=(e.clientX-b.left)/b.width-.5;targetY=(e.clientY-b.top)/b.height-.5;});canvas.addEventListener("pointerleave",()=>{targetX=0;targetY=0;});
 new ResizeObserver(resize).observe(canvas);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();}).observe(canvas);reduced.addEventListener("change",()=>{if(frame)cancelAnimationFrame(frame);frame=0;start();});resize();start();
}