"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","version-check.js"),"utf8");
const OLD="a".repeat(40);
const NEW="b".repeat(40);

async function boot({current=OLD,remote=NEW,href="https://example.test/gamo-transfer/#/reservas",saved=null,networkError=false,modalOpen=false}={}){
 let replaced=null,requests=0;
 const storage=new Map(saved?[["gamo.build-refresh.v1",saved]]:[]);
 const document={
   baseURI:"https://example.test/gamo-transfer/",
   querySelector:selector=>selector==='meta[name="gamo-build"]' ? {content:current} : (modalOpen ? {} : null)
 };
 const location={href,replace(next){replaced=next;}};
 const window={
   location,
   sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
   fetch:async (url,options)=>{
     requests++;
     assert.match(url,/build-info\.txt\?check=/);
     assert.equal(options.cache,"no-store");
     if(networkError)throw Error("offline");
     return {ok:true,text:async()=>`commit=${remote}\n`};
   }
 };
 vm.runInNewContext(source,{window,document,URL,Date});
 await new Promise(resolve=>setImmediate(resolve));
 return {replaced,requests,storage};
}
test("local development and a current build do not trigger a reload",async()=>{
 const dev=await boot({current:"development"});
 const same=await boot({current:OLD,remote:OLD});
 assert.equal(dev.requests,0);
 assert.equal(dev.replaced,null);
 assert.equal(same.requests,1);
 assert.equal(same.replaced,null);
});
test("new deployment automatically refreshes once and preserves the hash route",async()=>{
 const result=await boot();
 assert.equal(result.requests,1);
 assert.equal(result.replaced,"https://example.test/gamo-transfer/?gamo-build="+NEW.slice(0,12)+"#/reservas");
 assert.equal(result.storage.get("gamo.build-refresh.v1"),NEW);
});
test("a refresh attempt never loops while the old HTML remains cached",async()=>{
 const already=await boot({saved:NEW});
 const url=await boot({href:"https://example.test/gamo-transfer/?gamo-build="+NEW.slice(0,12)+"#/inicio"});
 assert.equal(already.replaced,null);
 assert.equal(url.replaced,null);
});
test("offline refresh checks never break the interface",async()=>{
 const result=await boot({networkError:true});
 assert.equal(result.requests,1);
 assert.equal(result.replaced,null);
});

test("an open edit modal is not interrupted by a late version check",async()=>{
 const result=await boot({modalOpen:true});
 assert.equal(result.requests,1);
 assert.equal(result.replaced,null);
});
