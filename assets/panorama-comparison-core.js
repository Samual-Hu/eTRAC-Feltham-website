(function(root){
 'use strict';
 function visits(catalog,event,serial){
  return event?(catalog.events||[]).filter(e=>e.mode==='panorama'&&e.unit===event.unit&&e.side===event.side&&e.carriages.some(c=>c.serial===serial)).sort((a,b)=>(a.date+(a.time||'')+a.id).localeCompare(b.date+(b.time||'')+b.id)).map(e=>({event:e,carriage:e.carriages.find(c=>c.serial===serial)})):[];
 }
 function neighbors(catalog,event,serial){const all=visits(catalog,event,serial);return {previous:all.filter(r=>r.event.date<event.date).at(-1)||null,next:all.find(r=>r.event.date>event.date)||null};}
 function select(catalog,params){
  const old=(catalog.comparisons||[]).find(c=>c.id===params.get('comparison'));
  const id=params.get('event')||params.get('sourceEvent')||old?.sourceEventId;
  const event=(catalog.events||[]).find(e=>e.id===id);
  const serial=params.get('carriage')||params.get('serial')||old?.serial||event?.carriages[0]?.serial;
  const all=visits(catalog,event,serial),near=event?neighbors(catalog,event,serial):{},current=all.find(r=>r.event.id===event?.id);
  const explicit=all.find(r=>r.event.id===(params.get('target')||old?.targetEventId)&&r.event.id!==event?.id);
  const target=explicit||(params.get('direction')==='next'?near.next:near.previous)||(params.has('direction')?null:near.next);
  const chosen=params.has('dates')?all.filter(r=>r.event.id===event?.id||params.getAll('dates').includes(r.event.id)):[current,target].filter(Boolean);
  const rows=chosen.sort((a,b)=>(a.event.date+(a.event.time||'')+a.event.id).localeCompare(b.event.date+(b.event.time||'')+b.event.id));
  return {event,serial,rows,all,neighbors:near,focus:old?.sourceBox||null};
 }
 function interpolation(anchors,x,inverse=false){
  const column=inverse?1:0;let i=0;
  while(i<anchors.length-2&&x>anchors[i+1][column])i++;
  const a=anchors[i],b=anchors[i+1],r=(x-a[column])/(b[column]-a[column]);
  return [a[inverse?0:1]+r*(b[inverse?0:1]-a[inverse?0:1]),a[2]+r*(b[2]-a[2])];
 }
 function map(transform,p){if(!transform?.trusted)return p.slice();const [x,dy]=interpolation(transform.anchors,p[0]);return [x,p[1]*(transform.verticalScale||1)+dy];}
 function inverse(transform,p){if(!transform?.trusted)return p.slice();const [x,dy]=interpolation(transform.anchors,p[0],true);return [x,(p[1]-dy)/(transform.verticalScale||1)];}
 function adjacent(selection){
  const cars=[...(selection.event?.carriages||[])].filter(c=>selection.rows.every(r=>r.event.carriages.some(other=>other.serial===c.serial))).sort((a,b)=>a.order-b.order);
  const i=cars.findIndex(c=>c.serial===selection.serial);return {previous:i>0?cars[i-1]:null,next:i>=0?cars[i+1]||null:null};
 }
 function condition(car){const grade=car.assessed?String(car.cleanliness||'').toLowerCase():'';return {colour:({compliant:'#1a9d69',marginal:'#efa51b','non-compliant':'#e34e53'}[grade]||(car.assessed?'#98a6b1':'#fff')),label:car.assessed?car.cleanliness:'Not assessed',assessed:!!car.assessed};}
 function caption(event,car){return `${new Date(event.date+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})} · ${event.time||''}`;}
 const api={select,visits,neighbors,map,inverse,adjacent,caption,condition};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EyyaPanoramaCore=api;
})(typeof window!=='undefined'?window:globalThis);
