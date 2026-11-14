#!/usr/bin/env node
// Fail closed before publishing GitHub Pages: only explicitly reviewed demo assets.
import {readFileSync,readdirSync} from 'node:fs';
import {join,relative,resolve} from 'node:path';

const directory=resolve(process.argv[2]||'_site');
const expected=new Set([
  '.nojekyll','build-info.txt',
  'index.html','styles.css','domain.js','app.js','agency-reports.js',
  'ui-preferences.js','version-check.js','reportes-agencias.html',
  'gamo-logo.svg','assets/executive-van.svg'
]);

function walk(dir){
  return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const file=join(dir,entry.name);
    if(entry.isSymbolicLink())throw Error('Enlace simbólico no autorizado: '+file);
    return entry.isDirectory()?walk(file):[file];
  });
}

const actual=walk(directory).map(file=>relative(directory,file).replaceAll('\\','/'));
for(const file of actual)if(!expected.has(file))throw Error('Asset no autorizado para Pages: '+file);
for(const file of expected)if(!actual.includes(file))throw Error('Falta asset obligatorio: '+file);

const forbidden=[
  /GP Travel/i,/Grupo Summa/i,/gp-travel-logo/i,
  /993[.,]?500/,/1[.,]?053[.,]?500/,/880[.,]?000/,/312[.,]?000/,
  /(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/,
  /(?:postgres(?:ql)?:\/\/[^\s'"]+@)/i
];
for(const file of actual){
  const content=readFileSync(join(directory,file),'utf8');
  for(const pattern of forbidden){
    if(pattern.test(content))throw Error('Posible dato comercial/privado en Pages: '+file+' ('+pattern.source+')');
  }
}
// SVG can execute active content when opened directly, even when the main
// application embeds it as an image. Pages permits only passive artwork.
function assertPassiveSvg(name,content){
  if(!/^\\s*<svg\\b/i.test(content) ||
     /<!DOCTYPE|<!ENTITY|<\\s*(?:script|style|foreignObject|iframe|object|embed)\\b/i.test(content) ||
     /\\son[a-z]+\\s*=/i.test(content))
    throw Error('SVG activo o inválido en Pages: '+name);
  for(const match of content.matchAll(/\\b(?:href|xlink:href)\\s*=\\s*(["'])(.*?)\\1/gi)){
    const value=match[2];
    // The brand SVG contains one embedded raster JPEG. No other inline
    // external resources or remote fetches are allowed.
    if(value.startsWith('#'))continue;
    if(name==='gamo-logo.svg'&&/^data:image\\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))continue;
    throw Error('Referencia SVG no autorizada en Pages: '+name);
  }
  for(const match of content.matchAll(/\\burl\\s*\\(\\s*['"]?([^)'"]+)/gi)){
    if(!match[1].startsWith('#'))throw Error('URL CSS no autorizada en SVG: '+name);
  }
}
for(const name of actual.filter(file=>file.endsWith('.svg'))){
  assertPassiveSvg(name,readFileSync(join(directory,name),'utf8'));
}

const agency=readFileSync(join(directory,'agency-reports.js'),'utf8');
for(const marker of ['AGENCIA DEMO NORTE','AGENCIA DEMO SUR','Datos sintéticos']){
  if(!agency.includes(marker))throw Error('Reporte no indica datos sintéticos: '+marker);
}
console.log('Publicación permitida: '+actual.length+' archivos sintéticos verificados, sin assets inesperados.');
