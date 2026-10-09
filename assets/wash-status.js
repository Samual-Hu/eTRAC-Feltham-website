(function(root){'use strict';
 const grade=c=>String(c.cleanliness||'').toLowerCase();
 const expected=unit=>unit.startsWith('701')?10:['450','458'].some(p=>unit.startsWith(p))?8:0;
 function savingCase(catalog,event){
  if(!event.washed)return null;
  if(catalog.events.some(e=>e.unit===event.unit&&e.date===event.date&&e.washed&&e.time<event.time))return {reason:'Repeat wash of the same train on this evening'};
  const sides=catalog.events.filter(e=>e.unit===event.unit&&e.date===event.date&&e.time===event.time&&e.mode==='panorama');
  if(!['A','B'].every(side=>sides.some(e=>e.side===side)))return null;
  const size=expected(event.unit);if(!size)return null;
  if(sides.some(e=>e.carriages.length!==size||new Set(e.carriages.map(c=>c.serial)).size!==size||e.carriages.some(c=>!c.assessed||!['compliant','marginal'].includes(grade(c))||(c.defects||[]).some(d=>['severe','graffiti'].includes(d.type)))))return null;
  const a=sides.find(e=>e.side==='A'),b=sides.find(e=>e.side==='B');if(a.carriages.some(c=>!b.carriages.some(o=>o.serial===c.serial)))return null;
  return {reason:'Both pre-wash sides assessed; no non-compliant carriage'};
 }
 const api={savingCase};root.EyyaWashStatus=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
