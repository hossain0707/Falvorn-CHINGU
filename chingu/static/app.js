"use strict";
const by=id=>document.getElementById(id);
let token="", selected=null, busy=false;
async function api(path,body){
 const options={headers:{Authorization:"Bearer "+token}};
 if(body!==undefined){options.method="POST";options.headers["Content-Type"]="application/json";options.body=JSON.stringify(body);}
 const response=await fetch(path,options);
 const data=await response.json();
 if(!response.ok)throw Error(data.error||"Request failed");
 return data;
}
function el(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
function status(text){by("status").textContent=text;}
async function refresh(){
 if(!token||busy)return;
 busy=true;
 try{
 const [tasks,notes]=await Promise.all([api("/api/tasks"),api("/api/notes")]);
 by("tasks").replaceChildren(...tasks.map(t=>{
  const b=el("button",t.status.toUpperCase()+" · "+t.goal.slice(0,90));b.className="task-item";b.onclick=()=>{selected=t.id;refresh();};return b;
 }));
 by("notes").replaceChildren(...notes.map(n=>el("pre",n.text)));
 if(selected){
  const task=await api("/api/tasks/"+selected), d=by("detail");
  // Keep approval buttons stable during periodic refresh.
  if(d.dataset.signature!==JSON.stringify(task)){
   d.dataset.signature=JSON.stringify(task);
   d.replaceChildren(el("h3",task.status.toUpperCase()),el("p",task.goal));
   if(task.result)d.append(el("pre",task.result));
   if(task.pending){
    d.append(el("p","Approval required: save this note?"),el("pre",task.pending.text));
    for(const approved of [true,false]){
     const b=el("button",approved?"Approve":"Reject");b.onclick=async()=>{try{await api("/api/tasks/"+task.id+"/approval",{approved});await refresh();}catch(e){status(e.message);}};d.append(b,document.createTextNode(" "));
    }
   }
   d.append(el("h3","Activity"));
   for(const event of task.events)d.append(el("p",event.kind+" · "+event.detail));
  }
 }
 status("Connected · local workspace");
 }catch(e){status(e.message);}finally{busy=false;}
}
by("connect").onclick=async()=>{
 token=by("token").value;by("token").value="";
 try{const agents=await api("/api/agents");by("agent").replaceChildren(...Object.entries(agents).map(([key,value])=>{const o=el("option",value[0]);o.value=key;return o;}));await refresh();}
 catch(e){token="";status(e.message);}
};
by("task").onsubmit=async e=>{e.preventDefault();try{const task=await api("/api/tasks",{agent:by("agent").value,goal:by("goal").value});selected=task.id;by("goal").value="";await refresh();}catch(err){status(err.message);}};
setInterval(refresh,2000);
