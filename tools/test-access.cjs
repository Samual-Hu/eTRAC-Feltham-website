const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const site = path.resolve(__dirname, '..');
const code = process.env.STATICRYPT_PASSWORD;
assert(/^[0-9]{4}$/.test(code || ''), 'Set the test access code in the environment.');
async function openPage(name, storage) {
  const html = fs.readFileSync(path.join(site, name), 'utf8');
  const elements = {
    'etack-encrypted': {textContent: html.match(/id="etack-encrypted" type="application\/json">([^<]+)</)[1]},
    'access-form': {addEventListener(type, fn) { this.submit = fn; }},
    'access-code': {value:'',focus(){}}, 'unlock': {}, 'error': {}
  };
  const writes = [];
  const ctx = vm.createContext({window:{crypto:webcrypto}, TextEncoder, TextDecoder,
    sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    document:{getElementById:id=>elements[id],open(){},write:s=>writes.push(s),close(){}}});
  for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) await vm.runInContext(script[1], ctx);
  return {elements,writes,html};
}
(async () => {
  const storage = new Map();
  const first = await openPage('index.html', storage);
  assert.equal(first.writes.length, 0, 'Fresh visit must be locked');
  first.elements['access-code'].value = code === '0000' ? '0001' : '0000';
  await first.elements['access-form'].submit({preventDefault(){}});
  assert.equal(first.writes.length, 0);
  assert.match(first.elements.error.textContent, /Incorrect/);
  first.elements['access-code'].value = code;
  await first.elements['access-form'].submit({preventDefault(){}});
  assert.equal(first.writes[0], fs.readFileSync(path.resolve(site,'../site-source/index.html'),'utf8'));
  assert.equal(storage.size, 1);
  assert(![...storage.values()].includes(code), 'Never store the plaintext access code');
  for (const name of ['event.html','compare.html','train-701048.html']) {
    const unlocked = await openPage(name, storage);
    assert.equal(unlocked.writes[0], fs.readFileSync(path.resolve(site,'../site-source',name),'utf8'));
    assert.equal((await openPage(name,new Map())).writes.length, 0, 'Direct fresh visit must be locked');
    assert(unlocked.html.includes('type="password"'));
  }
  const blockedStorage = {get(){throw Error('Storage blocked');},set(){throw Error('Storage blocked');},delete(){}};
  const fallback = await openPage('index.html',blockedStorage);
  fallback.elements['access-code'].value = code;
  await fallback.elements['access-form'].submit({preventDefault(){}});
  assert.equal(fallback.writes.length,1,'Login must work without browser storage');
  console.log('Access checks passed: masked input, fresh/direct visits, wrong/correct code, tab navigation, blocked storage.');
})().catch(e=>{console.error(e);process.exitCode=1;});
