/* Executable examples. These exact sources also power the usage guides. */
const css = `:root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#e5e8ed;background:#14171c;color-scheme:dark;--panel:#1c2027;--line:#343b46;--accent:#d6ef81}*{box-sizing:border-box}body{margin:0;padding:16px}button,input,select,textarea{font:inherit}button,select,input{color:inherit;background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:8px 11px}button{cursor:pointer}button:hover{border-color:var(--accent)}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px}.toolbar label{display:flex;align-items:center;gap:8px;font-size:12px}.hint{font-size:12px;color:#9ea8b7;line-height:1.6}.stage{height:340px;min-width:0}.panel{padding:24px;background:var(--panel);border:1px solid var(--line);border-radius:10px}h1,h2,p{margin-top:0}h1{font-size:36px;letter-spacing:-1px}h2{font-size:24px}output{font-family:ui-monospace,monospace;font-size:12px}table{width:100%;border-collapse:collapse;font-size:13px}td,th{text-align:left;border-bottom:1px solid var(--line);padding:10px}th{color:#a9b4c2;font-size:11px;text-transform:uppercase;letter-spacing:.08em}canvas{display:block;max-width:100%;touch-action:none}textarea{background:var(--panel);color:inherit;border:0;resize:none;padding:18px}html[data-theme=light]{color-scheme:light;background:#f6f7f9;color:#232930;--panel:#fff;--line:#d9dee5;--accent:#497525}html[data-theme=light] .hint{color:#626d7a}html[data-theme=dark] tree-data-grid{--tdg-bg:#1c2027;--tdg-fg:#e5e8ed;--tdg-line:#343b46;--tdg-header:#222831;--tdg-header-fg:#acb8c7;--tdg-muted:#91a0b2;--tdg-hover:#29343e;--tdg-selection:#263e51;--tdg-accent:#80caff}@media(max-width:450px){body{padding:10px}h1{font-size:28px}.panel{padding:18px}.toolbar{gap:6px}.toolbar button{padding:8px}}`;
const demo=(label,html,js,extra='')=>({label,html,js,css:css+'\n'+extra});
const dock=demo('A creative workspace',`<div class="toolbar"><button id="float">Float editor</button><button id="dock">Dock editor</button><button id="hide">Auto-hide tools</button><button id="save">Save layout</button><button id="restore">Restore</button></div><div id="workspace" class="stage"></div><p class="hint">Drag tabs, resize splitters and edit the note. The content stays alive as you move it.</p>`, `import { DockingManager, LayoutRoot, LayoutPanel, LayoutDocumentPane,
  LayoutAnchorablePane, LayoutDocument, LayoutAnchorable,
  XmlLayoutSerializer } from '@wieslawsoltes/dockyard';

const editor = document.createElement('textarea');
editor.setAttribute('aria-label', 'Workspace notes');
editor.value = 'A workspace that moves with you.\\n\\nDrag this tab. Float it. Bring it home.\\nYour notes stay right here.';
editor.style.cssText = 'width:100%;height:100%;box-sizing:border-box';
const tools = document.createElement('div');
tools.innerHTML = '<div class="panel"><h2>Explorer</h2><p>▧ Project brief</p><p>▤ Design notes</p><p>◇ Components</p><hr><p class="hint">Your real DOM content, retained.</p></div>';
const doc = new LayoutDocument({ContentId:'notes', Title:'Project notes', Content:editor});
const tool = new LayoutAnchorable({ContentId:'explorer', Title:'Explorer', Content:tools});
const manager = new DockingManager(document.querySelector('#workspace'), {
  Theme: document.documentElement.dataset.theme,
  Layout: new LayoutRoot({RootPanel:new LayoutPanel({Orientation:'Horizontal', Children:[
    new LayoutAnchorablePane({DockWidth:190,Children:[tool]}),
    new LayoutDocumentPane({Children:[doc]})
  ]})})
});
const serializer = new XmlLayoutSerializer(manager);
let saved = serializer.Serialize();
document.querySelector('#float').onclick=()=>manager.Find('notes').Float();
document.querySelector('#dock').onclick=()=>manager.Find('notes').Dock();
document.querySelector('#hide').onclick=()=>manager.Find('explorer').ToggleAutoHide();
document.querySelector('#save').onclick=()=>{saved=serializer.Serialize();console.log('Layout captured',saved.length,'characters');};
document.querySelector('#restore').onclick=()=>{serializer.Deserialize(saved);console.log('Layout restored');};
window.addEventListener('pagehide',()=>manager.Dispose());
console.log('Dockyard ready: drag a tab or try Float editor.');`);
const tree=demo('Editable inventory',`<div class="toolbar"><button id="add">Add row</button><button id="update">Update first row</button><output id="count"></output></div><tree-data-grid id="grid" class="stage" style="display:block" aria-label="Component inventory"></tree-data-grid><p class="hint">Click a column header to sort. Double-click a value to edit. Resize columns at their edges.</p>`, `import {observable, ObservableList, FlatTreeDataGridSource, TextColumn, CheckBoxColumn}
  from '@wieslawsoltes/treedatagridweb/core';
import '@wieslawsoltes/treedatagridweb/web';

const rowCount = 100;
const items = new ObservableList(Array.from({length:rowCount},(_,i)=>observable({
  Name:['Workspace','Document','Collection','Canvas'][i%4]+' '+(i+1),
  Kind:['Layout','Editor','Data','Graphics'][i%4],
  Size:12+i%87, Active:i%3!==0
})));
const source = new FlatTreeDataGridSource(items);
source.Columns.Add(new TextColumn('Component',x=>x.Name,(x,v)=>x.Name=v,'2*'));
source.Columns.Add(new TextColumn('Category',x=>x.Kind,(x,v)=>x.Kind=v,'*'));
source.Columns.Add(new TextColumn('Modules',x=>x.Size,(x,v)=>x.Size=Number(v),90));
source.Columns.Add(new CheckBoxColumn('Enabled',x=>x.Active,(x,v)=>x.Active=v,85));
source.RowSelection.SingleSelect=false;
const grid=document.querySelector('#grid');
grid.Model=source; grid.CanUserResizeColumns=true;
grid.setAttribute('theme',document.documentElement.dataset.theme);
const count=()=>document.querySelector('#count').textContent=items.Count.toLocaleString()+' source rows';
document.querySelector('#add').onclick=()=>{items.Add(observable({Name:'New component',Kind:'Custom',Size:1,Active:true}));count();};
document.querySelector('#update').onclick=()=>{items.Get(0).Name='Updated live';console.log('Observable model updated');};
count();
window.addEventListener('pagehide',()=>{grid.Dispose();source.Dispose();});
console.log('Actual virtualized TreeDataGrid attached.');`);
const hierarchy=demo('Files & folders',`<div class="toolbar"><button id="expand">Expand all</button><button id="collapse">Collapse all</button></div><tree-data-grid id="grid" class="stage" style="display:block" aria-label="Project files"></tree-data-grid>`, `import {ObservableList, HierarchicalTreeDataGridSource, HierarchicalExpanderColumn, TextColumn}
  from '@wieslawsoltes/treedatagridweb/core';
import '@wieslawsoltes/treedatagridweb/web';
const files=new ObservableList([
 {name:'src',kind:'Folder',children:[{name:'components',kind:'Folder',children:[{name:'workspace.js',kind:'JavaScript'},{name:'editor.js',kind:'JavaScript'}]},{name:'styles.css',kind:'CSS'}]},
 {name:'docs',kind:'Folder',children:[{name:'getting-started.md',kind:'Markdown'},{name:'architecture.md',kind:'Markdown'}]},
 {name:'package.json',kind:'JSON'}
]);
const source=new HierarchicalTreeDataGridSource(files);
source.Columns.Add(new HierarchicalExpanderColumn(new TextColumn('Name',x=>x.name,null,'2*'),x=>x.children));
source.Columns.Add(new TextColumn('Type',x=>x.kind,null,'*'));
const grid=document.querySelector('#grid');grid.Model=source;
grid.setAttribute('theme',document.documentElement.dataset.theme);
document.querySelector('#expand').onclick=()=>source.ExpandAll();
document.querySelector('#collapse').onclick=()=>source.CollapseAll();
source.ExpandAll();
window.addEventListener('pagehide',()=>{grid.Dispose();source.Dispose();});
console.log('Hierarchical source expanded.');`);
const dynamic=demo('A live collection',`<div class="toolbar"><label>Show <select id="filter"><option value="all">All modules</option><option value="active">Active only</option><option value="heavy">Weight over 50</option></select></label><button id="batch">Batch update</button><button id="add">Add item</button><output id="count"></output></div><table><thead><tr><th>Module</th><th>Weight</th><th>Status</th></tr></thead><tbody id="rows"></tbody></table><p class="hint">Generated demonstration data. Filter, sort and binding are computed by DynamicDataWeb.</p>`, `import {BehaviorSubject} from 'rxjs';
import {SourceCache, filter, sort, bind} from '@wieslawsoltes/dynamicdataweb';
const cache=new SourceCache(x=>x.id);
const predicate=new BehaviorSubject(()=>true);
let nextId=9, revision=0;
function render(items){
 const body=document.querySelector('#rows'); body.replaceChildren();
 for(const item of items){const row=body.insertRow();for(const value of [item.name,item.weight,item.active?'Active':'Paused'])row.insertCell().textContent=value;}
 document.querySelector('#count').textContent=items.length+' visible';
}
const subscription=cache.connect().pipe(filter(predicate),sort((a,b)=>a.name.localeCompare(b.name)),bind(render)).subscribe();
cache.edit(updater=>{for(let i=1;i<=8;i++)updater.addOrUpdate({id:i,name:'Module '+i,weight:20+i*9,active:i%3!==0});});
document.querySelector('#filter').onchange=e=>predicate.next(e.target.value==='active'?x=>x.active:e.target.value==='heavy'?x=>x.weight>50:()=>true);
document.querySelector('#batch').onclick=()=>{revision++;cache.edit(updater=>{for(let i=1;i<=8;i++)updater.addOrUpdate({id:i,name:'Module '+i,weight:(i*17+revision*13)%100,active:(i+revision)%3!==0});});console.log('Committed atomic batch',revision);};
document.querySelector('#add').onclick=()=>{const id=nextId++;cache.addOrUpdate({id,name:'Module '+id,weight:64,active:true});};
window.addEventListener('pagehide',()=>{subscription.unsubscribe();predicate.complete();cache.dispose();});
console.log('Filter → sort → bind pipeline connected.');`);
const ribbon=demo('Document commands',`<ribbon-web id="ribbon"></ribbon-web><div class="panel" style="margin-top:24px"><p class="hint">LIVE DOCUMENT PREVIEW</p><h1 id="heading">Make room for ideas.</h1><p id="copy">A ribbon can be powerful without getting in the way. Try Bold, Accent or a different tab.</p><output id="status">Ready for your next command.</output></div>`, `import '@wieslawsoltes/ribbon-web';
const ribbon=document.querySelector('#ribbon');
ribbon.setAttribute('theme',document.documentElement.dataset.theme);
const heading=document.querySelector('#heading');
heading.style.fontWeight='400';
const command=(label,action)=>()=>{action();document.querySelector('#status').textContent=label+' applied';console.log(label);};
ribbon.model={tabs:[
 {id:'home',header:'Home',keyTip:'H',groups:[{id:'format',header:'Typography',items:[
  {id:'bold',type:'button',label:'Bold',icon:'bold',size:'large',command:command('Bold',()=>heading.style.fontWeight=heading.style.fontWeight==='400'?'700':'400')},
  {id:'italic',type:'button',label:'Italic',icon:'italic',command:command('Italic',()=>heading.style.fontStyle=heading.style.fontStyle==='italic'?'normal':'italic')},
  {id:'accent',type:'button',label:'Accent',icon:'font-color',command:command('Accent',()=>heading.style.color='#ab83eb')}
 ]},{id:'document',header:'Document',items:[{id:'reset',type:'button',label:'Reset style',icon:'undo',command:command('Reset',()=>heading.removeAttribute('style'))}]}]},
 {id:'insert',header:'Insert',keyTip:'I',groups:[{id:'content',header:'Content',items:[
  {id:'quote',type:'button',label:'Add a thought',icon:'text',size:'large',command:command('Thought',()=>document.querySelector('#copy').textContent='Great tools make space for the work, not themselves.')}
 ]}]},
 {id:'view',header:'View',keyTip:'V',groups:[{id:'zoom',header:'Presentation',items:[{id:'large',type:'button',label:'Larger type',icon:'zoom-in',command:command('Larger type',()=>heading.style.fontSize='48px')},{id:'small',type:'button',label:'Smaller type',icon:'zoom-out',command:command('Smaller type',()=>heading.style.fontSize='28px')}]}]}
]};
console.log('RibbonWeb commands are connected to the live preview.');`);
const skia=demo('Harmonic paths',`<div class="toolbar"><label>Petals <input id="petals" type="range" min="3" max="19" value="7"></label><label>Layers <input id="layers" type="range" min="4" max="32" value="18"></label><button id="redraw">Redraw</button><output>Native Skia · raster</output></div><skia-canvas id="canvas" backend="canvas" class="stage"></skia-canvas><p class="hint">Real SKPath geometry rendered by native Skia WASM. No implicit font downloads.</p>`, `import {RegisterWebComponent} from '@wieslawsoltes/skiasharpweb/browser';
const S=await RegisterWebComponent({assetBaseUrl:window.__assets.skia});
const view=document.querySelector('#canvas');
view.addEventListener('surfaceerror',e=>console.error(e.detail));
view.addEventListener('paintsurface',({detail:{Canvas,Info}})=>{
 const dark=document.documentElement.dataset.theme==='dark';
 Canvas.Clear(S.SKColor.Parse(dark?'#14171c':'#f6f7f9'));
 const petals=Number(document.querySelector('#petals').value);
 const layers=Number(document.querySelector('#layers').value);
 const radius=Math.min(Info.Width,Info.Height)*0.40;
 const paint=new S.SKPaint({IsAntialias:true,Style:S.SKPaintStyle.Stroke,StrokeWidth:1.3});
 try{for(let layer=0;layer<layers;layer++){
  const path=new S.SKPath();
  try{for(let i=0;i<=500;i++){
   const a=i/500*Math.PI*2, r=radius*(.60+.21*Math.cos(a*petals+layer*.09))*(1-layer/(layers*1.6));
   const x=Info.Width/2+Math.cos(a+layer*.018)*r, y=Info.Height/2+Math.sin(a+layer*.018)*r;
   if(i===0)path.MoveTo(x,y);else path.LineTo(x,y);
  }path.Close();paint.Color=S.SKColor.Parse(['#f897ab','#e0aaef','#9cb6ef','#81d8c9'][layer%4]);Canvas.DrawPath(path,paint);
  }finally{path.Dispose();}
 }}finally{paint.Dispose();}
});
for(const id of ['petals','layers'])document.getElementById(id).oninput=()=>view.InvalidateSurface();
document.querySelector('#redraw').onclick=()=>view.InvalidateSurface();
await view.InvalidateSurface();
console.log('Native Skia initialized. Change the geometry above.');`);
const reactive=demo('A reactive identity',`<div class="toolbar"><label>First name <input id="first" value="Alex"></label><label>Last name <input id="last" value="Morgan"></label><button id="save">Create greeting</button></div><div class="panel"><p class="hint">COMPUTED, NOT COPIED</p><h1 id="name"></h1><p>A live view of two reactive properties.</p><output id="message">Edit either field. This view follows the model.</output></div>`, `import {defineViewModel,reactiveProperty,WhenAnyValue,CompositeDisposable,DisposeWith} from '@wieslawsoltes/reactiveweb';
import {Bind,OneWayBind,BindCommand} from '@wieslawsoltes/reactiveweb/html';
const Profile=defineViewModel({
 properties:{FirstName:reactiveProperty('Alex'),LastName:reactiveProperty('Morgan')},
 computed:{FullName:{initialValue:'',source:vm=>WhenAnyValue(vm,'FirstName','LastName',(a,b)=>(a+' '+b).trim())}},
 commands:{Save:{kind:'task',canExecute:vm=>WhenAnyValue(vm,'FirstName',name=>!!name.trim()),execute:async vm=>{
  const message='Hello, '+vm.FullName+'. Your next idea starts here.';
  document.querySelector('#message').textContent=message;console.log(message);return message;
 }}}
});
const vm=new Profile(), lifetime=new CompositeDisposable();lifetime.Add(vm);
DisposeWith(Bind(vm,'FirstName',document.querySelector('#first'),'value'),lifetime);
DisposeWith(Bind(vm,'LastName',document.querySelector('#last'),'value'),lifetime);
DisposeWith(OneWayBind(vm,'FullName',document.querySelector('#name'),'textContent'),lifetime);
DisposeWith(BindCommand(vm.Save,document.querySelector('#save')),lifetime);
lifetime.Add(vm.Save.ThrownExceptions.subscribe(error=>console.error(error)));
window.addEventListener('pagehide',()=>lifetime.Dispose());
console.log('Two-way bindings and a computed FullName are live.');`);
const spatial=demo('Spatial query lens',`<div class="toolbar"><label>Query <select id="mode"><option value="area">Rectangle intersection</option><option value="nearest">20 nearest neighbors</option></select></label><label>Radius <input id="radius" type="range" min="20" max="140" value="75"></label><button id="center">Center query</button><output id="result"></output></div><canvas id="spatial" width="900" height="440" tabindex="0" aria-label="Spatial query canvas. Use arrow keys to move the query." style="width:100%;height:auto;border:1px solid var(--line);border-radius:10px"></canvas><p class="hint">Move the pointer, touch the canvas, or focus it and use arrow keys. Results come from RBush.Search or RBush.Knn.</p>`, `import {RBush,Envelope} from '@wieslawsoltes/rbushweb';
const count=2000,tree=new RBush(9),canvas=document.querySelector('#spatial'),ctx=canvas.getContext('2d');
let seed=19;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const items=Array.from({length:count},(_,id)=>{const x=random()*900,y=random()*440;return{id,x,y,Envelope:new Envelope(x,y,x+3,y+3)};});
tree.BulkLoad(items);let x=450,y=220;
function draw(){
 const r=Number(document.querySelector('#radius').value),near=document.querySelector('#mode').value==='nearest';
 const start=performance.now(),found=near?tree.Knn(20,x,y):tree.Search(new Envelope(x-r,y-r,x+r,y+r));
 const elapsed=performance.now()-start,selected=new Set(found);
 ctx.fillStyle=document.documentElement.dataset.theme==='dark'?'#14171c':'#f6f7f9';ctx.fillRect(0,0,900,440);
 for(const item of items){ctx.fillStyle=selected.has(item)?'#a7d260':'#606a78';ctx.fillRect(item.x,item.y,selected.has(item)?5:2,selected.has(item)?5:2);}
 ctx.strokeStyle='#b9e477';ctx.lineWidth=1;
 if(!near){ctx.fillStyle='#a7d26015';ctx.fillRect(x-r,y-r,r*2,r*2);ctx.strokeRect(x-r,y-r,r*2,r*2);}
 else {for(const p of found){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(p.x,p.y);ctx.stroke();}}
 ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.stroke();
 document.querySelector('#result').textContent=found.length+' / '+count.toLocaleString()+' · '+elapsed.toFixed(2)+' ms query';
}
canvas.onpointermove=e=>{const b=canvas.getBoundingClientRect();x=(e.clientX-b.left)*900/b.width;y=(e.clientY-b.top)*440/b.height;draw();};
canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();x=Math.max(0,Math.min(900,x+(e.key==='ArrowRight'?12:e.key==='ArrowLeft'?-12:0)));y=Math.max(0,Math.min(440,y+(e.key==='ArrowDown'?12:e.key==='ArrowUp'?-12:0)));draw();};
document.querySelector('#center').onclick=()=>{x=450;y=220;draw();};
document.querySelector('#radius').oninput=draw;document.querySelector('#mode').onchange=draw;
draw();console.log('Indexed',tree.Count,'synthetic points. Query time excludes drawing.');`);
const graph=demo('Find the shortest path',`<div class="toolbar"><label>From <select id="from"><option>A</option><option>B</option><option>C</option><option>D</option></select></label><label>To <select id="to"><option>H</option><option>G</option><option>F</option><option>E</option></select></label><button id="solve">Find path</button><output id="distance"></output></div><quikgraph-viewer id="graph" class="stage" style="display:block"></quikgraph-viewer><p class="hint">Pan, zoom and inspect the graph. Highlighted edges are the actual Dijkstra result.</p>`, `import {BidirectionalGraph,TaggedEdge,DijkstraShortestPathAlgorithm,defineQuikGraphViewer} from '@wieslawsoltes/quikgraphweb';
defineQuikGraphViewer();
const graph=new BidirectionalGraph();
const edges=[['A','B',4],['A','C',1],['C','B',2],['B','D',3],['C','E',5],['D','F',2],['E','F',1],['E','G',4],['F','H',3],['G','H',2]];
graph.AddVerticesAndEdgeRange(edges.map(e=>new TaggedEdge(...e)));
const viewer=document.querySelector('#graph');viewer.Graph=graph;
viewer.setAttribute('theme',document.documentElement.dataset.theme);
function solve(){
 const source=document.querySelector('#from').value,target=document.querySelector('#to').value;
 const algorithm=new DijkstraShortestPathAlgorithm(graph,e=>e.Tag);algorithm.Compute(source);
 const path=algorithm.TryGetPath(target);
 viewer.HighlightedEdges=new Set(path||[]);viewer.Refresh();
 const distance=algorithm.Distances.get(target);
 document.querySelector('#distance').textContent=Number.isFinite(distance)?'Total cost: '+distance:'No directed path';
 console.log(source+' → '+target,{distance,edges:path?.length||0});
}
document.querySelector('#solve').onclick=solve;
viewer.addEventListener('graph-select',e=>console.log('Selection',e.detail.vertex));solve();`);
const richtext=demo('An editable field note',`<div class="toolbar"><button id="undo">Undo</button><button id="redo">Redo</button><button id="inspect">Inspect document</button></div><rich-text-toolbar for="editor" mode="all"></rich-text-toolbar><rich-text-box id="editor" view-mode="continuous" aria-label="Editable field note" style="display:block;height:340px;margin-top:12px"></rich-text-box><p class="hint">Select text to format it. This is the published rich-text control and document engine.</p>`, `import {registerRichTextWeb,registerRichTextToolbar} from '@wieslawsoltes/richtextweb/web';
import {fromMarkdown} from '@wieslawsoltes/richtextweb/formats';
registerRichTextWeb();registerRichTextToolbar();
const editor=document.querySelector('#editor');
editor.setAttribute('theme',document.documentElement.dataset.theme);
editor.Document=fromMarkdown('# A field note on making\\n\\nThe best tools make space for **the work itself**. They feel familiar, but leave room to discover something new.\\n\\n## A few guiding principles\\n\\n- Start with a clear idea.\\n- Make the important things effortless.\\n- Leave the door open for what comes next.\\n\\n*This is your page. Make it your own.*');
document.querySelector('#undo').onclick=()=>editor.Engine.Undo();
document.querySelector('#redo').onclick=()=>editor.Engine.Redo();
document.querySelector('#inspect').onclick=()=>console.log(editor.Document.ToJSON());
editor.addEventListener('documentchange',()=>console.log('Document changed'));
console.log('Structured document ready for editing.');`);
const grid=demo('Project budget',`<div class="toolbar"><button id="increase">Increase design hours</button><button id="reset">Reset inputs</button><button id="inspect">Inspect total</button></div><grid-web id="grid" style="display:block;height:370px"></grid-web><p class="hint">Double-click cells to edit. Column D and the total use the real formula engine.</p>`, `import {Workbook} from '@wieslawsoltes/gridweb';
import '@wieslawsoltes/gridweb/controls';
const book=new Workbook(),sheet=book.ActiveWorksheet;
sheet.GetRange('A1:D6').Values=[
 ['Workstream','Hours','Rate','Subtotal'],
 ['Design system',24,90,null],['Component work',40,110,null],
 ['Documentation',16,75,null],['Quality review',12,95,null],
 ['TOTAL',null,null,null]
];
for(let row=2;row<=5;row++)sheet.GetCell('D'+row).Formula='=B'+row+'*C'+row;
sheet.GetCell('D6').Formula='=SUM(D2:D5)';
const grid=document.querySelector('#grid');grid.Workbook=book;
grid.setAttribute('theme',document.documentElement.dataset.theme);
let hours=24;
document.querySelector('#increase').onclick=()=>{hours+=4;sheet.GetCell('B2').Value=hours;console.log('Design hours',hours,'Total',sheet.GetCell('D6').Value);};
document.querySelector('#reset').onclick=()=>{hours=24;sheet.GetCell('B2').Value=hours;};
document.querySelector('#inspect').onclick=()=>console.log('Calculated project total',sheet.GetCell('D6').Value);
console.log('Workbook mounted; formulas calculate from the input cells.');`);
const drawing=demo('A connected process',`<div class="toolbar"><button id="add">Add a step</button><button id="undo">Undo</button><button id="redo">Redo</button><button id="fit">Fit diagram</button></div><div id="diagram" class="stage" style="border:1px solid var(--line);border-radius:8px;overflow:hidden"></div><p class="hint">Select, drag and resize shapes. Double-click text to edit. Every action uses the same diagram engine.</p>`, `import {DiagramEngine,DrawingControl,createDocument,createShape} from '@wieslawsoltes/drawingweb';
const engine=new DiagramEngine(createDocument('An idea, in motion'));
const pageId=engine.document.pages[0].id;
const labels=['An idea','Make it real','Ship with care'];
labels.forEach((text,i)=>engine.add(pageId,createShape('roundRect',{
 id:'step'+i,text,x:50+i*245,y:140,width:180,height:80,
 style:{fill:['#282e42','#2c3d39','#413a2c'][i],stroke:['#91acff','#78e4b2','#f4ce8e'][i],color:'#f1f3f7',fontSize:17}
})));
for(let i=0;i<2;i++)engine.add(pageId,createShape('connector',{
 source:{shapeId:'step'+i},target:{shapeId:'step'+(i+1)},style:{fill:'none',stroke:'#8c98ab',endArrow:true}
}));
const control=new DrawingControl(document.querySelector('#diagram'),{engine,grid:true,snap:true,background:document.documentElement.dataset.theme==='dark'?'#14171c':'#f6f7f9'});
let n=3;
document.querySelector('#add').onclick=()=>{engine.add(pageId,createShape('roundRect',{text:'Next step '+n,x:90+(n++%3)*215,y:285,width:170,height:70,style:{fill:'#30364c',stroke:'#91acff',color:'#fff'}}));control.fit();};
document.querySelector('#undo').onclick=()=>engine.undo();document.querySelector('#redo').onclick=()=>engine.redo();
document.querySelector('#fit').onclick=()=>control.fit();control.fit();
engine.changed.subscribe(e=>console.log('Revision',e.revision,e.label));
window.addEventListener('pagehide',()=>{control.dispose();engine.dispose();});
console.log('Actual DrawingControl attached. Drag a process step.');`);
const variant=(base,label,replacements)=>({...base,label,...Object.fromEntries(['html','js','css'].map(k=>[k,replacements.reduce((s,[a,b])=>s.replaceAll(a,b),base[k])]))});
export const samples={
 dockyard:[dock,variant(dock,'Vertical workbench',[["Orientation:'Horizontal'","Orientation:'Vertical'"],["DockWidth:190","DockHeight:130"]])],
 treedatagridweb:[tree,hierarchy,variant(tree,'10,000-row viewport',[['const rowCount = 100;','const rowCount = 10000;']])],
 dynamicdataweb:[dynamic,variant(dynamic,'A larger reactive cache',[['nextId=9','nextId=31'],['i<=8','i<=30']])],
 ribbonweb:[ribbon,variant(ribbon,'A compact command surface',[["ribbon.model=","ribbon.setAttribute('layout','simplified');\nribbon.model="]])],
 skiasharpweb:[skia,variant(skia,'Nineteen-fold geometry',[['value="7"','value="19"'],['value="18"','value="28"']])],
 reactiveweb:[reactive,variant(reactive,'Your project identity',[["reactiveProperty('Alex')","reactiveProperty('Project')"],["reactiveProperty('Morgan')","reactiveProperty('Atlas')"]])],
 rbushweb:[spatial,variant(spatial,'10,000-point spatial field',[['count=2000','count=10000']]),variant(spatial,'Nearest-neighbor lens',[['<option value="nearest">','<option value="nearest" selected>']])],
 quikgraphweb:[graph,variant(graph,'A different weighted route',[["['A','C',1]","['A','C',12]"],["['B','D',3]","['B','D',1]"]])],
 richtextweb:[richtext,variant(richtext,'Project brief',[['# A field note on making','# The next great thing'],['The best tools make space for **the work itself**. They feel familiar, but leave room to discover something new.','**Project:** Atlas workspace.\\n\\n**Goal:** Give creative work a better home.'],['## A few guiding principles','## Scope & principles']])],
 gridweb:[grid,variant(grid,'A larger estimate',[['24,90','80,120'],['40,110','120,135'],['16,75','40,95'],['12,95','24,110'],['let hours=24','let hours=80'],['hours=24','hours=80']])],
 drawingweb:[drawing,variant(drawing,'Product delivery flow',[["['An idea','Make it real','Ship with care']","['Discover','Prototype','Deliver']"],["createShape('roundRect'","createShape('rectangle'"]])]
};
export const baseSampleCss=css;
