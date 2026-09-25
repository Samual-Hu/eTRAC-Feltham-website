const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({URLSearchParams,location:{search:''},history:{},window:{EYYA_CATALOG:{events:[],comparisons:[]}}});
vm.runInContext(fs.readFileSync(__dirname+'/assets/compare.js','utf8').split("document.querySelector('[data-compare-back]')")[0],context);
const geometry=vm.runInContext('alignedGeometry([[12000,1200],[8000,800]],[[500,0,700,600],[1000,100,1134,500]],[{width:900,height:800},{width:900,height:800}])',context);
for(const [i,center] of [[0,[600,300]],[1,[1067,300]]]){
  const nativeHeight=i?800:1200;
  assert(Math.abs(geometry[i].left+center[0]/nativeHeight*geometry[i].height-450)<1e-6);
  assert(geometry[i].top<=0&&geometry[i].top+geometry[i].height>=800);
}
assert(Math.abs(geometry[0].top+300/1200*geometry[0].height-(geometry[1].top+300/800*geometry[1].height))<1e-6);
const disparate=vm.runInContext('alignedGeometry([[6000,1210],[6000,1210]],[[4511,273,5449,1194],[3916,284,4023,397]],[{width:900,height:550},{width:900,height:550}])',context);
assert(disparate[1].height>disparate[0].height*2);
for(const [i,box] of [[0,[4511,273,5449,1194]],[1,[3916,284,4023,397]]]){
  assert(disparate[i].top<=0&&disparate[i].top+disparate[i].height>=550);
  const y1=disparate[i].top+box[1]/1210*disparate[i].height;
  const y2=disparate[i].top+box[3]/1210*disparate[i].height;
  assert(y1>=-1&&y2<=551,`Focus ${i} is clipped: ${y1}, ${y2}`);
}
assert(Math.abs(disparate[0].top+(273+1194)/2/1210*disparate[0].height-(disparate[1].top+(284+397)/2/1210*disparate[1].height))<1e-6);
const catalog=JSON.parse(fs.readFileSync(__dirname+'/assets/catalog.json','utf8'));
let checked=0,maxDrift=0,maxDriftId='';
for(const item of catalog.comparisons){
  if(!item.sourceBox||!item.targetBox||!item.sourceTileSize||!item.targetTileSize)continue;
  const source=catalog.events.find(e=>e.id===item.sourceEventId)?.carriages.find(c=>c.serial===item.serial);
  const target=catalog.events.find(e=>e.id===item.targetEventId)?.carriages.find(c=>c.serial===item.serial);
  if(!source||!target)continue;
  const boxes=[item.sourceBox,item.targetBox],sizes=[[source.width,source.height],[target.width,target.height]];
  const result=vm.runInContext(`alignedGeometry(${JSON.stringify(sizes)},${JSON.stringify(boxes)},[{width:900,height:550},{width:900,height:550}])`,context);
  for(let i=0;i<2;i++){
    const y1=result[i].top+boxes[i][1]/sizes[i][1]*result[i].height;
    const y2=result[i].top+boxes[i][3]/sizes[i][1]*result[i].height;
    assert(y1>=-1&&y2<=551,`Focus ${i} clipped in ${item.id}: ${y1}, ${y2}`);
    const x1=result[i].left+boxes[i][0]/sizes[i][1]*result[i].height;
    const x2=result[i].left+boxes[i][2]/sizes[i][1]*result[i].height;
    assert(x2>0&&x1<900,`Focus ${i} entirely outside pane in ${item.id}: ${x1}, ${x2}`);
    assert(result[i].top<=.1&&result[i].top+result[i].height>=549.9,`Unfilled pane in ${item.id}`);
  }
  const centres=boxes.map((b,i)=>result[i].top+(b[1]+b[3])/2/sizes[i][1]*result[i].height);
  if(Math.abs(centres[0]-centres[1])>maxDrift){maxDrift=Math.abs(centres[0]-centres[1]);maxDriftId=item.id;}
  checked++;
}
console.log(`Comparison frames fill both panes; ${checked} catalogued pairs remain in view (maximum unavoidable centre drift: ${Math.round(maxDrift)} px in ${maxDriftId}).`);
