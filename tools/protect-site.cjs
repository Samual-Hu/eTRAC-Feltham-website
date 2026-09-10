// Build encrypted public entrypoints from local-only HTML sources.
// Password comes from STATICRYPT_PASSWORD, never from a checked-in file.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const engine = require('./staticrypt/cryptoEngine.js');
const codec = require('./staticrypt/codec.js').init(engine);
const site = path.resolve(__dirname, '..');
const source = path.resolve(site, '../site-source');
const read = p => fs.readFileSync(p, 'utf8');
const bundle = (name, file) => `const ${name}=(()=>{const exports={};\n${read(path.join(__dirname, file))}\nreturn exports;})();`;
async function main() {
  const password = process.env.STATICRYPT_PASSWORD;
  if (!/^[0-9]{4}$/.test(password || '')) throw new Error('Set STATICRYPT_PASSWORD to a four-digit code.');
  const names = fs.readdirSync(site).filter(n => n.endsWith('.html')).sort();
  const sourceNames = fs.readdirSync(source).filter(n => n.endsWith('.html')).sort();
  assert.deepEqual(sourceNames, names, 'Every public HTML entrypoint needs a local source.');
  const salt = engine.generateRandomSalt();
  const key = await engine.hashPassword(password, salt);
  const wrongKey = await engine.hashPassword(password === '0000' ? '0001' : '0000', salt);
  const runtime = bundle('etackCrypto', 'staticrypt/cryptoEngine.js') + '\n' + bundle('etackCodec', 'staticrypt/codec.js');
  const template = read(path.join(__dirname, 'access-template.html'));
  const outputs = [];
  for (const name of names) {
    const plain = read(path.join(source, name));
    assert(!plain.includes('id="etack-encrypted"'), 'Refusing to encrypt an already encrypted source.');
    const encrypted = await codec.encodeWithHashedPassword(plain, key);
    assert.equal((await codec.decode(encrypted, key, salt)).decoded, plain);
    assert.equal((await codec.decode(encrypted, wrongKey, salt)).success, false);
    const html = template.replace('__ENCRYPTED_PAYLOAD__', () => JSON.stringify({version:'staticrypt-3.5.4',salt,encrypted}))
      .replace('__STATICRYPT_RUNTIME__', () => runtime)
      .replace('__ACCESS_RUNTIME__', () => read(path.join(__dirname, 'access-runtime.js')));
    assert(html.includes('type="password"'));
    outputs.push([name, html]);
  }
  // Only replace public pages after every page passes the round-trip checks.
  for (const [name, html] of outputs) fs.writeFileSync(path.join(site, name), html);
  console.log(`Encrypted and verified ${outputs.length} HTML entrypoints. Local sources unchanged.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
