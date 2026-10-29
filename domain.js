/* Dominio independiente de DOM y almacenamiento. Todas las cotizaciones son ficticias. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Gamo = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";
  const currencies = ["ARS", "USD", "EUR"],
    statuses = [
      "Pendiente",
      "Confirmado",
      "En curso",
      "Completado",
      "Cancelado",
    ];
  const MONEY_LIMIT = Number.MAX_SAFE_INTEGER / 100;
  const round = (n) => {
    n = Number(n);
    if (!Number.isFinite(n) || Math.abs(n) > MONEY_LIMIT)
      throw new Error("Importe fuera del rango numérico admitido");
    return Math.round((n + Number.EPSILON) * 100) / 100;
  };
  const sum = (arr, fn) => round(arr.reduce((a, x) => a + Number(fn(x)), 0));
  const id = (prefix) =>
    prefix +
    "-" +
    (globalThis.crypto?.randomUUID?.() ||
      Date.now().toString(36) + Math.random().toString(36).slice(2));
  const fail = (message) => {
    throw new Error(message);
  };
  const positive = (n, label, zero = false) => {
    if (!Number.isFinite(Number(n)) || (zero ? Number(n) < 0 : Number(n) <= 0))
      fail("Importe o " + label + " inválido");
    const value = round(n);
    if (!zero && value <= 0) fail("Importe mínimo: 0,01");
    return value;
  };
  const ratio = (n, label) => {
    const value = Number(n);
    if (!Number.isFinite(value) || value <= 0 || value > MONEY_LIMIT)
      fail("Importe o " + label + " fuera del rango admitido");
    return value;
  };
  const dateOK = (d) =>
    /^\d{4}-\d{2}-\d{2}$/.test(d || "") &&
    !Number.isNaN(Date.parse(d + "T12:00:00Z")) &&
    new Date(d + "T12:00:00Z").toISOString().slice(0, 10) === d;
  const today = () =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  const shift = (day, n) =>
    new Date(Date.parse(day + "T12:00:00Z") + n * 86400000)
      .toISOString()
      .slice(0, 10);
  function dispatchAlerts(s, b) {
    if (["Completado", "Cancelado"].includes(b.status)) return [];
    const alerts = [],
      d = s.drivers.find((d) => d.id === b.driverId),
      v = s.vehicles.find((v) => v.id === b.vehicleId);
    if (!d) alerts.push("Sin conductor");
    else {
      if (d.status !== "Disponible") alerts.push("Conductor no disponible");
      if (d.licenseExpiry < b.date.slice(0, 10))
        alerts.push("Licencia vencida");
    }
    if (!v) alerts.push("Sin vehículo");
    else {
      if (v.status !== "Operativo") alerts.push("Vehículo fuera de servicio");
      if (v.capacity < b.count) alerts.push("Capacidad insuficiente");
      if (v.category !== b.category) alerts.push("Categoría incompatible");
      if (
        v.insuranceExpiry < b.date.slice(0, 10) ||
        v.inspectionExpiry < b.date.slice(0, 10)
      )
        alerts.push("Vencimiento de seguro o revisión");
    }
    if (
      s.bookings.some(
        (x) =>
          x.id !== b.id &&
          !["Cancelado", "Completado"].includes(x.status) &&
          Math.abs(
            Date.parse(x.date + "-03:00") - Date.parse(b.date + "-03:00"),
          ) <
            90 * 60000 &&
          ((b.driverId && x.driverId === b.driverId) ||
            (b.vehicleId && x.vehicleId === b.vehicleId)),
      )
    )
      alerts.push("Conflicto de horario");
    return alerts;
  }
  const driverBalance = (s, b) =>
    Math.max(
      0,
      round(
        b.costs.driver -
          sum(
            (s.driverPayments || []).filter((p) => p.bookingId === b.id),
            (p) => p.amount,
          ),
      ),
    );
  function recordDriverPayment(s, input) {
    const b = s.bookings.find((b) => b.id === input.bookingId);
    if (!b || b.status !== "Completado" || !b.driverId)
      fail("Solo servicios completados con conductor");
    const amount = positive(input.amount, "liquidación");
    if (!dateOK(input.date) || input.date < b.date.slice(0, 10))
      fail("Fecha de liquidación inválida");
    if (amount > driverBalance(s, b))
      fail("El pago supera la liquidación pendiente");
    const p = {
      id: id("LD"),
      bookingId: b.id,
      driverId: b.driverId,
      amount,
      date: input.date,
      reference: String(input.reference || ""),
    };
    (s.driverPayments ||= []).push(p);
    return p;
  }
  const documentFor = (s, bid) =>
    s.invoices.find(
      (i) => i.status !== "Anulada" && i.bookingIds.includes(bid),
    );
  const balance = (s, i) =>
    i.status === "Anulada"
      ? 0
      : Math.max(
          0,
          round(
            i.total -
              sum(
                s.payments.filter((p) => p.invoiceId === i.id),
                (p) => p.applied,
              ),
          ),
        );
  const paymentStatus = (s, i, day = today()) =>
    i.status === "Anulada"
      ? "Sin efecto"
      : balance(s, i) === 0
        ? "Pagada"
        : balance(s, i) < i.total
          ? "Parcialmente pagada"
          : i.status === "Preparada"
            ? "Sin emitir"
            : i.due < day
              ? "Vencida"
              : "Pendiente de cobro";
  function saveBooking(s, input) {
    const b = { ...input };
    const old = s.bookings.find((x) => x.id === b.id);
    if (old && (s.driverPayments || []).some((p) => p.bookingId === b.id))
      fail("El viaje tiene liquidaciones de conductor registradas");
    if (old && documentFor(s, b.id))
      fail(
        "El viaje pertenece a un documento activo. Anulalo antes de modificarlo.",
      );
    if (!s.companies.some((c) => c.id === b.companyId))
      fail("Seleccioná una empresa");
    for (const field of ["passengers", "origin", "destination"])
      if (!String(b[field] || "").trim())
        fail("Completá pasajero, origen y destino");
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(b.date || "") ||
      !dateOK(b.date.slice(0, 10))
    )
      fail("Fecha de servicio inválida");
    if (!statuses.includes(b.status) || !currencies.includes(b.currency))
      fail("Estado o moneda inválido");
    b.price = positive(b.price, "precio");
    b.rate = ratio(b.rate, "cotización");
    if (b.currency === "ARS") b.rate = 1;
    if (!dateOK(b.rateDate) || !String(b.rateSource || "").trim())
      fail("Registrá fecha y fuente de cotización ficticia");
    b.count = Number(b.count);
    if (!Number.isInteger(b.count) || b.count < 1)
      fail("Cantidad de pasajeros inválida");
    if (b.driverId && !s.drivers.some((d) => d.id === b.driverId))
      fail("Conductor inexistente");
    const v = s.vehicles.find((v) => v.id === b.vehicleId),
      d = s.drivers.find((d) => d.id === b.driverId);
    if (b.vehicleId && !v) fail("Vehículo inexistente");
    if (b.status !== "Cancelado" && b.status !== "Completado") {
      if (v && v.status !== "Operativo") fail("Vehículo fuera de servicio");
      if (d && d.status !== "Disponible") fail("Conductor no disponible");
      if (v && v.capacity < b.count) fail("Capacidad insuficiente");
      if (v && v.category !== b.category)
        fail("Categoría del vehículo incompatible");
      if (d && d.licenseExpiry < b.date.slice(0, 10))
        fail("Licencia vencida para la fecha del servicio");
      if (
        v &&
        (v.insuranceExpiry < b.date.slice(0, 10) ||
          v.inspectionExpiry < b.date.slice(0, 10))
      )
        fail("Seguro o revisión del vehículo vencido");
      const conflict = s.bookings.find(
        (x) =>
          x.id !== b.id &&
          !["Cancelado", "Completado"].includes(x.status) &&
          Math.abs(
            Date.parse(x.date + "-03:00") - Date.parse(b.date + "-03:00"),
          ) <
            90 * 60000 &&
          ((b.driverId && b.driverId === x.driverId) ||
            (b.vehicleId && b.vehicleId === x.vehicleId)),
      );
      if (conflict)
        fail(
          "Conflicto de horario con " +
            conflict.id +
            " (ventana demo de 90 minutos)",
        );
    }
    if (
      ["En curso", "Completado"].includes(b.status) &&
      (!b.driverId || !b.vehicleId)
    )
      fail("Asigná conductor y vehículo antes de iniciar o finalizar");
    b.costs = Object.fromEntries(
      ["driver", "fuel", "tolls", "parking", "other"].map((k) => [
        k,
        positive(b.costs?.[k] ?? 0, k, true),
      ]),
    );
    round(b.price * b.rate);
    sum(Object.values(b.costs), (x) => x);
    b.id = old?.id || id("R");
    if (old) Object.assign(old, b);
    else s.bookings.push(b);
    return b;
  }
  function createInvoice(s, input) {
    if (!s.companies.some((c) => c.id === input.companyId))
      fail("Empresa inexistente");
    if (!input.bookingIds?.length) fail("Seleccioná al menos un servicio");
    if (new Set(input.bookingIds).size !== input.bookingIds.length)
      fail("Servicio repetido");
    const bookings = input.bookingIds.map((bid) =>
      s.bookings.find((b) => b.id === bid),
    );
    for (const b of bookings) {
      if (!b || b.companyId !== input.companyId || b.status !== "Completado")
        fail("Solo servicios completados de la misma empresa");
      if (documentFor(s, b.id)) fail("Servicio ya incluido en un documento");
      if (b.currency !== input.currency)
        fail("No mezclar monedas en un documento");
    }
    if (!dateOK(input.date) || !dateOK(input.due) || input.due < input.date)
      fail("Fechas de emisión y vencimiento inválidas");
    if (!currencies.includes(input.currency)) fail("Moneda inválida");
    const rate = input.currency === "ARS" ? 1 : ratio(input.rate, "cotización");
    if (
      !dateOK(input.rateDate) ||
      !String(input.rateSource || "").trim() ||
      !String(input.type || "").trim() ||
      !String(input.fiscal || "").trim()
    )
      fail("Completá cotización, tipo y revisión fiscal");
    const i = {
      id: id("DOC"),
      companyId: input.companyId,
      bookingIds: [...input.bookingIds],
      lines: bookings.map((b) => ({
        bookingId: b.id,
        date: b.date,
        passengers: b.passengers,
        route: b.origin + " → " + b.destination,
        amount: b.price,
      })),
      total: sum(bookings, (b) => b.price),
      currency: input.currency,
      rate,
      rateDate: input.rateDate,
      rateSource: input.rateSource,
      date: input.date,
      due: input.due,
      type: input.type,
      fiscal: input.fiscal,
      status: "Preparada",
      number: "",
    };
    round(i.total * i.rate);
    s.invoices.push(i);
    return i;
  }
  function issueInvoice(s, iid, number) {
    const i = s.invoices.find((i) => i.id === iid);
    if (!i || i.status !== "Preparada") fail("Documento no preparado");
    if (!String(number || "").trim()) fail("Ingresá un número de comprobante");
    if (s.invoices.some((x) => x.id !== iid && x.number === number.trim()))
      fail("Número de comprobante ya utilizado");
    i.number = number.trim();
    i.status = "Emitida";
    return i;
  }
  function cancelInvoice(s, iid, reason) {
    const i = s.invoices.find((i) => i.id === iid);
    if (!i || i.status === "Anulada") fail("Documento no disponible");
    if (s.payments.some((p) => p.invoiceId === iid))
      fail("No se puede anular un documento con pagos registrados");
    if (!String(reason || "").trim()) fail("Indicá el motivo de corrección");
    i.status = "Anulada";
    i.cancelReason = reason.trim();
    i.cancelDate = today();
    return i;
  }
  function recordPayment(s, input) {
    const i = s.invoices.find((i) => i.id === input.invoiceId);
    if (!i || i.status !== "Emitida")
      fail("Solo se cobran documentos emitidos");
    if (!currencies.includes(input.currency)) fail("Moneda inválida");
    const amount = positive(input.amount, "pago"),
      conversion =
        input.currency === i.currency
          ? 1
          : ratio(input.conversion, "conversión"),
      arsRate =
        input.currency === "ARS" ? 1 : ratio(input.arsRate, "cotización ARS"),
      fee = positive(input.fee ?? 0, "comisión", true);
    if (fee > amount) fail("La comisión no puede superar el pago");
    if (
      !dateOK(input.date) ||
      input.date < i.date ||
      !dateOK(input.rateDate) ||
      !String(input.source || "").trim() ||
      !String(input.method || "").trim()
    )
      fail("Completá fechas, fuente y medio de pago");
    const applied = round(amount * conversion);
    if (applied <= 0) fail("Importe convertido inválido");
    if (applied > balance(s, i)) fail("El pago supera el saldo del documento");
    const p = {
      id: id("P"),
      invoiceId: i.id,
      date: input.date,
      currency: input.currency,
      amount,
      conversion,
      arsRate,
      rateDate: input.rateDate,
      source: input.source,
      fee,
      method: input.method,
      reference: String(input.reference || ""),
      applied,
      arsValue: round(amount * arsRate),
      feeARS: round(fee * arsRate),
      exchangeDifference: round(amount * arsRate - applied * i.rate),
    };
    s.payments.push(p);
    return p;
  }
  const grouped = (rows, value, currency) =>
    currencies.map((c) => ({
      currency: c,
      total: sum(
        rows.filter((r) => currency(r) === c),
        value,
      ),
    }));
  function metrics(s) {
    const completed = s.bookings.filter((b) => b.status === "Completado");
    return {
      revenue: grouped(
        s.invoices.filter((i) => i.status === "Emitida"),
        (i) => i.total,
        (i) => i.currency,
      ),
      receivable: grouped(
        s.invoices.filter((i) => i.status === "Emitida"),
        (i) => balance(s, i),
        (i) => i.currency,
      ),
      payments: grouped(
        s.payments,
        (p) => p.amount,
        (p) => p.currency,
      ),
      pending: grouped(
        completed.filter((b) => !documentFor(s, b.id)),
        (b) => b.price,
        (b) => b.currency,
      ),
      incomeARS: sum(completed, (b) => b.price * b.rate),
      costARS: sum(completed, (b) => sum(Object.values(b.costs), (v) => v)),
      cashARS: sum(s.payments, (p) => p.arsValue - p.feeARS),
    };
  }
  const csvCell = (value) =>
    '"' +
    (/^[\s]*[=+@\-\t\r]/.test(String(value ?? "")) ? "'" : "") +
    String(value ?? "").replace(/"/g, '""') +
    '"';
  // Validate untrusted browser storage before rendering or persisting any changes.
  function validateState(s) {
    const bad = () =>
      fail("Formato de datos guardados inválido o referencia dañada");
    const obj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
    const text = (x) => typeof x === "string";
    const num = (x, zero = true) =>
      typeof x === "number" &&
      Number.isFinite(x) &&
      (zero ? x >= 0 : x > 0) &&
      x <= MONEY_LIMIT;
    const datetime = (x) =>
      text(x) &&
      /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(x) &&
      dateOK(x.slice(0, 10));
    if (!obj(s) || s.version !== 1 || !dateOK(s.seedDate)) bad();
    for (const key of [
      "companies",
      "drivers",
      "vehicles",
      "bookings",
      "invoices",
      "payments",
    ]) {
      if (!Array.isArray(s[key])) bad();
      const ids = new Set();
      for (const x of s[key]) {
        if (!obj(x) || !text(x.id) || !x.id || ids.has(x.id)) bad();
        ids.add(x.id);
      }
    }
    if (s.driverPayments !== undefined && !Array.isArray(s.driverPayments))
      bad();
    const company = (id) => s.companies.some((c) => c.id === id);
    const driver = (id) => s.drivers.some((c) => c.id === id);
    const vehicle = (id) => s.vehicles.some((c) => c.id === id);
    const booking = (id) => s.bookings.find((b) => b.id === id);
    for (const c of s.companies)
      if (
        !text(c.name) ||
        !c.name ||
        !text(c.country) ||
        !currencies.includes(c.currency) ||
        !Number.isInteger(c.creditDays) ||
        c.creditDays < 0
      )
        bad();
    for (const d of s.drivers)
      if (
        !text(d.name) ||
        !text(d.license) ||
        !dateOK(d.licenseExpiry) ||
        !["Disponible", "No disponible"].includes(d.status) ||
        !num(d.commission) ||
        d.commission > 100
      )
        bad();
    for (const v of s.vehicles)
      if (
        !text(v.name) ||
        !text(v.plate) ||
        !["Sedán", "Van"].includes(v.category) ||
        !Number.isInteger(v.capacity) ||
        v.capacity < 1 ||
        !num(v.km) ||
        !num(v.expenses) ||
        !dateOK(v.insuranceExpiry) ||
        !dateOK(v.inspectionExpiry) ||
        !["Operativo", "Mantenimiento", "Fuera de servicio"].includes(v.status)
      )
        bad();
    for (const b of s.bookings) {
      if (
        !company(b.companyId) ||
        !datetime(b.date) ||
        !text(b.passengers) ||
        !text(b.origin) ||
        !text(b.destination) ||
        !statuses.includes(b.status) ||
        !currencies.includes(b.currency) ||
        !num(b.price, false) ||
        !num(b.rate, false) ||
        !dateOK(b.rateDate) ||
        !text(b.rateSource) ||
        !Number.isInteger(b.count) ||
        b.count < 1 ||
        !["Sedán", "Van"].includes(b.category) ||
        !obj(b.costs) ||
        (b.driverId && !driver(b.driverId)) ||
        (b.vehicleId && !vehicle(b.vehicleId))
      )
        bad();
      if (
        !["driver", "fuel", "tolls", "parking", "other"].every((k) =>
          num(b.costs[k]),
        )
      )
        bad();
      round(b.price * b.rate);
      sum(Object.values(b.costs), (x) => x);
    }
    const reserved = new Set(),
      numbers = new Set();
    for (const i of s.invoices) {
      if (
        !company(i.companyId) ||
        !Array.isArray(i.bookingIds) ||
        !i.bookingIds.length ||
        new Set(i.bookingIds).size !== i.bookingIds.length ||
        !i.bookingIds.every(booking) ||
        !Array.isArray(i.lines) ||
        i.lines.length !== i.bookingIds.length ||
        !num(i.total, false) ||
        !num(i.rate, false) ||
        !currencies.includes(i.currency) ||
        !["Preparada", "Emitida", "Anulada"].includes(i.status) ||
        !dateOK(i.date) ||
        !dateOK(i.due) ||
        i.due < i.date ||
        !dateOK(i.rateDate) ||
        !text(i.rateSource) ||
        !text(i.type) ||
        !text(i.fiscal) ||
        !text(i.number)
      )
        bad();
      const lineIds = new Set();
      for (const l of i.lines) {
        if (
          !obj(l) ||
          !i.bookingIds.includes(l.bookingId) ||
          lineIds.has(l.bookingId) ||
          !num(l.amount, false) ||
          !datetime(l.date) ||
          !text(l.passengers) ||
          !text(l.route)
        )
          bad();
        lineIds.add(l.bookingId);
      }
      if (sum(i.lines, (l) => l.amount) !== i.total) bad();
      round(i.total * i.rate);
      if (i.number) {
        if (numbers.has(i.number)) bad();
        numbers.add(i.number);
      }
      if (i.status === "Emitida" && !i.number) bad();
      if (i.status !== "Anulada")
        for (const bid of i.bookingIds) {
          const b = booking(bid);
          if (
            reserved.has(bid) ||
            b.companyId !== i.companyId ||
            b.currency !== i.currency ||
            b.status !== "Completado"
          )
            bad();
          reserved.add(bid);
        }
    }
    for (const p of s.payments) {
      const i = s.invoices.find((i) => i.id === p.invoiceId);
      if (
        !i ||
        i.status !== "Emitida" ||
        !currencies.includes(p.currency) ||
        !dateOK(p.date) ||
        p.date < i.date ||
        !dateOK(p.rateDate) ||
        !text(p.source) ||
        !text(p.method) ||
        !num(p.amount, false) ||
        !num(p.applied, false) ||
        !num(p.conversion, false) ||
        !num(p.arsRate, false) ||
        !num(p.fee) ||
        p.fee > p.amount ||
        !num(p.arsValue) ||
        !num(p.feeARS) ||
        !Number.isFinite(p.exchangeDifference)
      )
        bad();
      if (
        round(p.amount * p.conversion) !== p.applied ||
        round(p.amount * p.arsRate) !== p.arsValue ||
        round(p.fee * p.arsRate) !== p.feeARS ||
        round(p.amount * p.arsRate - p.applied * i.rate) !==
          p.exchangeDifference
      )
        bad();
    }
    for (const i of s.invoices)
      if (
        sum(
          s.payments.filter((p) => p.invoiceId === i.id),
          (p) => p.applied,
        ) > i.total
      )
        bad();
    const settlementIds = new Set();
    for (const p of s.driverPayments || []) {
      const b = obj(p) && booking(p.bookingId);
      if (
        !b ||
        !text(p.id) ||
        settlementIds.has(p.id) ||
        p.driverId !== b.driverId ||
        b.status !== "Completado" ||
        !num(p.amount, false) ||
        !dateOK(p.date) ||
        p.date < b.date.slice(0, 10)
      )
        bad();
      settlementIds.add(p.id);
    }
    for (const b of s.bookings)
      if (
        sum(
          (s.driverPayments || []).filter((p) => p.bookingId === b.id),
          (p) => p.amount,
        ) > b.costs.driver
      )
        bad();
    metrics(s);
    return true;
  }
  function seed(day = today()) {
    const s = {
      version: 1,
      seedDate: day,
      companies: [],
      drivers: [],
      vehicles: [],
      bookings: [],
      invoices: [],
      payments: [],
      driverPayments: [],
    };
    const names = [
      ["Global Mobility Services LLC", "Estados Unidos", "USD"],
      ["Euro Executive Travel GmbH", "Alemania", "EUR"],
      ["London Corporate Rides Ltd", "Reino Unido", "USD"],
      ["Maple Business Travel Inc", "Canadá", "USD"],
      ["Iberia Meetings SL", "España", "EUR"],
      ["Paris Affaires SAS", "Francia", "EUR"],
      ["Andes Corporate SpA", "Chile", "USD"],
      ["Brasil Business Viagens Ltda", "Brasil", "USD"],
      ["Particular demo", "Argentina", "ARS"],
    ];
    s.companies = names.map(([name, country, currency], j) => ({
      id: "C" + (j + 1),
      name,
      tradeName: name.split(" ").slice(0, 2).join(" "),
      country,
      currency,
      taxId: "DEMO-EXT-" + (100 + j),
      address: "Dirección fiscal ficticia " + (j + 1),
      contact: "Contacto demo " + (j + 1),
      email: "administracion" + (j + 1) + "@example.com",
      billingEmail: "facturas" + (j + 1) + "@example.com",
      phone: "+00 000 000 " + (100 + j),
      terms: "Transferencia a 30 días",
      creditDays: 30,
      rates:
        currency === "ARS"
          ? "EZE–CABA: ARS 95000; AEP–CABA: ARS 45000"
          : currency === "EUR"
            ? "EZE–CABA: EUR 80; AEP–CABA: EUR 45"
            : "EZE–CABA: USD 85; AEP–CABA: USD 45",
    }));
    s.drivers = [
      "Martín Ríos",
      "Lucía Torres",
      "Diego Acosta",
      "Valeria Luna",
      "Nicolás Paz",
      "Sofía Costa",
    ].map((name, j) => ({
      id: "D" + (j + 1),
      name,
      phone: "+54 11 0000 " + (1100 + j),
      license: "DEMO-D1-" + j,
      licenseExpiry: shift(day, 200),
      status: j === 5 ? "No disponible" : "Disponible",
      commission: 20,
    }));
    s.vehicles = [
      "Toyota Corolla",
      "Mercedes-Benz Vito",
      "Toyota Camry",
      "Volkswagen Vento",
      "Mercedes-Benz Sprinter",
      "Peugeot 508",
      "Toyota Hiace",
      "Ford Mondeo",
    ].map((name, j) => ({
      id: "V" + (j + 1),
      name,
      plate: "DEMO " + (101 + j),
      category: [1, 4, 6].includes(j) ? "Van" : "Sedán",
      capacity: [1, 4, 6].includes(j) ? 8 : 3,
      km: 20000 + j * 11000,
      status: j === 7 ? "Mantenimiento" : "Operativo",
      insuranceExpiry: shift(day, 180),
      inspectionExpiry: shift(day, 150),
      maintenance: "Control preventivo cada 10.000 km",
      expenses: 20000 + j * 1000,
    }));
    const routes = [
      ["Aeropuerto Ezeiza (EZE)", "Palermo"],
      ["Aeroparque (AEP)", "Recoleta"],
      ["Puerto Madero", "Aeropuerto Ezeiza (EZE)"],
      ["Hotel CABA", "Centro de convenciones"],
      ["San Isidro", "Aeroparque (AEP)"],
    ];
    for (let j = 0; j < 28; j++) {
      const c = s.companies[j % 9],
        route = routes[j % 5],
        past = j < 18,
        offset = past ? -35 + j * 2 : j - 18;
      s.bookings.push({
        id: "R-" + String(j + 1).padStart(4, "0"),
        date:
          shift(day, offset) +
          "T" +
          String(8 + (j % 5) * 2).padStart(2, "0") +
          ":00",
        companyId: c.id,
        passengers: "Pasajero demo " + (j + 1),
        phone: "+54 11 0000 0000",
        origin: route[0],
        destination: route[1],
        airport: j % 2 ? "AEP" : "EZE",
        flight: "DEMO " + (100 + j),
        count: 1 + (j % 3),
        luggage: "2 valijas",
        category: s.vehicles[j % 5].category,
        driverId: past || j % 3 ? s.drivers[j % 5].id : "",
        vehicleId: past || j % 3 ? s.vehicles[j % 5].id : "",
        price:
          c.currency === "ARS"
            ? 95000
            : c.currency === "EUR"
              ? 80 + (j % 4) * 5
              : 85 + (j % 4) * 5,
        currency: c.currency,
        rate: c.currency === "ARS" ? 1 : c.currency === "EUR" ? 1450 : 1200,
        rateDate: shift(day, offset),
        rateSource: "Cotización ficticia demo",
        status: past ? "Completado" : j % 3 ? "Confirmado" : "Pendiente",
        notes: "Datos ficticios para presentación",
        costs: {
          driver: 22000,
          fuel: 9000,
          tolls: 3000,
          parking: 1500,
          other: 1000,
        },
      });
    }
    for (let j = 0; j < 4; j++) {
      const b = s.bookings[j],
        i = createInvoice(s, {
          companyId: b.companyId,
          bookingIds: [b.id],
          currency: b.currency,
          date: shift(day, -28),
          due: shift(day, j === 3 ? 10 : -5),
          rate: b.rate,
          rateDate: shift(day, -28),
          rateSource: "Cotización ficticia demo",
          type: "Factura comercial DEMO",
          fiscal: "Pendiente de revisión contable",
        });
      issueInvoice(s, i.id, "DEMO-2026-" + String(j + 1).padStart(4, "0"));
      if (j < 2)
        recordPayment(s, {
          invoiceId: i.id,
          amount: j === 0 ? i.total : round(i.total / 2),
          currency: i.currency,
          conversion: 1,
          arsRate: i.rate + 30,
          date: shift(day, -10),
          rateDate: shift(day, -10),
          source: "Cotización ficticia demo",
          fee: 1,
          method: "Transferencia internacional",
          reference: "Pago simulado",
        });
    }
    return s;
  }
  return {
    validateState,
    currencies,
    statuses,
    round,
    sum,
    id,
    today,
    shift,
    documentFor,
    balance,
    paymentStatus,
    dispatchAlerts,
    driverBalance,
    recordDriverPayment,
    saveBooking,
    createInvoice,
    issueInvoice,
    cancelInvoice,
    recordPayment,
    metrics,
    grouped,
    csvCell,
    seed,
  };
});
