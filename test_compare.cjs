const fs=require('node:fs'),assert=require('node:assert/strict');
const core=require('./assets/panorama-comparison-core.js');
const catalog=JSON.parse(fs.readFileSync(__dirname+'/assets/catalog.json','utf8'));
let checked=0;
for(const event of catalog.events.filter(e=>e.mode==='panorama'))for(const car of event.carriages){
 for(const direction of ['previous','next']){
  const s=core.select(catalog,new URLSearchParams({event:event.id,carriage:car.serial,direction}));
  assert(s.rows.length>=1&&s.rows.length<=2);assert(s.rows.some(r=>r.event.id===event.id));
  assert(s.rows.every(r=>r.event.unit===event.unit&&r.event.side===event.side&&r.carriage.serial===car.serial));
  if(s.rows.length===2)assert(s.rows[0].event.date<s.rows[1].event.date);
  const other=s.rows.find(r=>r.event.id!==event.id);
  if(other){const options=catalog.events.filter(e=>e.mode==='panorama'&&e.unit===event.unit&&e.side===event.side&&e.carriages.some(c=>c.serial===car.serial)&&(direction==='previous'?e.date<event.date:e.date>event.date)).sort((a,b)=>(a.date+a.time+a.id).localeCompare(b.date+b.time+b.id));assert.equal(other.event.id,(direction==='previous'?options.at(-1):options[0]).id);}
  checked++;
 }
}
for(const old of catalog.comparisons||[]){
 const s=core.select(catalog,new URLSearchParams({comparison:old.id}));
 assert.equal(s.event.id,old.sourceEventId);assert.equal(s.serial,old.serial);assert.deepEqual(s.focus,old.sourceBox||null);
 assert(s.rows.length<=2);assert(s.rows.every(r=>r.carriage.serial===old.serial));
}
const transform={trusted:true,anchors:[[0,.01,.002],[.4,.39,.01],[1,.98,-.004]],verticalScale:1.04};
for(const p of [[0,0],[.1,.7],[.4,.2],[.9,.8],[1,1]]){const q=core.inverse(transform,core.map(transform,p));assert(Math.abs(q[0]-p[0])<1e-8&&Math.abs(q[1]-p[1])<1e-8);assert.deepEqual(core.map({...transform,trusted:false},p),p);}
const script=fs.readFileSync(__dirname+'/assets/compare.js','utf8');
assert(!script.includes('Earlier date above, later date below.'));
assert.equal(core.caption({date:'2026-08-20',time:'06:08'},{}),'20 Aug 2026 · 06:08');
assert.equal(core.condition({assessed:true,cleanliness:'Compliant'}).colour,'#1a9d69');
assert(script.includes('transform.imageSha256!==car.panoramaSha256'));
assert(script.includes('for(const d of b.car.defects||[])'));
console.log(`Two-date comparison passed for ${checked} carriage/direction selections, legacy routes, reversible body mappings and stale-image guards.`);
