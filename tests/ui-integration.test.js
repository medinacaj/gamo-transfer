"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs");
const path=require("node:path");
const D=require("../domain.js");
const root=path.join(__dirname,"..");
const src=fs.readFileSync(path.join(root,"app.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
function mount(savedState=null){
  const nodes=new Map(), docListeners=new Map(),winListeners=new Map();
  const node=selector=>{
    if(!nodes.has(selector))nodes.set(selector,{
      id:selector.replace(/^#/,""),value:"",textContent:"",innerHTML:"",
      classList:{toggle(){},remove(){},add(){}},setAttribute(){},removeAttribute(){},
      addEventListener(){},focus(){},append(){}
    });
    return nodes.get(selector);
  };
  const document={
    body:{dataset:{},classList:{toggle(){},remove(){},add(){}}},
    querySelector:node,querySelectorAll(){return[];},
    getElementById:id=>node("#"+id),
    addEventListener(name,fn){docListeners.set(name,fn);}
  };
  const location={hash:"#/inicio"};
  const window={
    Gamo:D,
    GamoAgencyReports:{overview:()=>[
      {key:"gp",name:"GP TRAVEL",count:22,total:993500,source:"Excel",week:"octubre 2026"}
    ],
    page:()=>'<section class="agency-report"><h1>Reportes por agencia</h1><p>Histórico documental de agencias con detalle de servicios, totales y filtros.</p></section>',
    mount(){}
    },
    addEventListener(name,fn){winListeners.set(name,fn);}
  };
  const localStorage={getItem(key){return key==="gamo.demo.v1" && savedState ? JSON.stringify(savedState) : null;},setItem(){}};
  vm.runInNewContext(src,{window,document,location,localStorage,setTimeout,Intl,Date,structuredClone,console});
  return {nodes,node,location,docListeners,winListeners};
}
test("main dashboard prioritizes operations, separates demo and history",()=>{
 const {node}=mount();
 const content=node("#content").innerHTML;
 const sections=["dashboard-zone-ops","dashboard-zone-history","dashboard-zone-finance"];
 for(const name of sections)assert.match(content,new RegExp('class="dashboard-zone '+name+'"'));
 assert.equal((content.match(/class="dashboard-zone /g)||[]).length,3);
 const operations=content.indexOf("Operación y despacho");
 const historical=content.indexOf("Servicios históricos");
 const finances=content.indexOf("Facturación y cobros");
 assert.ok(operations>=0 && historical>operations && finances>historical);
 assert.match(content,/ENTORNO DE DEMOSTRACIÓN/);
 assert.match(content,/33|22 servicios/);
 assert.doesNotMatch(content,/class="hero-banner"/);
});
test("booking page contains every advanced filter and status legend",()=>{
 const {node,location,winListeners}=mount();
 location.hash="#/reservas";
 winListeners.get("hashchange")();
 const content=node("#content").innerHTML;
 for(const field of ["booking-from","booking-to","booking-origin","booking-destination","booking-driver","booking-vehicle","booking-reset"]){
   assert.ok(content.includes('id="'+field+'"'),field);
 }
 for(const status of ["Pendiente","Confirmado","En curso","Completado","Cancelado"]){
   assert.ok(content.includes(status),status);
 }
});
test("changing a route filter updates filtered results and clearing restores all",()=>{
 const {node,location,winListeners,docListeners}=mount();
 location.hash="#/reservas";
 winListeners.get("hashchange")();
 node("#booking-origin").value="_____no-such-place_____";
 docListeners.get("input")({target:{id:"booking-origin"}});
 assert.match(node("#booking-count").textContent,/^0 de \d+ servicios$/);
 docListeners.get("click")({target:{closest(selector){return selector==="#booking-reset"?{}:null;}}});
 assert.equal(node("#booking-origin").value,"");
 assert.match(node("#booking-count").textContent,/^\d+ de \d+ servicios$/);
});
test("UI preferences buttons are mounted in the global header",()=>{
 assert.match(html,/data-ui-preference="theme"/);
 assert.match(html,/data-ui-preference="density"/);
 assert.match(html,/ui-preferences\.js/);
});
test("visual hierarchy uses functional regions and corresponding dark theme styles",()=>{
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 assert.match(css,/GAMO VISUAL HIERARCHY v4/);
 for(const cls of ["dashboard-zone-ops","dashboard-zone-history","dashboard-zone-finance"]){
   assert.ok(css.includes("."+cls),cls);
   assert.ok(css.includes('body[data-theme="dark"] .'+cls),cls+" dark");
 }
 assert.match(css,/\.kpi\{background:#fff;border:/);
});

test("navigation has functional groups without losing modules",()=>{
 const groupLabels=["Principal","Operación","Clientes","Finanzas","Reportes"];
 for(const label of groupLabels) assert.ok(html.includes(">"+label+"</span>"),label);
 assert.equal((html.match(/data-page="/g)||[]).length,11);
});
test("dashboard separation uses whitespace rather than decorative borders",()=>{
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 const v5=css.slice(css.indexOf("/* JERARQUÍA EDITORIAL v5"));
 assert.ok(v5.includes("background:transparent;border:0;border-radius:0;box-shadow:none"));
 assert.doesNotMatch(v5,/border-(?:left|top):[34]px/);
 assert.match(html, /href="styles\.css\?v=[a-z0-9-]+"/);
});

test("tables carry field labels for adaptive card layout",()=>{
 const {node,location,winListeners}=mount();
 const overview=node("#content").innerHTML;
 assert.match(overview,/class="data-table table-many-columns"/);
 assert.match(overview,/data-label="Servicio · hora argentina"/);
 location.hash="#/facturacion";
 winListeners.get("hashchange")();
 const invoices=node("#content").innerHTML;
 assert.match(invoices,/data-label="Documento"/);
});
test("no table or agenda is forced to scroll sideways",()=>{
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 const adaptive=css.slice(css.indexOf("/* GAMO RESPONSIVE TABLES v1"));
 assert.match(adaptive,/container:table-area \/ inline-size;/);
 assert.match(adaptive,/\.table-scroll\{[\s\S]*?overflow:visible/);
 assert.match(adaptive,/\.table-scroll \.data-table\{[\s\S]*?min-width:0/);
 assert.match(adaptive,/@container table-area \(max-width:1200px\)/);
 assert.match(adaptive,/@container table-area \(max-width:560px\)/);
 assert.match(adaptive,/\.agenda-grid\{grid-template-columns:repeat\(7,minmax\(0,1fr\)\);overflow-x:visible/);
 assert.match(adaptive,/\.agenda-grid\.single-day\{grid-template-columns:minmax\(0,1fr\)\}/);
});


test("invalid prototype-like hash paths fail closed to the home page",()=>{
 const {node,location,winListeners}=mount();
 for(const invalid of ["constructor","toString","__proto__"]){
   location.hash="#/"+invalid;
   winListeners.get("hashchange")();
   assert.match(node("#content").innerHTML,/Centro de operaciones/);
 }
});
test("demo admin is marked noindex and reserves logo space",()=>{
 assert.match(html,/name="robots" content="noindex, nofollow, noarchive"/);
 assert.equal((html.match(/width="170" height="56"/g)||[]).length,2);
});
test("both modal types use inert background and restore it on close",()=>{
 const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
 assert.equal((app.match(/if \(shell\) shell\.inert = true/g)||[]).length,2);
 assert.equal((app.match(/if \(shell\) shell\.inert = false/g)||[]).length,1);
});

test("persisted HTML payload is escaped before rendering customer names",()=>{
 const saved=D.seed("2026-11-01");
 saved.companies[0].name='<img src=x onerror=alert(1)>';
 const {node,location,winListeners}=mount(saved);
 location.hash="#/clientes";
 winListeners.get("hashchange")();
 const content=node("#content").innerHTML;
 assert.ok(content.includes("&lt;img src=x onerror=alert(1)&gt;"));
 assert.ok(!content.includes('<img src=x onerror=alert(1)>'));
});


test("action buttons in modal forms are never implicit submit controls",()=>{
 const {node,docListeners}=mount();
 const target={dataset:{action:"booking",id:""}};
 docListeners.get("click")({target:{closest(selector){
   return selector==="#booking-reset"?null:selector==="[data-action]"?target:null;
 }}});
 const html=node("#modal-root").innerHTML;
 assert.match(html,/type="button" class="btn btn-light" data-action="close"/);
 assert.match(html,/type="submit" class="btn btn-primary">Guardar/);
});
test("skip navigation focuses the main region without altering the route",()=>{
 assert.match(html,/id="skip-to-content"/);
 assert.match(html,/id="content" tabindex="-1"/);
 const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
 assert.match(app,/\$\("#skip-to-content"\)\?\.addEventListener\("click"/);
 assert.match(app,/\$\("#content"\)\?\.focus\(\)/);
});
test("reservation CSV uses current filters consistently with the table",()=>{
 const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
 assert.match(app,/function filteredBookings\(\)/);
 assert.match(app,/const rows = filteredBookings\(\)/);
 assert.match(app,/page === "reservas" \? filteredBookings\(\) : state.bookings/);
});

test("application logic and stylesheets are versioned and files exist",()=>{
 const js=html.match(/<script src="(app\.js\?v=[a-z0-9-]+)" defer><\/script>/);
 const css=html.match(/<link rel="stylesheet" href="(styles\.css\?v=[a-z0-9-]+)"\s*\/>/);
 assert.ok(js,"JavaScript principal con versión de caché");
 assert.ok(css,"CSS con versión de caché");
 for(const asset of [js[1],css[1]]) {
   assert.ok(fs.existsSync(path.join(root,asset.split("?")[0])),asset);
 }
});


test("destructive reset has an explicit submit action and safe cancel",()=>{
 const {node,docListeners}=mount();
 const target={dataset:{action:"reset",id:""}};
 docListeners.get("click")({target:{closest(selector){
   return selector==="#booking-reset"?null:selector==="[data-action]"?target:null;
 }}});
 const form=node("#modal-root").innerHTML;
 assert.match(form,/type="button" class="btn btn-light" data-action="close"/);
 assert.match(form,/type="submit" class="btn btn-danger">Restaurar datos/);
 assert.match(form,/Escribí RESTAURAR para confirmar/);
});


test("cards have a subtle base shadow and a desktop hover elevation",()=>{
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 const block=css.slice(css.indexOf("/* GAMO CARDS DEPTH v1"));
 assert.ok(block.startsWith("/* GAMO CARDS DEPTH v1"));
 assert.match(block,/--gamo-card-shadow:/);
 assert.match(block,/--gamo-card-shadow-hover:/);
 assert.match(block,/--gamo-panel-shadow:/);
 assert.match(block,/@media \(hover: hover\) and \(pointer: fine\)/);
 assert.match(block,/\.entity-card, \.stat-pill, \.history-source-item/);
 assert.match(block,/\.panel:hover/);
 assert.match(block,/prefers-reduced-motion: reduce/);
 assert.match(block,/transform: none !important/);
 assert.match(block,/@media print/);
 assert.doesNotMatch(block,/border-(?:top|left):\s*[34]px/);
});


test("collections do not nest an outer card around their own cards",()=>{
 const {node,location,winListeners}=mount();
 const home=node("#content").innerHTML;
 assert.match(home,/class="history-source-panel history-source-flat history-ledger"/);
 assert.doesNotMatch(home,/class="panel history-source-panel"/);
 assert.match(home,/class="operations-service-board"/);
 assert.match(home,/class="history-source-grid"/);
 assert.match(home,/class="history-source-item"/);
 location.hash="#/reservas";
 winListeners.get("hashchange")();
 assert.match(node("#content").innerHTML,/class="panel panel--collection" id="booking-results"/);
});
test("flat card layers preserve shadows and hover on individual cards",()=>{
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 const flat=css.slice(css.indexOf("/* GAMO SINGLE-LEVEL CARDS v1"));
 assert.match(flat,/\.panel\.panel--collection/);
 assert.match(flat,/box-shadow: none/);
 assert.match(flat,/\.history-source-panel\.history-source-flat/);
 assert.match(flat,/\.entity-card \.entity-meta/);
 assert.match(flat,/\.agency-document \.agency-subpanel/);
 const elevated=css.slice(css.indexOf("/* GAMO CARDS DEPTH v1"),css.indexOf("/* GAMO SINGLE-LEVEL CARDS v1"));
 assert.match(elevated,/--gamo-card-shadow-hover:/);
 assert.match(elevated,/translateY\(-2px\)/);
});


test("Apple-inspired design has contrasting tiles, functional blue and safe card hierarchy",()=>{
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 const skin=css.slice(css.indexOf("/* GAMO APPLE-INSPIRED OPERATIONS v1"));
 assert.ok(skin.startsWith("/* GAMO APPLE-INSPIRED OPERATIONS v1"));
 for(const token of ["--canvas: #101012;","--card: #1d1d1f;","--apple-action: #0071e3;","--apple-link: #65b7ff;","--apple-tile-contrast: #f5f5f7;"]){
  assert.ok(skin.includes(token),token);
 }
 assert.match(skin,/--canvas: #ededf0;/);
 assert.match(skin,/body\[data-theme="dark"\] \.dashboard-zone-finance \.kpi/);
 assert.match(skin,/body\[data-theme="dark"\] \.dashboard-zone-ops \.kpi:first-child/);
 assert.match(skin,/body \.panel\.panel--collection/);
 assert.match(skin,/body \.history-source-flat/);
 assert.match(skin,/@media\(hover:hover\) and \(pointer:fine\)/);
 assert.match(skin,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(skin,/@media print/);
 assert.match(html,/styles\.css\?v=20261101-premium-v17/);
 assert.match(html,/app\.js\?v=20261101-premium-v17/);
 assert.match(html,/ui-preferences\.js\?v=20261101-apple-v15/);
 assert.match(html,/<meta name="theme-color" content="#0e0e0e"/);
 assert.match(html,/<body data-theme="dark" data-density="comfortable">/);
 const ui=fs.readFileSync(path.join(root,"ui-preferences.js"),"utf8");
 assert.match(ui,/let state=\{theme:"dark",density:"comfortable"\};/);
 assert.match(ui,/validTheme\.has\(stored\.theme\)/);
 const rgb=h=>h.replace("#","").match(/../g).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const lum=h=>{const [r,g,b]=rgb(h);return .2126*r+.7152*g+.0722*b;};
 const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 assert.ok(ratio("#f5f5f7","#1d1d1f")>14);
 assert.ok(ratio("#ffffff","#0071e3")>4.5);
 assert.ok(ratio("#1d1d1f","#f5f5f7")>14);
 assert.ok(ratio("#65b7ff","#101012")>8);
});

test("dashboard areas have clear unnumbered headings and one neutral separator",()=>{
 const {node}=mount();
 const content=node("#content").innerHTML;
 assert.equal((content.match(/class="dashboard-zone dashboard-zone-/g)||[]).length,3);
 for(const label of ["PRIORIDAD OPERATIVA","FUENTES DOCUMENTADAS","GESTIÓN FINANCIERA"]){
  assert.ok(content.includes(label),label);
 }
 assert.doesNotMatch(content,/<span class="eyebrow">(?:01|02|03) ·/);
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 const styles=css.slice(css.indexOf("/* GAMO DASHBOARD SEPARATORS + REAL COMPACT v1"));
 assert.match(styles,/\.dashboard-zone \+ \.dashboard-zone \{[\s\S]*?border-top: 1px solid #afb4b7;/);
 assert.match(styles,/body\[data-theme="dark"\] \.dashboard-zone \+ \.dashboard-zone \{[\s\S]*?border-top: 1px solid #52616b;/);
 assert.doesNotMatch(styles,/border-left:\s*[34]px|border-top:\s*[34]px/);
});
test("compact density changes real component dimensions, not just the toolbar button",()=>{
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 const styles=css.slice(css.indexOf("/* GAMO DASHBOARD SEPARATORS + REAL COMPACT v1"));
 assert.match(styles,/body\[data-density="compact"\] \.kpi \{ padding: 10px 12px; \}/);
 assert.match(styles,/body\[data-density="compact"\] \.bar-chart \{ height: 125px;/);
 assert.match(styles,/body\[data-density="compact"\] \.history-source-item \{ padding: 10px 12px;/);
 assert.match(styles,/body\[data-density="compact"\] \.agenda-day \{ min-height: 220px;/);
 assert.match(styles,/body\[data-density="compact"\] \.entity-meta \{/);
 assert.match(styles,/body\[data-density="compact"\] \.table-scroll \.data-table tbody td \{[\s\S]*?--cell-padding: 7px 9px;/);
 assert.match(styles,/@container table-area \(max-width: 1200px\) \{[\s\S]*?--cell-padding: 3px 6px;/);
 assert.match(styles,/@media\(max-width: 900px\) \{[\s\S]*?main \{ padding: 16px 14px 25px;/);
 assert.match(styles,/@media print \{[\s\S]*?border-top: 0 !important;/);
 assert.ok((styles.match(/body\[data-density="compact"\]/g)||[]).length>30);
});


test("obsolete dashboard card shell is absent; editorial sections own the layout",()=>{
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 assert.doesNotMatch(css,/background:var\(--zone-fill\);border:1px solid var\(--zone-line\);border-radius:14px/);
 assert.doesNotMatch(css,/body\[data-density="compact"\] \.dashboard-zone\{margin:16px 0;padding:14px 15px\}/);
 assert.match(css,/\/\* Shared dashboard tokens\. The outer section is deliberately not a card;/);
 assert.match(css,/\.dashboard-zone \+ \.dashboard-zone \{/);
 assert.match(css,/GAMO SINGLE-LEVEL CARDS v1/);
});

test("Apple-inspired skin preserves operational routes and status semantics",()=>{
 const {node,location,winListeners}=mount();
 const dashboard=node("#content").innerHTML;
 assert.equal((dashboard.match(/class="dashboard-zone dashboard-zone-/g)||[]).length,3);
 assert.match(dashboard,/Operación y despacho/);
 assert.match(dashboard,/Servicios históricos/);
 assert.match(dashboard,/Facturación y cobros/);
 for(const route of ["reservas","agenda","clientes","conductores","vehiculos","facturacion","cobros","finanzas","reportes","reportes-agencias"]){
  location.hash="#/"+route;
  winListeners.get("hashchange")();
  assert.ok(node("#content").innerHTML.length>100,route);
 }
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 const system=css.slice(css.indexOf("/* GAMO APPLE-INSPIRED OPERATIONS v1"));
 for(const status of ["success","warning","danger","info","neutral"])assert.ok(system.includes(".badge."+status),status);
 assert.match(system,/\.agenda-day\.today/);
 assert.match(system,/\.agency-table tfoot td/);
 assert.match(system,/\.data-table tbody tr:hover/);
});


test("operational home uses distinct Apple-style composition rather than the old flat row",()=>{
 const {node}=mount();
 const page=node("#content").innerHTML;
 for(const name of ["operations-intro","operations-intro-copy","operations-hero-stat","dashboard-ops-overview","history-ledger-intro","history-ledger-details","dashboard-finance-layout","dashboard-finance-chart"]){
  assert.match(page,new RegExp('class="[^"]*'+name));
 }
 assert.match(page,/<h1>Centro de operaciones<\/h1>/);
 assert.match(page,/class="operations-hero-value"/);
 assert.ok(page.indexOf('class="operations-intro"')<page.indexOf('class="dashboard-zone dashboard-zone-ops"'));
 assert.ok(page.indexOf('class="history-ledger-intro"')<page.indexOf('class="dashboard-zone dashboard-zone-finance"'));
 assert.equal((page.match(/class="dashboard-zone dashboard-zone-/g)||[]).length,3);
 const ops=page.slice(page.indexOf('class="dashboard-ops-overview"'),page.indexOf('class="dashboard-main dashboard-operations"'));
 assert.equal((ops.match(/class="kpi"/g)||[]).length,4);
 assert.match(page,/class="operations-service-list"/);
 const finance=page.slice(page.indexOf('class="dashboard-finance-layout"'));
 assert.equal((finance.match(/class="kpi"/g)||[]).length,4);
 assert.match(finance,/class="dashboard-finance-chart"/);
 assert.match(page,/GP Travel: diferencia de \$60\.000/);
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 const layout=css.slice(css.indexOf("/* GAMO OPERATIONS COMPOSITION v1"));
 assert.match(layout,/\.operations-intro \{/);
 assert.match(layout,/\.dashboard-ops-overview \{/);
 assert.match(layout,/\.history-source-flat\.history-ledger/);
 assert.match(layout,/\.dashboard-finance-layout \{/);
 assert.match(layout,/@media\(max-width:650px\)/);
});


test("premium v2 uses actionable selectable services, real amounts and licensed visual stage",()=>{
 const {node}=mount(), page=node("#content").innerHTML;
 for(const name of ["operations-photo","operations-week-bars","operations-service-list","operations-service-detail","operations-detail-grid","operations-detail-actions","dashboard-triad"]) assert.match(page,new RegExp(name));
 assert.equal((page.match(/class="operations-service-row/g)||[]).length,5);
 assert.match(page,/data-action="dashboard-select"/);
 assert.match(page,/data-action="booking"/);
 assert.match(page,/data-id="R-/);
 assert.doesNotMatch(page,/142 servicios|128 servicios/);
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 const premium=css.slice(css.indexOf("/* GAMO PREMIUM STAGE V2"));
 assert.match(premium,/executive-van\.svg/);
 assert.match(premium,/images\.unsplash\.com/);
 assert.match(premium,/\.dashboard-main\.dashboard-triad/);
 assert.match(premium,/@media\(max-width:570px\)/);
 assert.match(html,/img-src 'self' data: https:\/\/images\.unsplash\.com/);
});
