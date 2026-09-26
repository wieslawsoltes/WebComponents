import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {build,transform} from 'esbuild';
import {components,guides} from '../content/catalog.mjs';
import {samples} from '../content/samples.mjs';
import * as page from '../src/templates.mjs';

const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const base=process.env.SITE_BASE||'/WebComponents/';
if(!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base))throw new Error('SITE_BASE must be a slash-delimited absolute URL path.');
const pkg=JSON.parse(await fs.readFile('package.json','utf8'));
const versions=pkg.dependencies;
await fs.rm('dist',{recursive:true,force:true});await fs.mkdir('dist',{recursive:true});
async function write(file,text){const target=path.join('dist',file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,text);}
await fs.cp('public','dist',{recursive:true});
page.configure({base,versions});
const routes=new Map([['',page.home()],['components/',page.collection()],['playgrounds/',page.playgrounds()],['guides/',page.guideIndex()],['about/',page.about()]]);
const search=[];
for(const c of components){
 for(const [tab,title] of [['','Overview'],['playground/','Playground'],['installation/','Installation'],['usage/','Usage guide']]){
  const route='components/'+c.id+'/'+tab;routes.set(route,page.componentPage(c,tab));search.push({title:c.name+(tab?' · '+title:''),kind:title,description:c.category+' · '+c.concept,keywords:[c.description,c.package,...c.features].join(' '),url:base+route});
 }
 for(const sample of samples[c.id])await transform(sample.js,{loader:'js',sourcefile:c.id+' / '+sample.label});
 await write('samples/'+c.id+'.json',JSON.stringify({name:c.name,version:versions[c.package],samples:samples[c.id]}));
}
for(const g of guides){routes.set('guides/'+g.id+'/',page.guidePage(g));search.push({title:g.title,kind:'Guide',description:g.summary,url:base+'guides/'+g.id+'/'});}
await write('search-index.json',JSON.stringify(search));
// esbuild shares original model modules between public entry points, preserving identity.
const specs=['@wieslawsoltes/dockyard','@wieslawsoltes/treedatagridweb/core','@wieslawsoltes/treedatagridweb/web','@wieslawsoltes/dynamicdataweb','@wieslawsoltes/ribbon-web','@wieslawsoltes/skiasharpweb/browser','@wieslawsoltes/reactiveweb','@wieslawsoltes/reactiveweb/html','@wieslawsoltes/rbushweb','@wieslawsoltes/quikgraphweb','@wieslawsoltes/richtextweb/web','@wieslawsoltes/richtextweb/formats','@wieslawsoltes/gridweb','@wieslawsoltes/gridweb/controls','@wieslawsoltes/drawingweb','rxjs'];
await fs.mkdir('.build-entries',{recursive:true});const entryPoints={},imports={};
for(const spec of specs){const name=spec.replace('@wieslawsoltes/','').replaceAll('/','-');const file='.build-entries/'+name+'.js';await fs.writeFile(file,`export * from ${JSON.stringify(spec)};\n`);entryPoints[name]=file;imports[spec]=base+'runtime/'+name+'.js';}
await fs.writeFile('.build-entries/dockyard-style.css',"@import '@wieslawsoltes/dockyard/styles.css';");entryPoints['dockyard-style']='.build-entries/dockyard-style.css';
const bundled=await build({entryPoints,outdir:'dist/runtime',bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',minify:true,metafile:true,chunkNames:'chunks/[name]-[hash]',logLevel:'info'});
await build({entryPoints:{playground:'src/playground.mjs'},outdir:'dist/assets',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof',logLevel:'info'});
execFileSync(process.execPath,['node_modules/@wieslawsoltes/skiasharpweb/dist/package/copy-assets.mjs','dist/skia'],{stdio:'inherit'});
await write('runtime-manifest.json',JSON.stringify({schema:1,base,imports,styles:[base+'runtime/dockyard-style.css'],skia:base+'skia/',versions:Object.fromEntries(components.map(c=>[c.package,versions[c.package]]))},null,2));
// Preserve textual upstream notices; never include font binaries or test fixtures.
let noticeHTML='<h1 class="page-title">Acknowledgements.</h1><p class="page-lead">Project licenses and upstream notices from the exact installed packages.</p>';
for(const c of components){const dir=path.join('node_modules',c.package);let names=await fs.readdir(dir);names=names.filter(n=>/^(LICENSE|NOTICE|COPYING|THIRD_PARTY|THIRD-PARTY)/i.test(n));const links=[];for(const n of names){const stat=await fs.stat(path.join(dir,n));if(!stat.isFile())continue;await write('licenses/'+c.id+'/'+n,await fs.readFile(path.join(dir,n)));links.push(`<a href="${base}licenses/${c.id}/${encodeURIComponent(n)}">${page.esc(n)}</a>`);}noticeHTML+=`<h2>${c.name} <span class="version">${versions[c.package]} · ${c.license}</span></h2><p>${links.join(' · ')||`<a href="${c.repo}/blob/main/LICENSE">Upstream license</a>`}</p>`;}
noticeHTML+='<h2>Site tooling</h2><p>The editor uses CodeMirror 6 (MIT). Reactive samples use RxJS (Apache-2.0). Build tooling uses esbuild (MIT). See the repository lockfile for exact transitive dependencies.</p><p>Native Skia/CanvasKit notices are retained with the <a href="'+base+'skia/THIRD_PARTY_NOTICES.txt">native runtime</a>.</p>';
for(const name of ['codemirror','rxjs','@codemirror/state','@codemirror/view','@codemirror/language','@codemirror/commands','@codemirror/search','@codemirror/autocomplete','@codemirror/lint','@lezer/common','@lezer/lr','@lezer/highlight','style-mod','w3c-keyname','crelt']){const dir=path.join('node_modules',name);try{const names=(await fs.readdir(dir)).filter(n=>/^LICENSE|^NOTICE/i.test(n));for(const n of names){if((await fs.stat(path.join(dir,n))).isFile())await write('licenses/tooling/'+name.replaceAll('/','-')+'/'+n,await fs.readFile(path.join(dir,n)));}}catch{}}
routes.set('licenses/',page.layout({title:'Licenses and acknowledgements',path:'licenses/',body:'<section class="section page-width"><article class="prose">'+noticeHTML+'</article></section>'}));
for(const [route,html] of routes)await write(route+'index.html',html);
await write('404.html',page.notFound());await write('.nojekyll','');
const origin='https://wieslawsoltes.github.io';await write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...routes.keys()].map(r=>`<url><loc>${origin+base+r}</loc></url>`).join('')+'</urlset>');await write('robots.txt','User-agent: *\nAllow: /\nSitemap: '+origin+base+'sitemap.xml\n');
await write('build-info.json',JSON.stringify({siteVersion:pkg.version,packages:Object.fromEntries(components.map(c=>[c.name,versions[c.package]])),routes:routes.size+1,sourceCommit:process.env.GITHUB_SHA||'local',runtimeBytes:Object.entries(bundled.metafile.outputs).reduce((n,[,v])=>n+v.bytes,0)},null,2));
await fs.rm('.build-entries',{recursive:true,force:true});
console.log(`Generated ${routes.size+1} static pages, ${components.length} component sandboxes, and ${Object.values(samples).reduce((n,s)=>n+s.length,0)} executable presets.`);
