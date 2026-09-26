import {EditorView, basicSetup} from 'codemirror';
import {EditorState, Compartment} from '@codemirror/state';
import {javascript} from '@codemirror/lang-javascript';
import {html} from '@codemirror/lang-html';
import {css} from '@codemirror/lang-css';
import {oneDark} from '@codemirror/theme-one-dark';
import {keymap} from '@codemirror/view';
import {icon} from './icons.mjs';

const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeJSON=x=>JSON.stringify(x).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const notify=x=>window.wcToast?.(x);
const languages={js:javascript,html,css};
const MAX_SOURCE=180000;
const validSource=v=>v&&typeof v==='object'&&['js','html','css'].every(k=>typeof v[k]==='string'&&v[k].length<=MAX_SOURCE);
export async function encodeShare(value){const text=JSON.stringify(value);const bytes=new TextEncoder().encode(text);const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));const compressed=new Uint8Array(await new Response(stream).arrayBuffer());let binary='';for(const b of compressed)binary+=String.fromCharCode(b);return btoa(binary).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
export async function decodeShare(hash){if(hash.length>100000)throw new Error('Shared source is too large.');const binary=atob(hash.replaceAll('-','+').replaceAll('_','/'));const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();let size=0,chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_SOURCE*3){await reader.cancel();throw new Error('Shared source exceeds the size limit.');}chunks.push(value);}const value=JSON.parse(await new Blob(chunks).text());if(value.v!==1||!validSource(value.source))throw new Error('The shared source format is not supported.');return value;}

/** A unique-origin sandbox. The host never executes editable text itself. */
export function frameDocument(source,manifest,theme,runId,{standalone=false}={}){
 const origin=new URL(manifest.base,document.baseURI).origin;
 const imports=Object.fromEntries(Object.entries(manifest.imports).map(([k,v])=>[k,new URL(v,document.baseURI).href]));
 const assets={skia:new URL(manifest.skia,document.baseURI).href};
 const policy=`default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval' blob: ${origin}; style-src 'unsafe-inline' ${origin}; img-src data: blob: ${origin}; font-src data: ${origin}; connect-src data: blob: ${origin}; worker-src blob: ${origin}; base-uri 'none'; form-action 'none'; object-src 'none';`;
 const boot=`const runId=${safeJSON(runId)};const send=(type,text)=>parent.postMessage({channel:'wc-playground',runId,type,text:String(text).slice(0,8000)},'*');let messages=0;const format=v=>{if(v instanceof Error)return v.stack||v.message;try{return typeof v==='string'?v:JSON.stringify(v,(_,x)=>typeof x==='bigint'?String(x):x)}catch{return String(v)}};for(const kind of ['log','info','warn','error']){const original=console[kind];console[kind]=(...args)=>{original.apply(console,args);if(messages++<250)send(kind,args.map(format).join(' '));};}addEventListener('error',e=>send('error',e.message));addEventListener('unhandledrejection',e=>send('error',format(e.reason)));window.__assets=${safeJSON(assets)};const source=${safeJSON(source.js)};const blob=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));try{await import(blob);send('ready','Package initialized.')}catch(error){console.error(error)}finally{URL.revokeObjectURL(blob)}`;
 // HTML and CSS intentionally execute only inside the restricted document.
 return `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${esc(policy)}"><title>Component experiment</title><script type="importmap">${safeJSON({imports})}</script>${manifest.styles.map(x=>`<link rel="stylesheet" href="${esc(new URL(x,document.baseURI).href)}" crossorigin="anonymous">`).join('')}<style>${source.css.replace(/<\/style/gi,'<\\/style')}</style></head><body>${source.html}<script type="module">${boot}</script></body></html>`;
}

class Playground extends HTMLElement{
 async initialize(){
  if(this.initialized)return;this.initialized=true;this.base=document.body.dataset.base;this.idName=this.dataset.component;this.life=new AbortController();this.lang='js';this.theme=document.documentElement.dataset.theme;this.compact=this.dataset.compact==='true';
  try{
   const [sampleResponse,manifestResponse]=await Promise.all([fetch(this.base+'samples/'+this.idName+'.json'),fetch(this.base+'runtime-manifest.json')]);
   if(!sampleResponse.ok||!manifestResponse.ok)throw new Error('The sample or runtime manifest is unavailable.');
   const data=await sampleResponse.json();this.presets=data.samples;this.manifest=await manifestResponse.json();this.name=data.name;this.source={...this.presets[0]};
   this.render();this.bind();
   if(!await this.loadShared())this.run();
  }catch(error){this.initialized=false;throw error;}
 }
 async loadShared(){
  if(!location.hash.startsWith('#code='))return false;
  this.stop();const ticket=this.shareRevision=(this.shareRevision||0)+1;
  try{const v=await decodeShare(location.hash.slice(6));if(ticket!==this.shareRevision)return true;if(v.component!==this.idName)throw new Error('This experiment belongs to another component.');this.source={...v.source};this.updateEditor();this.notice('Shared code loaded for review. Press Run when you are ready.');this.status('Review first','idle');}catch(error){this.notice(error.message);this.status('Invalid share','error');}return true;
 }
 q(s){return this.querySelector(s)}
 render(){this.innerHTML=`<div class="pg-shell" data-mode="${this.compact?'preview':'split'}"><div class="pg-toolbar"><select data-preset aria-label="Example preset">${this.presets.map((p,i)=>`<option value="${i}">${esc(p.label)}</option>`).join('')}</select><button class="button primary" data-run title="Run source (Ctrl or Command + Enter)">${icon('play')}Run</button><button class="icon-button" data-reset aria-label="Reset current example" title="Reset current example">${icon('reset')}</button><span class="pg-divider"></span><button class="button pg-code-toggle" data-toggle-code aria-pressed="${!this.compact}">${icon('code')}Source</button><span class="pg-spacer"></span><span class="pg-status" data-state="idle" role="status" aria-live="polite">Preparing</span><button class="icon-button" data-demo-theme aria-label="Toggle preview color theme" title="Toggle preview color theme">${icon('sun')}</button><button class="icon-button" data-share aria-label="Copy shareable experiment link" title="Share experiment">${icon('share')}</button><button class="icon-button" data-export aria-label="Export experiment source" title="Download runnable HTML">${icon('download')}</button><details class="pg-draft-menu"><summary aria-label="Draft options">Draft ▾</summary><div><button data-save-draft>Save locally</button><button data-restore-draft>Restore local draft</button><button data-delete-draft>Delete local draft</button></div></details><button class="icon-button" data-fullscreen aria-label="Enter fullscreen playground" title="Fullscreen">${icon('expand')}</button></div><div class="pg-shared-notice" hidden></div><div class="pg-body"><section class="pg-code" aria-label="Source editor"><div class="pg-tabs" role="tablist" aria-label="Source language">${[['js','JavaScript'],['html','HTML'],['css','CSS']].map(([l,label])=>`<button role="tab" data-lang="${l}" aria-selected="${l==='js'}" tabindex="${l==='js'?0:-1}">${label}</button>`).join('')}</div><div class="pg-editor" role="tabpanel" aria-label="JavaScript source"></div><div class="pg-code-foot">EDITABLE SOURCE · ⌘ / CTRL + ENTER TO RUN</div></section><div class="pg-resize" role="separator" tabindex="0" aria-label="Resize source and preview" aria-orientation="vertical" aria-valuenow="38" aria-valuemin="22" aria-valuemax="70"></div><section class="pg-preview" aria-label="Live preview"><div class="pg-preview-label"><span><span class="status-dot"></span>LIVE PREVIEW · ${esc(this.name)}</span><select data-viewport aria-label="Preview viewport"><option value="desktop">Responsive</option><option value="tablet">Tablet · 768</option><option value="mobile">Mobile · 375</option></select></div><div class="pg-frame-wrap"><p class="pg-placeholder">Review the example and press Run.</p></div></section></div><section class="pg-console" aria-label="Experiment console"><div class="pg-console-bar"><span>CONSOLE <span data-log-count>0</span></span><button data-clear-console>Clear</button></div><div class="pg-console-output" role="log" aria-live="polite"></div></section></div>`;
  this.language=new Compartment();this.editorTheme=new Compartment();this.editor=new EditorView({parent:this.q('.pg-editor'),state:EditorState.create({doc:this.source.js,extensions:[basicSetup,this.language.of(javascript()),this.editorTheme.of(this.theme==='dark'?oneDark:[]),EditorView.lineWrapping,EditorView.contentAttributes.of({'aria-label':'JavaScript source code'}),keymap.of([{key:'Mod-Enter',run:()=>{this.run();return true;}}]),EditorView.updateListener.of(update=>{if(update.docChanged)this.source[this.lang]=update.state.doc.toString()})]})});
 }
 bind(){
  const opts={signal:this.life.signal};window.addEventListener('hashchange',()=>this.loadShared(),opts);const on=(s,fn,event='click')=>this.q(s)?.addEventListener(event,fn,opts);
  on('[data-run]',()=>this.run());on('[data-reset]',()=>this.reset());on('[data-preset]',()=>this.reset(),'change');
  on('[data-toggle-code]',()=>{const shell=this.q('.pg-shell'),show=shell.dataset.mode==='preview';shell.dataset.mode=show?'split':'preview';this.q('[data-toggle-code]').setAttribute('aria-pressed',String(show));this.editor.requestMeasure()});
  on('[data-demo-theme]',()=>{this.theme=this.theme==='dark'?'light':'dark';this.run()});
  on('[data-viewport]',()=>{if(this.frame)this.frame.dataset.size=this.q('[data-viewport]').value},'change');
  on('[data-clear-console]',()=>this.clearConsole());on('[data-share]',()=>this.share());on('[data-export]',()=>this.export());
  on('[data-fullscreen]',async()=>{const shell=this.q('.pg-shell');if(document.fullscreenElement){await document.exitFullscreen();return}if(shell.classList.contains('fullscreen-fallback')){shell.classList.remove('fullscreen-fallback');return}try{await shell.requestFullscreen()}catch{shell.classList.add('fullscreen-fallback')}});
  on('[data-save-draft]',()=>{try{localStorage.setItem('wc-draft:'+this.idName,JSON.stringify({v:1,source:this.source}));notify('Draft saved in this browser.')}catch{notify('Local storage is unavailable or full.')}this.q('details').open=false;});
  on('[data-restore-draft]',()=>{try{const draft=JSON.parse(localStorage.getItem('wc-draft:'+this.idName)||'null');if(!draft||draft.v!==1||!validSource(draft.source))throw new Error();this.source={...draft.source};this.updateEditor();this.notice('Local draft restored. Review the source, then press Run.');this.stop();notify('Local draft restored without running.')}catch{notify('No valid local draft found.')}this.q('details').open=false;});
  on('[data-delete-draft]',()=>{try{localStorage.removeItem('wc-draft:'+this.idName);notify('Local draft deleted.')}catch{notify('Local storage is unavailable.')}this.q('details').open=false});
  for(const tab of this.querySelectorAll('[data-lang]')){tab.addEventListener('click',()=>this.changeLanguage(tab.dataset.lang),opts);tab.addEventListener('keydown',e=>{const list=['js','html','css'],index=list.indexOf(this.lang);if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const lang=list[(index+(e.key==='ArrowRight'?1:2))%3];this.changeLanguage(lang);this.q(`[data-lang="${lang}"]`).focus()}},opts)}
  window.addEventListener('message',e=>{if(e.source!==this.frame?.contentWindow||e.origin!=='null')return;const m=e.data;if(!m||m.channel!=='wc-playground'||m.runId!==this.runId||typeof m.text!=='string')return;if(m.type==='ready'){clearTimeout(this.timeout);if(!this.hadError)this.status('Ready','ready');return;}if(['log','info','warn','error'].includes(m.type)){if(m.type==='error'){this.hadError=true;clearTimeout(this.timeout);this.status('Error','error')}this.log(m.type,m.text.slice(0,8000))}},opts);
  document.addEventListener('wc-theme',e=>this.editor?.dispatch({effects:this.editorTheme.reconfigure(e.detail==='dark'?oneDark:[])}),opts);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')this.q('.pg-shell').classList.remove('fullscreen-fallback')},opts);
  const separator=this.q('.pg-resize');let resizing=false;
  const size=percent=>{const n=Math.max(22,Math.min(70,percent));this.q('.pg-body').style.gridTemplateColumns=`minmax(200px,${n}%) 6px minmax(0,1fr)`;separator.setAttribute('aria-valuenow',String(Math.round(n)))};
  separator.addEventListener('pointerdown',e=>{resizing=true;separator.setPointerCapture(e.pointerId);if(this.frame)this.frame.style.pointerEvents='none'},opts);
  separator.addEventListener('pointermove',e=>{if(!resizing)return;const r=this.q('.pg-body').getBoundingClientRect();size((e.clientX-r.left)/r.width*100)},opts);
  const end=()=>{resizing=false;if(this.frame)this.frame.style.pointerEvents='auto'};separator.addEventListener('pointerup',end,opts);separator.addEventListener('pointercancel',end,opts);
  separator.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();size(Number(separator.getAttribute('aria-valuenow'))+(e.key==='ArrowRight'?3:-3))}},opts);
 }
 changeLanguage(lang){this.lang=lang;for(const tab of this.querySelectorAll('[data-lang]')){tab.setAttribute('aria-selected',String(tab.dataset.lang===lang));tab.tabIndex=tab.dataset.lang===lang?0:-1}this.updateEditor();this.q('.pg-editor').setAttribute('aria-label',lang.toUpperCase()+' source')}
 updateEditor(){if(!this.editor)return;const text=this.source[this.lang];this.editor.dispatch({changes:{from:0,to:this.editor.state.doc.length,insert:text},effects:this.language.reconfigure(languages[this.lang]())});}
 reset(){this.source={...this.presets[Number(this.q('[data-preset]').value)]};this.updateEditor();if(location.hash.startsWith('#code='))history.replaceState(null,'',location.pathname);this.run();}
 stop(){clearTimeout(this.timeout);this.frame?.remove();this.frame=null;this.status('Review first','idle')}
 run(){
  if(!validSource(this.source)){this.notice('One source file exceeds the 180 KB safety limit.');return;}
  this.stop();this.clearConsole();this.hadError=false;this.q('.pg-shared-notice').hidden=true;this.status('Running','running');this.runId=crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');const frame=document.createElement('iframe');frame.title=this.name+' live experiment';frame.setAttribute('sandbox','allow-scripts allow-downloads');frame.setAttribute('referrerpolicy','no-referrer');frame.dataset.size=this.q('[data-viewport]').value;frame.srcdoc=frameDocument(this.source,this.manifest,this.theme,this.runId);this.frame=frame;this.q('.pg-frame-wrap').replaceChildren(frame);
  this.timeout=setTimeout(()=>{this.status('Check console','error');this.log('warn','Initialization has not completed. Inspect the console, check your code, or reset the example. Native graphics may need longer on a first load.')},45000);
 }
 status(text,state){const el=this.q('.pg-status');el.textContent=text;el.dataset.state=state;}
 notice(text){const el=this.q('.pg-shared-notice');el.textContent=text;el.hidden=false;}
 clearConsole(){this.q('.pg-console-output').replaceChildren();this.q('[data-log-count]').textContent='0';this.logCount=0;}
 log(level,text){if(this.logCount>=250)return;const el=document.createElement('div');el.className='pg-log';el.dataset.level=level;el.textContent=text;const console=this.q('.pg-console-output');console.append(el);console.scrollTop=console.scrollHeight;this.q('[data-log-count]').textContent=String(++this.logCount);}
 async share(){try{const payload=await encodeShare({v:1,component:this.idName,source:this.source});const url=new URL(this.base+'components/'+this.idName+'/playground/',location.href);url.hash='code='+payload;history.replaceState(null,'',url);await navigator.clipboard.writeText(url.href);notify('Share link copied. Recipients review before running.')}catch(error){notify('Could not copy the link. Copy the address bar after sharing.')}}
 export(){const content=frameDocument(this.source,this.manifest,this.theme,'standalone',{standalone:true});const blob=new Blob([content],{type:'text/html'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=this.idName+'-experiment.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);notify('HTML exported. It loads packages from this site.');}
 disconnectedCallback(){this.life?.abort();this.editor?.destroy();clearTimeout(this.timeout);this.initialized=false;}
}
if(!customElements.get('wc-playground'))customElements.define('wc-playground',Playground);
