"use strict";
(()=>{
 const stage=document.getElementById("falcon-stage"),canvas=document.getElementById("chingu-world");
 if(!stage||!canvas)return;
 const ctx=canvas.getContext("2d"),label=document.getElementById("falcon-label"),step=document.getElementById("falcon-step"),pause=document.getElementById("falcon-pause");
 const media=matchMedia("(prefers-reduced-motion: reduce)");
 const ambientLabel=document.getElementById("ambient-label"),ambientStep=document.getElementById("ambient-step"),focus=document.getElementById("focus-toggle");
 const workspace=document.getElementById("workspace");
 let zone=0; function updateZone(){const r=workspace.getBoundingClientRect();zone=Math.max(0,Math.min(1,(innerHeight*.85-r.top)/(innerHeight*.60)));if(r.bottom<innerHeight*.20)zone*=Math.max(0,r.bottom/(innerHeight*.20));}
 const presence={ready:["Together, always.","Ready whenever you are."],welcome:["Welcome to CHINGU.","Your companions are here."],running:["In motion.","Working through your request."],approval:["Your decision.","Waiting for your approval."],complete:["All done.","Your deliverable is ready."],error:["Here to help.","Review your inputs and try again."]};
 function updatePresence(){if(ambientLabel&&ambientStep){ambientLabel.textContent=presence[state][0];ambientStep.textContent=presence[state][1];}}
 focus?.addEventListener("click",()=>{const enabled=document.body.classList.toggle("focus-mode");focus.setAttribute("aria-pressed",String(enabled));focus.textContent=enabled?"Exit focus mode":"Focus mode";});
 let state="ready",paused=media.matches,visible=!document.hidden,loaded=false,raf=0,w=0,h=0,dpr=1,origin=performance.now(),scroll=0,px=0,py=0,first=true,hasTask=false;
 const poster=new Image(),sprite=new Image(),frames=[];
 const text={ready:["Ready for your next task","Resting together"],welcome:["Welcome to CHINGU","Your friends are taking flight"],running:["CHINGU is working","Executing your workflow"],approval:["Waiting for your approval","Review the proposed action"],complete:["Task completed","Your deliverable is ready"],error:["Task needs attention","Please check your inputs"]};
 function set(next,detail=""){if(!text[next])return;state=next;origin=performance.now();stage.dataset.state=state;updatePresence();label.textContent=text[next][0];step.textContent=detail||text[next][1];if(next==="running")hasTask=true;if(paused||!visible)draw(origin);else start();}
 function update(detail){if(state==="running")step.textContent=detail;}
 function size(){updateZone();dpr=Math.min(devicePixelRatio||1,1.6);w=innerWidth;h=innerHeight;canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw(performance.now());}
 function maskFrame(image,sx,sy,sw,sh){const c=document.createElement("canvas");c.width=sw;c.height=sh;const g=c.getContext("2d");g.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);g.globalCompositeOperation="destination-in";const fade=g.createRadialGradient(sw*.52,sh*.51,Math.min(sw,sh)*.30,sw*.50,sh*.50,Math.min(sw,sh)*.69);fade.addColorStop(0,"#000");fade.addColorStop(.57,"#000");fade.addColorStop(.81,"#000b");fade.addColorStop(1,"#0000");g.fillStyle=fade;g.fillRect(0,0,sw,sh);g.globalCompositeOperation="destination-in";const edges=g.createLinearGradient(0,0,sw,0);edges.addColorStop(0,"#0000");edges.addColorStop(.09,"#000");edges.addColorStop(.90,"#000");edges.addColorStop(1,"#0000");g.fillStyle=edges;g.fillRect(0,0,sw,sh);const vertical=g.createLinearGradient(0,0,0,sh);vertical.addColorStop(0,"#0000");vertical.addColorStop(.08,"#000");vertical.addColorStop(.91,"#000");vertical.addColorStop(1,"#0000");g.fillStyle=vertical;g.fillRect(0,0,sw,sh);return c;}
 const stars=Array.from({length:92},(_,i)=>({x:((i*137.508)%360)/360,y:((i*73.131+17)%360)/360,r:.45+(i%5)*.22,p:i*.31}));
 function background(t){ctx.clearRect(0,0,w,h);let g=ctx.createRadialGradient(w*.72,h*.43,0,w*.72,h*.43,Math.max(w,h)*.75);g.addColorStop(0,"#0d2842");g.addColorStop(.45,"#080f25");g.addColorStop(1,"#040914");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);for(const s of stars){const y=(s.y*h+scroll*.065)%h;ctx.globalAlpha=(.12+.25*(.5+.5*Math.sin(t*.0007+s.p)));ctx.fillStyle=s.p%2>1?"#b7a2ff":"#81deff";ctx.beginPath();ctx.arc(s.x*w,y,s.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
 function frameAt(ms){if(paused||media.matches)return [0,0,0];let arr,pace,repeat=false;if(state==="welcome"){arr=[0,1,2,3,3,4,5,0];pace=590;}else if(state==="running"){if(ms<650){arr=[1,2,3];pace=230;}else{arr=[2,3,3,2];pace=500;ms-=650;repeat=true;}}else if(state==="complete"){arr=[4,5,0];pace=460;}else return [0,0,0];let q=ms/pace,i=Math.floor(q);if(repeat)i%=arr.length;else if(i>=arr.length-1)return [arr[arr.length-1],arr[arr.length-1],0];let mix=q-Math.floor(q);mix=mix*mix*(3-2*mix);return [arr[i],arr[(i+1)%arr.length],mix];}
 function draw(t){if(!ctx||!w||!h)return;const ms=Math.max(0,t-origin);if(!paused&&state==="welcome"&&ms>=4700){state="ready";stage.dataset.state=state;updatePresence();label.textContent=text.ready[0];step.textContent=text.ready[1];origin=t;}const moving=state==="running"||state==="welcome",staticMotion=paused||media.matches,small=w<=850,progress=Math.min(1,scroll/Math.max(h*.8,1));background(staticMotion?0:t);const [f1,f2,mix]=frameAt(ms);stage.dataset.frame=String(mix<.5?f1:f2);
 let side=small?Math.max(w*1.08,Math.min(h*.70,590)):Math.min(w*.76,h*1.18);
 let x=small?w*.50:w*.73,y=small?h*.77:h*.49;
 const z=zone;const workSide=small?Math.min(w*.86,h*.58):Math.min(w*.40,h*.82);const workX=small?w*.79:w*.845,workY=small?h*.31:h*.53;
 x+=(workX-x)*z;y+=(workY-y)*z;side+=(workSide-side)*z;
 if(!staticMotion){const sway=moving?Math.sin(ms*.0009)*w*(small?.035:.06)*(1-z*.72):Math.sin(t*.00045)*4;x+=sway+px*8;y+=Math.sin(t*.0012)*(moving?10:4)+py*6;}
 let opacity=1-progress*.06-z*(small?.31:.04);
 const p=frames[f1]||frames[0];const n=frames[f2]||p;function paint(img,alpha){if(!img)return;ctx.globalAlpha=alpha*opacity;ctx.drawImage(img,x-side/2,y-side/2,side,side);}if(p===n){paint(p,1);}else{paint(p,1);paint(n,mix);}ctx.globalAlpha=1;
 if(moving&&!staticMotion&&loaded){for(let k=0;k<2;k++){ctx.beginPath();for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,rx=side*(.44+k*.10),ry=side*(.16+k*.03),rot=-.28+k*.55;let u=Math.cos(a)*rx,v=Math.sin(a)*ry;const xx=x+u*Math.cos(rot)-v*Math.sin(rot),yy=y+u*Math.sin(rot)+v*Math.cos(rot)+side*.06;if(!i)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.strokeStyle=k?"#a48aff38":"#46e4ff35";ctx.lineWidth=1;ctx.stroke();for(let i=0;i<8;i++){const a=t*.0012+i*Math.PI/4+k*.5,rx=side*(.44+k*.10),ry=side*(.16+k*.03),rot=-.28+k*.55,u=Math.cos(a)*rx,v=Math.sin(a)*ry;ctx.beginPath();ctx.arc(x+u*Math.cos(rot)-v*Math.sin(rot),y+u*Math.sin(rot)+v*Math.cos(rot)+side*.06,1.6,0,Math.PI*2);ctx.fillStyle=k?"#b7a3ff":"#8cffff";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;ctx.fill();ctx.shadowBlur=0;}}}
 }
 function tick(t){raf=0;if(!visible||paused||media.matches)return;draw(t);raf=requestAnimationFrame(tick);}
 function start(){if(!raf&&visible&&!paused&&!media.matches)raf=requestAnimationFrame(tick);}
 function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
 function sync(){pause.textContent=paused?"Resume motion":"Pause motion";pause.setAttribute("aria-pressed",String(paused));if(paused||media.matches||!visible){stop();draw(performance.now());}else start();}
 pause.onclick=()=>{paused=!paused;if(paused&&state==="welcome")set("ready");sync();};
 media.addEventListener("change",()=>{paused=media.matches;if(paused&&state==="welcome")set("ready");sync();});
 document.addEventListener("visibilitychange",()=>{visible=!document.hidden;sync();});
 window.addEventListener("resize",size,{passive:true});window.addEventListener("scroll",()=>{scroll=window.scrollY;updateZone();if(paused||media.matches)draw(performance.now());},{passive:true});
 window.addEventListener("pointermove",e=>{px=e.clientX/Math.max(w,1)-.5;py=e.clientY/Math.max(h,1)-.5;},{passive:true});
 poster.onload=()=>{if(!frames[0])frames[0]=maskFrame(poster,0,0,poster.width,poster.height);draw(performance.now());};poster.src="assets/falcon-rest.webp";
 sprite.onload=()=>{const sw=Math.floor(sprite.width/3),sh=Math.floor(sprite.height/2);for(let i=0;i<6;i++)frames[i]=maskFrame(sprite,(i%3)*sw,Math.floor(i/3)*sh,sw,sh);loaded=true;stage.classList.add("frames-ready");if(first&&state==="ready"&&!paused&&!hasTask){first=false;set("welcome");}else draw(performance.now());};
 sprite.onerror=()=>{stage.classList.add("asset-missing");};sprite.src="assets/falcon-frames.webp";
 window.chinguFalcons={set,update};size();sync();
})();