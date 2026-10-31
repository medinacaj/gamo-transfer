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
function mount(){
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
  const localStorage={getItem(){return null;},setItem(){}};
  vm.runInNewContext(src,{window,document,location,localStorage,setTimeout,Intl,Date,structuredClone,console});
  return {nodes,node,location,docListeners,winListeners};
}
test("main dashboard prioritizes operations, separates demo and history",()=>{
 const {node}=mount();
 const content=node("#content").innerHTML;
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