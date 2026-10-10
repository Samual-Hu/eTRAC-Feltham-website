const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const picker=require('./assets/train-picker.js'),catalog=require('./assets/catalog.json');let back,installed,selection;
const capture=catalog.events.find(e=>e.unit==='701042'&&e.side==='A');
const location={href:'http://localhost/event.html'};
vm.runInNewContext(fs.readFileSync(__dirname+'/assets/event-dates.js','utf8'),{catalog,capture,location,document:{createElement(){return {setAttribute(){}}},querySelector(s){return s==='.event-left'?{prepend(b){back=b}}:{}}},window:{EyyaTrainPicker:{install(host,c,o){installed=o;selection=o.onSelect},destination:picker.destination}}});
assert.equal(back.href,'index.html');assert.equal(installed.current,capture.unit);selection('701026');const u=new URL(location.href,'http://localhost');const event=catalog.events.find(e=>e.id===u.searchParams.get('event'));assert.equal(event.unit,'701026');assert.equal(event.side,'A');
console.log('Shared panorama train picker passed: current identity, selected unit and same-side destination.');
