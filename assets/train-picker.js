(function(root){
 'use strict';
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icon='<svg class="train-picker-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M5 10h14 M8 6h2m4 0h2 M8 14h.01M16 14h.01 M9 18l-3 4m9-4 3 4 M8 20h8"/></svg>';
 function units(catalog){return [...new Set(catalog.events.filter(e=>e.mode==='panorama').map(e=>e.unit))].sort();}
 function dates(catalog,unit){return new Set(catalog.events.filter(e=>e.mode==='panorama'&&e.unit===unit).map(e=>e.date)).size;}
 function menu(catalog,current=''){
  const all=units(catalog),sections=['450','701','458'].map(k=>{const group=all.filter(u=>u.startsWith(k));return group.length?`<section class="train-group"><h2>${k==='701'?'701/0 Class':k+' Class'}</h2><div class="train-unit-grid class-${k}">${group.map(u=>{const n=dates(catalog,u);return `<button type="button" data-open-unit="${esc(u)}" class="${n>=3?'has-history':''} ${u===current?'is-current-unit':''}" aria-label="${esc(u)}, ${n} inspection dates">${esc(u.replaceAll('+',' + '))}</button>`;}).join('')}</div></section>`:'';}).join('');
  return sections+(all.some(u=>dates(catalog,u)>=3)?'<p class="train-history-key"><i aria-hidden="true"></i>3+ inspection dates</p>':'');
 }
 function render(host,catalog,current=''){if(!host)return;host.querySelector('[data-train-menu]').innerHTML=menu(catalog,current);const button=host.querySelector('[data-train-picker]');button.innerHTML=icon+'<span>Select train unit</span><span aria-hidden="true">▾</span>';}
 function destination(catalog,unit,{side='A',date='*',serial=''}={}){
  let all=catalog.events.filter(e=>e.unit===unit&&e.mode==='panorama').sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  const filtered=all.filter(e=>date==='*'||e.date===date);if(filtered.length)all=filtered;
  const event=all.find(e=>e.side===side)||all[0];if(!event)return null;
  const p=new URLSearchParams({event:event.id});if(event.carriages.some(c=>c.serial===serial))p.set('carriage',serial);return 'event.html?'+p;
 }
 function install(host,catalog,{current='',onSelect}={}){
  render(host,catalog,current);const button=host.querySelector('[data-train-picker]'),panel=host.querySelector('[data-train-menu]');
  function close(){panel.hidden=true;button.setAttribute('aria-expanded','false');}
  button.addEventListener('click',()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));});
  panel.addEventListener('click',e=>{const b=e.target.closest('[data-open-unit]');if(!b)return;close();onSelect(b.dataset.openUnit);});
  document.addEventListener('click',e=>{if(!host.contains(e.target))close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});return {close};
 }
 root.EyyaTrainPicker={menu,render,install,dates,destination};if(typeof module==='object')module.exports=root.EyyaTrainPicker;
})(typeof window==='object'?window:globalThis);
