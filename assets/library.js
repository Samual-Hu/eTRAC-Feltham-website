const catalog = window.EYYA_CATALOG || { events: [] };
const grid = document.querySelector('[data-capture-grid]');
const tabs = document.querySelector('[data-date-tabs]');
const search = document.querySelector('[data-unit-search]');
const count = document.querySelector('[data-result-count]');
const empty = document.querySelector('[data-empty-state]');
const dialog = document.querySelector('[data-video-dialog]');
const video = document.querySelector('[data-video]');
const videoTitle = document.querySelector('[data-video-title]');
const dates = [...new Set(catalog.events.map((event) => event.date))].sort().reverse();
let activeDate = '*';
const drawer = document.querySelector('[data-dates-drawer]');
const backdrop = document.querySelector('[data-dates-backdrop]');

const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"></path></svg>';
const panoramaIcon = '<b>PANO</b>';
function readableDate(value) { return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)); }
function shortDate(value) { return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)); }
function sessions(events) {
  const grouped = new Map();
  events.forEach((event) => {
    const key = `${event.unit}|${event.date}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(event);
  });
  return [...grouped.values()].map((items) => ({ unit: items[0].unit, date: items[0].date, time: items[0].time || '', items: items.sort((a, b) => a.side.localeCompare(b.side)), primary: items.find((item) => item.mode === 'panorama') || items[0] })).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time) || a.unit.localeCompare(b.unit));
}
function renderTabs() {
  const all = `<button type="button" class="date-tab ${activeDate === '*' ? 'is-active' : ''}" data-date="*"><strong>All</strong><small>${sessions(catalog.events).length}</small></button>`;
  tabs.innerHTML = all + dates.map((date) => `<button type="button" class="date-tab ${date === activeDate ? 'is-active' : ''}" data-date="${date}" title="${readableDate(date)}"><strong>${shortDate(date)}</strong><small>${sessions(catalog.events.filter((item) => item.date === date)).length}</small></button>`).join('');
}
function sideBadge(items) { const sides = items.map((item) => item.side).filter(Boolean); return sides.length ? [...new Set(sides)].join('/') : ''; }
function renderCards() {
  const query = search.value.trim();
  const visible = catalog.events.filter((event) => query ? event.unit.includes(query) : (activeDate === '*' || event.date === activeDate));
  const grouped = sessions(visible);
  count.textContent = `${grouped.length} capture${grouped.length === 1 ? '' : 's'}`;
  empty.hidden = grouped.length > 0;
  grid.innerHTML = grouped.map((session) => {
    const event = session.primary;
    const isVideo = event.mode === 'video';
    const attrs = isVideo ? `type="button" data-video-event="${event.id}"` : `href="event.html?event=${encodeURIComponent(event.id)}"`;
    const tag = isVideo ? 'button' : 'a';
    const badge = sideBadge(session.items);
    return `<${tag} class="capture-card ${isVideo ? 'is-video' : 'is-panorama'}" ${attrs}><span class="capture-cover"><img src="${event.cover}" alt="Unit ${event.unit}, ${readableDate(event.date)}"><span class="capture-action ${isVideo ? '' : 'panorama-action'}" aria-hidden="true">${isVideo ? playIcon : panoramaIcon}</span>${badge ? `<span class="side-badge">${badge}</span>` : ''}</span><span class="capture-copy"><strong>${event.unit}</strong><span>${readableDate(event.date)}${event.time?` · ${event.time}`:''}</span>${event.mode === 'panorama' ? `<small>${event.carriages.length} panoramas</small>` : '<small>Video audit</small>'}</span></${tag}>`;
  }).join('');
}
function openVideo(eventId) { const capture = catalog.events.find((item) => item.id === eventId); if (!capture?.video) return; videoTitle.textContent = `Unit ${capture.unit} · ${readableDate(capture.date)}${capture.time?` · ${capture.time}`:''}`; video.src = capture.video; dialog.showModal(); video.play().catch(() => {}); }
function closeVideo() { video.pause(); video.removeAttribute('src'); video.load(); dialog.close(); }
function setDrawer(open){drawer.classList.toggle('is-open',open);drawer.setAttribute('aria-hidden',String(!open));backdrop.hidden=!open;}
tabs.addEventListener('click', (event) => { const button = event.target.closest('[data-date]'); if (!button) return; activeDate = button.dataset.date; search.value = ''; renderTabs(); renderCards(); setDrawer(false); });
search.addEventListener('input', () => { if (search.value.trim()) activeDate = '*'; renderTabs(); renderCards(); });
grid.addEventListener('click', (event) => { const card = event.target.closest('[data-video-event]'); if (card) openVideo(card.dataset.videoEvent); });
document.querySelector('[data-video-close]').addEventListener('click', closeVideo);
dialog.addEventListener('click', (event) => { if (event.target === dialog) closeVideo(); });
document.querySelector('[data-dates-open]').addEventListener('click',()=>setDrawer(true));
document.querySelector('[data-dates-close]').addEventListener('click',()=>setDrawer(false));
backdrop.addEventListener('click',()=>setDrawer(false));
document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&drawer.classList.contains('is-open'))setDrawer(false);});
renderTabs(); renderCards();
