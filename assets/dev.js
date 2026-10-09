window.EyyaDev = (() => {
  const requiredApiVersion = 8;
  let session;
  function watchRefresh(initial) {
    if(initial?.state !== 'running'||document.querySelector('.local-refresh-status'))return;
    const notice=document.createElement('div');
    notice.className='local-refresh-status';notice.setAttribute('role','status');
    notice.textContent='Updating captures…';document.body.append(notice);
    async function poll(){
      try{
        const response=await fetch('/api/dev/status',{cache:'no-store'});
        if(!response.ok){notice.remove();return;}
        const status=(await response.json()).refresh;
        if(status?.state==='running'){setTimeout(poll,2000);return;}
        if(status?.state==='ready'){
          notice.remove();
          if(status.revision!==window.EYYA_CATALOG?.revision)location.reload();
        }else{
          notice.textContent='Capture refresh failed. Existing records are still available.';
          console.warn(status?.error||'Local capture refresh failed');
        }
      }catch(_error){notice.remove();}
    }
    setTimeout(poll,2000);
  }
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
      watchRefresh(session?.refresh);
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
    applyUpdates(result);
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
  function applyUpdates(result) {
    queueVersion++;queueRequest=null;
    for (const updated of result.eventUpdates||[]) {
      const current=window.EYYA_CATALOG.events.find(e=>e.id===updated.id);
      if(current)Object.assign(current,updated);
    }
    if(result.revision)window.EYYA_CATALOG.revision=result.revision;
    window.dispatchEvent(new CustomEvent('eyya:review-saved',{detail:result}));
  }
  let queueRequest;
  let queueVersion=0;
  function refreshQueueCounts(){if(queueRequest)return queueRequest;const version=queueVersion;const task=(async()=>{const response=await fetch('/api/dev/pipeline-review-queue',{cache:'no-store'});const result=await response.json();if(!response.ok)throw new Error(result.error||'无法读取审核进度');if(version===queueVersion)window.dispatchEvent(new CustomEvent('eyya:queue-counted',{detail:result.counts}));return result;})().finally(()=>{if(queueRequest===task)queueRequest=null;});queueRequest=task;return task;}
  return { connect, save, launchAnnotation, applyUpdates, refreshQueueCounts };
})();
document.addEventListener('DOMContentLoaded', async () => {
 const session=await window.EyyaDev.connect();if(!session?.enabled)return;
 const host=document.querySelector('.library-actions')||document.querySelector('.event-left');if(!host)return;
 const link=document.createElement('a');link.href='/api/dev/pipeline-review-queue.html';link.className='local-review-queue-link';link.textContent='审核队列';host.append(link);
 function show(c){let badge=link.querySelector('.local-review-count');if(!badge){badge=document.createElement('span');badge.className='local-review-count';link.append(badge);}badge.textContent=c.candidates+' 个框';let surface=link.querySelector('.local-review-surface-count');if(!surface){surface=document.createElement('small');surface.className='local-review-surface-count';surface.style.cssText='margin-left:7px;font-size:11px;color:#526c7b';link.append(surface);}surface.textContent='整图 '+c.surface_checks;link.setAttribute('aria-label',`审核队列：${c.candidates} 个待审框，${c.surface_checks} 张全景待整图检查`);link.title='接受或判为误标都会完成一条。整图检查另行计数。';}
 async function count(){try{await window.EyyaDev.refreshQueueCounts();}catch(_){}}
 window.addEventListener('eyya:queue-counted',e=>show(e.detail));
 count();window.addEventListener('eyya:review-saved',count);
});

