const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const site=__dirname,catalog=JSON.parse(fs.readFileSync(site+'/assets/catalog.json','utf8')),picker=require(site+'/assets/train-picker.js');
for(const u of ['701020','701026','701042'])assert(picker.dates(catalog,u)>=3,u);
assert.equal(picker.dates(catalog,'450047+450119'),2); // Three visits span two calendar dates.
assert(picker.menu(catalog).includes('3+ inspection dates'));
const fixture={events:[{unit:'u',mode:'panorama',date:'2026-08-01',side:'A',time:'12:00',id:'a',carriages:[{serial:'s'}]},{unit:'u',mode:'panorama',date:'2026-08-01',side:'B',time:'12:01',id:'b',carriages:[]}]};
assert.equal(picker.dates(fixture,'u'),1);assert(picker.destination(fixture,'u',{side:'A',serial:'s'}).includes('carriage=s'));
const nodes=new Map(),node=s=>{if(!nodes.has(s))nodes.set(s,{innerHTML:'',append(){},addEventListener(){},classList:{toggle(){}},setAttribute(){},querySelector(q){return node(q)}});return nodes.get(s);};
const handlers={},context=vm.createContext({URL,URLSearchParams,Intl,Date,console,location:{search:'',toString(){return 'http://localhost/index.html'}},history:{pushState(){}},window:{EYYA_CATALOG:catalog,EyyaTrainPicker:picker,addEventListener(){},scrollTo(){}},document:{querySelector:node,addEventListener(k,h){(handlers[k]??=[]).push(h)}}});
vm.runInContext(fs.readFileSync(site+'/assets/wash-status.js','utf8'),context);vm.runInContext(fs.readFileSync(site+'/assets/fleet.js','utf8'),context);
const html=node('[data-dashboard]').innerHTML;assert.equal((html.match(/compact-metric/g)||[]).length,8);assert(!/savings-metric[^>]*title=/.test(html));
vm.runInContext("drawer=open=>{globalThis.lastDrawer=open};",context);
const target={dataset:{date:'2026-08-10'},hasAttribute(){return false}};handlers.click[0]({target:{closest(){return target}}});assert.equal(context.lastDrawer,undefined,'Selecting a date must not close the calendar');
const compare=fs.readFileSync(site+'/assets/compare.js','utf8');assert(!compare.includes('Body features aligned'));assert(!compare.includes("nav.append(zl)"));assert(!compare.includes("nav.append(lock)"));assert(compare.includes("lens.addEventListener('wheel'"));
const chart=fs.readFileSync(site+'/assets/cleanliness-history.js','utf8');assert(chart.includes('y="149"'));console.log('Compact UI passed: distinct-date highlights, eight inline metrics, no savings tooltip, persistent calendar and control-free comparison.');
