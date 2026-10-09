(function(root){
 'use strict';
 function install(host,{catalog,event,serial,selected=[]}){
  const details=document.createElement('details');details.className='comparison-dates-picker';
  const summary=document.createElement('summary');summary.textContent='Compare dates';details.append(summary);
  const panel=document.createElement('div');panel.className='comparison-dates-menu';panel.setAttribute('aria-label','Comparison dates');details.append(panel);host.append(details);
  let lastSerial='',chosen=new Set(selected);
  function update(){
   const car=serial();if(lastSerial===car)return;lastSerial=car;
   const rows=root.EyyaPanoramaCore.visits(catalog,event,car);chosen=new Set([...chosen].filter(id=>rows.some(r=>r.event.id===id)&&id!==event.id));
   panel.replaceChildren();const title=document.createElement('strong');title.textContent=`Carriage ${car} · Side ${event.side}`;panel.append(title);
   for(const {event:e} of rows){const label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');input.type='checkbox';input.value=e.id;input.checked=e.id===event.id||chosen.has(e.id);input.disabled=e.id===event.id;input.setAttribute('aria-label',root.EyyaPanoramaCore.caption(e));text.textContent=root.EyyaPanoramaCore.caption(e);label.append(input,text);if(e.id===event.id){const tag=document.createElement('small');tag.textContent='Current';label.append(tag);}panel.append(label);input.onchange=()=>{if(input.checked)chosen.add(e.id);else chosen.delete(e.id);refreshButton();};}
   const footer=document.createElement('div');footer.className='comparison-dates-footer';const note=document.createElement('small');note.textContent='Dates are shown in time order.';const apply=document.createElement('button');apply.type='button';apply.textContent='Compare';apply.dataset.compareDatesApply='';apply.onclick=()=>{const url=new URL('compare.html',location.href);url.searchParams.set('event',event.id);url.searchParams.set('carriage',car);url.searchParams.append('dates',event.id);for(const id of chosen)url.searchParams.append('dates',id);location.href=url.href;};footer.append(note,apply);panel.append(footer);refreshButton();summary.classList.toggle('is-unavailable',rows.length<2);
  }
  function refreshButton(){const button=panel.querySelector('[data-compare-dates-apply]');if(button)button.disabled=!chosen.size;summary.textContent=chosen.size?`Compare dates (${chosen.size+1})`:'Compare dates';}
  details.addEventListener('toggle',()=>{if(details.open)update();});document.addEventListener('click',e=>{if(!details.contains(e.target))details.open=false;});document.addEventListener('keydown',e=>{if(e.key==='Escape')details.open=false;});update();
  return {update,details};
 }
 root.EyyaComparisonDates={install};
})(window);
