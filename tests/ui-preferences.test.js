"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","ui-preferences.js"),"utf8");
function setup(saved){
  const db=new Map(saved?[["gamo.ui.preferences.v1",JSON.stringify(saved)]]:[]);
  const listeners=new Map();
  const nodes=new Map();
  const document={
    body:{dataset:{}},
    querySelector(selector){
      if(!nodes.has(selector))nodes.set(selector,{textContent:"",attrs:{},setAttribute(k,v){this.attrs[k]=v;}});
      return nodes.get(selector);
    },
    addEventListener(kind,fn){listeners.set(kind,fn);}
  };
  const window={localStorage:{getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,v)}};
  vm.runInNewContext(source,{window,document});
  return {window,document,db,listeners,nodes};
}
test("default choices apply to the whole app",()=>{
 const {window,document}=setup();
 assert.equal(window.GamoUI.read().theme,"dark");
 assert.equal(window.GamoUI.read().density,"comfortable");
 assert.equal(document.body.dataset.theme,"dark");
});
test("theme and density persist, without exposing operational data",()=>{
 const {window,document,db}=setup();
 assert.equal(window.GamoUI.setTheme("light"),true);
 assert.equal(window.GamoUI.setDensity("compact"),true);
 assert.equal(document.body.dataset.theme,"light");
 assert.equal(document.body.dataset.density,"compact");
 assert.equal(JSON.parse(db.get("gamo.ui.preferences.v1")).theme,"light");
 assert.equal(window.GamoUI.setDensity("invalid"),false);
});
test("invalid values in browser storage are ignored",()=>{
 const {window}=setup({theme:"unsafe",density:"unsupported"});
 assert.equal(window.GamoUI.read().theme,"dark");
 assert.equal(window.GamoUI.read().density,"comfortable");
});
test("preferences can be toggled from accessible buttons",()=>{
 const {window,listeners}=setup();
 const button={dataset:{uiPreference:"theme"}};
 listeners.get("click")({target:{closest(){return button;}}});
 assert.equal(window.GamoUI.read().theme,"light");
});