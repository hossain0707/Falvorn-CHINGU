"use strict";
const $=id=>document.getElementById(id),{agents,run}=ChinguEngine;
let a=0,f=0,busy=false,pending=null,history=[],notes=[],current="",epoch=0;
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function btn(text,cls,fn){const b=node("button",text,cls);b.type="button";b.onclick=fn;return b;}
function status(t){$("state").textContent=t;const m={Ready:"ready",Running:"running","Awaiting approval":"approval",Complete:"complete","Check input":"error",History:"ready"};if(m[t])window.chinguFalcons?.set(m[t]);}
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
function event(t){window.chinguFalcons?.update(t);$("events").append(node("div",t,"event"));$("step-count").textContent=$("events").children.length+" STEPS";}
function showResult(text){current=text;$("result").textContent=text;$("result-wrap").hidden=false;}
function drawHistory(){ $("history").replaceChildren(...(history.length?history.map(h=>btn(h.name+" · "+h.flow,"history-item",()=>{if(busy)return;choose(h.a,h.f);for(const [k,v] of Object.entries(h.values))$("field-"+k).value=v;$("events").replaceChildren();h.steps.forEach(event);showResult(h.text);status("History");})):[node("p","No workflows yet.","muted")]));$("notes").replaceChildren(...(notes.length?notes.map(n=>node("p",n,"note")):[node("p","No approved notes.","muted")]));}
function finish(text,record){showResult(text);status("Complete");$("approval").hidden=true;pending=null;history.unshift({...record,text,steps:[...$("events").children].map(n=>n.textContent)});history=history.slice(0,20);setBusy(false);drawHistory();}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
$("task-form").onsubmit=async e=>{e.preventDefault();if(busy)return;const agent=agents[a],flow=agent.flows[f],values=Object.fromEntries(new FormData(e.currentTarget));clearOutput();$("events").replaceChildren();let outcome;try{outcome=run(flow.id,values);}catch(err){status("Check input");feedback(err.message);return;}const record={a,f,name:agent.name,flow:flow.title,values};setBusy(true);status("Running");const token=++epoch;for(const step of outcome.steps){if(!reduced.matches)await wait(430);if(token!==epoch)return;event(step);}if(outcome.note){pending={outcome,record};$("approval-text").textContent=outcome.note;$("approval").hidden=false;status("Awaiting approval");return;}finish(outcome.text,record);};
$("approve").onclick=()=>{if(!pending)return;const {outcome,record}=pending;notes.unshift(outcome.note);notes=notes.slice(0,20);event("Approved note saved in this session");finish("Saved preference: "+outcome.note,record);};
$("reject").onclick=()=>{if(!pending)return;const {record}=pending;event("Rejected — nothing saved");finish("Note was not saved.",record);};
$("reset").onclick=()=>choose(a,f);
$("clear").onclick=()=>{if(busy)return;history=[];notes=[];clearOutput();drawHistory();feedback("Session cleared.");};
$("copy").onclick=async()=>{if(!current)return;try{await navigator.clipboard.writeText(current);feedback("Copied.");}catch{feedback("Copy unavailable. Select the result text to copy manually.");}};
$("download").onclick=()=>{if(!current)return;const url=URL.createObjectURL(new Blob([current],{type:"text/plain;charset=utf-8"}));const link=node("a");link.href=url;link.download="chingu-deliverable.txt";document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback("Download requested.");};
$("cards").replaceChildren(...agents.map((x,i)=>{const b=btn("","agent-card",()=>choose(i,0,true));b.append(node("div",x.icon,"agent-icon"),node("h3",x.name),node("p",x.description),node("span","↗","arrow"));return b;}));
render();drawHistory();
