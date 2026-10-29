const { test } = require("node:test");
const assert = require("node:assert/strict");
let D;
try {
  D = require("../domain.js");
} catch {
  D = {};
}
const fresh = () => D.seed("2026-10-29");
test("datos demo mantienen referencias, cantidades y separación de estados", () => {
  assert.equal(typeof D.seed, "function");
  const s = fresh();
  assert.equal(s.drivers.length, 6);
  assert.equal(s.vehicles.length, 8);
  assert.equal(s.bookings.length, 28);
  assert.equal(s.companies.filter((c) => c.country !== "Argentina").length, 8);
  for (const b of s.bookings) {
    assert.ok(s.companies.some((c) => c.id === b.companyId));
    assert.ok(b.passengers);
  }
  assert.ok(
    s.invoices.some((i) => D.balance(s, i) > 0 && D.balance(s, i) < i.total),
  );
});
function pending(s) {
  return s.bookings.filter(
    (b) => b.status === "Completado" && !D.documentFor(s, b.id),
  );
}
function doc(s) {
  const b = pending(s)[0];
  return D.createInvoice(s, {
    companyId: b.companyId,
    bookingIds: [b.id],
    date: "2026-10-29",
    due: "2026-11-29",
    currency: b.currency,
    rate: 1200,
    rateDate: "2026-10-29",
    rateSource: "Ficticio demo",
    type: "Resumen comercial",
    fiscal: "Pendiente de revisión contable",
  });
}
test("consolidación rechaza duplicados, mezcla de monedas y viajes no completados", () => {
  const s = fresh(),
    i = doc(s),
    b = s.bookings.find((b) => b.id === i.bookingIds[0]);
  assert.equal(i.total, b.price);
  assert.throws(
    () => D.createInvoice(s, { ...i, bookingIds: [b.id] }),
    /incluido/,
  );
  const p = pending(s)[0];
  assert.throws(
    () => D.createInvoice(s, { ...i, bookingIds: [p.id, p.id] }),
    /repetido/,
  );
});
test("emisión, pagos parciales, cruzados e históricos y rechazo de sobrepagos", () => {
  const s = fresh(),
    i = doc(s);
  D.issueInvoice(s, i.id, "DEMO-999");
  D.recordPayment(s, {
    invoiceId: i.id,
    amount: 10,
    currency: i.currency,
    conversion: 1,
    arsRate: 1300,
    date: "2026-10-29",
    rateDate: "2026-10-29",
    source: "Demo",
    fee: 0,
    method: "Transferencia internacional",
  });
  assert.equal(D.balance(s, i), D.round(i.total - 10));
  const old = s.payments.at(-1).arsValue;
  assert.throws(
    () =>
      D.recordPayment(s, {
        invoiceId: i.id,
        amount: i.total * 2,
        currency: i.currency,
        conversion: 1,
        arsRate: 1300,
        date: "2026-10-29",
        rateDate: "2026-10-29",
        source: "Demo",
        fee: 0,
        method: "Otro",
      }),
    /supera/,
  );
  D.recordPayment(s, {
    invoiceId: i.id,
    amount: (i.total - 10) * 2,
    currency: i.currency === "EUR" ? "USD" : "EUR",
    conversion: 0.5,
    arsRate: 1500,
    date: "2026-10-29",
    rateDate: "2026-10-29",
    source: "Demo",
    fee: 1,
    method: "Plataforma de pagos",
  });
  assert.equal(D.balance(s, i), 0);
  assert.equal(s.payments.at(-2).arsValue, old);
  assert.throws(() => D.cancelInvoice(s, i.id, "Corrección"), /pagos/);
});
test("anulación auditada libera servicios y bloquea modificaciones de viajes documentados", () => {
  const s = fresh(),
    i = doc(s),
    b = s.bookings.find((b) => b.id === i.bookingIds[0]);
  assert.throws(
    () => D.saveBooking(s, { ...b, price: b.price + 5 }),
    /documento/,
  );
  assert.throws(() => D.cancelInvoice(s, i.id, ""), /motivo/);
  D.cancelInvoice(s, i.id, "Error de período");
  assert.equal(D.documentFor(s, b.id), undefined);
  assert.ok(i.cancelReason);
});
test("reservas validan capacidad, conflictos y cantidades", () => {
  const s = fresh(),
    b = {
      ...s.bookings.find((b) => !D.documentFor(s, b.id)),
      id: undefined,
      date: "2026-11-20T10:00",
      driverId: s.drivers[0].id,
      vehicleId: s.vehicles[0].id,
      status: "Confirmado",
      count: 1,
      category: s.vehicles[0].category,
    };
  const saved = D.saveBooking(s, b);
  assert.ok(saved.id);
  assert.throws(
    () => D.saveBooking(s, { ...b, date: "2026-11-20T10:30" }),
    /conflicto/i,
  );
  assert.throws(
    () => D.saveBooking(s, { ...b, date: "2026-11-21T10:30", count: 99 }),
    /capacidad/i,
  );
  for (const price of [-1, Infinity, NaN])
    assert.throws(() => D.saveBooking(s, { ...b, price }), /importe/i);
});
test("documentos requieren empresa, moneda, cotización y fechas válidas", () => {
  const s = fresh(),
    b = pending(s)[0],
    input = {
      companyId: b.companyId,
      bookingIds: [b.id],
      currency: b.currency,
      date: "2026-10-29",
      due: "2026-11-29",
      rate: 1200,
      rateDate: "2026-10-29",
      rateSource: "Demo",
      type: "Resumen",
      fiscal: "Revisar",
    };
  for (const change of [
    { rate: 0 },
    { due: "2026-01-01" },
    { currency: b.currency === "USD" ? "EUR" : "USD" },
    { companyId: "none" },
  ])
    assert.throws(() => D.createInvoice(s, { ...input, ...change }));
});
test("CSV neutraliza fórmulas y escapa comillas y separadores", () => {
  assert.equal(D.csvCell("=1+1"), '"\'=1+1"');
  assert.equal(D.csvCell('a;"b"'), '"a;""b"""');
});
test("consolidación suma varios servicios y mantiene moneda única", () => {
  const s = fresh(),
    bs = s.bookings.filter(
      (b) => b.companyId === "C5" && b.status === "Completado",
    );
  const i = D.createInvoice(s, {
    companyId: "C5",
    bookingIds: bs.map((b) => b.id),
    currency: "EUR",
    date: "2026-10-29",
    due: "2026-11-29",
    rate: 1450,
    rateDate: "2026-10-29",
    rateSource: "Demo",
    type: "Resumen DEMO",
    fiscal: "Revisar",
  });
  assert.equal(i.bookingIds.length, 2);
  assert.equal(
    i.total,
    bs.reduce((n, b) => n + b.price, 0),
  );
});
test("rechaza fechas imposibles sin normalizarlas silenciosamente", () => {
  const s = fresh(),
    b = { ...s.bookings[8], id: undefined, date: "2026-02-31T10:00" };
  assert.throws(() => D.saveBooking(s, b), /Fecha/);
});
test("alertas de despacho identifican recursos fuera de servicio y conflictos", () => {
  const s = fresh(),
    b = s.bookings.find((b) => b.status === "Confirmado");
  s.vehicles.find((v) => v.id === b.vehicleId).status = "Mantenimiento";
  assert.ok(D.dispatchAlerts(s, b).some((x) => /fuera de servicio/.test(x)));
  s.bookings.push({ ...b, id: "CONFLICTO" });
  assert.ok(D.dispatchAlerts(s, b).some((x) => /Conflicto/.test(x)));
});
test("liquidación a conductor permite pagos parciales sin sobrepagar", () => {
  const s = fresh(),
    b = s.bookings[0];
  D.recordDriverPayment(s, {
    bookingId: b.id,
    amount: 1000,
    date: "2026-10-29",
    reference: "Demo",
  });
  assert.equal(D.driverBalance(s, b), b.costs.driver - 1000);
  assert.throws(
    () =>
      D.recordDriverPayment(s, {
        bookingId: b.id,
        amount: b.costs.driver,
        date: "2026-10-29",
      }),
    /supera/,
  );
});
test("conserva precisión de conversión ARS a USD y EUR a USD", () => {
  const s = fresh(),
    b = s.bookings.find(
      (b) =>
        b.companyId === "C1" &&
        b.status === "Completado" &&
        !D.documentFor(s, b.id),
    );
  const i = D.createInvoice(s, {
    companyId: b.companyId,
    bookingIds: [b.id],
    currency: "USD",
    date: "2026-10-29",
    due: "2026-11-29",
    rate: 1200.123456,
    rateDate: "2026-10-29",
    rateSource: "Demo",
    type: "Resumen",
    fiscal: "Revisar",
  });
  D.issueInvoice(s, i.id, "PRECISION");
  assert.equal(i.rate, 1200.123456);
  const base = {
    invoiceId: i.id,
    date: "2026-10-29",
    rateDate: "2026-10-29",
    source: "Demo",
    method: "Otro",
    fee: 0,
  };
  const p = D.recordPayment(s, {
    ...base,
    currency: "ARS",
    amount: 12000,
    conversion: 1 / 1200,
    arsRate: 1,
  });
  assert.equal(p.applied, 10);
  assert.equal(p.conversion, 1 / 1200);
  const q = D.recordPayment(s, {
    ...base,
    currency: "EUR",
    amount: 10,
    conversion: 0.923456,
    arsRate: 1450.123456,
  });
  assert.equal(q.applied, 9.23);
  assert.equal(q.arsRate, 1450.123456);
  assert.equal(D.validateState(s), true);
});
test("rechaza importes y resultados fuera del rango numérico sin mutación", () => {
  const s = fresh(),
    n = s.bookings.length,
    b = { ...s.bookings[4], id: undefined };
  for (const price of [1e308, 1e100])
    assert.throws(() => D.saveBooking(s, { ...b, price }), /rango|importe/i);
  assert.throws(
    () => D.saveBooking(s, { ...b, price: 1e12, rate: 1e9 }),
    /rango|importe/i,
  );
  assert.equal(s.bookings.length, n);
  const i = doc(s);
  D.issueInvoice(s, i.id, "OVERFLOW");
  const count = s.payments.length;
  assert.throws(
    () =>
      D.recordPayment(s, {
        invoiceId: i.id,
        date: "2026-10-29",
        rateDate: "2026-10-29",
        source: "Demo",
        method: "Otro",
        currency: i.currency,
        amount: 1,
        arsRate: 1e308,
      }),
    /rango|importe/i,
  );
  assert.equal(s.payments.length, count);
});
test("valida estructura persistida, referencias e importes sin modificar datos", () => {
  const s = fresh();
  assert.equal(D.validateState(s), true);
  for (const change of [
    { bookings: [null] },
    { companies: [{}] },
    { invoices: [{ ...s.invoices[0], total: Infinity }] },
    { bookings: [{ ...s.bookings[0], companyId: "inexistente" }] },
    { bookings: [{ ...s.bookings[0], costs: null }] },
  ]) {
    const corrupt = { ...s, ...change };
    assert.throws(
      () => D.validateState(corrupt),
      /datos|formato|referencia|importe/i,
    );
  }
});
