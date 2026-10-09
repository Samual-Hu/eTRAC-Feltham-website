(function(root){
 'use strict';
 const clamp=(v,max)=>Math.max(0,Math.min(max,v));
 function nativePoint(point,rect,view,width,height){return [clamp(view[0]+(point[0]-rect.left)/rect.width*view[2],width),clamp(view[1]+(point[1]-rect.top)/rect.height*view[3],height)];}
 function payload(event,car,box,type,id){
  if(!['minor','severe','graffiti'].includes(type)||!id||!event.id||!['A','B'].includes(event.side)||!car.panoramaSha256)throw new Error('Current panorama identity is required. Reload the comparison.');
  const b=box?.map(Math.round);
  if(!b||b.length!==4||b.some(n=>!Number.isFinite(n))||!(0<=b[0]&&b[0]<b[2]&&b[2]<=car.width&&0<=b[1]&&b[1]<b[3]&&b[3]<=car.height))throw new Error('Draw a box inside this panorama first.');
  return {action:'annotation',eventId:event.id,serial:car.serial,date:event.date,side:event.side,annotationId:id,type,bbox:b,imageSha256:car.panoramaSha256};
 }
 const api={nativePoint,payload};if(typeof module==='object')module.exports=api;else root.EyyaCompareAnnotationCore=api;
})(typeof window==='object'?window:globalThis);
