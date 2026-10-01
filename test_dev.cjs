const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function main() {
  const notices = [], timers = [];
  let reloaded = 0, refresh = {state:'running'};
  const document = {
    querySelector(selector) { return notices.find(n => selector === '.local-refresh-status' ? n.className === 'local-refresh-status' : selector === '[data-customer-preview]' && n.dataset.customerPreview === ''); },
    createElement() { return {dataset:{}, setAttribute(){}, remove(){const index=notices.indexOf(this);if(index>=0)notices.splice(index,1);}}; },
    body: {append(node){notices.push(node);}},
    addEventListener() {},
  };
  const context = {
    window: {EYYA_CATALOG:{revision:'old'}}, document, console,
    location:{reload(){reloaded++;}},
    setTimeout(fn){timers.push(fn);},
    fetch:async()=>({ok:true,json:async()=>({mode:'customer',enabled:false,apiVersion:7,refresh})}),
  };
  vm.runInNewContext(fs.readFileSync(__dirname+'/assets/dev.js','utf8'),context);
  const [first,second] = await Promise.all([context.window.EyyaDev.connect(),context.window.EyyaDev.connect()]);
  assert.equal(first.enabled,false);assert.equal(second.enabled,false);
  assert.equal(notices.filter(n=>n.className==='local-refresh-status').length,1);
  assert.equal(notices.filter(n=>n.dataset.customerPreview==='').length,1);
  assert.equal(timers.length,1);
  refresh={state:'ready',revision:'new'};
  await timers.shift()();
  assert.equal(reloaded,1);
  assert.equal(notices.filter(n=>n.className==='local-refresh-status').length,0);
  console.log('Local refresh checks passed: one progress notice, automatic catalog reload, customer read-only mode.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
