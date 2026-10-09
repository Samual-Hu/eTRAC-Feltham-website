(function(root){
 'use strict';
 let lens,canvas,ctx,note,active,frame=0,drag=null,dragged=false;
 const colours={minor:'#2868f7',severe:'#e34e53',graffiti:'#8054c9',pending:'#ffd060'};
 const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
 function close(){if(lens)lens.hidden=true;if(active)active.stage.setAttribute('aria-expanded','false');active=null;drag=null;}
 function queue(){if(!frame)frame=requestAnimationFrame(draw);}
 function draw(){
  frame=0;if(!active||!active.img.naturalWidth)return;
  const {img,stage,zoom,regions}=active,nw=img.naturalWidth,nh=img.naturalHeight;
  canvas.width=Math.max(1,innerWidth-28);canvas.height=Math.max(1,innerHeight-56);
  const w=canvas.width/zoom,h=canvas.height/zoom;
  active.x=w<=nw?clamp(active.x,w/2,nw-w/2):nw/2;active.y=h<=nh?clamp(active.y,h/2,nh-h/2):nh/2;
  const x=active.x-w/2,y=active.y-h/2;
  ctx.fillStyle='#e7edf2';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,x,y,w,h,0,0,canvas.width,canvas.height);
  for(const box of stage.querySelectorAll(regions)){
   const l=parseFloat(box.style.left)/100*nw,t=parseFloat(box.style.top)/100*nh,bw=parseFloat(box.style.width)/100*nw,bh=parseFloat(box.style.height)/100*nh;
   const kind=box.dataset.defectType||(['minor','severe','graffiti'].find(k=>box.classList.contains('issue-'+k)))||'pending';
   ctx.strokeStyle=colours[kind];ctx.lineWidth=['severe','graffiti'].includes(kind)?4:2.5;ctx.strokeRect((l-x)*zoom,(t-y)*zoom,bw*zoom,bh*zoom);
  }
  lens.hidden=false;lens.style.width=(innerWidth-24)+'px';note.textContent='Reviewed boxes · Drag to pan'+(active.zoomable?' · Scroll to zoom':'')+' · Click to close';
  lens.dataset.serial=stage.closest('[data-serial]')?.dataset.serial||img.alt;
  lens.dataset.zoom=zoom;lens.dataset.nativeX=active.x.toFixed(2);lens.dataset.nativeY=active.y.toFixed(2);
  if(active.justOpened){lens.focus({preventScroll:true});active.justOpened=false;}
 }
 function setup(){
  if(lens)return;
  lens=document.createElement('aside');lens.className='surface-loupe';lens.hidden=true;lens.setAttribute('role','dialog');lens.setAttribute('aria-label','Surface magnifier; click to close');lens.tabIndex=0;
  canvas=document.createElement('canvas');ctx=canvas.getContext('2d');note=document.createElement('small');lens.append(canvas,note);document.body.append(lens);
  lens.addEventListener('pointerdown',e=>{if(!active)return;drag={x:e.clientX,y:e.clientY,nx:active.x,ny:active.y};dragged=false;lens.setPointerCapture(e.pointerId);});
  lens.addEventListener('pointermove',e=>{if(!drag||!active)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)dragged=true;if(!dragged)return;active.x=clamp(drag.nx-dx/active.zoom,0,active.img.naturalWidth);active.y=clamp(drag.ny-dy/active.zoom,0,active.img.naturalHeight);queue();});
  lens.addEventListener('pointerup',()=>{drag=null;});lens.addEventListener('pointercancel',()=>{drag=null;});
  lens.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(dragged){dragged=false;return;}close();});
  lens.addEventListener('wheel',e=>{
   if(!active)return;e.preventDefault();e.stopPropagation();if(!active.zoomable)return;
   const r=canvas.getBoundingClientRect(),dx=((e.clientX-r.left)/r.width-.5)*canvas.width,dy=((e.clientY-r.top)/r.height-.5)*canvas.height;
   const nx=active.x+dx/active.zoom,ny=active.y+dy/active.zoom,delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
   active.zoom=clamp(active.zoom*Math.exp(-delta*.002),.5,8);active.x=nx-dx/active.zoom;active.y=ny-dy/active.zoom;queue();
  },{passive:false});
  window.addEventListener('keydown',e=>{if(e.key==='Escape')close();});window.addEventListener('resize',queue);window.addEventListener('eyya:review-saved',queue);
 }
 function bind(stage,img,options={}){
  if(stage.dataset.loupeBound)return;stage.dataset.loupeBound='1';stage.setAttribute('aria-haspopup','dialog');stage.setAttribute('aria-expanded','false');stage.title='Click to magnify';
  const open=e=>{if(!img.naturalWidth)return;e.preventDefault();e.stopPropagation();setup();close();const r=img.getBoundingClientRect();active={stage,img,zoom:1,justOpened:true,x:clamp(((e.clientX??(r.left+r.width/2))-r.left)/r.width*img.naturalWidth,0,img.naturalWidth),y:clamp(((e.clientY??(r.top+r.height/2))-r.top)/r.height*img.naturalHeight,0,img.naturalHeight),regions:options.regions||'.defect-box,.pipeline-candidate',zoomable:!!options.zoomable};stage.setAttribute('aria-expanded','true');queue();};
  stage.addEventListener('click',open);stage.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key))open({clientX:undefined,clientY:undefined,preventDefault:()=>e.preventDefault(),stopPropagation:()=>e.stopPropagation()});});
 }
 root.EyyaSurfaceLoupe={bind,close};
})(window);
