"use strict";
(() => {
 const stage=document.getElementById('falcon-stage');if(!stage)return;
 const label=document.getElementById('falcon-label'),step=document.getElementById('falcon-step'),pause=document.getElementById('falcon-pause');
 const media=matchMedia('(prefers-reduced-motion: reduce)');let state='ready',timer=0,paused=media.matches,loaded=false,version=0,visible=!document.hidden,heroVisible=true;
 function show(i){stage.dataset.frame=String(i);}
 function stop(){clearTimeout(timer);timer=0;version++;}
 function updatePause(){pause.textContent=paused?'Resume motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused));}
 function position(){stage.classList.toggle('is-floating',!heroVisible&&['running','approval','complete'].includes(state));}
 function set(next,detail='') {stop();state=next;stage.dataset.state=state;position();label.textContent=({welcome:'Welcome flight',ready:'Ready for your next task',running:'CHINGU is working',approval:'Waiting for your approval',complete:'Task completed',error:'Task needs attention'})[state]||'Ready';step.textContent=detail||({welcome:'Your friends are here.',ready:'Resting together',running:'Executing your workflow',approval:'Review the proposed action',complete:'Your deliverable is ready',error:'Please check your inputs'})[state]||'';const v=version;
  if(!loaded||paused||!visible){show(0);return;}
  function seq(arr,delay,done){let i=0;function tick(){if(v!==version)return;show(arr[i++]);if(i<arr.length)timer=setTimeout(tick,delay);else if(done)timer=setTimeout(done,delay);}tick();}
  function flight(){seq([2,3,2,3],400,flight);}
  if(state==='welcome')seq([1,2,3,4,5],480,()=>set('ready'));
  else if(state==='running')seq([1,2,3],240,flight);
  else if(state==='complete')seq([4,5],450,()=>show(0));
  else show(0);
 }
 function update(detail){if(state==='running')step.textContent=detail;}
 pause.onclick=()=>{paused=!paused;updatePause();set(state==='welcome'?'ready':state,step.textContent);};
 media.addEventListener('change',()=>{paused=media.matches;updatePause();set(state==='welcome'?'ready':state,step.textContent);});
 document.addEventListener('visibilitychange',()=>{visible=!document.hidden;set(state==='welcome'?'ready':state,step.textContent);});
 const hero=stage.parentElement;new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;position();},{threshold:0.1}).observe(hero);
 const sprite=new Image();sprite.onload=()=>{loaded=true;stage.classList.add('frames-ready');if(state==='ready'&&!paused)set('welcome');else set(state,step.textContent);};
 sprite.onerror=()=>{stage.classList.add('asset-missing');label.textContent='Falcon artwork unavailable';};
 sprite.src='assets/falcon-frames.webp';updatePause();window.chinguFalcons={set,update};
})();