"use strict";
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.ChinguSwarm=api;})(typeof globalThis==="object"?globalThis:this,function(){
 const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
 const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
 function count(steps,mobile=false){return Math.min(mobile?12:24,Math.max(mobile?4:8,Math.ceil(Number(steps)||1)*(mobile?3:6)));}
 function create(now=0){return {from:0,target:0,at:now,duration:1,flightAt:now,steps:["Prepare","Explore"],kind:"ready"};}
 function spread(s,now){return s.from+(s.target-s.from)*ease((now-s.at)/s.duration);}
 function transition(s,kind,now,steps){const active=kind==="running"||kind==="welcome",current=spread(s,now);const target=active?1:0;
  if(kind===s.kind&&target===s.target)return s;
  return {from:current,target,at:now,duration:active?460:1050,flightAt:active&&current<.001?now:s.flightAt,steps:active&&Array.isArray(steps)&&steps.length?steps.slice(0,8):s.steps,kind};}
 function position(i,n,ms,w,h,home,amount){
  const phase=(i/n)*Math.PI*2, speed=.00032+(i%4)*.000045;
  const a=phase+ms*speed;const lane=i%3;
  const cx=w*.5,cy=h*.53;const rx=w*(.34+lane*.045),ry=h*(.26+lane*.035);
  const tx=cx+Math.cos(a)*rx+Math.sin(a*2+phase)*w*.035;
  const ty=cy+Math.sin(a*1.08+phase*.28)*ry;
  const sx=home.x+(i%2===0?-1:1)*home.side*.10,sy=home.y-home.side*.03;
  return {x:sx+(tx-sx)*amount,y:sy+(ty-sy)*amount};
 }
 function falcon(ctx,x,y,size,angle,flap,color,alpha){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(size,size);ctx.globalAlpha=alpha;
  ctx.shadowColor=color;ctx.shadowBlur=7/size;
  // Anatomical peregrine-style swept wings, layered primary feathers, tapered tail.
  const lift=.67+flap*.30;
  for(const sign of [-1,1]){
   ctx.save();ctx.scale(1,sign);
   ctx.beginPath();ctx.moveTo(-.22,.08);ctx.bezierCurveTo(-.13,.37*lift,-.10,.72*lift,-.75,1.04*lift);ctx.quadraticCurveTo(-.62,.68*lift,-.36,.36*lift);ctx.lineTo(-.49,.24*lift);ctx.lineTo(-.16,.12);ctx.closePath();ctx.fillStyle=color;ctx.fill();
   ctx.shadowBlur=0;ctx.strokeStyle="#d7faff";ctx.lineWidth=.026;ctx.globalAlpha=alpha*.68;
   for(let j=0;j<4;j++){ctx.beginPath();ctx.moveTo(-.16-j*.065,.24*lift);ctx.lineTo(-.38-j*.08,(.54+j*.12)*lift);ctx.stroke();}
   ctx.restore();
  }
  ctx.globalAlpha=alpha;ctx.shadowBlur=0;ctx.beginPath();ctx.moveTo(-.13,-.12);ctx.lineTo(-.72,-.16);ctx.lineTo(-.51,0);ctx.lineTo(-.72,.16);ctx.lineTo(-.13,.12);ctx.closePath();ctx.fillStyle=color;ctx.fill();
  ctx.beginPath();ctx.ellipse(.02,0,.43,.13,0,0,Math.PI*2);ctx.fillStyle="#e1f6ff";ctx.fill();
  ctx.beginPath();ctx.arc(.34,0,.125,0,Math.PI*2);ctx.fillStyle="#e9faff";ctx.fill();
  ctx.beginPath();ctx.moveTo(.43,-.045);ctx.lineTo(.55,0);ctx.lineTo(.43,.045);ctx.fillStyle="#f1d39a";ctx.fill();ctx.restore();
 }
 function paint(ctx,s,now,w,h,home,{mobile=false,focus=false}={}){
  const amount=spread(s,now),n=count(s.steps.length,mobile);if(amount<.002)return 0;
  const ms=Math.max(0,now-s.flightAt),alpha=clamp(amount*2.2)*(focus?.32:1);
  for(let i=0;i<n;i++){
   const p=position(i,n,ms,w,h,home,amount),q=position(i,n,ms+35,w,h,home,amount);
   const angle=Math.atan2(q.y-p.y,q.x-p.x);const color=i%2?"#b69bff":"#72efff";
   const size=(mobile?9:14)+(i%4)*(mobile?1.5:2.4);
   ctx.save();ctx.lineCap="round";
   for(let j=8;j>=1;j--){const a=position(i,n,Math.max(0,ms-j*36),w,h,home,amount),b=position(i,n,Math.max(0,ms-(j-1)*36),w,h,home,amount);
    ctx.globalAlpha=alpha*(1-j/9)*.37;ctx.strokeStyle=color;ctx.lineWidth=(mobile?1:1.5);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
   ctx.restore();
   falcon(ctx,p.x,p.y,size*(.64+.36*amount),angle,Math.sin(ms*.012+i*1.6),color,alpha*.92);
  }
  return n;
 }
 return {count,create,spread,transition,position,paint};
});