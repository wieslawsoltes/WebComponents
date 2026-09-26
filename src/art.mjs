/** Original, lightweight SVG artwork. Illustrations are not library screenshots. */
export function art(c,large=false){
 const f='var(--art-panel)',l='var(--art-line)',t='var(--art-text)',a=c.color;
 const rect=(x,y,w,h,fill=f,stroke=l,r=6)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
 const text=(x,y,s,size=10,fill=t)=>`<text x="${x}" y="${y}" fill="${fill}" font-family="ui-monospace,monospace" font-size="${size}">${s}</text>`;
 const line=(x,y,x2,y2,color=l)=>`<path d="M${x} ${y}L${x2} ${y2}" stroke="${color}" fill="none"/>`;
 let out='';
 if(c.symbol==='dock'){
  out+=rect(24,28,352,192)+rect(24,28,352,25)+text(39,45,'WORKSPACE / ATLAS',9);
  out+=rect(34,64,83,144)+rect(127,64,238,92)+rect(127,166,238,42);
  out+=text(46,83,'EXPLORER',8,a)+text(46,109,'▧ project')+text(46,130,'◇ layers')+text(46,151,'▤ assets');
  out+=rect(137,74,70,20,`${a}22`,a,4)+text(146,88,'canvas.js',8,a);
  out+=text(145,113,'const workspace =',11)+text(159,132,'new DockingManager();',11,a);
  out+=text(139,183,'OUTPUT',8)+line(138,193,293,193)+rect(266,112,112,65,f,a)+text(279,134,'INSPECTOR',8,a)+text(279,154,'retained content',8);
 }else if(['tree','grid'].includes(c.symbol)){
  out+=rect(33,30,334,190)+rect(33,30,334,28)+text(49,48,c.symbol==='tree'?'COMPONENT / TYPE / ENABLED':'ƒx  = SUM(B2:C8)',10,a);
  for(let i=0;i<5;i++){const y=60+i*30;out+=line(33,y,367,y)+text(46,y+20,c.symbol==='tree'?['⌄ workspace','  ⌄ components','    editor.js','    grid.js','  package.json'][i]:String(i+1),10);out+=text(210,y+20,c.symbol==='tree'?['Folder','Folder','Module','Module','JSON'][i]:['1,240','860','2,100','340','4,540'][i],10);out+=rect(308,y+10,29,9,i%2?`${a}25`:a,'none',2);}
  out+=line(196,58,196,211)+line(287,58,287,211)+rect(195,118,92,31,`${a}17`,a,0);
 }else if(c.symbol==='ribbon'){
  out+=rect(25,31,350,187)+rect(25,31,350,25)+text(42,48,'File     Home     Insert     View',10)+line(80,56,120,56,a);
  out+=rect(36,67,329,55);for(let i=0;i<7;i++){out+=rect(48+i*45,78,24,23,i===1?`${a}25`:f,i===1?a:l,3)+line(51+i*45,108,69+i*45,108);}
  out+=text(55,156,'Make room for ideas.',20,a)+line(55,176,278,176)+line(55,190,333,190);
 }else if(['stream','reactive'].includes(c.symbol)){
  const ys=[62,124,186];ys.forEach((y,i)=>{out+=text(25,y-17,['SOURCE','TRANSFORM','VIEW'][i],8);out+=line(25,y,373,y);for(let j=0;j<6;j++){const x=66+j*51;out+=`<circle cx="${x}" cy="${y}" r="${i===1?11:7}" fill="${j%3===0?a:f}" stroke="${a}" opacity="${j%2===i%2?1:.35}"/>`;}});
  out+=`<path d="M120 65C120 94 172 92 172 113M224 135C224 161 275 157 275 179" stroke="${a}" fill="none" stroke-dasharray="3 4"/>`;
  out+=rect(253,16,113,23,f,l)+text(264,31,c.symbol==='stream'?'filter → sort':'WhenAnyValue()',8,a);
 }else if(c.symbol==='skia'){
  for(let layer=0;layer<24;layer++){let d='';for(let i=0;i<=220;i++){const p=i/220*Math.PI*2,r=90*(.72+.2*Math.cos(p*7+layer*.12))*(1-layer/39),x=200+Math.cos(p+layer*.05)*r*1.4,y=122+Math.sin(p+layer*.05)*r;d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);}out+=`<path d="${d}Z" fill="none" stroke="${[a,'#c2a3ed','#8dcbd7'][layer%3]}" opacity=".8" stroke-width=".8"/>`;}
  out+=text(32,221,'SKPath · native precision',8);
 }else if(c.symbol==='spatial'){
  for(let i=0;i<88;i++){const x=30+(i*67%337),y=26+(i*41%190),inside=x>145&&x<270&&y>70&&y<183;out+=`<circle cx="${x}" cy="${y}" r="${inside?3:2}" fill="${inside?a:t}" opacity="${inside?1:.4}"/>`;}
  out+=rect(130,57,156,134,`${a}0b`,a,0)+rect(157,79,95,68,'none',`${a}65`,0)+line(205,105,205,140,a)+line(188,122,222,122,a)+text(137,49,'query envelope',9,a);
 }else if(['graph','drawing'].includes(c.symbol)){
  const nodes=[[73,122],[192,62],[193,181],[318,122]];
  [[0,1],[0,2],[1,3],[2,3],[1,2]].forEach(([u,v],i)=>{out+=line(nodes[u][0],nodes[u][1],nodes[v][0],nodes[v][1],i<2?a:l);});
  nodes.forEach(([x,y],i)=>{out+=c.symbol==='drawing'?rect(x-39,y-21,78,42,f,i<3?a:l):`<circle cx="${x}" cy="${y}" r="22" fill="${f}" stroke="${i<3?a:l}"/>`;out+=text(x-(c.symbol==='drawing'?23:4),y+4,c.symbol==='drawing'?['Discover','Design','Build','Deliver'][i]:['A','B','C','D'][i],10,i<3?a:t);});
  out+=rect(269,200,99,24,f,l)+text(279,216,c.symbol==='graph'?'A → B → D':'model ↔ view',9,a);
 }else if(c.symbol==='text'){
  out+=rect(82,15,236,221)+text(102,45,'FIELD NOTES / 001',8,a)+text(102,77,'The art of',23)+text(102,105,'making things.',23,a);
  [129,142,155,181,194,207].forEach((y,i)=>{out+=line(102,y,295-(i%3)*20,y);});out+=rect(193,119,76,18,`${a}35`,'none',1)+rect(47,153,90,30,f,a,5)+text(58,173,'B  I  U  ↗',11,a);
 }
 return `<svg class="component-art ${large?'large':''}" viewBox="0 0 400 250" fill="none" aria-hidden="true"><defs><pattern id="dots-${c.id}-${large}" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="${l}"/></pattern></defs><rect width="400" height="250" fill="url(#dots-${c.id}-${large})"/>${out}</svg>`;
}
