/* Reportes por agencia: integrados dentro del shell principal de GAMO TRANSFER.
 * Registros históricos documentados, separados de las reservas demo.
 */
(function(root){
"use strict";
const markup="\n<div class=\"agency-report\">\n  <div class=\"page-header\">\n    <div>\n      <div class=\"eyebrow\">GAMO TRANSFER · GESTIÓN COMERCIAL</div>\n      <h1>Reportes por agencia</h1>\n      <p class=\"subheading\">Ejemplo de 33 servicios totalmente ficticios para probar filtros e informes.</p>\n    </div>\n    <div class=\"header-actions agency-actions\">\n      <button type=\"button\" class=\"btn btn-light\" id=\"csv\">Exportar CSV</button>\n      <button type=\"button\" class=\"btn btn-primary\" id=\"print\">Imprimir / PDF</button>\n    </div>\n  </div>\n  <div class=\"toolbar agency-toolbar\">\n    <div class=\"toolbar-controls\">\n      <label for=\"agency\">Agencia\n        <select class=\"field-select\" id=\"agency\"><option value=\"gp\">Agencia Demo Norte</option><option value=\"summa\">Agencia Demo Sur</option></select>\n      </label>\n      <label for=\"mode\">Formato del reporte\n        <select class=\"field-select\" id=\"mode\"><option value=\"detallado\">Detalle de servicios</option><option value=\"ejecutivo\">Resumen ejecutivo</option></select>\n      </label>\n    </div>\n    <div class=\"agency-toolbar-note\">Ejemplo sintético · octubre 2026</div>\n  </div>\n  \n  <div class=\"agency-report-filters\" aria-label=\"Filtros del histórico\">\n    <label>Desde <input class=\"field-input\" type=\"date\" id=\"report-from\"></label>\n    <label>Hasta <input class=\"field-input\" type=\"date\" id=\"report-to\"></label>\n    <label>Recorrido <input class=\"field-input\" type=\"search\" id=\"report-route\" placeholder=\"Origen o destino\"></label>\n    <button class=\"btn btn-light\" type=\"button\" id=\"report-clear\">Limpiar filtros</button>\n    <span class=\"agency-filter-count\" id=\"report-filter-count\" aria-live=\"polite\"></span>\n  </div>\n<div class=\"grid-kpi agency-kpis\" aria-label=\"Indicadores por agencia\">\n    <article class=\"kpi\"><div class=\"kpi-top\"><span class=\"kpi-label\">Servicios realizados</span><span class=\"kpi-icon\">▤</span></div><div class=\"kpi-value\" id=\"k-count\">—</div><div class=\"kpi-foot\">Período del reporte</div></article>\n    <article class=\"kpi\"><div class=\"kpi-top\"><span class=\"kpi-label\">Servicios IN</span><span class=\"kpi-icon\">↘</span></div><div class=\"kpi-value\" id=\"k-in\">—</div><div class=\"kpi-foot\">Llegadas</div></article>\n    <article class=\"kpi\"><div class=\"kpi-top\"><span class=\"kpi-label\">Servicios OUT</span><span class=\"kpi-icon\">↗</span></div><div class=\"kpi-value\" id=\"k-out\">—</div><div class=\"kpi-foot\">Salidas</div></article>\n    <article class=\"kpi\"><div class=\"kpi-top\"><span class=\"kpi-label\">Otros servicios</span><span class=\"kpi-icon\">⋯</span></div><div class=\"kpi-value\" id=\"k-others\">—</div><div class=\"kpi-foot\">Servicios adicionales · TRF–TRF: 0</div></article>\n    <article class=\"kpi agency-kpi-amount\"><div class=\"kpi-top\"><span class=\"kpi-label\">Importe del reporte</span><span class=\"kpi-icon\">ARS</span></div><div class=\"kpi-value\" id=\"k-total\">—</div><div class=\"kpi-foot\">Tarifa base + extras</div></article>\n  </div>\n  <div class=\"notice agency-notice\"><strong>Primera fase · Ejemplo sintético:</strong> sin tarifas, documentos ni identidades comerciales reales. <span id=source-note></span></div>\n  <section class=\"panel agency-document\" aria-label=\"Vista del documento a exportar\">\n    <div class=\"agency-document-header\">\n      <img class=\"agency-gamo-logo\" src=\"gamo-logo.svg\" alt=\"Gamo Transfer\">\n      <div class=\"agency-document-title\"><h2 id=\"report-title\">REPORTE DE SERVICIOS</h2><p>AIRPORT TRANSFERS &amp; RECEPTIVE SERVICES</p></div>\n      <div class=\"agency-partner\" id=\"partner\" aria-label=\"Agencia contratante\"></div>\n    </div>\n    <div class=\"agency-meta\">\n      <div><span>Agencia</span><strong id=\"meta-agency\"></strong></div>\n      <div><span>Período</span><strong id=\"meta-week\"></strong></div>\n      <div><span>Fecha de emisión de referencia</span><strong id=\"meta-issue\"></strong></div>\n    </div>\n    <div class=\"table-scroll\"><table class=\"data-table agency-table table-many-columns\"><thead id=\"head\"></thead><tbody id=\"body\"></tbody><tfoot id=\"foot\"></tfoot></table></div>\n    <div class=\"agency-breakdown\">\n      <section class=\"agency-subpanel\">\n        <h3>Resumen general</h3><div id=\"summary-list\"></div>\n      </section>\n      <section class=\"agency-subpanel\">\n        <h3>Distribución de servicios</h3><div id=\"summary-services\"></div>\n      </section>\n      <section class=\"agency-subpanel\">\n        <h3>Composición de importes</h3><div id=\"summary-amounts\"></div>\n        <div class=\"total-band\"><span>Total del reporte</span><strong id=\"band-total\"></strong></div>\n      </section>\n    </div>\n    <div class=\"agency-document-footer\">\n      <img src=\"gamo-logo.svg\" alt=\"Gamo Transfer\">\n      <span>Servicios realizados con calidad y compromiso</span>\n      <span>Agradecemos su confianza y preferencia</span>\n      <span>www.gamo-transfer.com</span>\n    </div>\n  </section>\n</div>";
    // PUBLIC DEMO DATA ONLY. Commercial source records must remain private.
    const routes=[["AEROPUERTO","CENTRO"],["CENTRO","HOTEL"],["TERMINAL","AEROPUERTO"],["HOTEL","TERMINAL"]];
    const makeDemoRows=(count,seed)=>Array.from({length:count},(_,i)=>{
      const [from,to]=routes[(i+seed)%routes.length],base=25000+seed*1200+(i%4)*3500;
      const date=String(19+i%7).padStart(2,"0")+"-10";
      const time=String(7+(i*3)%16).padStart(2,"0")+":"+String(i%4*15).padStart(2,"0");
      return [date,time,from,to,base,i%3===0?2500:0,i%5===0?1500:0,"","TRASLADO DEMO","FICTICIO",from==="AEROPUERTO"?"IN":to==="AEROPUERTO"?"OUT":"OTRO"];
    });
    const samples={
      gp:{name:"AGENCIA DEMO NORTE",week:"19/10/2026 al 25/10/2026",issued:"27/10/2026",data:makeDemoRows(22,1)},
      summa:{name:"AGENCIA DEMO SUR",week:"19/10/2026 al 25/10/2026",issued:"27/10/2026",data:makeDemoRows(11,3)}
    };
    const overviews=Object.entries(samples).map(([key,s])=>{
      const sum=i=>s.data.reduce((a,r)=>a+r[i],0);
      return Object.freeze({key,name:s.name,count:s.data.length,base:sum(4),parking:sum(5),guide:sum(6),total:sum(4)+sum(5)+sum(6),week:s.week,source:"Datos sintéticos"});
    });
root.GamoAgencyReports={
  page(){return markup;},
  overview(){return overviews.map(o=>({...o}));},
  mount(){
    "use strict";
    const money=(n)=>"$ "+new Intl.NumberFormat("es-AR",{maximumFractionDigits:0}).format(n);
    const $=(q)=>document.querySelector(q);
    const escapeText=(x)=>String(x).replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    let activeRows=[];
    function render(){
    const key=$("#agency").value,mode=$("#mode").value,s=samples[key],
      from=$("#report-from")?.value || "",to=$("#report-to")?.value || "",
      route=($("#report-route")?.value||"").trim().toLocaleLowerCase("es"),
      rows=s.data.filter(r=>{
        const [day,month]=r[0].split("-");
        const dayISO="2026-"+month+"-"+day;
        return (!from||dayISO>=from)&&(!to||dayISO<=to)&&
          (!route||[r[2],r[3],r[8],r[9]].join(" ").toLocaleLowerCase("es").includes(route));
      });
    activeRows=rows;
    const filterCount=$("#report-filter-count");
    if(filterCount)filterCount.textContent=rows.length+" de "+s.data.length+" servicios";
    const sum=(idx)=>rows.reduce((a,r)=>a+r[idx],0),base=sum(4),park=sum(5),guide=sum(6),total=base+park+guide;
    const counts={IN:0,OUT:0,OTRO:0};rows.forEach((r)=>counts[r[10]]++);
    $("#k-count").textContent=rows.length;$("#k-in").textContent=counts.IN;$("#k-out").textContent=counts.OUT;$("#k-others").textContent=counts.OTRO;$("#k-total").textContent=money(total);
    $("#report-title").textContent=mode==="detallado"?"REPORTE DE SERVICIOS":"REPORTE EJECUTIVO DE SERVICIOS";
    $("#partner").textContent=s.name;
    $("#meta-agency").textContent=s.name;$("#meta-week").textContent=s.week;$("#meta-issue").textContent=s.issued;
    const sourceNote=$("#source-note");
    if(sourceNote) sourceNote.textContent="Datos sintéticos: los importes y trayectos sirven exclusivamente para probar el sistema; no son operaciones comerciales reales.";

    const detailed=mode==="detallado";
    const cols=detailed?["#","AGENCIA","CHOFER","GUÍA","SERVICIO","FECHA","HORA","ORIGEN","DESTINO","VEHÍCULO","OBSERVACIÓN","PARKING","TARIFA BASE","PRECIO TOTAL"]:["#","AGENCIA","SERVICIO","FECHA","HORA","ORIGEN","DESTINO","VEHÍCULO","OBSERVACIÓN","PRECIO TOTAL"];
    $("#head").innerHTML="<tr>"+cols.map((c)=>"<th scope=\"col\">"+c+"</th>").join("")+"</tr>";
    const rowCells=(r,i)=>{const cells=detailed?[i+1,s.name,r[7]||"—",r[6]?money(r[6]):"—",r[8],r[0],r[1],r[2],r[3],"STANDARD",r[9],r[5]?money(r[5]):"—",money(r[4]),money(r[4]+r[5]+r[6])]:[i+1,s.name,r[8],r[0],r[1],r[2],r[3],"STANDARD",r[9],money(r[4]+r[5]+r[6])];return "<tr>"+cells.map((c,j)=>"<td data-label=\""+escapeText(cols[j])+"\""+(j===1?' class=\"agency\"':j===cells.length-1?' class=\"total-cell\"':"")+">"+escapeText(c)+"</td>").join("")+"</tr>";};
    $("#body").innerHTML=rows.length?rows.map(rowCells).join(""):'<tr><td colspan="'+(detailed?14:10)+'">No hay servicios para los filtros seleccionados</td></tr>';
    $("#foot").innerHTML=detailed?'<tr><td colspan="3">TOTAL</td><td data-label="Guías">'+money(guide)+'</td><td colspan="7" class="agency-total-spacer"></td><td data-label="Parking">'+money(park)+'</td><td data-label="Tarifa base">'+money(base)+'</td><td class="total-cell" data-label="Precio total">'+money(total)+'</td></tr>':'<tr><td colspan="9">TOTAL GENERAL</td><td class="total-cell" data-label="Precio total">'+money(total)+'</td></tr>';
    $("#summary-list").innerHTML=[["Total de servicios",rows.length],["Servicios IN",counts.IN],["Servicios OUT",counts.OUT],["Otros servicios",counts.OTRO],["Vehículos","STANDARD"]].map(([a,b])=>'<div class="metric-line"><span>'+a+'</span><b>'+b+'</b></div>').join("");
    $("#summary-services").innerHTML=[["IN",counts.IN,"green"],["OUT",counts.OUT,""],["Otros",counts.OTRO,"gold"]].map(([a,b,c])=>'<div class="agency-bar-line"><span>'+a+'</span><div class="agency-bar-rail"><div class="agency-bar '+c+'" style="width:'+((rows.length?b/rows.length*100:0))+'%"></div></div><strong>'+((rows.length?b/rows.length*100:0)).toFixed(1).replace(".",",")+'%</strong></div>').join("");
    $("#summary-amounts").innerHTML=[["Tarifa base",base,""],["Parking",park,"gold"],["Guías",guide,"green"]].map(([a,b,c])=>'<div class="agency-bar-line"><span>'+a+'</span><div class="agency-bar-rail"><div class="agency-bar '+c+'" style="width:'+((total?b/total*100:0))+'%"></div></div><strong>'+money(b)+'</strong></div>').join("");
    $("#band-total").textContent=money(total);
    // La selección de formato se realiza desde el filtro integrado.
    }
    $("#agency").addEventListener("change",render);$("#mode").addEventListener("change",render);
    ["report-from","report-to"].forEach(id=>$("#"+id).addEventListener("change",render));
    $("#report-route").addEventListener("input",render);
    $("#report-clear").addEventListener("click",()=>{
      ["report-from","report-to","report-route"].forEach(id=>{$("#"+id).value="";});
      render();
    });

    document.querySelectorAll("[data-mode]").forEach((button)=>button.addEventListener("click",()=>{$("#mode").value=button.dataset.mode;render();}));
    $("#print").addEventListener("click",()=>window.print());
    $("#csv").addEventListener("click",()=>{
     const s=samples[$("#agency").value],headers=["N","Agencia","Conductor","Guia","Servicio","Fecha","Hora","Origen","Destino","Vehiculo","Observacion","Parking","Tarifa base","Precio total"];
     const lines=[headers,...activeRows.map((r,i)=>[i+1,s.name,r[7],r[6],r[8],r[0]+"/2026",r[1],r[2],r[3],"STANDARD",r[9],r[5],r[4],r[4]+r[5]+r[6]])];
     const escapeCSV=(v)=>{const val=String(v??"");const safe=/^\s*[=+\-@\t\r]/.test(val)?"'"+val:val;return '"'+safe.replace(/"/g,'""')+'"';};
     const csv="\ufeff"+lines.map((r)=>r.map(escapeCSV).join(";")).join("\r\n");
     const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="Gamo_DEMO_"+$("#agency").value+"_Oct2026.csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    render();
  }
};
})(window);
