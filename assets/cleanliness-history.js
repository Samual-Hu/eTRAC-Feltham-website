(function(root){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const types=['severe','minor','graffiti'],colours={severe:'#e34e53',minor:'#2868f7',graffiti:'#8054c9'};
 const drop='M0 -7 C-2 -4 -5 -1 -5 2 A5 5 0 0 0 5 2 C5 -1 2 -4 0 -7Z';
 const time=e=>Date.parse(e.date+'T'+(e.time||'00:00')+':00');
 const grade=c=>String(c.cleanliness||'').toLowerCase();
 const color=c=>!c.assessed?'#fff':({compliant:'#1a9d69',marginal:'#efa51b','non-compliant':'#e34e53'}[grade(c)]||'#98a6b1');
 const y=c=>c.assessed?({compliant:26,marginal:72,'non-compliant':118}[grade(c)]??126):126;
 function entries(catalog,current,serial){return catalog.events.filter(e=>e.unit===current.unit&&e.side===current.side&&e.mode==='panorama').sort((a,b)=>time(a)-time(b)||a.id.localeCompare(b.id)).map(e=>({e,c:e.carriages.find(c=>c.serial===serial)})).filter(p=>p.c);}
 function svg(catalog,current,serial){
  const rows=entries(catalog,current,serial),width=Math.max(250,rows.length*47),x=i=>40+(rows.length===1?(width-75)/2:i*(width-75)/(rows.length-1));
  const link=(e,type='all')=>`event.html?event=${encodeURIComponent(e.id)}&amp;carriage=${serial}${type?'&amp;highlight='+type:''}`;
  const currentAttrs=(e,type='all')=>e.id===current.id?`data-jump="${serial}" ${type?`data-highlight="${serial}:${type}"`:''}`:'';
  let lines='';rows.forEach((p,i)=>{if(i&&p.c.assessed&&rows[i-1].c.assessed)lines+=`<path d="M${x(i-1)},${y(rows[i-1].c)} L${x(i)},${y(p.c)}"/>`;});
  const washes=new Map();catalog.events.filter(e=>e.unit===current.unit&&e.washed).sort((a,b)=>Number(b.side===current.side)-Number(a.side===current.side)).forEach(e=>{const key=e.date+'|'+e.time;if(!washes.has(key))washes.set(key,e);});
  const marks=[...washes.values()].filter(e=>rows.length&&time(e)>=time(rows[0].e)&&time(e)<=time(rows.at(-1).e)).map(e=>{
   let i=rows.findIndex(p=>time(p.e)>=time(e)),px=x(i);if(time(rows[i].e)!==time(e)&&i>0)px=x(i-1)+(x(i)-x(i-1))*(time(e)-time(rows[i-1].e))/(time(rows[i].e)-time(rows[i-1].e));
   px=Math.min(width-12,px+10);const active=e.date===current.date&&e.time===current.time,avoidable=!!root.EyyaWashStatus?.savingCase(catalog,e);
   return `<g class="chart-wash ${active?'is-current-date':'is-other-date'} ${avoidable?'avoidable-wash':''}" data-history-wash="${esc(e.id)}" role="button" tabindex="0" aria-label="Play wash-entry audit: ${esc(e.date)} ${esc(e.time)}" transform="translate(${px},9)"><title>${esc(e.date)} ${esc(e.time)} · ${avoidable?'Potentially avoidable wash; ':''}Wash active at entry; inspection image is pre-wash</title>${avoidable?'<rect class="wash-opportunity-frame" x="-7" y="-9" width="14" height="19" rx="2"/>':''}<path d="${drop}"/><path class="wash-guide" d="M0 9 V126"/></g>`;
  }).join('');
  const dots=rows.map(({e,c},i)=>{
   const automatic=c.assessmentSource==='automatic',counts=types.map(t=>({t,n:automatic?c.automaticAssessment.counts[t]:(c.defects||[]).filter(d=>d.type===t).length})).filter(p=>p.n),repeated=rows.some(p=>p.e.id!==e.id&&p.e.date===e.date),date=new Date(e.date+'T12:00:00'),label=`${date.getDate()}/${date.getMonth()+1}`;
   return `<g class="history-date ${e.id===current.id?'is-current-date':'is-other-date'}" data-history-event="${esc(e.id)}"><a href="${link(e)}" ${currentAttrs(e)} aria-label="${serial}, ${esc(e.date)} ${esc(e.time)}: ${c.assessed?esc(c.cleanliness):'Not assessed'}"><title>${esc(e.date)} ${esc(e.time)} · ${c.assessed?esc(c.cleanliness):'Not assessed'}</title><circle cx="${x(i)}" cy="${y(c)}" r="6" fill="${color(c)}" stroke="${c.assessed?'#fff':'#98a6b1'}"/><text class="chart-date" x="${x(i)}" y="161">${label}${repeated?`<tspan x="${x(i)}" dy="12">${esc(e.time)}</tspan>`:''}</text></a>${counts.map(({t,n},j)=>`<a href="${link(e)}" ${currentAttrs(e)} aria-label="${n} ${t} ${automatic?'assessment mark':'annotation'}${n===1?'':'s'}, ${serial}, ${esc(e.date)}"><title>${n} ${t} ${automatic?'assessment mark':'annotation'}${n===1?'':'s'}</title><text class="chart-issue-count" x="${x(i)+(j-(counts.length-1)/2)*17}" y="${y(c)+18}" fill="${colours[t]}">${n}</text></a>`).join('')}</g>`;
  }).join('');
  return `<svg viewBox="0 0 ${width} 180" role="group" aria-label="Carriage ${serial} cleanliness history"><g class="chart-grid">${[26,72,118].map((v,i)=>`<path d="M30 ${v} H${width-15}"/><text x="8" y="${v+4}">${['C','M','N'][i]}</text>`).join('')}</g><g class="chart-lines">${lines}</g>${marks}${dots}</svg>`;
 }
 function render(host,catalog,current){
  host.innerHTML=`<div class="history-chart-heading"><h2>Cleanliness history · Side ${esc(current.side)}</h2><span>Choose a date to open its panorama</span></div><p class="chart-legend"><span style="color:#1a9d69">● Compliant</span><span style="color:#efa51b">● Marginal</span><span style="color:#e34e53">● Non-compliant</span><span>○ Not assessed</span><span style="color:#078abe">◆ Wash active at entry</span><span class="boxed-drop" style="color:#14877f">◆ Potentially avoidable wash</span><span>Counts: <b style="color:#e34e53">Severe</b> · <b style="color:#2868f7">Minor</b> · <b style="color:#8054c9">Graffiti</b></span></p><div class="carriage-charts">${current.carriages.map(c=>`<article class="carriage-chart" data-row="${c.serial}"><h3><button type="button" data-jump="${c.serial}">${c.serial}</button></h3><div class="history-plot">${svg(catalog,current,c.serial)}</div><div class="history-tools"><span class="history-grade">${c.assessed?esc(c.cleanliness):'Not assessed'}</span><span class="history-actions"></span></div></article>`).join('')}</div>`;
 }
 function refresh(host,catalog,current){for(const c of current.carriages){const row=host.querySelector(`[data-row="${c.serial}"]`);if(row)row.querySelector('.history-plot').innerHTML=svg(catalog,current,c.serial);}}
 const api={entries,svg,render,refresh};root.EyyaHistory=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
