const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const catalog=JSON.parse(process.argv.includes('--published')
  ?execFileSync('git',['show','HEAD:assets/catalog.json'],{cwd:__dirname,encoding:'utf8',maxBuffer:16*1024*1024})
  :fs.readFileSync(__dirname+'/assets/catalog.json','utf8'));
const nodes=new Map();
const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',append(){},addEventListener(){},classList:{toggle(){}},setAttribute(){}});return nodes.get(selector);};
const context=vm.createContext({URL,URLSearchParams,Intl,Date,location:{search:'',toString(){return 'http://localhost/index.html';}},history:{pushState(){}},window:{EYYA_CATALOG:catalog,EyyaTrainPicker:{render(){}},addEventListener(){},scrollTo(){}},document:{querySelector:node,addEventListener(){}}});
vm.runInContext(fs.readFileSync(__dirname+'/assets/wash-status.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/assets/fleet.js','utf8'),context);
for(const type of ['severe','minor','graffiti']){
  const rows=catalog.events.filter(e=>e.mode==='panorama').flatMap(e=>e.carriages.filter(c=>c.defects.some(d=>d.type===type)));
  const expected=rows.reduce((n,c)=>n+c.defects.filter(d=>d.type===type).length,0);
  const html=vm.runInContext(`issueListing(catalog.events,'${type}')`,context);
  if(type==='minor'){
    assert.equal((html.match(/class="minor-mark-card"/g)||[]).length,expected);
    assert.equal((html.match(/class="minor-crop-box"/g)||[]).length,expected);
    assert.equal((html.match(/annotation=/g)||[]).length,expected);
    assert(!html.includes('class="issue-panorama-card"'));
    for(const e of catalog.events.filter(e=>e.mode==='panorama'))for(const c of e.carriages)for(const d of c.defects.filter(d=>d.type==='minor')){
      assert(html.includes(`annotation=${encodeURIComponent(d.id)}`));
      assert(html.includes(`carriage=${c.serial}`));
    }
  }else{
    assert.equal((html.match(/class="issue-panorama-card"/g)||[]).length,rows.length);
    assert(!html.includes('class="issue-panorama-meta"'));
    assert.equal((html.match(new RegExp(`class="issue-region issue-${type}"`,'g'))||[]).length,expected);
    assert.equal((html.match(/Open panorama/g)||[]).length,rows.length);
  }
  assert(!html.includes('issue-record-count'));assert(!html.includes('<i>'));
  assert(html.includes(`${expected} ${type==='minor'?'reviewed marks':'recorded annotations'}`));
  assert(html.includes(`highlight=${type}`)||rows.length===0);
}
const css=fs.readFileSync(__dirname+'/assets/review-refinements.css','utf8');
assert(css.includes('.issue-minor{color:var(--minor,#155eef)}'));
assert(css.includes('.issue-list-heading h1.issue-minor{color:var(--minor,#155eef)}'));
assert(css.includes('.issue-panorama-list{display:grid;gap:8px;'));
assert(css.includes('.issue-panorama-meta{position:absolute;'));
assert(!css.includes('.issue-region i{'));
assert(css.includes(':root{--annotation-border-width:1.5px}'));
assert(css.includes('.defect-box{border-width:var(--annotation-border-width)}'));
assert(css.includes('outline:var(--annotation-border-width) solid currentColor'));
const boxStyle=css.match(/\.issue-region\{([^}]+)\}/)[1];
assert(!boxStyle.includes('min-width'));assert(!boxStyle.includes('min-height'));
assert(boxStyle.includes('border:0'));assert(boxStyle.includes('background:transparent'));
assert(!css.includes('.issue-panorama-image:hover .issue-region'));
console.log('Issue galleries passed: one Minor card per human annotation with exact panorama links; Severe/Graffiti retain complete panoramas and separate open links.');
