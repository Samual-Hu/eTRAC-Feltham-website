/* Direct manual boxes on either native panorama or its synchronized crop. */
window.EyyaCompareAnnotation=(()=>{
 let editing=null,drag=null,saving=false,api,form,notice;
 const core=()=>window.EyyaCompareAnnotationCore;
 const editor=()=>window.EyyaCandidateEditor;
 const date=s=>new Date(s+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
 function active(){return !!editing;}
 function paint(binding,ctx,view){
  if(editing?.binding!==binding||!editing.box)return;
  const [x,y,w,h]=view,[l,t,r,b]=editing.box,sx=binding.canvas.width/w,sy=binding.canvas.height/h;
  ctx.strokeStyle='#ffe071';ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.strokeRect((l-x)*sx,(t-y)*sy,(r-l)*sx,(b-t)*sy);ctx.setLineDash([]);
  ctx.fillStyle='#fff';ctx.strokeStyle='#755a00';ctx.lineWidth=1;
  for(const xx of [l,(l+r)/2,r])for(const yy of [t,(t+b)/2,b]){if(xx===(l+r)/2&&yy===(t+b)/2)continue;ctx.fillRect((xx-x)*sx-4,(yy-y)*sy-4,8,8);ctx.strokeRect((xx-x)*sx-4,(yy-y)*sy-4,8,8);}
 }
 function showBox(){
  document.querySelectorAll('.comparison-draft-box').forEach(el=>el.remove());
  if(editing?.box){const b=editing.binding,c=b.car,[l,t,r,d]=editing.box,el=document.createElement('span');el.className='comparison-draft-box';el.style.cssText=`left:${l/c.width*100}%;top:${t/c.height*100}%;width:${(r-l)/c.width*100}%;height:${(d-t)/c.height*100}%`;b.stage.append(el);form.querySelector('[data-compare-save]').disabled=saving;form.querySelector('[data-compare-box]').textContent=`原图坐标： ${editing.box.join(', ')}`;}
  api.schedule();
 }
 function cancel(){editing=null;drag=null;document.body.classList.remove('compare-adding-mark');document.querySelectorAll('.comparison-draft-box').forEach(el=>el.remove());form.hidden=true;api.schedule();}
 function begin(binding){
  if(saving)return;cancel();editing={binding,box:null,id:'CMP-'+crypto.randomUUID()};
  document.body.classList.add('compare-adding-mark');form.hidden=false;
  form.querySelector('[data-compare-date]').textContent=`补标 · ${date(binding.event.date)} ${binding.event.time||''} · ${binding.event.side} 面`;
  form.querySelector('[data-compare-type]').value='minor';form.querySelector('[data-compare-save]').disabled=true;form.querySelector('[data-compare-box]').textContent='在此日期的全景或放大镜中拖动画框，拖动边缘调整大小。';notice.textContent='';
  api.focus(binding);api.setLocked(true);api.schedule();
 }
 function bindDrawing(binding,element,isCrop){
  function point(e){const r=element.getBoundingClientRect(),view=isCrop?binding.view:[0,0,binding.car.width,binding.car.height];return core().nativePoint([e.clientX,e.clientY],r,view,binding.car.width,binding.car.height);}
  element.addEventListener('pointerdown',e=>{
   if(editing?.binding!==binding||saving||e.button!==0||e.target.closest('button,a'))return;
   const start=point(e),view=isCrop?binding.view:[0,0,binding.car.width,binding.car.height],scale=view[2]/element.getBoundingClientRect().width;
   drag={start,original:editing.box?[...editing.box]:[...start,...start],mode:editing.box?editor().hit(start,editing.box,9*scale):'draw'};
   element.setPointerCapture(e.pointerId);e.preventDefault();e.stopPropagation();
  });
  element.addEventListener('pointermove',e=>{if(editing?.binding!==binding||!drag)return;editing.box=editor().change(drag.original,drag.start,point(e),drag.mode,binding.car.width,binding.car.height);showBox();e.preventDefault();});
  const end=()=>{if(editing?.binding===binding)drag=null;};element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);
 }
 async function save(){
  if(!editing?.box||saving)return;const target=editing,b=target.binding;
  try{const payload=core().payload(b.event,b.car,target.box,form.querySelector('[data-compare-type]').value,target.id);saving=true;form.querySelectorAll('button,select').forEach(el=>el.disabled=true);notice.textContent='正在保存标注…';await window.EyyaDev.save(payload);cancel();notice.textContent=`已保存到 ${date(b.event.date)} · ${b.event.side} 面.`;notice.className='comparison-save-status';notice.hidden=false;api.schedule();}
  catch(error){notice.textContent=error.message;}
  finally{saving=false;form.querySelectorAll('button,select').forEach(el=>el.disabled=false);if(editing&&!editing.box)form.querySelector('[data-compare-save]').disabled=true;}
 }
 async function install(options){
  api=options;const session=await window.EyyaDev?.connect();if(!session?.enabled)return;
  form=document.createElement('section');form.className='comparison-annotation-editor';form.hidden=true;form.setAttribute('aria-label','对比图补标');
  form.innerHTML='<strong data-compare-date></strong><label>类型 <select data-compare-type aria-label="污渍类型"><option value="minor">Minor · 轻微污渍/划痕</option><option value="severe">Severe · 严重污渍</option><option value="graffiti">Graffiti · 涂鸦</option></select></label><button data-compare-save type="button" disabled>保存标注</button><button data-compare-cancel type="button">取消</button><small data-compare-box></small>';
  document.body.append(form);notice=document.createElement('p');notice.setAttribute('role','status');notice.className='comparison-save-status';document.body.append(notice);
  form.querySelector('[data-compare-save]').onclick=save;form.querySelector('[data-compare-cancel]').onclick=cancel;
  for(const b of api.bindings){
   for(const [host,cls] of [[b.stage,'compare-add-mark'],[b.frame,'compare-loupe-add-mark']]){const button=document.createElement('button');button.type='button';button.className=cls;button.textContent='补标';button.setAttribute('aria-label',`补标：${b.event.date} ${b.event.time||''}，${b.event.side} 面${host===b.frame?'，放大镜':''}`);button.onclick=e=>{e.preventDefault();e.stopPropagation();begin(b);};host.append(button);}
   bindDrawing(b,b.image,false);bindDrawing(b,b.canvas,true);
  }
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&editing&&!saving)cancel();});
 }
 return {install,active,paint};
})();
