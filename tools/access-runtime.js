// StatiCrypt decrypts the HTML; this UI only retains the derived key for this tab.
(async function () {
  const payload = JSON.parse(document.getElementById('etack-encrypted').textContent);
  const form = document.getElementById('access-form');
  const input = document.getElementById('access-code');
  const button = document.getElementById('unlock');
  const error = document.getElementById('error');
  const storageKey = 'etack-access:' + payload.salt;
  const codec = etackCodec.init(etackCrypto);
  const readKey = () => { try { return sessionStorage.getItem(storageKey); } catch { return null; } };
  const saveKey = key => { try { sessionStorage.setItem(storageKey, key); } catch {} };
  const clearKey = () => { try { sessionStorage.removeItem(storageKey); } catch {} };
  async function unlock(key) {
    const result = await codec.decode(payload.encrypted, key, payload.salt);
    if (!result.success) return false;
    saveKey(key);
    // A remembered key can decrypt while the HTML parser is still running.
    // document.open() is then ignored and document.write() inserts the website
    // into the login page instead of replacing it. Wait for parser completion
    // and leave its current task before opening a fresh document.
    await new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve, {once:true});
      } else resolve();
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    // Keep the current path, query and fragment so direct comparison links work.
    document.open();
    document.write(result.decoded);
    document.close();
    return true;
  }
  if (!window.crypto || !window.crypto.subtle) {
    error.textContent = 'Please open this website using HTTPS.';
    button.disabled = true;
    return;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!/^[0-9]{4}$/.test(input.value)) {
      error.textContent = 'Enter a four-digit access code.';
      return;
    }
    button.disabled = true;
    button.textContent = 'Unlocking…';
    error.textContent = '';
    try {
      const key = await etackCrypto.hashPassword(input.value, payload.salt);
      input.value = '';
      if (await unlock(key)) return;
      clearKey();
      error.textContent = 'Incorrect access code. Please try again.';
    } catch {
      error.textContent = 'Unable to unlock this page. Please reload and try again.';
    }
    button.disabled = false;
    button.textContent = 'Enter';
    input.focus();
  });
  const saved = readKey();
  if (saved) {
    button.disabled = true;
    try { if (await unlock(saved)) return; } catch {}
    clearKey();
    button.disabled = false;
  }
})();
