function metricIcon(label){const paths={'Train captures':'M5 3h14v14H5z M5 9h14 M8 20l2-3m6 3-2-3 M8 6h2m4 0h2','Carriage passages':'M2 6h20v11H2z M7 6v11m10-11v11 M5 20h2m10 0h2','Inspection dates':'M4 5h16v16H4z M4 10h16 M8 2v6m8-6v6','Carriage records':'M5 3h14v18H5z M8 8h8m-8 5h8m-8 4h5','Compliant':'M4 12l5 5L20 6','Marginal':'M12 4v10 M12 18v2','Non-compliant':'M6 6l12 12M18 6L6 18','Severe':'M12 3L2 21h20L12 3z M12 9v5m0 3v1','Minor':'M12 4a8 8 0 1 0 0 16a8 8 0 0 0 0-16 M8 12h8','Graffiti':'M5 8h14v13H5z M9 8V4h6v4 M16 2h4'};return '<svg class="metric-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="'+(paths[label]||paths['Carriage records'])+'"/></svg>';}
const catalog = window.EYYA_CATALOG || {events:[]};
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel = d => new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00'));
const smallDate = d => new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short'}).format(new Date(d+'T12:00:00'));
const classOf = u => u.startsWith('701') ? '701' : u.slice(0,3);
const classNames = {'701':'Arterio (701/0)','450':'Class 450','458':'Class 458'};
const carriageCount = u => classOf(u)==='701'?10:['450','458'].includes(classOf(u))?8:0;
const grade = c => String(c.cleanliness||'').toLowerCase();
const colours = {'compliant':'#1a9d69','marginal':'#efa51b','non-compliant':'#e34e53'};
const graffitiNonCompliant = c => c.assessed && grade(c)==='non-compliant' && (c.defects||[]).some(d=>d.type==='graffiti');
const chartColour = c => !c.assessed ? '#fff' : graffitiNonCompliant(c) ? '#8054c9' : colours[grade(c)]||'#98a6b1';
const chartCondition = c => !c.assessed ? 'Not assessed' : c.cleanliness + (graffitiNonCompliant(c) ? ' · Graffiti present' : '');
// A pre-wash verdict needs complete assessments on both sides of the same pass.
// A second wash of the same formation that evening is counted separately.
function savingCase(e){return window.EyyaWashStatus.savingCase(catalog,e);}
const routeParams=new URLSearchParams(location.search);
const featureFilters={wash:routeParams.get('wash')==='1',avoidable:routeParams.get('avoidable')==='1'};
function matchesFeatures(items){return (!featureFilters.wash||items.some(e=>e.washed))&&(!featureFilters.avoidable||items.some(savingCase));}
function savings(events){const cases=sessions(events).filter(s=>s.items.some(savingCase));return {count:cases.length,water:cases.reduce((n,s)=>n+carriageCount(s.primary.unit)*225,0),cost:cases.length*182};}
function savingsMetrics(events){const v=savings(events);const note=esc(v.count+' potentially avoidable washes · Estimate: 225 L per carriage; £182 per train wash. Not measured savings.');return '<article class="fleet-metric savings-metric"><span class="metric-icon" aria-hidden="true">◈</span><strong>'+v.water.toLocaleString('en-GB')+' L</strong><b>Potential water saving</b><small>'+v.count+' washes · 225 L per carriage (estimate)</small></article><article class="fleet-metric savings-metric"><span class="metric-icon" aria-hidden="true">£</span><strong>£'+v.cost.toLocaleString('en-GB')+'</strong><b>Potential cost saving</b><small>£182 per train wash · estimated</small></article>';}
let historySide=new URLSearchParams(location.search).get('side')||'';
let activeDate=routeParams.get('date')||'*', activeClass='*', overnight=routeParams.get('overnight')==='1', unitView=routeParams.get('unit')||'';
let issueView=['severe','minor','graffiti'].includes(routeParams.get('issue'))?routeParams.get('issue'):'';
function sessions(events){const m=new Map();events.forEach(e=>{const k=[e.unit,e.date,e.time].join('|');if(!m.has(k))m.set(k,[]);m.get(k).push(e);});return [...m.values()].map(items=>({items,primary:items.find(e=>e.mode==='panorama')||items[0],cover:(items.find(e=>e.coverProvided)||items[0]).cover})).sort((a,b)=>(b.primary.date+b.primary.time).localeCompare(a.primary.date+a.primary.time));}
function filtered(){const selected=catalog.events.filter(e=>{let inDate=activeDate==='*'||e.date===activeDate;if(overnight){if(activeDate==='*')inDate=!!e.time&&(e.time>='19:00'||e.time<'07:00');else{const next=new Date(activeDate+'T12:00:00');next.setDate(next.getDate()+1);const d=next.toISOString().slice(0,10);inDate=!!e.time&&((e.date===activeDate&&e.time>='19:00')||(e.date===d&&e.time<'07:00'));}}return inDate&&(activeClass==='*'||classOf(e.unit)===activeClass);});return sessions(selected).filter(s=>matchesFeatures(s.items)).flatMap(s=>s.items);}
function metric(n,label,note='',colour=''){return `<article class="fleet-metric compact-metric">${metricIcon(label)}<strong style="color:${colour||'#123b58'}">${n}</strong><b>${label}</b>${note?`<small>${esc(note)}</small>`:''}</article>`;}
function issues(rows){return ['severe','minor','graffiti'].map(t=>({type:t,n:rows.reduce((n,c)=>n+c.defects.filter(d=>d.type===t).length,0)}));}
function latestIssue(events,type){
  for(const event of [...events].filter(e=>e.mode==='panorama').sort((a,b)=>(b.date+(b.time||'')).localeCompare(a.date+(a.time||''))||a.id.localeCompare(b.id))){
    const carriage=[...event.carriages].sort((a,b)=>a.order-b.order).find(c=>c.defects.some(d=>d.type===type));
    if(carriage)return `event.html?event=${encodeURIComponent(event.id)}&carriage=${carriage.serial}&highlight=${type}`;
  }
  return '';
}
function issuePanel(rows,events){return `<div class="issue-totals">${issues(rows).map(({type,n})=>{const href=latestIssue(events,type);const label=type[0].toUpperCase()+type.slice(1);return href?`<a class="issue-${type}" href="${esc(href)}" aria-label="${label}: ${n}. Open latest matching carriage"><strong>${n}</strong><span>${label}</span><span class="issue-arrow" aria-hidden="true">↗</span></a>`:`<div class="issue-${type} is-empty"><strong>${n}</strong><span>${label}</span></div>`;}).join('')}</div>`;}

function issueListUrl(type){const query=new URLSearchParams({issue:type});if(activeDate!=='*')query.set('date',activeDate);if(overnight)query.set('overnight','1');for(const key of ['wash','avoidable'])if(featureFilters[key])query.set(key,'1');return 'index.html?'+query;}
function issueMetric(n,type,events,list=false){const href=n?(list?issueListUrl(type):latestIssue(events,type)):'';const label=type[0].toUpperCase()+type.slice(1);return href?`<a class="fleet-metric compact-metric issue-${type} issue-metric" href="${esc(href)}" aria-label="${list?'Browse all recorded':'Open latest'} ${label.toLowerCase()} annotations">${metricIcon(label)}<span class="metric-open-cue" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h13m-6-6 6 6-6 6"/></svg></span><strong>${n}</strong><b>${label}</b></a>`:`<article class="fleet-metric compact-metric issue-${type}">${metricIcon(label)}<strong>${n}</strong><b>${label}</b></article>`;}
function overview(events){const grouped=sessions(events), units=[...new Set(events.map(e=>e.unit))];const latest=new Map();events.filter(e=>e.mode==='panorama').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).forEach(e=>e.carriages.forEach(c=>{if(c.assessed)latest.set(e.unit+'|'+e.side+'|'+c.serial,c);}));const rows=[...latest.values()];const allRows=events.filter(e=>e.mode==='panorama').flatMap(e=>e.carriages);const percentages=gradePercentages(rows),pct=g=>rows.length?percentages[g]+'%':'—';
return `<div class="fleet-heading"><div>${activeDate==='*'?'':`<span>${dateLabel(activeDate)}</span>`}</div></div><div class="fleet-metrics overview-metrics">${metric(grouped.length,'Train captures',`${grouped.filter(s=>s.items.some(e=>e.mode==='panorama')).length} panorama visits · ${grouped.filter(s=>s.items.every(e=>e.mode==='video')).length} video-only visits`)}${metric(grouped.reduce((n,s)=>n+carriageCount(s.primary.unit),0),'Carriage passages',`${units.reduce((n,u)=>n+carriageCount(u),0)} across distinct units`)}${metric(pct('compliant'),'Compliant',`${rows.length} latest assessed surfaces`,colours.compliant)}${metric(pct('marginal'),'Marginal','Of assessed surfaces',colours.marginal)}${metric(pct('non-compliant'),'Non-compliant','Of assessed surfaces',colours['non-compliant'])}${issues(allRows).map(({type,n})=>issueMetric(n,type,events,true)).join('')}${savingsMetrics(events)}</div>`;}

function issueRecords(events,type){return events.filter(e=>e.mode==='panorama').flatMap(event=>event.carriages.map(carriage=>({event,carriage,defects:carriage.defects.filter(d=>d.type===type)})).filter(row=>row.defects.length)).sort((a,b)=>(b.event.date+(b.event.time||'')).localeCompare(a.event.date+(a.event.time||''))||a.event.id.localeCompare(b.event.id)||a.carriage.order-b.carriage.order);}
function issueListing(events,type){
  const rows=issueRecords(events,type),label=type[0].toUpperCase()+type.slice(1),count=rows.reduce((n,row)=>n+row.defects.length,0);
  const carriages=new Set(rows.map(row=>[row.event.unit,row.event.side,row.carriage.serial].join('|'))).size;
  if(type==='minor')return minorListing(rows,count,carriages);
  return `<button class="overview-back" type="button" data-overview>← Fleet overview</button><div class="fleet-heading issue-list-heading"><div><h1 class="issue-${type}">${label}</h1><span>${count} recorded annotations · ${carriages} carriages · ${rows.length} panoramas</span></div><span>Newest first${activeDate==='*'?'':` · ${dateLabel(activeDate)}${overnight?' · Overnight':''}`}</span></div><section class="issue-panorama-list" aria-label="${label} carriage panoramas">${rows.map(({event,carriage,defects})=>{
    const href=`event.html?event=${encodeURIComponent(event.id)}&carriage=${carriage.serial}&highlight=${type}`;
    const boxes=defects.map(defect=>{const[x0,y0,x1,y1]=defect.box;return `<span class="issue-region issue-${type}" style="left:${x0/carriage.width*100}%;top:${y0/carriage.height*100}%;width:${(x1-x0)/carriage.width*100}%;height:${(y1-y0)/carriage.height*100}%" aria-hidden="true"></span>`;}).join('');
    return `<article class="issue-panorama-card"><div class="issue-open-row"><span>Carriage ${carriage.serial} (Side ${esc(event.side)}) &nbsp; ${dateLabel(event.date)} · ${esc(event.time)}</span><a href="${esc(href)}">Open panorama ↗</a></div><a class="issue-panorama-image" href="${esc(href)}" aria-label="Open carriage ${carriage.serial}, ${dateLabel(event.date)}, Side ${esc(event.side)} and highlight ${label.toLowerCase()}"><img loading="lazy" src="${esc(carriage.image)}" width="${carriage.width}" height="${carriage.height}" alt="Carriage ${carriage.serial} · Side ${esc(event.side)} · ${dateLabel(event.date)}">${boxes}</a></article>`;
  }).join('')||'<p class="issue-list-empty">No matching surface issues.</p>'}</section>`;
}
function minorListing(rows,count,carriages){
 return `<button class="overview-back" type="button" data-overview>← Fleet overview</button><div class="fleet-heading issue-list-heading"><div><h1 class="issue-minor">Minor</h1><span>${count} reviewed marks · ${carriages} carriages</span></div><span>Newest first · Select a mark to open its panorama</span></div><section class="minor-mark-grid" aria-label="Minor mark gallery">${rows.flatMap(({event,carriage,defects})=>defects.map(defect=>{
  const href=`event.html?event=${encodeURIComponent(event.id)}&carriage=${carriage.serial}&highlight=minor&annotation=${encodeURIComponent(defect.id)}`,b=defect.thumbnailBox,sz=defect.thumbnailSize;
  const region=b&&sz?`<span class="minor-crop-box" style="left:${b[0]/sz[0]*100}%;top:${b[1]/sz[1]*100}%;width:${(b[2]-b[0])/sz[0]*100}%;height:${(b[3]-b[1])/sz[1]*100}%"></span>`:'';
  return `<a class="minor-mark-card" href="${esc(href)}" aria-label="Minor mark ${esc(defect.id)}, carriage ${carriage.serial}, ${dateLabel(event.date)}, Side ${esc(event.side)}"><div class="minor-mark-photo" style="aspect-ratio:${sz?sz[0]+'/'+sz[1]:'4/3'}"><img loading="lazy" src="${esc(defect.thumbnail||carriage.image)}" alt="Reviewed Minor mark on carriage ${carriage.serial}">${region}</div><div class="minor-mark-copy"><span class="minor-mark-identity"><strong>${carriage.serial}</strong><span class="minor-mark-side">Side ${esc(event.side)}</span></span><time datetime="${event.date}T${esc(event.time)}">${dateLabel(event.date)} · ${esc(event.time)}</time></div></a>`;
 })).join('')||'<p class="issue-list-empty">No matching Minor marks.</p>'}</section>`;
}



function render(){
  if(unitView){openUnit(unitView);return;}
  $('.library-main').append($('.fleet-toolbar'));
  const events=unitView?catalog.events.filter(e=>e.unit===unitView):filtered();
  $('[data-dashboard]').innerHTML=issueView?issueListing(events,issueView):overview(events);
  const toolbar=$('.fleet-toolbar');$('.captures-bar').append(toolbar);toolbar.hidden=!!unitView||!!issueView;
  $('.captures-bar').hidden=!!issueView;$('[data-capture-grid]').hidden=!!issueView;
  $('.captures-heading').textContent=unitView?`${unitView} captures`:'Captures';
  const grouped=sessions(events);$('[data-empty-state]').hidden=!!issueView||!!grouped.length;
  $('[data-period-label]').textContent=activeDate==='*'?'All dates':dateLabel(activeDate);
  $('[data-capture-grid]').innerHTML=issueView?'':grouped.map(s=>{const e=s.primary,isVideo=e.mode==='video',tag=isVideo?'button':'a',badge=[...new Set(s.items.map(e=>e.side).filter(Boolean))].join('/');return `<${tag} class="capture-card ${isVideo?'is-video':'is-panorama'}" ${isVideo?`type="button" data-video-event="${e.id}"`:`href="event.html?event=${encodeURIComponent(e.id)}"`}><span class="capture-cover"><img loading="lazy" src="${esc(s.cover)}" alt="Unit ${e.unit}"><span class="capture-action ${isVideo?'':'panorama-action'}">${isVideo?'▶':'PANO'}</span>${badge&&!badge.includes('/')?`<span class="side-badge">Side ${badge}</span>`:''}${s.items.some(e=>e.washed)?'<span class="wash-badge" title="Entering the operating wash plant; surface shown before washing">◆ Wash active</span>':''}${s.items.some(savingCase)?`<span class="avoidable-badge" title="${esc(savingCase(s.items.find(savingCase)).reason)}">▣ Avoidable wash</span>`:''}</span><span class="capture-copy"><strong>${e.unit}</strong><span class="capture-when">${smallDate(e.date)} ${e.date.slice(0,4)} <time>${e.time}</time></span><small>${isVideo?'Video audit':(e.video?'Panoramas & video audit':'Panoramas')}</small></span></${tag}>`;}).join('');
  renderDates();
  window.EyyaIssueInspection?.setup($('[data-dashboard]'),issueView);
}
function gradePercentages(rows){
 const keys=['compliant','marginal','non-compliant'],counts=keys.map(g=>rows.filter(c=>grade(c)===g).length),total=counts.reduce((a,b)=>a+b,0);
 if(!total)return Object.fromEntries(keys.map(k=>[k,0]));
 const raw=counts.map(n=>n/total*100),values=raw.map(Math.floor),order=keys.map((_,i)=>i).sort((a,b)=>(raw[b]-values[b])-(raw[a]-values[a])||a-b);
 for(let n=100-values.reduce((a,b)=>a+b,0),i=0;i<n;i++)values[order[i]]++;
 return Object.fromEntries(keys.map((k,i)=>[k,values[i]]));
}
let calendarMonth='';
function renderDates(){
 const dates=[...new Set(catalog.events.map(e=>e.date))].sort(),latest=dates.at(-1)||new Date().toISOString().slice(0,10);
 if(!calendarMonth)calendarMonth=(activeDate==='*'?latest:activeDate).slice(0,7);
 const [year,month]=calendarMonth.split('-').map(Number),first=new Date(year,month-1,1),offset=(first.getDay()+6)%7,last=new Date(year,month,0).getDate(),monthLabel=first.toLocaleDateString('en-GB',{month:'long',year:'numeric'});
 const cells=Array.from({length:offset},()=>'<span class="calendar-blank"></span>');
 for(let day=1;day<=last;day++){const d=calendarMonth+'-'+String(day).padStart(2,'0'),available=dates.includes(d);cells.push(`<button type="button" class="calendar-day ${available?'has-captures':''} ${activeDate===d?'is-selected':''}" ${available?`data-date="${d}"`:'disabled'} aria-label="${dateLabel(d)}${available?', captures available':', no captures'}" ${activeDate===d?'aria-current="date"':''}>${day}${available?'<span class="calendar-capture-dot" aria-hidden="true"></span>':''}</button>`);}
 $('[data-date-tabs]').innerHTML=`<div class="calendar-month"><button type="button" data-calendar-step="-1" aria-label="Previous month" ${calendarMonth<=dates[0]?.slice(0,7)?'disabled':''}>‹</button><strong>${monthLabel}</strong><button type="button" data-calendar-step="1" aria-label="Next month" ${calendarMonth>=latest.slice(0,7)?'disabled':''}>›</button></div><div class="calendar-weekdays">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>'<span>'+d+'</span>').join('')}</div><div class="calendar-days">${cells.join('')}</div><button type="button" class="calendar-all ${activeDate==='*'?'is-selected':''}" data-date="*">All dates</button>`;
 const units=[...new Set(catalog.events.filter(e=>e.mode==='panorama').map(e=>e.unit))].sort();
 $('[data-history-select]').innerHTML='<option value="">Select train unit</option>'+units.map(u=>`<option value="${u}">${u}</option>`).join('');
 window.EyyaTrainPicker.render(document.querySelector('.train-picker'),catalog);
 $('[data-class-tabs]').innerHTML=[['wash','Wash active'],['avoidable','Avoidable wash'],['overnight','Overnight · 19:00–07:00']].map(([key,label])=>`<label class="feature-filter"><input type="checkbox" data-feature-filter="${key}" ${(key==='overnight'?overnight:featureFilters[key])?'checked':''}>${label}</label>`).join('');
}
function trainPicker(open){$('[data-train-menu]').hidden=!open;$('[data-train-picker]').setAttribute('aria-expanded',String(open));}
function drawer(open){const el=$('[data-dates-drawer]');el.classList.toggle('is-open',open);el.setAttribute('aria-hidden',String(!open));$('[data-dates-backdrop]').hidden=!open;if(open){trainPicker(false);const rect=$('[data-dates-open]').getBoundingClientRect();el.style.top=Math.max(12,Math.min(innerHeight-420,rect.bottom+8))+'px';el.style.right=Math.max(12,innerWidth-rect.right)+'px';}}
function openUnit(unit){const all=catalog.events.filter(e=>e.unit===unit&&e.mode==='panorama');const side=historySide||'A';const filtered=all.filter(e=>(activeDate==='*'||e.date===activeDate)&&e.side===side);const target=(filtered.length?filtered:all.filter(e=>e.side===side).length?all.filter(e=>e.side===side):all).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))[0];if(target)location.replace('event.html?event='+encodeURIComponent(target.id));else{unitView='';render();}}
function route(unit){if(unit){openUnit(unit);return;}historySide='';unitView='';issueView='';const url=new URL(location);url.searchParams.delete('issue');url.searchParams.delete('unit');history.pushState({},'',url);render();window.scrollTo(0,0);}

document.addEventListener('click',e=>{const t=e.target.closest('button,[data-dates-backdrop],[data-video-event]');if(!t)return;if(t.hasAttribute('data-train-picker'))trainPicker($('[data-train-menu]').hidden);if(t.dataset.openUnit){trainPicker(false);route(t.dataset.openUnit);}if(t.dataset.calendarStep){const [y,m]=calendarMonth.split('-').map(Number),d=new Date(y,m-1+Number(t.dataset.calendarStep),1);calendarMonth=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');renderDates();}if(t.hasAttribute('data-dates-open'))drawer(true);if(t.hasAttribute('data-dates-close')||t.hasAttribute('data-dates-backdrop'))drawer(false);if(t.hasAttribute('data-history-side')){historySide=t.dataset.historySide;render();}if(t.dataset.date){activeDate=t.dataset.date;unitView='';render();}if(t.dataset.class){activeClass=t.dataset.class;render();}if(t.hasAttribute('data-overview'))route('');if(t.dataset.videoEvent){const c=catalog.events.find(c=>c.id===t.dataset.videoEvent);$('[data-video-title]').textContent=`Unit ${c.unit} · ${dateLabel(c.date)} ${c.time}`;$('[data-video]').src=c.video;$('[data-video-dialog]').showModal();$('[data-video]').play().catch(()=>{});}if(t.hasAttribute('data-video-close'))$('[data-video-dialog]').close();});
$('[data-video-dialog]').addEventListener('close',()=>{$('[data-video]').pause();$('[data-video]').removeAttribute('src');$('[data-video]').load();});
$('[data-history-select]').addEventListener('change',e=>route(e.target.value));
document.addEventListener('change',e=>{const key=e.target?.dataset?.featureFilter;if(!key)return;if(key==='overnight')overnight=e.target.checked;else if(Object.hasOwn(featureFilters,key))featureFilters[key]=e.target.checked;else return;render();});window.addEventListener('popstate',()=>{const params=new URLSearchParams(location.search);unitView=params.get('unit')||'';issueView=['severe','minor','graffiti'].includes(params.get('issue'))?params.get('issue'):'';render();});render();

document.addEventListener('click',e=>{if(!e.target.closest('.train-picker'))trainPicker(false);});document.addEventListener('keydown',e=>{if(e.key==='Escape'){trainPicker(false);drawer(false);}});
