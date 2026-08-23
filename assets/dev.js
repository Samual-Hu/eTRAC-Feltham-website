window.EyyaDev = (() => {
  let session;
  async function connect() {
    if (session !== undefined) return session;
    try {
      const response = await fetch('/api/dev/status', { cache: 'no-store' });
      session = response.ok ? await response.json() : null;
    } catch (_error) {
      session = null;
    }
    return session;
  }
  async function save(payload) {
    const active = await connect();
    if (!active?.enabled) throw new Error('Development editing is not available');
    const response = await fetch('/api/dev/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-Token': active.token },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to save review');
    return result;
  }
  return { connect, save };
})();
