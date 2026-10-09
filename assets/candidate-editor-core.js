(function(root){
 'use strict';
 const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
 function hit(p,b,t){const [x,y]=p,[l,u,r,d]=b,inside=x>=l-t&&x<=r+t&&y>=u-t&&y<=d+t;if(!inside)return 'draw';const dl=Math.abs(x-l),dr=Math.abs(x-r),du=Math.abs(y-u),dd=Math.abs(y-d);const horizontal=Math.min(dl,dr)<=t?(dl<=dr?'w':'e'):'',vertical=Math.min(du,dd)<=t?(du<=dd?'n':'s'):'';return vertical+horizontal||(x>=l&&x<=r&&y>=u&&y<=d?'move':'draw');}
 function change(original,start,point,mode,width,height){
  let [l,t,r,b]=original;const dx=point[0]-start[0],dy=point[1]-start[1];
  if(mode==='move'){const x=clamp(dx,-l,width-r),y=clamp(dy,-t,height-b);return [l+x,t+y,r+x,b+y].map(Math.round);}
  if(mode==='draw'){l=Math.min(start[0],point[0]);r=Math.max(start[0],point[0]);t=Math.min(start[1],point[1]);b=Math.max(start[1],point[1]);}
  else{if(mode.includes('w'))l=Math.min(r-1,point[0]);if(mode.includes('e'))r=Math.max(l+1,point[0]);if(mode.includes('n'))t=Math.min(b-1,point[1]);if(mode.includes('s'))b=Math.max(t+1,point[1]);}
  l=clamp(Math.round(l),0,width-1);t=clamp(Math.round(t),0,height-1);r=clamp(Math.round(r),l+1,width);b=clamp(Math.round(b),t+1,height);return [l,t,r,b];
 }
 const api={hit,change};root.EyyaCandidateEditor=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
