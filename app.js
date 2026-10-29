/* GAMO APP: demo local, sin servicios remotos ni transacciones reales. */
(() => {
  "use strict";
  const D = window.Gamo,
    KEY = "gamo.demo.v1",
    $ = (s) => document.querySelector(s),
    esc = (v) =>
      String(v ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
  const money = (n, c = "ARS") =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: c,
      maximumFractionDigits: 2,
    }).format(n);
  const date = (d) =>
    d
      ? new Intl.DateTimeFormat("es-AR", {
          timeZone: "America/Argentina/Buenos_Aires",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(
          new Date(d.length === 10 ? d + "T12:00:00-03:00" : d + "-03:00"),
        )
      : "—";
  const cname = (id) => state.companies.find((c) => c.id === id)?.name || "—",
    dname = (id) =>
      state.drivers.find((c) => c.id === id)?.name || "Sin asignar",
    vname = (id) =>
      state.vehicles.find((c) => c.id === id)?.name || "Sin asignar";
  let state,
    storageError = "",
    rawBackup = "",
    page = "inicio",
    lastFocus,
    formHandler;
  try {
    rawBackup = localStorage.getItem(KEY) || "";
    state = rawBackup ? JSON.parse(rawBackup) : D.seed();
    D.validateState(state);
  } catch (e) {
    storageError =
      "No se pudieron leer los datos guardados. No se sobrescribieron. Descargá una copia antes de restaurar.";
    state = D.seed();
  }
  function commit(fn) {
    if (storageError) throw Error(storageError);
    const next = structuredClone(state),
      result = fn(next);
    D.validateState(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      throw Error(
        "No se pudo guardar: almacenamiento lleno o bloqueado. Exportá una copia.",
      );
    }
    state = next;
    return result;
  }
  function toast(message) {
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = message;
    $("#toast-root").append(t);
    setTimeout(() => t.remove(), 5000);
  }
  const btn = (label, action, id = "", style = "light") =>
    `<button class="btn btn-${style}" data-action="${action}" data-id="${esc(id)}">${label}</button>`;
  const badge = (text) =>
    `<span class="badge ${/Completado|Pagada|Disponible|Operativo/.test(text) ? "success" : /Vencida|Cancelado|Anulada|Mantenimiento|No disponible/.test(text) ? "danger" : /Pendiente|Parcial|Preparada|Sin /.test(text) ? "warning" : "info"}">${esc(text)}</span>`;
  const empty = (text) =>
    `<div class="empty"><strong>${esc(text)}</strong><span>Probá con otro período o creá un registro nuevo.</span></div>`;
  const table = (headers, rows) =>
    rows.length
      ? `<div class="table-scroll"><table class="data-table"><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      : empty("No hay registros para esta selección");
  const panel = (title, body, sub = "") =>
    `<section class="panel"><div class="panel-head"><div><h2>${title}</h2>${sub ? `<span class="panel-sub">${sub}</span>` : ""}</div></div>${body}</section>`;
  const kpi = (label, value, foot, icon = "chart") =>
    `<article class="kpi"><div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-icon">${iconSVG(icon)}</span></div><div class="kpi-value">${value}</div><div class="kpi-foot">${foot}</div></article>`;
  const totals = (rows) =>
    rows
      .map(
        (r) =>
          `<span class="currency-total"><small>${r.currency}</small> ${esc(money(r.total, r.currency))}</span>`,
      )
      .join("");
  const title = (name, sub, actions = "") =>
    `<div class="page-header"><div><div class="eyebrow">GAMO · TRANSPORTE EJECUTIVO</div><h1>${name}</h1><p class="subheading">${sub}</p></div><div class="header-actions">${actions}</div></div>`;
  const options = (items, selected, blank = "") =>
    (blank ? `<option value="">${blank}</option>` : "") +
    items
      .map((x) => {
        const value = typeof x === "string" ? x : x.id,
          label = typeof x === "string" ? x : x.name;
        return `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(label)}</option>`;
      })
      .join("");
  function field(
    name,
    label,
    value = "",
    type = "text",
    extra = "",
    wide = false,
  ) {
    return `<div class="form-group ${wide ? "wide" : ""}"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
  }
  function select(name, label, items, value, blank = "", extra = "") {
    return `<div class="form-group"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}" ${extra}>${options(items, value, blank)}</select></div>`;
  }
  const notice =
    '<div class="notice">DEMO · Datos ficticios y cotizaciones simuladas. Documentos comerciales sin validez fiscal. Clasificación y tratamiento fiscal sujetos a revisión contable y normativa ARCA.</div>';
  function iconSVG(name) {
    const paths = {
      layout: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
      calendar: "M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4",
      clock: "M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
      users:
        "M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 4a4 4 0 0 1 0 8 M22 21v-3a4 4 0 0 0-3-4",
      car: "M3 16V9l3-5h12l3 5v7H3z M3 10h18 M6 16v4 M18 16v4 M6 13h1 M17 13h1",
      building: "M4 21V3h16v18 M9 21v-5h6v5 M8 7h1 M15 7h1 M8 11h1 M15 11h1",
      wallet: "M3 5h17v15H3z M16 10h6v6h-6z",
      invoice: "M5 3h14v19l-3-2-4 2-4-2-3 2z M8 7h8 M8 11h8 M8 15h5",
      chart: "M4 3v18h17 M8 16v-5 M13 16V7 M18 16V4",
      menu: "M3 6h18 M3 12h18 M3 18h18",
    };
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.chart}"/></svg>`;
  }
  function modal(
    name,
    body,
    handler,
    subtitle = "Todos los datos son ficticios para demostración",
  ) {
    lastFocus = document.activeElement;
    formHandler = handler;
    $("#modal-root").innerHTML =
      `<div class="modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="dialog-title" class="modal"><div class="modal-header"><div><h2 id="dialog-title">${name}</h2><p>${subtitle}</p></div><button class="icon-button" data-action="close" aria-label="Cerrar">✕</button></div><form id="modal-form" class="modal-form"><div class="form-grid">${body}</div><p id="form-error" role="alert" class="form-error"></p><div class="form-actions">${btn("Cancelar", "close")}<button type="submit" class="btn btn-primary">Guardar</button></div></form></section></div>`;
    document.body.classList.add("modal-open");
    $("#modal-root input, #modal-root select, #modal-root button")?.focus();
  }
  function closeModal() {
    $("#modal-root").innerHTML = "";
    document.body.classList.remove("modal-open");
    formHandler = null;
    if (lastFocus?.isConnected) lastFocus.focus();
  }
  document.addEventListener("keydown", (e) => {
    const m = $("#modal-root [role=dialog]");
    if (!m) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") {
      const all = [
          ...m.querySelectorAll("button,input,select,a,textarea"),
        ].filter((x) => !x.disabled && x.offsetParent !== null),
        first = all[0],
        last = all.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "modal-form") return;
    e.preventDefault();
    try {
      formHandler(Object.fromEntries(new FormData(e.target)), e.target);
      closeModal();
      render();
      toast("Cambios guardados en este navegador");
    } catch (err) {
      $("#form-error").textContent = err.message;
    }
  });
  function bookingRows(bookings) {
    return bookings.map((b) => [
      `<strong>${esc(b.id)}</strong><span class="secondary-cell">${date(b.date)} · ${b.date.slice(11)} h</span>`,
      `<span class="primary-cell">${esc(b.passengers)}</span><span class="secondary-cell">${esc(cname(b.companyId))}</span>`,
      `${esc(b.origin)}<span class="secondary-cell">→ ${esc(b.destination)} · ${b.count} pasajero(s)</span>`,
      `${esc(dname(b.driverId))}<span class="secondary-cell">${esc(vname(b.vehicleId))}</span>`,
      `${esc(money(b.price, b.currency))}<span class="secondary-cell">${D.documentFor(state, b.id) ? esc(D.documentFor(state, b.id).status) : "Sin facturar"}</span>`,
      badge(b.status),
      btn("Ver / editar", "booking", b.id),
    ]);
  }
  function bookingTable(bookings) {
    return table(
      [
        "Servicio · hora argentina",
        "Pasajero / contratante",
        "Recorrido",
        "Asignación",
        "Tarifa / facturación",
        "Operación",
        "Acción",
      ],
      bookingRows(bookings),
    );
  }
  function dashboard() {
    const m = D.metrics(state),
      today = D.today(),
      daily = state.bookings.filter(
        (b) => b.date.startsWith(today) && b.status !== "Cancelado",
      ),
      upcoming = state.bookings
        .filter(
          (b) =>
            b.date.slice(0, 10) >= today &&
            !["Completado", "Cancelado"].includes(b.status),
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
      missing = upcoming.filter((b) => D.dispatchAlerts(state, b).length),
      margin = m.incomeARS - m.costARS;
    return (
      title(
        "Tu operación, en un vistazo",
        "Viajes en Argentina. Empresas conectadas con el mundo.",
        btn("Nueva reserva", "booking", "", "mint"),
      ) +
      `<div class="hero-banner"><div><span class="hero-tag">CONTROL OPERATIVO & FINANCIERO</span><h2>Cada viaje cuenta.<br>Cada cuenta, en orden.</h2><p>Reservas, despacho y cobros internacionales en un mismo lugar.</p><a class="btn btn-light" href="#/facturacion">Preparar una liquidación →</a></div><div class="hero-route"><span>EZE</span><i>·········· ✈ ··········</i><span>CABA</span><small>Movilidad ejecutiva · Argentina</small></div></div>` +
      `<div class="grid-kpi">${kpi("Servicios de hoy", daily.length, "Hora local de Argentina", "calendar")}${kpi("Alertas de despacho", missing.length, "Servicios próximos con alertas", "clock")}${kpi("Conductores disponibles", state.drivers.filter((d) => d.status === "Disponible").length, "De " + state.drivers.length + " conductores", "users")}${kpi("Vehículos operativos", state.vehicles.filter((v) => v.status === "Operativo").length, "De " + state.vehicles.length + " unidades", "car")}</div>` +
      `<div class="grid-kpi financial-kpis">${kpi("Facturación emitida", totals(m.revenue), "Documentos emitidos · no equivale a cobros")}${kpi("Cuentas por cobrar", totals(m.receivable), "Saldo de documentos emitidos")}${kpi("Cobros recibidos", totals(m.payments), "Importe bruto por moneda de pago")}${kpi("Pendiente de facturar", totals(m.pending), "Solo servicios completados")}</div>` +
      `<div class="dashboard-main">${panel("Próximos servicios", bookingTable(upcoming.slice(0, 5)), "Despacho y seguimiento de reservas")}<div>${panel(
        "Atención en despacho",
        `<div class="panel-pad">${
          missing.length
            ? missing
                .slice(0, 4)
                .map(
                  (b) =>
                    `<div class="alert-item"><span class="alert-dot"></span><div><strong>${esc(b.id)} · ${b.date.slice(11)} h</strong><p>${esc(b.origin)} → ${esc(b.destination)}<br>${esc(D.dispatchAlerts(state, b).join(" · "))}</p>${btn("Asignar recursos", "booking", b.id)}</div></div>`,
                )
                .join("")
            : empty("Todo asignado")
        }</div>`,
      )}<div class="notice">${state.bookings.filter((b) => b.status === "Completado").length} servicios completados · Ingreso estimado: ${esc(money(m.incomeARS))} · Costos: ${esc(money(m.costARS))} · Margen estimado: ${esc(money(margin))}.<br>Conversión con la cotización histórica ficticia de cada viaje.</div></div></div>` +
      monthlyChart() +
      notice
    );
  }
  function monthlyChart() {
    const months = Array.from({ length: 6 }, (_, n) => {
      const now = new Date(D.today() + "T12:00:00Z");
      now.setUTCMonth(now.getUTCMonth() - 5 + n, 1);
      const key = now.toISOString().slice(0, 7);
      return {
        key,
        label: new Intl.DateTimeFormat("es-AR", {
          month: "short",
          timeZone: "UTC",
        }).format(now),
        total: D.sum(
          state.invoices.filter(
            (i) => i.status === "Emitida" && i.date.startsWith(key),
          ),
          (i) => i.total * i.rate,
        ),
      };
    });
    const max = Math.max(...months.map((m) => m.total), 1);
    return panel(
      "Evolución de facturación",
      `<div class="chart-area"><div class="bar-chart">${months.map((m) => `<div class="bar-group"><div class="bar active" style="height:${Math.max(3, (m.total / max) * 95)}%"><span class="tip">${esc(money(m.total))}</span></div><span class="bar-label">${m.label}</span><span class="sr-only">${m.key}: ${money(m.total)}</span></div>`).join("")}</div></div>`,
      "Equivalente ARS · cotizaciones históricas ficticias de los documentos",
    );
  }
  function bookings() {
    return (
      title(
        "Reservas y viajes",
        "Empresa contratante → pasajeros → servicio. Horarios de Argentina.",
        btn("Exportar CSV", "export", "reservas") +
          btn("Nueva reserva", "booking", "", "mint"),
      ) +
      `<div class="toolbar"><label class="search-wrap"><span>⌕</span><input id="booking-search" placeholder="Buscar pasajero, empresa o recorrido" aria-label="Buscar reservas"></label><div class="toolbar-controls"><select id="booking-status" class="field-select" aria-label="Estado operativo">${options(D.statuses, "", "Todos los estados")}</select><select id="booking-company" class="field-select" aria-label="Empresa">${options(state.companies, "", "Todas las empresas")}</select><input type="date" id="booking-day" class="field-input" aria-label="Fecha del servicio"></div></div><section class="panel" id="booking-results">${bookingTable([...state.bookings].sort((a, b) => b.date.localeCompare(a.date)))}</section>`
    );
  }
  function filterBookings() {
    const q = $("#booking-search").value.toLowerCase(),
      status = $("#booking-status").value,
      company = $("#booking-company").value,
      day = $("#booking-day").value;
    $("#booking-results").innerHTML = bookingTable(
      state.bookings
        .filter(
          (b) =>
            (!status || b.status === status) &&
            (!company || b.companyId === company) &&
            (!day || b.date.startsWith(day)) &&
            [b.id, b.passengers, cname(b.companyId), b.origin, b.destination]
              .join(" ")
              .toLowerCase()
              .includes(q),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    );
  }
  function bookingForm(bid) {
    const b = state.bookings.find((x) => x.id === bid) || {
      date: D.today() + "T10:00",
      companyId: state.companies[0].id,
      currency: "USD",
      price: 85,
      rate: 1200,
      rateDate: D.today(),
      rateSource: "Cotización ficticia demo",
      status: "Pendiente",
      count: 1,
      category: "Sedán",
      costs: {},
    };
    const doc = D.documentFor(state, b.id);
    if (doc) {
      documentModal(doc.id);
      return;
    }
    modal(
      b.id ? "Editar reserva · " + esc(b.id) : "Nueva reserva",
      select(
        "companyId",
        "Empresa contratante",
        state.companies,
        b.companyId,
        "",
        "required",
      ) +
        field(
          "date",
          "Fecha y hora · Argentina",
          b.date,
          "datetime-local",
          "required",
        ) +
        field(
          "passengers",
          "Pasajeros (separar por coma)",
          b.passengers,
          "text",
          'required maxlength="200"',
          true,
        ) +
        field("phone", "Teléfono de contacto", b.phone, "tel") +
        field(
          "count",
          "Cantidad de pasajeros",
          b.count,
          "number",
          'required min="1" max="30" step="1"',
        ) +
        field(
          "origin",
          "Origen",
          b.origin,
          "text",
          'required maxlength="160"',
        ) +
        field(
          "destination",
          "Destino",
          b.destination,
          "text",
          'required maxlength="160"',
        ) +
        select(
          "airport",
          "Aeropuerto",
          ["No aplica", "EZE", "AEP"],
          b.airport || "EZE",
        ) +
        field("flight", "Número de vuelo", b.flight) +
        field("luggage", "Equipaje", b.luggage) +
        select(
          "category",
          "Categoría solicitada",
          ["Sedán", "Van"],
          b.category,
        ) +
        select(
          "driverId",
          "Conductor",
          state.drivers,
          b.driverId,
          "Sin asignar",
        ) +
        select(
          "vehicleId",
          "Vehículo",
          state.vehicles.map((v) => ({
            ...v,
            name: v.name + " · " + v.plate + " · " + v.capacity + " plazas",
          })),
          b.vehicleId,
          "Sin asignar",
        ) +
        select("status", "Estado operativo", D.statuses, b.status) +
        select("currency", "Moneda pactada", D.currencies, b.currency) +
        field(
          "price",
          "Tarifa pactada",
          b.price,
          "number",
          'required min="0.01" step="0.01"',
        ) +
        field(
          "rate",
          "ARS por unidad de moneda (ficticio)",
          b.rate,
          "number",
          'required min="0.000001" step="any"',
        ) +
        field(
          "rateDate",
          "Fecha de cotización",
          b.rateDate,
          "date",
          "required",
        ) +
        field(
          "rateSource",
          "Fuente / criterio",
          b.rateSource,
          "text",
          "required",
        ) +
        ["driver", "fuel", "tolls", "parking", "other"]
          .map((k, j) =>
            field(
              "cost_" + k,
              [
                "Costo conductor · ARS",
                "Combustible · ARS",
                "Peajes · ARS",
                "Estacionamiento · ARS",
                "Otros gastos · ARS",
              ][j],
              b.costs[k] ?? 0,
              "number",
              'min="0" step="0.01"',
            ),
          )
          .join("") +
        field(
          "notes",
          "Observaciones",
          b.notes,
          "text",
          'maxlength="500"',
          true,
        ) +
        `<p class="wide form-help">Asignaciones: ventana de conflicto de 90 minutos, capacidad, categoría y vencimientos. La facturación se controla por separado. Comisión del conductor informativa; el costo ARS es el costo efectivo estimado del servicio.</p>`,
      (data) =>
        commit((s) =>
          D.saveBooking(s, {
            ...b,
            ...data,
            costs: Object.fromEntries(
              ["driver", "fuel", "tolls", "parking", "other"].map((k) => [
                k,
                Number(data["cost_" + k]),
              ]),
            ),
          }),
        ),
    );
    $("#f-companyId").addEventListener("change", () => {
      const c = state.companies.find((c) => c.id === $("#f-companyId").value);
      $("#f-currency").value = c.currency;
      $("#f-rate").value =
        c.currency === "ARS" ? 1 : c.currency === "EUR" ? 1450 : 1200;
    });
    $("#f-currency").addEventListener("change", () => {
      $("#f-rate").value =
        $("#f-currency").value === "ARS"
          ? 1
          : $("#f-currency").value === "EUR"
            ? 1450
            : 1200;
    });
  }
  function agenda() {
    return (
      title(
        "Agenda y despacho",
        "Planificación diaria y semanal · America/Argentina/Buenos_Aires",
        btn("Nueva reserva", "booking", "", "mint"),
      ) +
      `<div class="toolbar"><div class="toolbar-controls"><label>Desde <input type="date" id="agenda-date" class="field-input" value="${D.today()}"></label><label>Vista <select id="agenda-view" class="field-select"><option value="7">Semana</option><option value="1">Día</option></select></label></div></div><div id="agenda-results"></div><div class="notice">Las reservas sin conductor o vehículo aparecen en amarillo. Se validan solapamientos de 90 minutos al guardar una asignación. Revisá la duración real antes de operar.</div>`
    );
  }
  function agendaResults() {
    const from = $("#agenda-date").value || D.today(),
      days = Number($("#agenda-view").value);
    $("#agenda-results").innerHTML =
      `<div class="agenda-grid ${days === 1 ? "single-day" : ""}">${Array.from(
        { length: days },
        (_, j) => {
          const day = D.shift(from, j),
            bookings = state.bookings
              .filter((b) => b.date.startsWith(day) && b.status !== "Cancelado")
              .sort((a, b) => a.date.localeCompare(b.date));
          return `<section class="agenda-day ${day === D.today() ? "today" : ""}"><div class="agenda-day-head"><strong>${date(day)}</strong><span>${bookings.length} servicio(s)</span></div><div class="agenda-events">${bookings.map((b) => `<button class="agenda-event ${D.dispatchAlerts(state, b).length ? "warning" : ""}" data-action="booking" data-id="${esc(b.id)}"><strong>${b.date.slice(11)} · ${esc(b.id)}</strong><small>${esc(b.passengers)}</small><small>${esc(b.origin)} → ${esc(b.destination)}</small><small>${esc(dname(b.driverId))} · ${esc(vname(b.vehicleId))}</small>${badge(b.status)}<small class="negative">${esc(D.dispatchAlerts(state, b).join(" · "))}</small></button>`).join("") || '<p class="agenda-empty">Sin servicios</p>'}</div></section>`;
        },
      ).join("")}</div>`;
  }
  function entityCards(type) {
    const config = {
      clientes: [
        "Empresas y clientes",
        "Contratantes internacionales y sus acuerdos comerciales.",
        "company",
        state.companies,
      ],
      conductores: [
        "Conductores",
        "Disponibilidad, vencimientos y liquidaciones estimadas.",
        "driver",
        state.drivers,
      ],
      vehiculos: [
        "Flota",
        "Capacidad, estado y mantenimiento de vehículos.",
        "vehicle",
        state.vehicles,
      ],
    }[type];
    return (
      title(
        config[0],
        config[1],
        btn("Nuevo registro", config[2] + "-new", "", "mint"),
      ) +
      `<label class="search-wrap entity-search"><input id="entity-search" placeholder="Buscar por nombre, país o patente" aria-label="Buscar registros"></label><div class="cards-3" id="entity-results">${config[3].map((e) => entityCard(type, e)).join("")}</div>`
    );
  }
  function entityCard(type, e) {
    const bookings = state.bookings.filter(
        (b) =>
          b[
            type === "clientes"
              ? "companyId"
              : type === "conductores"
                ? "driverId"
                : "vehicleId"
          ] === e.id,
      ),
      meta =
        type === "clientes"
          ? [
              ["País", e.country],
              ["Moneda comercial", e.currency],
              ["Crédito", e.creditDays + " días"],
              ["Servicios", bookings.length],
            ]
          : type === "conductores"
            ? [
                ["Estado", e.status],
                ["Licencia", e.license],
                ["Vencimiento", date(e.licenseExpiry)],
                [
                  "Completados",
                  bookings.filter((b) => b.status === "Completado").length,
                ],
                [
                  "Liquidación estimada",
                  money(
                    D.sum(
                      bookings.filter((b) => b.status === "Completado"),
                      (b) => D.driverBalance(state, b),
                    ),
                  ),
                ],
              ]
            : [
                ["Estado", e.status],
                ["Patente", e.plate],
                ["Capacidad", e.capacity + " pasajeros"],
                ["Kilometraje", e.km + " km"],
                ["Seguro", date(e.insuranceExpiry)],
                ["Revisión", date(e.inspectionExpiry)],
              ];
    const action =
      type === "clientes"
        ? "company"
        : type === "conductores"
          ? "driver"
          : "vehicle";
    return `<article class="entity-card"><div class="entity-top"><span class="avatar">${
      type === "vehiculos"
        ? iconSVG("car")
        : esc(
            e.name
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join(""),
          )
    }</span><div><div class="entity-name">${esc(e.name)}</div><div class="entity-sub">${esc(e.tradeName || e.phone || e.category)}</div></div></div><div class="entity-meta">${meta.map(([k, v]) => `<div class="meta-row"><span>${k}</span><strong>${esc(v)}</strong></div>`).join("")}</div><div class="action-foot">${type === "clientes" ? btn("Ver cuenta", "company-detail", e.id) : btn("Servicios y gastos", "resource-detail", action + ":" + e.id)}${btn("Editar ficha", action, e.id)}</div></article>`;
  }
  function entityForm(type, eid) {
    const list =
        type === "company"
          ? "companies"
          : type === "driver"
            ? "drivers"
            : "vehicles",
      e = state[list].find((x) => x.id === eid) || {},
      isCompany = type === "company",
      isDriver = type === "driver";
    let fields = field(
      "name",
      isCompany
        ? "Razón social"
        : isDriver
          ? "Nombre del conductor"
          : "Marca y modelo",
      e.name,
      "text",
      'required maxlength="160"',
      true,
    );
    if (isCompany)
      fields +=
        field("tradeName", "Nombre comercial", e.tradeName) +
        field("country", "País", e.country, "text", "required") +
        field(
          "taxId",
          "Identificación fiscal extranjera (sin CUIT obligatorio)",
          e.taxId,
        ) +
        field("address", "Dirección fiscal", e.address) +
        field("contact", "Persona de contacto", e.contact) +
        field("email", "Correo administrativo", e.email, "email") +
        field(
          "billingEmail",
          "Correo de facturación",
          e.billingEmail,
          "email",
        ) +
        field("phone", "Teléfono", e.phone, "tel") +
        select(
          "currency",
          "Moneda comercial",
          D.currencies,
          e.currency || "USD",
        ) +
        field(
          "creditDays",
          "Plazo de crédito (días)",
          e.creditDays ?? 30,
          "number",
          'required min="0" max="365" step="1"',
        ) +
        field("terms", "Condiciones de pago", e.terms) +
        field(
          "rates",
          "Contrato / tarifas acordadas",
          e.rates,
          "text",
          'maxlength="500"',
          true,
        );
    else if (isDriver)
      fields +=
        field("phone", "Teléfono", e.phone, "tel") +
        field("license", "Licencia", e.license, "text", "required") +
        field(
          "licenseExpiry",
          "Vencimiento de licencia",
          e.licenseExpiry || D.shift(D.today(), 180),
          "date",
          "required",
        ) +
        select(
          "status",
          "Disponibilidad",
          ["Disponible", "No disponible"],
          e.status || "Disponible",
        ) +
        field(
          "commission",
          "Comisión acordada (%) · referencia",
          e.commission ?? 20,
          "number",
          'min="0" max="100" step="0.01"',
        );
    else
      fields +=
        field("plate", "Patente", e.plate, "text", "required") +
        select(
          "category",
          "Categoría",
          ["Sedán", "Van"],
          e.category || "Sedán",
        ) +
        field(
          "capacity",
          "Capacidad",
          e.capacity ?? 3,
          "number",
          'required min="1" max="30" step="1"',
        ) +
        field(
          "km",
          "Kilometraje",
          e.km ?? 0,
          "number",
          'required min="0" step="1"',
        ) +
        select(
          "status",
          "Estado",
          ["Operativo", "Mantenimiento", "Fuera de servicio"],
          e.status || "Operativo",
        ) +
        field(
          "insuranceExpiry",
          "Vencimiento de seguro",
          e.insuranceExpiry || D.shift(D.today(), 180),
          "date",
          "required",
        ) +
        field(
          "inspectionExpiry",
          "Vencimiento de revisión",
          e.inspectionExpiry || D.shift(D.today(), 180),
          "date",
          "required",
        ) +
        field("maintenance", "Mantenimiento", e.maintenance) +
        field(
          "expenses",
          "Gasto de flota de referencia · ARS",
          e.expenses ?? 0,
          "number",
          'required min="0" step="0.01"',
        ) +
        '<p class="wide form-help">El gasto de flota de referencia no se duplica en la rentabilidad: allí se usan los costos registrados por viaje.</p>';
    modal(
      (e.id ? "Editar" : "Crear") +
        " " +
        (isCompany ? "empresa" : isDriver ? "conductor" : "vehículo"),
      fields,
      (data) =>
        commit((s) => {
          const record = { ...e, ...data, id: e.id || D.id(type) };
          if (isCompany) record.creditDays = Number(data.creditDays);
          else if (isDriver) record.commission = Number(data.commission);
          else {
            for (const k of ["capacity", "km", "expenses"])
              record[k] = Number(data[k]);
            if (
              s.vehicles.some(
                (v) =>
                  v.id !== e.id &&
                  v.plate.toLowerCase() === record.plate.toLowerCase(),
              )
            )
              throw Error("Patente ya registrada");
          }
          const current = s[list].find((x) => x.id === e.id);
          if (current) Object.assign(current, record);
          else s[list].push(record);
        }),
    );
  }
  function companyDetail(cid) {
    const c = state.companies.find((c) => c.id === cid),
      invoices = state.invoices.filter((i) => i.companyId === cid),
      bookings = state.bookings.filter((b) => b.companyId === cid),
      payments = state.payments.filter((p) =>
        invoices.some((i) => i.id === p.invoiceId),
      );
    detailModal(
      "Cuenta · " + esc(c.name),
      `<div class="detail-list">${[
        ["País", c.country],
        ["Razón social", c.name],
        ["Identificación fiscal", c.taxId],
        ["Dirección fiscal", c.address],
        ["Contacto", c.contact],
        ["Administración", c.email],
        ["Facturación", c.billingEmail],
        ["Teléfono", c.phone],
        ["Condiciones", c.terms],
        ["Plazo", c.creditDays + " días"],
        ["Contrato / tarifas", c.rates],
      ]
        .map(
          ([k, v]) =>
            `<div><div class="detail-label">${k}</div><div class="detail-value">${esc(v || "—")}</div></div>`,
        )
        .join(
          "",
        )}</div><div class="panel-pad"><h3>Saldo de documentos emitidos</h3>${totals(
        D.grouped(
          invoices.filter((i) => i.status === "Emitida"),
          (i) => D.balance(state, i),
          (i) => i.currency,
        ),
      )}<h3 class="space-top">Cobros recibidos</h3>${totals(
        D.grouped(
          payments,
          (p) => p.amount,
          (p) => p.currency,
        ),
      )}</div><h3 class="panel-pad">Documentos y pagos</h3>${invoiceTable(invoices)}<h3 class="panel-pad">Historial de servicios</h3>${bookingTable(bookings)}`,
    );
  }
  function resourceDetail(value) {
    const [type, rid] = value.split(":"),
      isDriver = type === "driver",
      e = state[isDriver ? "drivers" : "vehicles"].find((x) => x.id === rid),
      bs = state.bookings.filter(
        (b) => b[isDriver ? "driverId" : "vehicleId"] === rid,
      ),
      done = bs.filter((b) => b.status === "Completado"),
      payments = (state.driverPayments || []).filter((p) => p.driverId === rid);
    detailModal(
      esc(e.name),
      `<div class="panel-pad">${totals([{ currency: "ARS", total: D.sum(done, (b) => (isDriver ? D.driverBalance(state, b) : D.sum(Object.values(b.costs), (x) => x))) }])}<p class="muted">${isDriver ? "Liquidación pendiente en ARS. Comisión de referencia: " + esc(e.commission) + "%. El costo del conductor se pacta por servicio; las liquidaciones son simuladas." : "Costos de viajes completados. Mantenimiento y gastos de referencia en la ficha."}</p></div>${
        isDriver
          ? table(
              ["Servicio", "Costo pactado ARS", "Pendiente ARS", "Acción"],
              done.map((b) => [
                esc(b.id),
                esc(money(b.costs.driver)),
                esc(money(D.driverBalance(state, b))),
                D.driverBalance(state, b) > 0
                  ? btn("Liquidar servicio", "driver-payment", b.id)
                  : badge("Pagada"),
              ]),
            )
          : ""
      }${
        isDriver
          ? '<h3 class="panel-pad">Pagos simulados al conductor</h3>' +
            table(
              ["Fecha", "Servicio", "ARS", "Referencia"],
              payments.map((p) => [
                date(p.date),
                esc(p.bookingId),
                esc(money(p.amount)),
                esc(p.reference),
              ]),
            )
          : ""
      }<h3 class="panel-pad">Servicios asignados</h3>${bookingTable(bs)}`,
    );
  }
  function driverPaymentForm(bid) {
    const b = state.bookings.find((b) => b.id === bid);
    modal(
      "Liquidación simulada al conductor",
      `<p class="wide">${esc(dname(b.driverId))} · ${esc(b.id)} · Pendiente: ${esc(money(D.driverBalance(state, b)))}</p>` +
        field(
          "amount",
          "Importe de liquidación · ARS",
          D.driverBalance(state, b),
          "number",
          'required min="0.01" step="0.01"',
        ) +
        field(
          "date",
          "Fecha",
          D.today(),
          "date",
          `required min="${b.date.slice(0, 10)}"`,
        ) +
        field(
          "reference",
          "Referencia del pago simulado",
          "",
          "text",
          'maxlength="200"',
          true,
        ),
      (data) =>
        commit((s) => D.recordDriverPayment(s, { ...data, bookingId: bid })),
    );
  }
  function detailModal(name, html) {
    lastFocus = document.activeElement;
    $("#modal-root").innerHTML =
      `<div class="modal-backdrop"><section class="modal modal-large" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="modal-header"><h2 id="dialog-title">${name}</h2><button class="icon-button" aria-label="Cerrar" data-action="close">✕</button></div>${html}</section></div>`;
    document.body.classList.add("modal-open");
    $("#modal-root button")?.focus();
  }
  function invoiceTable(invoices) {
    return table(
      [
        "Documento",
        "Empresa",
        "Emisión / vencimiento",
        "Importe",
        "Estado emisión",
        "Estado cobro / saldo",
        "Acción",
      ],
      invoices.map((i) => [
        esc(i.number || "Borrador " + i.id.slice(-6)),
        esc(cname(i.companyId)),
        date(i.date) +
          `<span class="secondary-cell">Vence ${date(i.due)}</span>`,
        esc(money(i.total, i.currency)),
        badge(i.status),
        badge(D.paymentStatus(state, i)) +
          `<span class="secondary-cell">${esc(money(D.balance(state, i), i.currency))}</span>`,
        btn("Ver documento", "document", i.id),
      ]),
    );
  }
  function invoicing() {
    return (
      title(
        "Facturación internacional",
        "Consolidá servicios completados por empresa y moneda.",
        btn("Exportar documentos", "export", "facturas") +
          btn("Preparar documento", "invoice-new", "", "mint"),
      ) +
      notice +
      `<div class="space-top">${panel("Documentos comerciales", invoiceTable([...state.invoices].reverse()), "Estados de emisión y cobro independientes. Las preparaciones reservan sus servicios.")}</div>`
    );
  }
  function invoiceForm() {
    const first = state.companies[0];
    modal(
      "Preparar documento consolidado",
      select("companyId", "Empresa contratante", state.companies, first.id) +
        field("period", "Período de los servicios", "", "month") +
        select(
          "currency",
          "Moneda de facturación",
          D.currencies,
          first.currency,
        ) +
        field("date", "Fecha del documento", D.today(), "date", "required") +
        field(
          "due",
          "Fecha de vencimiento",
          D.shift(D.today(), first.creditDays),
          "date",
          "required",
        ) +
        field(
          "type",
          "Tipo de comprobante configurable",
          "Resumen comercial DEMO",
          "text",
          "required",
        ) +
        field(
          "fiscal",
          "Estado fiscal",
          "Pendiente de revisión contable / ARCA",
          "text",
          "required",
        ) +
        field(
          "rate",
          "ARS por unidad (ficticio)",
          1200,
          "number",
          'required min="0.000001" step="any"',
        ) +
        field(
          "rateDate",
          "Fecha de cotización",
          D.today(),
          "date",
          "required",
        ) +
        field(
          "rateSource",
          "Fuente / criterio",
          "Cotización ficticia demo",
          "text",
          "required",
        ) +
        '<div class="wide invoice-select" id="invoice-select"></div><div class="wide selection-total" id="selection-total" aria-live="polite"></div>',
      (data, form) =>
        commit((s) =>
          D.createInvoice(s, {
            ...data,
            bookingIds: [
              ...form.querySelectorAll("[name=bookingIds]:checked"),
            ].map((x) => x.value),
          }),
        ),
      "Solo documentos DEMO. No se asigna factura E automáticamente.",
    );
    for (const name of ["companyId", "currency", "period"])
      $("#f-" + name).addEventListener("change", () => {
        if (name === "companyId") {
          const c = state.companies.find(
            (c) => c.id === $("#f-companyId").value,
          );
          $("#f-currency").value = c.currency;
          $("#f-due").value = D.shift($("#f-date").value, c.creditDays);
        }
        $("#f-rate").value =
          $("#f-currency").value === "ARS"
            ? 1
            : $("#f-currency").value === "EUR"
              ? 1450
              : 1200;
        invoiceSelection();
      });
    invoiceSelection();
  }
  function invoiceSelection() {
    const company = $("#f-companyId").value,
      currency = $("#f-currency").value,
      period = $("#f-period").value,
      bs = state.bookings.filter(
        (b) =>
          b.companyId === company &&
          b.currency === currency &&
          b.status === "Completado" &&
          !D.documentFor(state, b.id) &&
          (!period || b.date.startsWith(period)),
      );
    $("#invoice-select").innerHTML = bs.length
      ? `<label class="check-all"><input type="checkbox" id="select-all"> Seleccionar todos (${bs.length})</label>` +
        bs
          .map(
            (b) =>
              `<label class="invoice-choice"><input type="checkbox" name="bookingIds" value="${esc(b.id)}"><span><strong>${esc(b.id)} · ${date(b.date)}</strong><small>${esc(b.passengers)} · ${esc(b.origin)} → ${esc(b.destination)}</small></span><strong>${esc(money(b.price, b.currency))}</strong></label>`,
          )
          .join("")
      : empty("Sin servicios pendientes en esta moneda y período");
    $("#invoice-select").addEventListener("change", (e) => {
      if (e.target.id === "select-all")
        $("#invoice-select")
          .querySelectorAll("[name=bookingIds]")
          .forEach((x) => (x.checked = e.target.checked));
      selectionTotal();
    });
    selectionTotal();
  }
  function selectionTotal() {
    const ids = [...document.querySelectorAll("[name=bookingIds]:checked")].map(
        (x) => x.value,
      ),
      total = D.sum(
        state.bookings.filter((b) => ids.includes(b.id)),
        (b) => b.price,
      );
    $("#selection-total").textContent =
      ids.length +
      " servicio(s) · Total " +
      money(total, $("#f-currency").value);
  }
  function documentModal(iid) {
    const i = state.invoices.find((i) => i.id === iid),
      c = state.companies.find((c) => c.id === i.companyId),
      payments = state.payments.filter((p) => p.invoiceId === iid);
    detailModal(
      "Documento · " + esc(i.number || "Preparado"),
      `<article class="document-sheet" id="print-document"><div class="document-brand"><strong>GAMO APP</strong><span>DEMO · SIN VALIDEZ FISCAL</span></div><h2>${esc(i.type)}</h2><p>${esc(i.number || "Documento preparado, sin emitir")} · ${date(i.date)} · Vence ${date(i.due)}</p><h3>${esc(c.name)} · ${esc(c.country)}</h3><p>${esc(c.address)} · ID fiscal ${esc(c.taxId)}<br>${esc(c.billingEmail)}</p>${table(
        ["Servicio", "Fecha", "Pasajeros / recorrido", "Importe"],
        i.lines.map((l) => [
          esc(l.bookingId),
          date(l.date),
          esc(l.passengers) +
            `<span class="secondary-cell">${esc(l.route)}</span>`,
          esc(money(l.amount, i.currency)),
        ]),
      )}<div class="document-total">Total ${esc(money(i.total, i.currency))}</div><p>Estado de emisión: ${esc(i.status)} · Cobro: ${esc(D.paymentStatus(state, i))}<br>Saldo: ${esc(money(D.balance(state, i), i.currency))}<br>Equivalente histórico: ${esc(money(i.total * i.rate))}<br>Cotización ficticia: 1 ${i.currency} = ${i.rate} ARS · ${date(i.rateDate)} · ${esc(i.rateSource)}<br>Estado fiscal: ${esc(i.fiscal)}</p>${i.cancelReason ? `<p class="form-error">Anulado: ${esc(i.cancelReason)} · ${date(i.cancelDate)}</p>` : ""}<h3>Historial de pagos</h3>${table(
        [
          "Fecha / medio",
          "Pago bruto / comisión",
          "Aplicado al documento",
          "Cotización / diferencia",
        ],
        payments.map((p) => [
          date(p.date) +
            '<span class="secondary-cell">' +
            esc(p.method) +
            " · " +
            esc(p.reference) +
            "</span>",
          esc(money(p.amount, p.currency)) +
            '<span class="secondary-cell">Comisión ' +
            esc(money(p.fee, p.currency)) +
            "</span>",
          esc(money(p.applied, i.currency)),
          `1 ${p.currency} = ${p.conversion} ${i.currency}<br>1 ${p.currency} = ${p.arsRate} ARS<span class="secondary-cell">${date(p.rateDate)} · ${esc(p.source)}<br>Diferencia: ${esc(money(p.exchangeDifference))}</span>`,
        ]),
      )}<p class="footer-note">Documento comercial simulado. No implica exportación de servicios ni comprobante fiscal. Validación profesional requerida.</p></article><div class="detail-actions">${btn("Imprimir / guardar PDF", "print", i.id)}${i.status === "Preparada" ? btn("Marcar emitida (DEMO)", "issue", i.id, "mint") : ""}${i.status === "Emitida" && D.balance(state, i) > 0 ? btn("Registrar pago", "payment", i.id, "mint") : ""}${i.status !== "Anulada" && !payments.length ? btn("Anular con motivo", "cancel-doc", i.id, "danger") : ""}</div>`,
    );
  }
  function issueForm(iid) {
    modal(
      "Registrar emisión DEMO",
      field(
        "number",
        "Número comercial (único)",
        "DEMO-" + String(state.invoices.length + 1).padStart(5, "0"),
        "text",
        "required",
      ),
      (data) => commit((s) => D.issueInvoice(s, iid, data.number)),
    );
  }
  function cancelForm(iid) {
    modal(
      "Anular documento",
      field(
        "reason",
        "Motivo de corrección",
        "",
        "text",
        'required maxlength="300"',
        true,
      ) +
        '<p class="wide form-help">Queda un registro de la anulación y sus servicios vuelven a estar disponibles. No se anulan documentos con pagos registrados.</p>',
      (data) => commit((s) => D.cancelInvoice(s, iid, data.reason)),
    );
  }
  function paymentForm(iid) {
    const i = state.invoices.find((i) => i.id === iid);
    modal(
      "Registrar pago simulado",
      `<div class="wide selection-total">${esc(cname(i.companyId))}<br>Saldo: ${esc(money(D.balance(state, i), i.currency))}</div>` +
        field(
          "date",
          "Fecha del pago",
          D.today(),
          "date",
          `required min="${i.date}"`,
        ) +
        select("currency", "Moneda recibida", D.currencies, i.currency) +
        field(
          "amount",
          "Importe bruto recibido",
          D.balance(state, i),
          "number",
          'required min="0.01" step="0.01"',
        ) +
        field(
          "conversion",
          "Unidades de " + i.currency + " por moneda recibida",
          1,
          "number",
          'required min="0.000001" step="any"',
        ) +
        field(
          "arsRate",
          "ARS por moneda recibida (ficticio)",
          i.rate,
          "number",
          'required min="0.000001" step="any"',
        ) +
        field(
          "rateDate",
          "Fecha de cotización",
          D.today(),
          "date",
          "required",
        ) +
        field(
          "source",
          "Fuente / criterio",
          "Cotización ficticia demo",
          "text",
          "required",
        ) +
        field(
          "fee",
          "Comisión bancaria (moneda recibida)",
          0,
          "number",
          'required min="0" step="0.01"',
        ) +
        select(
          "method",
          "Medio de pago",
          [
            "Transferencia internacional",
            "Transferencia local",
            "Plataforma de pagos",
            "Otro",
          ],
          "Transferencia internacional",
        ) +
        field(
          "reference",
          "Referencia / observación",
          "",
          "text",
          'maxlength="200"',
        ) +
        '<div class="wide notice" id="payment-preview" aria-live="polite"></div><p class="wide form-help">El importe bruto se aplica a la deuda; la comisión es un gasto del operador. Diferencia de cambio = bruto convertido a ARS menos importe aplicado × cotización histórica del documento. Nunca se procesa dinero real.</p>',
      (data) => commit((s) => D.recordPayment(s, { ...data, invoiceId: iid })),
    );
    const preview = () => {
      const currency = $("#f-currency").value,
        conversion =
          currency === i.currency ? 1 : Number($("#f-conversion").value),
        rate = currency === "ARS" ? 1 : Number($("#f-arsRate").value),
        amount = Number($("#f-amount").value),
        fee = Number($("#f-fee").value);
      $("#f-conversion").readOnly = currency === i.currency;
      $("#f-arsRate").readOnly = currency === "ARS";
      $("#payment-preview").textContent =
        "Aplicación: " +
        money(amount * conversion, i.currency) +
        " · Neto: " +
        money((amount - fee) * rate) +
        " · Diferencia cambiaria: " +
        money(amount * rate - amount * conversion * i.rate);
    };
    $("#f-currency").addEventListener("change", () => {
      const c = $("#f-currency").value;
      $("#f-conversion").value = c === i.currency ? 1 : "";
      $("#f-arsRate").value = c === "ARS" ? 1 : c === "EUR" ? 1450 : 1200;
      preview();
    });
    for (const k of ["amount", "conversion", "arsRate", "fee"])
      $("#f-" + k).addEventListener("input", preview);
    preview();
  }
  function receivables() {
    const m = D.metrics(state),
      issued = state.invoices.filter(
        (i) => i.status === "Emitida" && D.balance(state, i) > 0,
      ),
      buckets = [
        ["A vencer", -Infinity, 0],
        ["1–30 días", 1, 30],
        ["31–60 días", 31, 60],
        ["61–90 días", 61, 90],
        ["Más de 90 días", 91, Infinity],
      ],
      now = Date.parse(D.today() + "T12:00:00Z");
    return (
      title(
        "Cuentas por cobrar",
        "Deuda por empresa y moneda. Facturación, cobros y comisiones separados.",
        btn("Exportar saldos", "export", "saldos"),
      ) +
      `<div class="grid-kpi financial-kpis">${kpi("Saldo emitido", totals(m.receivable), "No incluye documentos preparados")}${kpi("Pagos recibidos", totals(m.payments), "Importe bruto por moneda")}${kpi("Comisiones bancarias", esc(money(D.sum(state.payments, (p) => p.feeARS))), "Conversión histórica de cada pago")}${kpi("Diferencias de cambio", esc(money(D.sum(state.payments, (p) => p.exchangeDifference))), "Respecto a la cotización del documento")}</div>` +
      panel(
        "Antigüedad de deuda",
        table(
          ["Antigüedad", "ARS", "USD", "EUR"],
          buckets.map(([label, min, max]) => [
            label,
            ...D.currencies.map((currency) =>
              esc(
                money(
                  D.sum(
                    issued.filter((i) => {
                      const days = Math.floor(
                        (now - Date.parse(i.due + "T12:00:00Z")) / 86400000,
                      );
                      return (
                        i.currency === currency && days >= min && days <= max
                      );
                    }),
                    (i) => D.balance(state, i),
                  ),
                  currency,
                ),
              ),
            ),
          ]),
        ),
      ) +
      `<div class="space-top">${panel(
        "Saldos por empresa",
        table(
          ["Empresa", "Saldo ARS", "Saldo USD", "Saldo EUR", "Cuenta"],
          state.companies.map((c) => [
            esc(c.name),
            ...D.currencies.map((currency) =>
              esc(
                money(
                  D.sum(
                    issued.filter(
                      (i) => i.companyId === c.id && i.currency === currency,
                    ),
                    (i) => D.balance(state, i),
                  ),
                  currency,
                ),
              ),
            ),
            btn("Ver cuenta", "company-detail", c.id),
          ]),
        ),
      )}</div><div class="space-top">${panel("Documentos abiertos", invoiceTable(issued))}</div>` +
      notice
    );
  }
  function finances() {
    const m = D.metrics(state),
      bs = state.bookings.filter((b) => b.status === "Completado");
    return (
      title(
        "Rentabilidad operativa",
        "Ingresos estimados por servicios completados y costos operativos en ARS.",
        btn("Exportar rentabilidad", "export", "rentabilidad"),
      ) +
      `<div class="grid-kpi">${kpi("Ingreso estimado", esc(money(m.incomeARS)), "Tarifas de servicios completados")}${kpi("Costos de servicios", esc(money(m.costARS)), "Conductor, combustible y otros")}${kpi("Margen estimado", esc(money(m.incomeARS - m.costARS)), "Ingreso estimado menos costos")}${kpi("Cobros netos", esc(money(m.cashARS)), "Dinero simulado recibido menos comisiones")}</div>` +
      panel(
        "Resultado por viaje",
        table(
          [
            "Servicio / empresa",
            "Tarifa original",
            "Cotización histórica ficticia",
            "Ingreso ARS",
            "Costos ARS",
            "Margen ARS",
          ],
          bs.map((b) => {
            const cost = D.sum(Object.values(b.costs), (v) => v);
            return [
              esc(b.id) +
                '<span class="secondary-cell">' +
                esc(cname(b.companyId)) +
                "</span>",
              esc(money(b.price, b.currency)),
              `${b.rate} ARS / ${b.currency}<span class="secondary-cell">${date(b.rateDate)} · ${esc(b.rateSource)}</span>`,
              esc(money(b.price * b.rate)),
              esc(money(cost)),
              `<strong class="${b.price * b.rate - cost < 0 ? "negative" : "positive"}">${esc(money(b.price * b.rate - cost))}</strong>`,
            ];
          }),
        ),
      ) +
      `<div class="notice">La rentabilidad es estimada por viaje. No es resultado contable: no incluye impuestos ni costos fijos. Las comisiones de cobro y diferencias cambiarias se muestran en Cuentas por cobrar y no alteran las tarifas históricas.</div>`
    );
  }
  function reports() {
    return (
      title(
        "Reportes gerenciales",
        "Elegí un período para analizar producción, facturación y rentabilidad.",
        btn("Exportar reporte", "export", "reporte"),
      ) +
      `<div class="toolbar"><div class="toolbar-controls"><label>Período <input type="month" id="report-period" class="field-input" value="${D.today().slice(0, 7)}"></label><label>Agrupar por <select id="report-group" class="field-select">${options(
        [
          { id: "companyId", name: "Empresa" },
          { id: "driverId", name: "Conductor" },
          { id: "vehicleId", name: "Vehículo" },
          { id: "month", name: "Mes" },
          { id: "country", name: "País" },
          { id: "currency", name: "Moneda" },
        ],
        "companyId",
      )}</select></label></div></div><div id="report-results"></div>`
    );
  }
  function reportData() {
    const period = $("#report-period")?.value || "",
      group = $("#report-group")?.value || "companyId",
      rows = new Map();
    for (const b of state.bookings.filter(
      (b) =>
        b.status === "Completado" && (!period || b.date.startsWith(period)),
    )) {
      const label =
        group === "companyId"
          ? cname(b.companyId)
          : group === "driverId"
            ? dname(b.driverId)
            : group === "vehicleId"
              ? vname(b.vehicleId)
              : group === "country"
                ? state.companies.find((c) => c.id === b.companyId).country
                : group === "currency"
                  ? b.currency
                  : b.date.slice(0, 7);
      if (!rows.has(label))
        rows.set(label, {
          label,
          count: 0,
          ARS: 0,
          USD: 0,
          EUR: 0,
          income: 0,
          cost: 0,
        });
      const row = rows.get(label);
      row.count++;
      row[b.currency] += b.price;
      row.income += b.price * b.rate;
      row.cost += D.sum(Object.values(b.costs), (x) => x);
    }
    return [...rows.values()];
  }
  function reportResults() {
    const rows = reportData(),
      period = $("#report-period").value,
      docs = state.invoices.filter(
        (i) => i.status === "Emitida" && (!period || i.date.startsWith(period)),
      );
    $("#report-results").innerHTML =
      panel(
        "Producción y rentabilidad por servicio",
        table(
          [
            "Agrupación",
            "Servicios",
            "Ventas ARS",
            "Ventas USD",
            "Ventas EUR",
            "Equivalente ARS",
            "Costos ARS",
            "Margen ARS",
          ],
          rows.map((r) => [
            esc(r.label),
            r.count,
            ...D.currencies.map((c) => esc(money(r[c], c))),
            esc(money(r.income)),
            esc(money(r.cost)),
            esc(money(r.income - r.cost)),
          ]),
        ),
      ) +
      `<div class="space-top">${panel(
        "Facturación por país y moneda",
        table(
          ["País", "ARS", "USD", "EUR"],
          [...new Set(state.companies.map((c) => c.country))].map((country) => [
            esc(country),
            ...D.currencies.map((currency) =>
              esc(
                money(
                  D.sum(
                    docs.filter(
                      (i) =>
                        i.currency === currency &&
                        state.companies.find((c) => c.id === i.companyId)
                          .country === country,
                    ),
                    (i) => i.total,
                  ),
                  currency,
                ),
              ),
            ),
          ]),
        ),
      )}</div>` +
      monthlyChart() +
      notice;
  }
  function download(name, content, type = "text/csv;charset=utf-8") {
    const a = document.createElement("a"),
      url = URL.createObjectURL(new Blob([content], { type }));
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportCSV(kind) {
    let headers, rows;
    if (kind === "reservas") {
      headers = [
        "ID",
        "Fecha Argentina",
        "Empresa",
        "Pasajeros",
        "Origen",
        "Destino",
        "Conductor",
        "Vehículo",
        "Estado operativo",
        "Estado facturación",
        "Moneda",
        "Tarifa",
      ];
      rows = state.bookings.map((b) => [
        b.id,
        b.date,
        cname(b.companyId),
        b.passengers,
        b.origin,
        b.destination,
        dname(b.driverId),
        vname(b.vehicleId),
        b.status,
        D.documentFor(state, b.id)?.status || "Sin facturar",
        b.currency,
        b.price,
      ]);
    } else if (kind === "facturas" || kind === "saldos") {
      headers = [
        "Documento",
        "Empresa",
        "Emisión",
        "Vencimiento",
        "Estado emisión",
        "Estado cobro",
        "Moneda",
        "Total",
        "Saldo",
        "ARS por unidad",
        "Fecha TC",
        "Fuente ficticia",
      ];
      rows = state.invoices
        .filter((i) => kind !== "saldos" || i.status === "Emitida")
        .map((i) => [
          i.number || i.id,
          cname(i.companyId),
          i.date,
          i.due,
          i.status,
          D.paymentStatus(state, i),
          i.currency,
          i.total,
          D.balance(state, i),
          i.rate,
          i.rateDate,
          i.rateSource,
        ]);
    } else if (kind === "reporte") {
      headers = [
        "Agrupación",
        "Servicios",
        "ARS",
        "USD",
        "EUR",
        "Equivalente ARS",
        "Costos ARS",
        "Margen ARS",
      ];
      rows = reportData().map((r) => [
        r.label,
        r.count,
        r.ARS,
        r.USD,
        r.EUR,
        D.round(r.income),
        D.round(r.cost),
        D.round(r.income - r.cost),
      ]);
    } else {
      headers = [
        "Viaje",
        "Empresa",
        "Moneda",
        "Tarifa",
        "TC histórico ficticio",
        "Ingreso ARS",
        "Costo conductor",
        "Combustible",
        "Peajes",
        "Estacionamiento",
        "Otros",
        "Margen ARS",
      ];
      rows = state.bookings
        .filter((b) => b.status === "Completado")
        .map((b) => [
          b.id,
          cname(b.companyId),
          b.currency,
          b.price,
          b.rate,
          D.round(b.price * b.rate),
          b.costs.driver,
          b.costs.fuel,
          b.costs.tolls,
          b.costs.parking,
          b.costs.other,
          D.round(b.price * b.rate - D.sum(Object.values(b.costs), (x) => x)),
        ]);
    }
    download(
      "gamo-" + kind + "-" + D.today() + ".csv",
      "\uFEFF" +
        [headers, ...rows].map((r) => r.map(D.csvCell).join(";")).join("\r\n"),
    );
    toast("CSV exportado para Excel");
  }
  function resetForm() {
    modal(
      "Restaurar los datos iniciales",
      `<p class="wide">Esta acción reemplaza las reservas, empresas, documentos y pagos guardados en este navegador. Podés descargar una copia antes de continuar.</p><div class="wide">${btn("Descargar copia JSON", "backup")}</div>` +
        field(
          "confirm",
          "Escribí RESTAURAR para confirmar",
          "",
          "text",
          'required pattern="RESTAURAR"',
          true,
        ),
      (data) => {
        if (data.confirm !== "RESTAURAR") throw Error("Escribí RESTAURAR");
        const next = D.seed();
        localStorage.setItem(KEY, JSON.stringify(next));
        state = next;
        storageError = "";
      },
    );
  }
  function render() {
    page = location.hash.replace("#/", "") || "inicio";
    const screens = {
      inicio: dashboard,
      reservas: bookings,
      agenda,
      conductores: () => entityCards("conductores"),
      vehiculos: () => entityCards("vehiculos"),
      clientes: () => entityCards("clientes"),
      facturacion: invoicing,
      cobros: receivables,
      finanzas: finances,
      reportes: reports,
    };
    if (!screens[page]) page = "inicio";
    $("#content").innerHTML =
      (storageError
        ? `<div class="storage-error" role="alert">${esc(storageError)} ${btn("Descargar copia", "backup")}${btn("Restaurar", "reset")}</div>`
        : "") + screens[page]();
    $("#section-name").textContent = {
      inicio: "Resumen",
      reservas: "Reservas",
      agenda: "Despacho",
      conductores: "Conductores",
      vehiculos: "Flota",
      clientes: "Empresas",
      facturacion: "Facturación internacional",
      cobros: "Cuentas por cobrar",
      finanzas: "Rentabilidad",
      reportes: "Reportes",
    }[page];
    document.querySelectorAll("#nav a").forEach((a) => {
      a.classList.toggle("active", a.dataset.page === page);
      if (a.dataset.page === page) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    $("#nav-count").textContent = state.bookings.filter(
      (b) => !["Completado", "Cancelado"].includes(b.status),
    ).length;
    document
      .querySelectorAll("[data-icon]")
      .forEach((e) => (e.innerHTML = iconSVG(e.dataset.icon)));
    if (page === "agenda") agendaResults();
    if (page === "reportes") reportResults();
  }
  document.addEventListener("input", (e) => {
    if (e.target.id === "booking-search") filterBookings();
    if (e.target.id === "entity-search") {
      const q = e.target.value.toLowerCase(),
        list =
          page === "clientes"
            ? "companies"
            : page === "conductores"
              ? "drivers"
              : "vehicles";
      $("#entity-results").innerHTML =
        state[list]
          .filter((x) =>
            [x.name, x.country, x.plate].join(" ").toLowerCase().includes(q),
          )
          .map((x) => entityCard(page, x))
          .join("") || empty("Sin coincidencias");
    }
  });
  document.addEventListener("change", (e) => {
    if (
      ["booking-status", "booking-company", "booking-day"].includes(e.target.id)
    )
      filterBookings();
    if (["agenda-date", "agenda-view"].includes(e.target.id)) agendaResults();
    if (["report-period", "report-group"].includes(e.target.id))
      reportResults();
  });
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const a = target.dataset.action,
      i = target.dataset.id;
    try {
      if (a === "close") closeModal();
      else if (a === "booking") bookingForm(i);
      else if (["company", "driver", "vehicle"].includes(a)) entityForm(a, i);
      else if (a.endsWith("-new") && a !== "invoice-new")
        entityForm(a.replace("-new", ""));
      else if (a === "company-detail") companyDetail(i);
      else if (a === "resource-detail") resourceDetail(i);
      else if (a === "driver-payment") driverPaymentForm(i);
      else if (a === "invoice-new") invoiceForm();
      else if (a === "document") documentModal(i);
      else if (a === "issue") issueForm(i);
      else if (a === "cancel-doc") cancelForm(i);
      else if (a === "payment") paymentForm(i);
      else if (a === "print") window.print();
      else if (a === "export") exportCSV(i);
      else if (a === "reset") resetForm();
      else if (a === "backup")
        download(
          "gamo-copia-" + D.today() + ".json",
          storageError.startsWith("No se pudieron leer") && rawBackup
            ? rawBackup
            : JSON.stringify(state, null, 2),
          "application/json",
        );
    } catch (err) {
      toast(err.message);
    }
  });
  $("#menu-btn").addEventListener("click", () => {
    const open = $("#sidebar").classList.toggle("open");
    $("#scrim").classList.toggle("visible", open);
    $("#menu-btn").setAttribute("aria-expanded", open);
  });
  $("#scrim").addEventListener("click", () => {
    $("#sidebar").classList.remove("open");
    $("#scrim").classList.remove("visible");
    $("#menu-btn").setAttribute("aria-expanded", "false");
  });
  window.addEventListener("hashchange", () => {
    closeModal();
    $("#sidebar").classList.remove("open");
    $("#scrim").classList.remove("visible");
    $("#menu-btn").setAttribute("aria-expanded", "false");
    render();
    $("#content").focus();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      storageError =
        "Los datos cambiaron en otra pestaña. Recargá esta página antes de continuar para evitar sobrescribir cambios.";
      render();
    }
  });
  $("#today-date").textContent = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "full",
  }).format(new Date());
  $("#year").textContent = new Date().getFullYear();
  $("#menu-btn").setAttribute("aria-controls", "sidebar");
  $("#menu-btn").setAttribute("aria-expanded", "false");
  render();
})();
