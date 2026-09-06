// Navigate between panorama inspections of the same unit and side.
if (capture?.mode === 'panorama') {
  const back = document.createElement('a');
  back.className = 'lifecycle-back';
  back.href = `index.html?unit=${encodeURIComponent(capture.unit)}&side=${encodeURIComponent(capture.side || '')}`;
  back.textContent = '‹';
  back.title = 'Back to Surface life cycle';
  back.setAttribute('aria-label', 'Back to Surface life cycle');
  document.querySelector('.event-left').prepend(back);
  const inspections = catalog.events.filter(e => e.unit === capture.unit && e.side === capture.side && e.mode === 'panorama')
    .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
  const nav = document.querySelector('[data-event-dates]');
  const select = nav.querySelector('select');
  const index = inspections.findIndex(e => e.id === capture.id);
  nav.hidden = inspections.length < 2;
  inspections.forEach(e => {
    const option = document.createElement('option');
    option.value = e.id;
    option.textContent = `${readableDate(e.date)}${e.time ? ' · '+e.time : ''}`;
    option.selected = e.id === capture.id;
    select.append(option);
  });
  function go(id) {
    const target = inspections.find(e => e.id === id);
    if (!target) return;
    const viewport = document.querySelector('[data-viewport]').getBoundingClientRect();
    const panels = [...document.querySelectorAll('[data-serial]')];
    const current = panels.reduce((best,p) => {
      const r=p.getBoundingClientRect();
      const visible=Math.max(0,Math.min(r.right,viewport.right)-Math.max(r.left,viewport.left));
      return visible>best.visible ? {serial:p.dataset.serial,visible} : best;
    }, {serial:'',visible:-1}).serial;
    const url = new URL('event.html',location.href);
    url.searchParams.set('event',id);
    if (target.carriages.some(c=>c.serial===current)) url.searchParams.set('carriage',current);
    location.href=url.href;
  }
  select.addEventListener('change',()=>go(select.value));
  const previous=nav.querySelector('[data-earlier-event]'),next=nav.querySelector('[data-later-event]');
  previous.disabled=index===0;next.disabled=index===inspections.length-1;
  previous.addEventListener('click',()=>go(inspections[index-1]?.id));
  next.addEventListener('click',()=>go(inspections[index+1]?.id));
}
