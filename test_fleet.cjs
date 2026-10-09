const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const catalog=JSON.parse(fs.readFileSync(__dirname+'/assets/catalog.json','utf8'));
const nodes=new Map(),listeners={};
const node=s=>{if(!nodes.has(s))nodes.set(s,{value:'',innerHTML:'',append(){},addEventListener(){},classList:{toggle(){}},setAttribute(){}});return nodes.get(s);};
let redirected='';
const location={search:'',toString(){return 'http://localhost/index.html';},replace(url){redirected=url;}};
const ctx=vm.createContext({URL,URLSearchParams,Intl,Date,console,location,history:{pushState(){}},window:{EYYA_CATALOG:catalog,addEventListener(){},scrollTo(){}},document:{querySelector:node,addEventListener:(name,fn)=>{listeners[name]=fn;}}});
const run=s=>vm.runInContext(s,ctx);
run(fs.readFileSync(__dirname+'/assets/wash-status.js','utf8'));run(fs.readFileSync(__dirname+'/assets/fleet.js','utf8'));
assert.equal(new Set(catalog.events.map(e=>e.id)).size,catalog.events.length);
const visits=new Set(catalog.events.map(e=>[e.unit,e.date,e.time].join('|'))).size;
assert.equal(run('sessions(catalog.events).length'),visits);
const paired=[...catalog.events.filter(e=>e.side==='A')].find(a=>catalog.events.some(b=>b.side==='B'&&b.unit===a.unit&&b.date===a.date&&b.time===a.time));
const pairedIndex=catalog.events.indexOf(paired);
assert.equal(run(`sessions(catalog.events.filter(e=>e.unit===catalog.events[${pairedIndex}].unit&&e.date===catalog.events[${pairedIndex}].date&&e.time===catalog.events[${pairedIndex}].time)).length`),1);
const overview=node('[data-dashboard]').innerHTML;
const modeCounts=run("[sessions(catalog.events).filter(s=>s.items.some(e=>e.mode==='panorama')).length,sessions(catalog.events).filter(s=>s.items.every(e=>e.mode==='video')).length]");
assert(overview.includes(`${modeCounts[0]} panorama visits · ${modeCounts[1]} video-only visits`));
assert(overview.includes(`<strong style="color:#123b58">${visits}</strong><b>Train captures</b>`));
assert(overview.includes('index.html?issue=minor'));assert(overview.includes('index.html?issue=graffiti'));

for(const [unit,date] of [['701008','2026-08-24'],['701004','2026-08-26'],['701043','2026-08-27'],['701026','2026-08-21']]){
 const sides=catalog.events.filter(e=>e.unit===unit&&e.date===date&&e.mode==='panorama');
 assert.deepEqual(sides.map(e=>e.side).sort(),['A','B']);assert(sides.every(e=>e.washed));
}
run("route('701042')");assert(redirected.startsWith('event.html?event=701042-'));
assert(!node('[data-dashboard]').innerHTML.includes('Carriage cleanliness history'));
run("activeDate='*';render()");
listeners.change({target:{dataset:{featureFilter:'wash'},checked:true}});
assert.equal(run('sessions(filtered()).every(s=>s.items.some(e=>e.washed))'),true);
listeners.change({target:{dataset:{featureFilter:'wash'},checked:false}});
listeners.change({target:{dataset:{featureFilter:'overnight'},checked:true}});
assert.equal(run("filtered().every(e=>e.time>='19:00'||e.time<'07:00')"),true);
listeners.change({target:{dataset:{featureFilter:'overnight'},checked:false}});

const expectedMinor=catalog.events.reduce((n,e)=>n+e.carriages.reduce((m,c)=>m+c.defects.filter(d=>d.type==='minor').length,0),0);
run("issueView='minor';render()");
assert.equal((node('[data-dashboard]').innerHTML.match(/class="minor-mark-card"/g)||[]).length,expectedMinor);
assert.equal(node('[data-capture-grid]').hidden,true);
run("route('')");assert.equal(node('[data-capture-grid]').hidden,false);

// User rule: both fully assessed sides without non-compliant grades, including automatic assessments.
run("catalog.events=['A','B'].map(side=>({id:'test-'+side,unit:'701999',side,date:'2026-09-01',time:'19:00',mode:'panorama',washed:true,carriages:Array.from({length:10},(_,i)=>({serial:String(480999+i),assessed:true,assessmentSource:'automatic',cleanliness:'Compliant',defects:[]}))}))");
assert(run('savingCase(catalog.events[0])'));
run("catalog.events.forEach(e=>e.carriages.forEach(c=>c.assessmentSource='human'))");assert(run('savingCase(catalog.events[0])'));
run("catalog.events[1].carriages[9].cleanliness='Non-Compliant'");assert.equal(run('savingCase(catalog.events[0])'),null);
console.log(`Current fleet tests passed: ${visits} paired visits, persistent wash metadata, direct panorama navigation, filters and provisional-grade boundaries.`);
