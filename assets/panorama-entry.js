(async()=>{
 const id=new URLSearchParams(location.search).get('event'),catalog=window.EYYA_CATALOG,event=catalog?.events.find(e=>e.id===id);if(event?.mode!=='panorama')return;
 const script=url=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=url;s.onload=ok;s.onerror=no;document.head.append(s);});
 if(!window.EyyaPanoramaCore)await script('assets/panorama-comparison-core.js?v=20261009r2');
 if(!window.EyyaComparisonDates)await script('assets/comparison-dates.js?v=20261009r2');
 const host=document.querySelector('.event-left'),viewport=document.querySelector('[data-viewport]');if(!host||!viewport)return;host.querySelectorAll('[data-panorama-compare-button]').forEach(n=>n.remove());
 const current=()=>{const panels=[...document.querySelectorAll('.event-carriage')],index=Math.max(0,Math.min(panels.length-1,Math.round(viewport.scrollLeft/Math.max(1,viewport.clientWidth))));return panels[index]?.dataset.serial||event.carriages[0]?.serial;};
 const picker=window.EyyaComparisonDates.install(host,{catalog,event,serial:current,openDates:true});
 viewport.addEventListener('scroll',picker.update,{passive:true});window.addEventListener('resize',picker.update);
 const selected=new URLSearchParams(location.search).get('carriage');if(selected)document.querySelector(`[data-serial="${selected}"]`)?.scrollIntoView({block:'nearest',inline:'start',behavior:'instant'});picker.update();
})();
