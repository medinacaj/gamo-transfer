"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "agency-reports.js"), "utf8");

function load() {
  const elements = new Map();
  const exported = [];
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) {
        const listeners = new Map();
        const element = {
          value: selector === "#agency" ? "gp" : selector === "#mode" ? "detallado" : "",
          textContent: "",
          innerHTML: "",
          classList: { toggle() {} },
          addEventListener(kind, listener) { listeners.set(kind, listener); },
          trigger(kind) { listeners.get(kind)?.(); }
        };
        elements.set(selector, element);
      }
      return elements.get(selector);
    },
    querySelectorAll() { return []; },
    createElement() { return { click() {}, remove() {}, set href(_) {}, set download(_) {} }; },
    body: { appendChild() {} }
  };
  const sandbox = {
    window: {},
    document,
    setTimeout() {},
    Blob: class { constructor(parts) { exported.push(parts.join('')); } },
    URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }
  };
  vm.runInNewContext(source, sandbox);
  return { api: sandbox.window.GamoAgencyReports, elements, document, exported };
}

test("GP Travel: Excel has 22 services and source-faithful amounts", () => {
  const { api } = load();
  const gp = api.overview().find((r) => r.key === "gp");
  assert.equal(gp.count, 22);
  assert.equal(gp.base, 880000);
  assert.equal(gp.parking, 81500);
  assert.equal(gp.guide, 32000);
  assert.equal(gp.total, 993500);
  assert.equal(1053500 - gp.total, 60000);
});

test("Grupo Summa: source image contains 11 services", () => {
  const { api } = load();
  const summa = api.overview().find((r) => r.key === "summa");
  assert.equal(summa.count, 11);
  assert.equal(summa.total, 312000);
  assert.equal(summa.base, 312000);
});

test("Report page contains agency selection and integrated print/export controls", () => {
  const { api } = load();
  const page = api.page();
  assert.match(page, /id="agency"/);
  assert.match(page, /id="print"/);
  assert.match(page, /id="csv"/);
  assert.match(page, /agency-document/);
});

test("Report renders matching totals and source warning for each agency", () => {
  const { api, elements, document } = load();
  api.mount();
  assert.equal(document.querySelector("#k-count").textContent, 22);
  assert.equal(document.querySelector("#k-total").textContent, "$ 993.500");
  assert.match(document.querySelector("#source-note").innerHTML, /conciliar/);
  const agency = document.querySelector("#agency");
  agency.value = "summa";
  agency.trigger("change");
  assert.equal(document.querySelector("#k-count").textContent, 11);
  assert.equal(document.querySelector("#k-total").textContent, "$ 312.000");
  assert.match(document.querySelector("#source-note").innerHTML, /Grupo Summa/);
});

test("Public data excludes driver first names from the source file", () => {
  assert.equal(source.includes('"ALEX"'), false);
  assert.equal(source.includes('"ROI"'), false);
});


test("History filters by date and route without changing original data", () => {
  const {api,document}=load();
  api.mount();
  document.querySelector("#report-from").value="2026-10-25";
  document.querySelector("#report-from").trigger("change");
  assert.equal(document.querySelector("#report-filter-count").textContent,"3 de 22 servicios");
  document.querySelector("#report-route").value="zz__unknown__";
  document.querySelector("#report-route").trigger("input");
  assert.equal(document.querySelector("#report-filter-count").textContent,"0 de 22 servicios");
  assert.match(document.querySelector("#body").innerHTML,/No hay servicios/);
  document.querySelector("#report-clear").trigger("click");
  assert.equal(document.querySelector("#report-filter-count").textContent,"22 de 22 servicios");
  assert.equal(document.querySelector("#k-total").textContent,"$ 993.500");
});


test("detail and executive reports provide field labels for no-scroll layout",()=>{
 const {api,document}=load();
 api.mount();
 assert.match(api.page(),/table-many-columns/);
 assert.match(document.querySelector("#body").innerHTML,/data-label="PRECIO TOTAL"/);
 assert.match(document.querySelector("#body").innerHTML,/data-label="TARIFA BASE"/);
 document.querySelector("#mode").value="ejecutivo";
 document.querySelector("#mode").trigger("change");
 assert.match(document.querySelector("#body").innerHTML,/data-label="DESTINO"/);
 assert.doesNotMatch(document.querySelector("#body").innerHTML,/data-label="TARIFA BASE"/);
});

test("CSV export contains all documented rows without losing monetary values",()=>{
  const {api,document,exported}=load();
  api.mount();
  document.querySelector("#csv").trigger("click");
  assert.equal(exported.length,1);
  const lines=exported[0].trim().split(/\r\n/);
  assert.equal(lines.length,23); // Encabezado + 22 servicios
  assert.match(lines[0],/Agencia/);
  assert.match(lines[0],/Tarifa base/);
  assert.match(lines[1],/GP TRAVEL/);
  document.querySelector("#agency").value="summa";
  document.querySelector("#agency").trigger("change");
  document.querySelector("#csv").trigger("click");
  assert.equal(exported[1].trim().split(/\r\n/).length,12);
});
