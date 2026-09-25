window.EyyaDev = (() => {
  const requiredApiVersion = 5;
  let session;
  async function connect() {
    if (session !== undefined) return session;
    try {
      const response = await fetch('/api/dev/status', { cache: 'no-store' });
      session = response.ok ? await response.json() : null;
      if (session?.enabled && session.apiVersion !== requiredApiVersion) {
        session = { enabled: false, outdated: true };
        if (!document.querySelector('[data-outdated-server]')) {
          const warning = document.createElement('div');
          warning.className = 'outdated-server-warning';
          warning.dataset.outdatedServer = '';
          warning.innerHTML = '<strong>LOCAL SERVER UPDATE REQUIRED</strong><span>Close the old server window and reopen <b>Start Local Website.bat</b> to use the latest annotation fixes.</span>';
          document.body.append(warning);
        }
      }
      if (session?.mode === 'customer' && !document.querySelector('[data-customer-preview]')) {
        const badge = document.createElement('div');
        badge.className = 'customer-preview-badge';
        badge.dataset.customerPreview = '';
        badge.textContent = 'CUSTOMER VIEW · READ ONLY';
        document.body.append(badge);
      }
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
  async function launchAnnotation(payload) {
    const active = await connect();
    if (!active?.enabled) throw new Error('Local development mode is required');
    const response = await fetch('/api/dev/launch-annotation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-Token': active.token },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to launch the annotation app');
    return result;
  }
  return { connect, save, launchAnnotation };
})();
document.addEventListener('DOMContentLoaded', () => window.EyyaDev.connect());
