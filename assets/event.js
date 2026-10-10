const catalog = window.EYYA_CATALOG || { events: [] };
const eventId = new URLSearchParams(location.search).get('event');
window.addEventListener('load', () => {
  const serial = new URLSearchParams(location.search).get('carriage');
  const type = new URLSearchParams(location.search).get('highlight');
  const mark = new URLSearchParams(location.search).get('annotation');
  if (serial && /^\d{5,6}$/.test(serial)) jump(serial, ['severe','minor','graffiti','all'].includes(type) ? type : '', 'auto', mark);
});
const capture = catalog.events.find((item) => item.id === eventId);
const track = document.querySelector('[data-track]');
const viewport = document.querySelector('[data-viewport]');
const table = document.querySelector('[data-table]');
const panoramaContent = document.querySelector('[data-panorama-content]');
const videoOnly = document.querySelector('[data-video-only]');
const dialog = document.querySelector('[data-video-dialog]');
const video = document.querySelector('[data-video]');
const magnifier = document.querySelector('[data-magnifier]');

function readableDate(value) { return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)); }
function boxStyle(defect, carriage) { const [x0,y0,x1,y1]=defect.box; return `left:${x0/carriage.width*100}%;top:${y0/carriage.height*100}%;width:${(x1-x0)/carriage.width*100}%;height:${(y1-y0)/carriage.height*100}%`; }
function gradeClass(value) { return value.toLowerCase().replace(/[^a-z]+/g,'-'); }
function defectCount(carriage,type){return carriage.defects.filter((item)=>item.type===type).length;}
function countButton(carriage,type){const value=defectCount(carriage,type);return `<button class="count-button count-${type}" type="button" data-highlight="${carriage.serial}:${type}" ${value?'':'disabled'}>${value}</button>`;}
function openVideo(id) { const selected=typeof id==='string'?catalog.events.find(e=>e.id===id):capture; if (!selected?.video) return; video.src=selected.video; dialog.showModal(); video.play().catch(()=>{}); }
function closeVideo() { video.pause(); video.removeAttribute('src'); video.load(); dialog.close(); }
document.querySelectorAll('[data-video-button]').forEach((button)=>button.addEventListener('click',openVideo));
document.querySelector('[data-video-close]').addEventListener('click',closeVideo);
dialog.addEventListener('click',(event)=>{if(event.target===dialog)closeVideo();});
table?.addEventListener('click',e=>{const wash=e.target.closest('[data-history-wash]');if(wash)openVideo(wash.dataset.historyWash);});
table?.addEventListener('keydown',e=>{const wash=e.target.closest('[data-history-wash]');if(wash&&['Enter',' '].includes(e.key)){e.preventDefault();openVideo(wash.dataset.historyWash);}});
function comparisonBranches(){return '';}
function constrainBranches(){
  document.querySelectorAll('.event-image').forEach((stage)=>{
    const occupied=[];
    stage.querySelectorAll('.defect-box').forEach((box)=>{
      const list=box.querySelector('.comparison-branches'),wrap=box.querySelector('.branch-wrap'),stem=box.querySelector('.branch-stem');if(!list||!wrap||!stem)return;
      const stageRect=stage.getBoundingClientRect(),boxRect=box.getBoundingClientRect();
      const listWidth=list.offsetWidth,listHeight=list.offsetHeight;
      const boxX=boxRect.left-stageRect.left,boxY=boxRect.top-stageRect.top;
      const rightSpace=stageRect.width-(boxX+boxRect.width),leftSpace=boxX;
      const goRight=rightSpace>=listWidth+34||rightSpace>=leftSpace;
      let x=goRight?boxX+boxRect.width+30:boxX-listWidth-30;
      let y=wrap.classList.contains('branch-up')?boxY-listHeight-18:boxY+boxRect.height+18;
      x=Math.max(5,Math.min(stageRect.width-listWidth-5,x));
      y=Math.max(5,Math.min(stageRect.height-listHeight-5,y));
      for(let attempt=0;attempt<8;attempt++){
        const clash=occupied.some((item)=>x<item.x+item.w+5&&x+listWidth+5>item.x&&y<item.y+item.h+5&&y+listHeight+5>item.y);
        if(!clash)break;
        const down=y+listHeight+7;
        y=down+listHeight<=stageRect.height-5?down:Math.max(5,y-listHeight-7);
      }
      occupied.push({x,y,w:listWidth,h:listHeight});
      list.classList.add('branch-positioned');
      list.style.left=`${x-boxX}px`;list.style.top=`${y-boxY}px`;
      const startX=boxRect.width/2,startY=boxRect.height/2,globalStartX=boxX+startX,globalStartY=boxY+startY;
      const endX=globalStartX<x?x:globalStartX>x+listWidth?x+listWidth:Math.abs(globalStartX-x)<Math.abs(globalStartX-(x+listWidth))?x:x+listWidth;
      const endY=Math.max(y,Math.min(y+listHeight,globalStartY));
      const dx=endX-globalStartX,dy=endY-globalStartY,length=Math.hypot(dx,dy);
      stem.classList.add('branch-linked');stem.style.left=`${startX}px`;stem.style.top=`${startY}px`;stem.style.width=`${length}px`;stem.style.transform=`rotate(${Math.atan2(dy,dx)*180/Math.PI}deg)`;
    });
  });
}
function bindMagnifier(stage,img){window.EyyaSurfaceLoupe.bind(stage,img,{zoomable:true});}

function renderPanoramas(){
  track.innerHTML=capture.carriages.map((carriage)=>`<article class="event-carriage" data-serial="${carriage.serial}"><div class="event-image"><img src="${carriage.image}?v=${catalog.revision||''}" alt="Carriage ${carriage.serial} exterior panorama">${carriage.defects.map((defect,index)=>`<span role="button" tabindex="0" class="defect-box defect-${defect.type}" data-defect-id="${defect.id}" data-defect-type="${defect.type}" style="${boxStyle(defect,carriage)}" aria-label="Reviewed ${defect.type} region">${comparisonBranches(defect,carriage,index)}</span>`).join('')}</div></article>`).join('');
  window.EyyaHistory.render(table,catalog,capture);
  document.querySelectorAll('.event-image').forEach((stage)=>{const image=stage.querySelector('img');bindMagnifier(stage,image);image.addEventListener('load',()=>{fitPanoramaViewport();constrainBranches();},{once:true});});
  new ResizeObserver(fitPanoramaViewport).observe(track);
  viewport.addEventListener('scroll',()=>{window.EyyaSurfaceLoupe.close();fitPanoramaViewport();},{passive:true});
  fitPanoramaViewport();
  requestAnimationFrame(constrainBranches);
}
window.addEventListener('resize',constrainBranches);
function fitPanoramaViewport(){
  if(!viewport||!track.children.length)return;
  const panels=[...track.children],index=Math.min(panels.length-1,Math.max(0,Math.round(viewport.scrollLeft/viewport.clientWidth)));
  const image=panels[index].querySelector('img'),height=image.getBoundingClientRect().height;
  if(!height)return;
  // Other carriages can have different aspect ratios. Fit the visible one,
  // rather than leaving the entire strip as tall as its tallest neighbour.
  const chrome=viewport.offsetHeight-viewport.clientHeight;
  viewport.style.height=Math.ceil(height+chrome)+'px';
}
window.addEventListener('resize',fitPanoramaViewport);
function jump(serial,flashType='',behavior='smooth',annotationId=''){const panel=document.querySelector(`[data-serial="${serial}"]`);if(!panel)return;panel.scrollIntoView({behavior,block:'nearest',inline:'start'});fitPanoramaViewport();document.querySelectorAll('[data-row]').forEach((row)=>row.classList.toggle('is-active',row.dataset.row===serial));panel.querySelectorAll('.defect-box').forEach((box)=>{box.classList.remove('is-flashing','show-branches');if(flashType&&(!annotationId||box.dataset.defectId===annotationId)&&(flashType==='all'||box.dataset.defectType===flashType))setTimeout(()=>box.classList.add('is-flashing'),120);});}

function seedAnnotations(carriage){return carriage.defects.map((item)=>({id:item.id,type:item.type,box:item.box}));}
function gradeValue(value){return value.toLowerCase().replaceAll(' ','-');}
async function enableDevelopmentEditing(){
  const dev=await window.EyyaDev.connect();if(!dev?.enabled||capture?.mode!=='panorama')return;
  document.body.classList.add('dev-mode');
  const badge=document.createElement('span');badge.className='dev-badge';badge.textContent='本地编辑';document.querySelector('.event-left').append(badge);
  capture.carriages.forEach((carriage)=>{const row=table.querySelector(`[data-row="${carriage.serial}"]`);const cell=row?.querySelector(".history-grade");if(!cell)return;cell.innerHTML=`<select class="dev-grade" aria-label="评估车厢 ${carriage.serial}"><option value="" disabled>未评估</option><option value="compliant">Compliant · 合格</option><option value="marginal">Marginal · 临界</option><option value="non-compliant">Non-compliant · 不合格</option></select>`;const select=cell.querySelector('select');select.value=carriage.assessed?gradeValue(carriage.cleanliness):'';select.title=carriage.assessmentSource==='automatic'?'自动评估，可人工修改':'人工评估';if(carriage.assessmentSource==='automatic'){const label=document.createElement('small');label.className='assessment-auto';label.textContent='自动';cell.append(label);}select.addEventListener('change',async()=>{select.disabled=true;try{await window.EyyaDev.save({action:'grade',side:capture.side,serial:carriage.serial,date:capture.date,eventId:capture.id,grade:select.value,seedAnnotations:seedAnnotations(carriage)});badge.textContent='已保存';setTimeout(()=>badge.textContent='本地编辑',2000);}catch(error){alert(error.message);}finally{select.disabled=false;select.value=carriage.assessed?gradeValue(carriage.cleanliness):'';}});});
  capture.carriages.forEach((carriage)=>{
    const row=table.querySelector(`[data-row="${carriage.serial}"]`),cell=row?.querySelector(".history-actions");if(!cell)return;
    const single=document.createElement('button');single.type='button';single.className='dev-single-annotate';single.textContent='标注';single.setAttribute('aria-label',`标注车厢 ${carriage.serial}`);
    single.addEventListener('click',async()=>{single.disabled=true;try{await window.EyyaDev.launchAnnotation({image:carriage.image});badge.textContent='标注工具已打开';setTimeout(()=>badge.textContent='本地编辑',2500);}catch(error){alert(error.message);}finally{single.disabled=false;}});
    cell.append(single);
    const choices=catalog.events.filter((item)=>item.id!==capture.id&&item.date!==capture.date&&item.mode==='panorama'&&(!capture.side||item.side===capture.side)&&item.carriages.some((candidate)=>candidate.serial===carriage.serial));
    if(!choices.length)return;
    const select=document.createElement('select');select.className='dev-compare-date';select.setAttribute('aria-label',`Open local annotation app for ${carriage.serial}`);select.innerHTML='<option value="">跨日期标注…</option>'+choices.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map((item)=>`<option value="${item.id}">${readableDate(item.date)} · ${item.time}</option>`).join('');
    select.addEventListener('change',async()=>{if(!select.value)return;const targetEvent=catalog.events.find((item)=>item.id===select.value),targetCarriage=targetEvent?.carriages.find((item)=>item.serial===carriage.serial);select.disabled=true;try{await window.EyyaDev.launchAnnotation({earlierImage:carriage.image,laterImage:targetCarriage.image});badge.textContent='标注工具已打开';setTimeout(()=>badge.textContent='本地编辑',2500);}catch(error){alert(error.message);}finally{select.value='';select.disabled=false;}});cell.append(select);
  });
  const editor=document.createElement('aside');editor.className='dev-defect-editor';editor.hidden=true;editor.innerHTML='<strong>Reviewed region</strong><select data-dev-type><option value="severe">Severe</option><option value="minor">Minor</option><option value="graffiti">Graffiti</option></select><button type="button" data-dev-save>Save</button><button type="button" class="danger" data-dev-delete>Delete</button><button type="button" data-dev-close>×</button>';document.body.append(editor);
  let active;
  track.addEventListener('contextmenu',(event)=>{if(event.target.closest('.comparison-branches a'))return;const box=event.target.closest('.defect-box');if(!box)return;event.preventDefault();event.stopPropagation();const panel=box.closest('[data-serial]');const carriage=capture.carriages.find((item)=>item.serial===panel.dataset.serial);const defect=carriage.defects.find((item)=>item.id===box.dataset.defectId);active={box,carriage,defect};editor.querySelector('[data-dev-type]').value=defect.type;const rect=box.getBoundingClientRect();editor.style.left=`${Math.min(innerWidth-205,Math.max(8,rect.left))}px`;editor.style.top=`${Math.min(innerHeight-170,rect.bottom+6)}px`;editor.hidden=false;});
  editor.querySelector('[data-dev-close]').addEventListener('click',()=>editor.hidden=true);
  editor.querySelector('[data-dev-save]').addEventListener('click',async()=>{if(!active)return;const button=editor.querySelector('[data-dev-save]');button.disabled=true;try{await window.EyyaDev.save({action:'annotation',side:capture.side,serial:active.carriage.serial,date:capture.date,eventId:capture.id,annotationId:active.defect.id,type:editor.querySelector('[data-dev-type]').value,bbox:active.defect.box,seedAnnotations:seedAnnotations(active.carriage)});editor.hidden=true;}catch(error){alert(error.message);}finally{button.disabled=false;}});
  editor.querySelector('[data-dev-delete]').addEventListener('click',async()=>{if(!active||!confirm('删除这个已确认的标注框？'))return;const button=editor.querySelector('[data-dev-delete]');button.disabled=true;try{await window.EyyaDev.save({action:'delete',side:capture.side,serial:active.carriage.serial,date:capture.date,eventId:capture.id,annotationId:active.defect.id,seedAnnotations:seedAnnotations(active.carriage)});editor.hidden=true;}catch(error){alert(error.message);}finally{button.disabled=false;}});
}
if(!capture){document.querySelector('[data-title]').textContent='Capture unavailable';panoramaContent.hidden=true;}else{
  document.title=`Unit ${capture.unit} · ${readableDate(capture.date)}`;
  document.querySelector('[data-title]').textContent=`Unit ${capture.unit}`;
  document.querySelector('[data-subtitle]').textContent=`${readableDate(capture.date)}${capture.time?` · ${capture.time}`:''}${capture.side?` · Side ${capture.side}`:''}`;
  document.querySelectorAll('.event-topbar [data-video-button]').forEach((button)=>button.hidden=!capture.video);
  const sibling=catalog.events.find((item)=>item.unit===capture.unit&&item.date===capture.date&&item.time===capture.time&&item.side&&item.side!==capture.side&&item.mode==='panorama');
  const sideToggle=document.querySelector('[data-side-toggle]');
  if(sibling){sideToggle.hidden=false;sideToggle.textContent=`Side ${capture.side} / ${sibling.side}`;sideToggle.addEventListener('click',()=>{location.href=`event.html?event=${encodeURIComponent(sibling.id)}`;});}
  if(capture.mode==='video'){panoramaContent.hidden=true;videoOnly.hidden=false;document.querySelector('[data-video-cover]').src=capture.cover;}else{videoOnly.hidden=true;renderPanoramas();track.addEventListener('click',(event)=>{if(event.target.closest('.comparison-branches a'))return;const box=event.target.closest('.defect-box');document.querySelectorAll('.defect-box.show-branches').forEach((item)=>{if(item!==box)item.classList.remove('show-branches');});if(box){event.preventDefault();event.stopPropagation();box.classList.toggle('show-branches');constrainBranches();}});document.addEventListener('click',(event)=>{if(!event.target.closest('.defect-box'))document.querySelectorAll('.defect-box.show-branches').forEach((box)=>box.classList.remove('show-branches'));});table.addEventListener('click',(event)=>{const highlight=event.target.closest('[data-highlight]');const serial=event.target.closest('[data-jump]');if(highlight){event.preventDefault();const [vehicle,type]=highlight.dataset.highlight.split(':');jump(vehicle,type);}else if(serial){event.preventDefault();jump(serial.dataset.jump,'all')};});jump(capture.carriages[0]?.serial||'');enableDevelopmentEditing();}
}

window.addEventListener('eyya:review-saved',()=>{
  if(!capture)return;
  for(const car of capture.carriages){
    const stage=track.querySelector(`[data-serial="${car.serial}"] .event-image`);
    if(!stage)continue;
    stage.querySelectorAll('.defect-box').forEach(n=>n.remove());
    stage.insertAdjacentHTML('beforeend',car.defects.map((d,i)=>`<span role="button" tabindex="0" class="defect-box defect-${d.type}" data-defect-id="${d.id}" data-defect-type="${d.type}" style="${boxStyle(d,car)}" aria-label="Reviewed ${d.type} region">${comparisonBranches(d,car,i)}</span>`).join(''));
    const row=table.querySelector(`[data-row="${car.serial}"]`);
    const grade=row?.querySelector('.dev-grade');if(grade){grade.value=car.assessed?gradeValue(car.cleanliness):'';grade.title=car.assessmentSource==='automatic'?'自动评估，可人工修改':'人工评估';row.querySelector('.assessment-auto')?.remove();if(car.assessmentSource==='automatic'){const label=document.createElement('small');label.className='assessment-auto';label.textContent='自动';grade.after(label);}}
    for(const type of ['minor','severe','graffiti']){const button=row?.querySelector(`[data-highlight="${car.serial}:${type}"]`);if(button){const n=defectCount(car,type);button.textContent=n;button.disabled=!n;}}
  }
  window.EyyaHistory.refresh(table,catalog,capture);
  requestAnimationFrame(constrainBranches);
});

// Adjacent-date panorama comparison; no heat overlays.
(()=>{const s=document.createElement('script');s.src='assets/panorama-entry.js?v=20261011compact';s.defer=true;document.head.append(s);})();
