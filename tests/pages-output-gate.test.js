import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const gate=join(root,'scripts/check-pages-output.mjs');
const staticFiles=[
  'index.html','styles.css','domain.js','app.js','agency-reports.js',
  'ui-preferences.js','version-check.js','reportes-agencias.html',
  'gamo-logo.svg','assets/executive-van.svg'
];
function stage(t){
  const dir=mkdtempSync(join(tmpdir(),'gamo-pages-privacy-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  for(const path of staticFiles){
    mkdirSync(join(dir,path.includes('/')?'assets':'.'),{recursive:true});
    cpSync(join(root,path),join(dir,path));
  }
  writeFileSync(join(dir,'.nojekyll'),'');
  writeFileSync(join(dir,'build-info.txt'),'commit=synthetic-ci-only\\n');
  return dir;
}
function inspect(dir){
  return spawnSync(process.execPath,[gate,dir],{encoding:'utf8',timeout:12000});
}
test('accepts only existing vetted passive art and synthetic files',t=>{
  const dir=stage(t),result=inspect(dir);
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/archivos sintéticos verificados/);
});
for(const [label,attack] of [
  ['script element','<script>alert(1)</script>'],
  ['event handler','<path onload="alert(1)" d="M0 0"/>'],
  ['foreignObject','<foreignObject><div>browser</div></foreignObject>'],
  ['remote image','<image href="https://example.test/track.svg"/>'],
  ['scriptable url','<image href="javascript:alert(1)"/>'],
  ['non-fragment CSS URL','<path fill="url(https://example.test/remote.svg)"/>'],
  ['DTD','<!DOCTYPE svg [<!ENTITY x "unsafe">]>'],
]){
  test('rejects '+label+' in published SVG',t=>{
    const dir=stage(t);
    writeFileSync(join(dir,'assets/executive-van.svg'),'<svg xmlns="http://www.w3.org/2000/svg">'+attack+'</svg>');
    const result=inspect(dir);
    assert.notEqual(result.status,0,label);
    assert.match(result.stderr,/SVG activo|SVG no autorizada|URL CSS no autorizada/,label);
  });
}
