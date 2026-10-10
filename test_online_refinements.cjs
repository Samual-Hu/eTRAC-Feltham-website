const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const site=__dirname,catalog=JSON.parse(fs.readFileSync(site+'/assets/catalog.json','utf8'));
const core=require(site+'/assets/panorama-comparison-core.js');
let selections=0;
for(const event of catalog.events.filter(e=>e.mode==='panorama'))for(const car of event.carriages){
 const all=core.visits(catalog,event,car.serial),params=new URLSearchParams({event:event.id,carriage:car.serial});
 for(const r of all)params.append('dates',r.event.id);params.append('dates','wrong-event');
 const s=core.select(catalog,params);assert.equal(s.rows.length,all.length);assert(s.rows.some(r=>r.event.id===event.id));assert.equal(new Set(s.rows.map(r=>r.event.id)).size,s.rows.length);assert(s.rows.every(r=>r.event.side===event.side&&r.carriage.serial===car.serial));
 for(let i=1;i<s.rows.length;i++)assert((s.rows[i-1].event.date+s.rows[i-1].event.time)<=(s.rows[i].event.date+s.rows[i].event.time));
 const single=core.select(catalog,new URLSearchParams({event:event.id,carriage:car.serial,dates:event.id}));assert.equal(single.rows.length,1);selections++;
}
const host={innerHTML:''},window={EyyaWashStatus:{savingCase(){return null}}},ctx=vm.createContext({window,module:{exports:{}},console});
vm.runInContext(fs.readFileSync(site+'/assets/cleanliness-history.js','utf8'),ctx);const chart=ctx.module.exports;
const e=catalog.events.find(e=>e.unit==='701042'&&e.side==='A'&&e.date==='2026-08-10');
assert(chart.svg(catalog,e,'482042').includes('>+</text>'));assert(!chart.legend(catalog,e).includes('Not assessed'));assert(!chart.legend(catalog,e).includes('Potentially avoidable wash'));
chart.render(host,catalog,e);assert(!host.innerHTML.includes('class="history-grade">Non'));assert(host.innerHTML.includes('--history-columns:5'));
const eight=catalog.events.find(e=>e.carriages.length===8);chart.render(host,catalog,eight);assert(host.innerHTML.includes('--history-columns:4'));
const fixture={events:[{id:'f',unit:'u',side:'A',mode:'panorama',date:'2026-08-01',time:'12:00',washed:false,carriages:[{serial:'s',assessed:true,cleanliness:'Compliant',defects:[]}]}]};
let legend=chart.legend(fixture,fixture.events[0]);assert(legend.includes('Compliant'));for(const text of ['Marginal','Non-compliant','Not assessed','Wash active','Counts:'])assert(!legend.includes(text));fixture.events[0].carriages[0].assessed=false;assert(chart.legend(fixture,fixture.events[0]).includes('Not assessed'));
const nodes=new Map(),node=s=>{if(!nodes.has(s))nodes.set(s,{innerHTML:'',append(){},addEventListener(){},classList:{toggle(){}},setAttribute(){}});return nodes.get(s);};
const fleet=vm.createContext({URL,URLSearchParams,Intl,Date,console,location:{search:'',toString(){return 'http://localhost/index.html'}},history:{pushState(){}},window:{EYYA_CATALOG:catalog,EyyaTrainPicker:{render(host,c){node('[data-train-menu]').innerHTML=require(site+'/assets/train-picker.js').menu(c);}},addEventListener(){},scrollTo(){}},document:{querySelector:node,addEventListener(){}}});
vm.runInContext(fs.readFileSync(site+'/assets/wash-status.js','utf8'),fleet);vm.runInContext(fs.readFileSync(site+'/assets/fleet.js','utf8'),fleet);
assert.equal(vm.runInContext('Object.values(gradePercentages(catalog.events.flatMap(e=>e.carriages).filter(c=>c.assessed))).reduce((a,b)=>a+b,0)',fleet),100);
for(let a=0;a<12;a++)for(let b=0;b<12;b++)for(let c=0;c<12;c++){if(!a&&!b&&!c)continue;const p=vm.runInContext(`gradePercentages([...Array(${a}).fill({cleanliness:'Compliant'}),...Array(${b}).fill({cleanliness:'Marginal'}),...Array(${c}).fill({cleanliness:'Non-compliant'})])`,fleet);assert.equal(Object.values(p).reduce((n,v)=>n+v,0),100);}
assert(!node('[data-dashboard]').innerHTML.includes('<h1>Fleet overview'));
assert(node('[data-train-menu]').innerHTML.includes('450 Class'));assert(node('[data-train-menu]').innerHTML.includes('701/0 Class'));assert(node('[data-date-tabs]').innerHTML.includes('Mon'));assert(node('[data-date-tabs]').innerHTML.includes('calendar-capture-dot'));
const grid=node('[data-capture-grid]').innerHTML;assert(!grid.includes('Side A/B'));assert(!grid.includes('Side B/A'));
for(const type of ['severe','graffiti']){const html=vm.runInContext(`issueListing(catalog.events,'${type}')`,fleet);assert(!html.includes('issue-panorama-meta'));assert(/Carriage \d+ \(Side [AB]\) &nbsp; .* · \d\d:\d\d/.test(html));}
console.log(`Online refinements passed: ${selections} all-date selections, dynamic legends, 4/5-column formations, 1,727 rounding distributions, calendar groups and clean issue captions.`);
