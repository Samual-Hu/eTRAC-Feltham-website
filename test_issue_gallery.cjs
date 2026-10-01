const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const catalog=JSON.parse(process.argv.includes('--published')
  ?execFileSync('git',['show','HEAD:assets/catalog.json'],{cwd:__dirname,encoding:'utf8',maxBuffer:16*1024*1024})
  :fs.readFileSync(__dirname+'/assets/catalog.json','utf8'));
const nodes=new Map();
const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',append(){},addEventListener(){},classList:{toggle(){}},setAttribute(){}});return nodes.get(selector);};
const context=vm.createContext({URL,URLSearchParams,Intl,Date,location:{search:'',toString(){return 'http://localhost/index.html';}},history:{pushState(){}},window:{EYYA_CATALOG:catalog,addEventListener(){},scrollTo(){}},document:{querySelector:node,addEventListener(){}}});
vm.runInContext(fs.readFileSync(__dirname+'/assets/fleet.js','utf8'),context);
for(const type of ['severe','minor','graffiti']){
  const rows=catalog.events.filter(e=>e.mode==='panorama').flatMap(e=>e.carriages.filter(c=>c.defects.some(d=>d.type===type)));
  const expected=rows.reduce((n,c)=>n+c.defects.filter(d=>d.type===type).length,0);
  const html=vm.runInContext(`issueListing(catalog.events,'${type}')`,context);
  assert.equal((html.match(/class="issue-panorama-card"/g)||[]).length,rows.length);
  assert.equal((html.match(/class="issue-panorama-meta"/g)||[]).length,rows.length);
  assert.equal((html.match(new RegExp(`class="issue-region issue-${type}"`,'g'))||[]).length,expected);
  assert(!html.includes('<header>'));assert(!html.includes('Open panorama'));assert(!html.includes('issue-record-count'));assert(!html.includes('<i>'));
  assert(html.includes(`${expected} recorded annotations`));
  assert(html.includes(`highlight=${type}`)||rows.length===0);
}
const css=fs.readFileSync(__dirname+'/assets/review-refinements.css','utf8');
assert(css.includes('.issue-minor{color:var(--minor,#155eef)}'));
assert(css.includes('.issue-list-heading h1.issue-minor{color:var(--minor,#155eef)}'));
assert(css.includes('.issue-panorama-list{display:grid;gap:8px;'));
assert(css.includes('.issue-panorama-meta{position:absolute;'));
assert(!css.includes('.issue-region i{'));
console.log('All three issue galleries passed: in-image metadata, compact gaps, unnumbered boxes, panorama links and shared Minor blue.');
