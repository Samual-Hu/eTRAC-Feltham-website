// The left date menu opens a visit or compares selected dates; the right picker changes unit.
if(capture?.mode==='panorama'){
 const back=document.createElement('a');back.className='lifecycle-back';back.href='index.html';back.textContent='‹';back.setAttribute('aria-label','Back to capture library');document.querySelector('.event-left').prepend(back);
}
window.EyyaTrainPicker.install(document.querySelector('[data-event-train-picker]'),catalog,{current:capture?.unit,onSelect(unit){
 const url=window.EyyaTrainPicker.destination(catalog,unit,{side:capture?.side,date:capture?.date});if(url)location.href=url;
}});
