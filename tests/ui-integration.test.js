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
    body:{classList:{toggle(){},remove(){},add(){}}},
    querySelector:node,querySelectorAll(){return[];},
    getElementById:id=>node("#"+id),
    addEventListener(name,fn){docListeners.set(name,fn);}
  };
  const location={hash:"#/inicio"};
  const window={
    Gamo:D,
    GamoAgencyReports:{overview:()=>[
      {key:"gp",name:"GP TRAVEL",count:22,total:993500,source:"Excel",week:"octubre 2026"}
    ]},
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
 assert.ok(html.includes("styles.css?v=20261101-canvas-v11"));
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

test("application logic uses a versioned script to avoid stale deploy cache",()=>{
 assert.match(html,/src="app\.js\?v=20261101-ux-v8" defer/);
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
 assert.match(home,/class="history-source-panel history-source-flat"/);
 assert.doesNotMatch(home,/class="panel history-source-panel"/);
 assert.match(home,/class="panel panel--collection"/);
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


test("page canvas differs from cards in both themes without introducing nested frames",()=>{
 const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
 assert.match(css,/--canvas: #cedbe6;/);
 assert.match(css,/--canvas:#07131e;/);
 assert.match(css,/background: var\(--canvas\)/);
 assert.match(css,/body\[data-theme="dark"\] \{ background-color: var\(--canvas\); \}/);
 assert.match(css,/\.workspace, #content \{ background-color: transparent; \}/);
 assert.match(css,/GAMO SINGLE-LEVEL CARDS v1/);
 assert.match(css,/GAMO CARDS DEPTH v1/);
 const srgb=h=>h.replace("#","").match(/../g).map(c=>parseInt(c,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const luminance=h=>{const [r,g,b]=srgb(h);return .2126*r+.7152*g+.0722*b;};
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 assert.ok(contrast("#cedbe6","#ffffff")>=1.35);
 assert.ok(contrast("#07131e","#1d3446")>=1.45);
});
