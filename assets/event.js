const catalog = window.EYYA_CATALOG || { events: [] };
const eventId = new URLSearchParams(location.search).get('event');
const capture = catalog.events.find((item) => item.id === eventId);
const track = document.querySelector('[data-track]');
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
function openVideo() { if (!capture?.video) return; video.src=capture.video; dialog.showModal(); video.play().catch(()=>{}); }
function closeVideo() { video.pause(); video.removeAttribute('src'); video.load(); dialog.close(); }
document.querySelectorAll('[data-video-button]').forEach((button)=>button.addEventListener('click',openVideo));
document.querySelector('[data-video-close]').addEventListener('click',closeVideo);
dialog.addEventListener('click',(event)=>{if(event.target===dialog)closeVideo();});
function comparisonBranches(defect, carriage, index) {
  if(!defect.compareOptions?.length)return'';
  const horizontal = defect.box[2] / carriage.width > .62 ? 'branch-left' : defect.box[0] / carriage.width < .38 ? 'branch-right' : index % 2 ? 'branch-left' : 'branch-right';
  const centreY=(defect.box[1]+defect.box[3])/(2*carriage.height);
  const vertical = centreY < .32 ? 'branch-down' : centreY > .68 ? 'branch-up' : index % 2 ? 'branch-up' : 'branch-down';
  const colours=['#20d9c2','#ffb000','#ff6482','#76a7ff','#c57cff','#65cf70'];
  return `<span class="branch-wrap ${horizontal} ${vertical}" style="--branch-colour:${colours[index%colours.length]}"><span class="branch-stem" aria-hidden="true"></span><span class="comparison-branches">${defect.compareOptions.map((option)=>`<a href="compare.html?comparison=${encodeURIComponent(option.comparisonId)}">${readableDate(option.date)}</a>`).join('')}</span></span>`;
}
function bindMagnifier(stage,img){stage.addEventListener('pointermove',(event)=>{if(event.pointerType==='touch')return;const rect=img.getBoundingClientRect();const naturalWidth=img.naturalWidth||rect.width;const naturalHeight=img.naturalHeight||rect.height;const sourceX=(event.clientX-rect.left)/rect.width*naturalWidth;const sourceY=(event.clientY-rect.top)/rect.height*naturalHeight;magnifier.classList.add('is-visible');const lensWidth=magnifier.offsetWidth||520;const lensHeight=magnifier.offsetHeight||330;let left=event.clientX+22;let top=event.clientY+22;if(left+lensWidth>window.innerWidth-12)left=event.clientX-lensWidth-22;if(top+lensHeight>window.innerHeight-12)top=event.clientY-lensHeight-22;magnifier.style.left=`${Math.max(12,left)}px`;magnifier.style.top=`${Math.max(12,top)}px`;magnifier.style.backgroundImage=`url("${img.currentSrc||img.src}")`;magnifier.style.backgroundSize=`${naturalWidth}px ${naturalHeight}px`;magnifier.style.backgroundPosition=`${lensWidth/2-sourceX}px ${lensHeight/2-sourceY}px`;});stage.addEventListener('pointerleave',()=>magnifier.classList.remove('is-visible'));}
function renderPanoramas(){
  track.innerHTML=capture.carriages.map((carriage)=>`<article class="event-carriage" data-serial="${carriage.serial}"><div class="event-image"><img src="${carriage.image}" alt="Carriage ${carriage.serial} exterior panorama">${carriage.defects.map((defect,index)=>`<span role="button" tabindex="0" class="defect-box defect-${defect.type}" data-defect-id="${defect.id}" data-defect-type="${defect.type}" style="${boxStyle(defect,carriage)}" aria-label="Reviewed ${defect.type} region">${comparisonBranches(defect,carriage,index)}</span>`).join('')}</div></article>`).join('');
  table.innerHTML=capture.carriages.map((carriage)=>`<tr data-row="${carriage.serial}"><td>${carriage.order}</td><td><button class="serial-button" type="button" data-jump="${carriage.serial}">${carriage.serial}</button></td><td><span class="cleanliness-status cleanliness-${gradeClass(carriage.cleanliness)}">${carriage.cleanliness}</span></td><td>${countButton(carriage,'severe')}</td><td>${countButton(carriage,'minor')}</td><td>${countButton(carriage,'graffiti')}</td></tr>`).join('');
  document.querySelectorAll('.event-image').forEach((stage)=>bindMagnifier(stage,stage.querySelector('img')));
}
function jump(serial,flashType=''){const panel=document.querySelector(`[data-serial="${serial}"]`);if(!panel)return;panel.scrollIntoView({behavior:'smooth',block:'nearest',inline:'start'});document.querySelectorAll('[data-row]').forEach((row)=>row.classList.toggle('is-active',row.dataset.row===serial));panel.querySelectorAll('.defect-box').forEach((box)=>{box.classList.remove('is-flashing','show-branches');if(flashType&&box.dataset.defectType===flashType){setTimeout(()=>box.classList.add('is-flashing'),120);setTimeout(()=>box.classList.add('show-branches'),1500);}});}

function seedAnnotations(carriage){return carriage.defects.map((item)=>({id:item.id,type:item.type,box:item.box}));}
function gradeValue(value){return value.toLowerCase().replaceAll(' ','-');}
async function enableDevelopmentEditing(){
  const dev=await window.EyyaDev.connect();if(!dev?.enabled||capture?.mode!=='panorama')return;
  document.body.classList.add('dev-mode');
  const badge=document.createElement('span');badge.className='dev-badge';badge.textContent='LOCAL EDIT';document.querySelector('.event-left').append(badge);
  capture.carriages.forEach((carriage)=>{const row=table.querySelector(`[data-row="${carriage.serial}"]`);const cell=row?.children[2];if(!cell)return;cell.innerHTML=`<select class="dev-grade" aria-label="Edit cleanliness for ${carriage.serial}"><option value="compliant">Compliant</option><option value="marginal">Marginal</option><option value="non-compliant">Non-compliant</option></select>`;const select=cell.querySelector('select');select.value=gradeValue(carriage.cleanliness);select.addEventListener('change',async()=>{select.disabled=true;await window.EyyaDev.save({action:'grade',serial:carriage.serial,date:capture.date,grade:select.value,seedAnnotations:seedAnnotations(carriage)});location.reload();});});
  capture.carriages.forEach((carriage)=>{const row=table.querySelector(`[data-row="${carriage.serial}"]`);const cell=row?.children[1];if(!cell)return;const choices=catalog.events.filter((item)=>item.id!==capture.id&&item.mode==='panorama'&&(!capture.side||item.side===capture.side)&&item.carriages.some((candidate)=>candidate.serial===carriage.serial));if(!choices.length)return;const select=document.createElement('select');select.className='dev-compare-date';select.setAttribute('aria-label',`Start comparison for ${carriage.serial}`);select.innerHTML='<option value="">Compare…</option>'+choices.sort((a,b)=>a.date.localeCompare(b.date)).map((item)=>`<option value="${item.id}">${readableDate(item.date)}</option>`).join('');select.addEventListener('change',()=>{if(select.value)location.href=`compare.html?sourceEvent=${encodeURIComponent(capture.id)}&targetEvent=${encodeURIComponent(select.value)}&serial=${carriage.serial}&blank=1`;});cell.append(select);});
  const editor=document.createElement('aside');editor.className='dev-defect-editor';editor.hidden=true;editor.innerHTML='<strong>Reviewed region</strong><select data-dev-type><option value="severe">Severe</option><option value="minor">Minor</option><option value="graffiti">Graffiti</option></select><button type="button" data-dev-save>Save</button><button type="button" class="danger" data-dev-delete>Delete</button><button type="button" data-dev-close>×</button>';document.body.append(editor);
  let active;
  track.addEventListener('click',(event)=>{if(event.target.closest('.comparison-branches a'))return;const box=event.target.closest('.defect-box');if(!box)return;event.preventDefault();event.stopPropagation();const panel=box.closest('[data-serial]');const carriage=capture.carriages.find((item)=>item.serial===panel.dataset.serial);const defect=carriage.defects.find((item)=>item.id===box.dataset.defectId);active={box,carriage,defect};editor.querySelector('[data-dev-type]').value=defect.type;const rect=box.getBoundingClientRect();editor.style.left=`${Math.min(innerWidth-205,Math.max(8,rect.left))}px`;editor.style.top=`${Math.min(innerHeight-170,rect.bottom+6)}px`;editor.hidden=false;});
  editor.querySelector('[data-dev-close]').addEventListener('click',()=>editor.hidden=true);
  editor.querySelector('[data-dev-save]').addEventListener('click',async()=>{if(!active)return;await window.EyyaDev.save({action:'annotation',serial:active.carriage.serial,date:capture.date,annotationId:active.defect.id,type:editor.querySelector('[data-dev-type]').value,bbox:active.defect.box,seedAnnotations:seedAnnotations(active.carriage)});location.reload();});
  editor.querySelector('[data-dev-delete]').addEventListener('click',async()=>{if(!active||!confirm('Delete this reviewed region?'))return;await window.EyyaDev.save({action:'delete',serial:active.carriage.serial,date:capture.date,annotationId:active.defect.id,seedAnnotations:seedAnnotations(active.carriage)});location.reload();});
}
if(!capture){document.querySelector('[data-title]').textContent='Capture unavailable';panoramaContent.hidden=true;}else{
  document.title=`Unit ${capture.unit} · ${readableDate(capture.date)}`;
  document.querySelector('[data-title]').textContent=`Unit ${capture.unit}`;
  document.querySelector('[data-subtitle]').textContent=`${readableDate(capture.date)}${capture.time?` · ${capture.time}`:''}${capture.side?` · Side ${capture.side}`:''}`;
  document.querySelectorAll('.event-topbar [data-video-button]').forEach((button)=>button.hidden=!capture.video);
  const sibling=catalog.events.find((item)=>item.unit===capture.unit&&item.date===capture.date&&item.side&&item.side!==capture.side&&item.mode==='panorama');
  const sideToggle=document.querySelector('[data-side-toggle]');
  if(sibling){sideToggle.hidden=false;sideToggle.textContent=`Side ${capture.side} / ${sibling.side}`;sideToggle.addEventListener('click',()=>{location.href=`event.html?event=${encodeURIComponent(sibling.id)}`;});}
  if(capture.mode==='video'){panoramaContent.hidden=true;videoOnly.hidden=false;document.querySelector('[data-video-cover]').src=capture.cover;}else{videoOnly.hidden=true;renderPanoramas();table.addEventListener('click',(event)=>{const highlight=event.target.closest('[data-highlight]');const serial=event.target.closest('[data-jump]');if(highlight){const [vehicle,type]=highlight.dataset.highlight.split(':');jump(vehicle,type);}else if(serial)jump(serial.dataset.jump);});jump(capture.carriages[0]?.serial||'');enableDevelopmentEditing();}
}
