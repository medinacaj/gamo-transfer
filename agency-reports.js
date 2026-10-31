/* Reportes por agencia: integrados dentro del shell principal de GAMO TRANSFER.
 * Registros históricos documentados, separados de las reservas demo.
 */
(function(root){
"use strict";
const markup="\n<div class=\"agency-report\">\n  <div class=\"page-header\">\n    <div>\n      <div class=\"eyebrow\">GAMO TRANSFER · GESTIÓN COMERCIAL</div>\n      <h1>Reportes por agencia</h1>\n      <p class=\"subheading\">Primera fase: servicios históricos por agencia, con importes del documento fuente.</p>\n    </div>\n    <div class=\"header-actions agency-actions\">\n      <button type=\"button\" class=\"btn btn-light\" id=\"csv\">Exportar CSV</button>\n      <button type=\"button\" class=\"btn btn-primary\" id=\"print\">Imprimir / PDF</button>\n    </div>\n  </div>\n  <div class=\"toolbar agency-toolbar\">\n    <div class=\"toolbar-controls\">\n      <label for=\"agency\">Agencia\n        <select class=\"field-select\" id=\"agency\"><option value=\"gp\">GP Travel</option><option value=\"summa\">Grupo Summa</option></select>\n      </label>\n      <label for=\"mode\">Formato del reporte\n        <select class=\"field-select\" id=\"mode\"><option value=\"detallado\">Detalle de servicios</option><option value=\"ejecutivo\">Resumen ejecutivo</option></select>\n      </label>\n    </div>\n    <div class=\"agency-toolbar-note\">Histórico documentado · octubre 2026</div>\n  </div>\n  <div class=\"grid-kpi agency-kpis\" aria-label=\"Indicadores por agencia\">\n    <article class=\"kpi\"><div class=\"kpi-top\"><span class=\"kpi-label\">Servicios realizados</span><span class=\"kpi-icon\">▤</span></div><div class=\"kpi-value\" id=\"k-count\">—</div><div class=\"kpi-foot\">Período del reporte</div></article>\n    <article class=\"kpi\"><div class=\"kpi-top\"><span class=\"kpi-label\">Servicios IN</span><span class=\"kpi-icon\">↘</span></div><div class=\"kpi-value\" id=\"k-in\">—</div><div class=\"kpi-foot\">Llegadas</div></article>\n    <article class=\"kpi\"><div class=\"kpi-top\"><span class=\"kpi-label\">Servicios OUT</span><span class=\"kpi-icon\">↗</span></div><div class=\"kpi-value\" id=\"k-out\">—</div><div class=\"kpi-foot\">Salidas</div></article>\n    <article class=\"kpi\"><div class=\"kpi-top\"><span class=\"kpi-label\">Otros servicios</span><span class=\"kpi-icon\">⋯</span></div><div class=\"kpi-value\" id=\"k-others\">—</div><div class=\"kpi-foot\">Servicios adicionales · TRF–TRF: 0</div></article>\n    <article class=\"kpi agency-kpi-amount\"><div class=\"kpi-top\"><span class=\"kpi-label\">Importe del reporte</span><span class=\"kpi-icon\">ARS</span></div><div class=\"kpi-value\" id=\"k-total\">—</div><div class=\"kpi-foot\">Tarifa base + extras</div></article>\n  </div>\n  <div class=\"notice agency-notice\"><strong>Primera fase · Histórico documentado:</strong> registros de los reportes facilitados. Conductores omitidos en la vista pública. <span id=source-note></span></div>\n  <section class=\"panel agency-document\" aria-label=\"Vista del documento a exportar\">\n    <div class=\"agency-document-header\">\n      <img class=\"agency-gamo-logo\" src=\"gamo-logo.svg\" alt=\"Gamo Transfer\">\n      <div class=\"agency-document-title\"><h2 id=\"report-title\">REPORTE DE SERVICIOS</h2><p>AIRPORT TRANSFERS &amp; RECEPTIVE SERVICES</p></div>\n      <div class=\"agency-partner\" id=\"partner\" aria-label=\"Agencia contratante\"></div>\n    </div>\n    <div class=\"agency-meta\">\n      <div><span>Agencia</span><strong id=\"meta-agency\"></strong></div>\n      <div><span>Período</span><strong id=\"meta-week\"></strong></div>\n      <div><span>Fecha de emisión de referencia</span><strong id=\"meta-issue\"></strong></div>\n    </div>\n    <div class=\"table-scroll\"><table class=\"data-table agency-table\"><thead id=\"head\"></thead><tbody id=\"body\"></tbody><tfoot id=\"foot\"></tfoot></table></div>\n    <div class=\"agency-breakdown\">\n      <section class=\"agency-subpanel\">\n        <h3>Resumen general</h3><div id=\"summary-list\"></div>\n      </section>\n      <section class=\"agency-subpanel\">\n        <h3>Distribución de servicios</h3><div id=\"summary-services\"></div>\n      </section>\n      <section class=\"agency-subpanel\">\n        <h3>Composición de importes</h3><div id=\"summary-amounts\"></div>\n        <div class=\"total-band\"><span>Total del reporte</span><strong id=\"band-total\"></strong></div>\n      </section>\n    </div>\n    <div class=\"agency-document-footer\">\n      <img src=\"gamo-logo.svg\" alt=\"Gamo Transfer\">\n      <span>Servicios realizados con calidad y compromiso</span>\n      <span>Agradecemos su confianza y preferencia</span>\n      <span>www.gamo-transfer.com</span>\n    </div>\n  </section>\n</div>";
    const gpSource=[
    ["19-10","11:10","AEP","HTL",30000,10000,0,"","TRANSFER","REALIZADO","IN"],
    ["19-10","18:00","AEP","HTL",30000,10000,0,"","TRANSFER","REALIZADO","IN"],
    ["19-10","19:05","EZE","HTL",60000,9000,0,"","TRANSFER","REALIZADO","IN"],
    ["19-10","23:25","EZE","HTL",60000,13500,0,"","TRANSFER","DESVÍO EZE","IN"],
    ["20-10","07:30","HTL","AEP",30000,0,0,"","TRANSFER","REALIZADO","OUT"],
    ["20-10","07:50","HTL","AEP",30000,0,8000,"","TRANSFER","REALIZADO","OUT"],
    ["20-10","19:30","HTL","AEP",30000,0,0,"","TRANSFER","REALIZADO","OUT"],
    ["21-10","22:25","AEP","HTL",30000,10000,0,"","TRANSFER","REALIZADO","IN"],
    ["22-10","06:00","HTL","BQB",30000,0,0,"","TRANSFER","REALIZADO","OUT"],
    ["22-10","11:15","HTL","AEP",30000,0,0,"","TRANSFER","REALIZADO","OUT"],
    ["22-10","10:00","HTL","CITY",100000,0,0,"","CITY 4HRS","REALIZADO","OTRO"],
    ["22-10","12:50","HTL","AEP",30000,0,0,"","TRANSFER","REALIZADO","OUT"],
    ["22-10","16:30","AEP","HTL",30000,0,8000,"","TRANSFER","REALIZADO","IN"],
    ["23-10","06:00","RETIRO","HTL",30000,0,0,"","TRANSFER","REALIZADO","IN"],
    ["23-10","11:50","AEP","HTL",30000,0,8000,"","TRANSFER","REALIZADO","IN"],
    ["23-10","17:50","AEP","HTL",30000,10000,0,"","TRANSFER","REALIZADO","IN"],
    ["24-10","07:30","HTL","EZE",60000,0,0,"","TRANSFER","REALIZADO","OUT"],
    ["24-10","11:15","HTL","AEP",30000,0,8000,"","TRANSFER","REALIZADO","OUT"],
    ["24-10","17:25","EZE","HTL",60000,9000,0,"","TRANSFER","REALIZADO","IN"],
    ["25-10","03:30","HTL","EZE",60000,0,0,"","TRANSFER","REALIZADO","OUT"],
    ["25-10","12:30","AEP","HTL",30000,10000,0,"","TRANSFER","REALIZADO","IN"],
    ["25-10","13:45","BQB","HTL",30000,0,0,"","TRANSFER","REALIZADO","OTRO"]
    ];
    const summaSource=[
    ["20-10","08:30","AEP","HTL",29000],["20-10","17:30","AEP","HTL",29000],
    ["21-10","09:30","HTL","AEP",29000],["22-10","18:35","AEP","HTL",29000],
    ["22-10","22:30","AEP","HTL",29000],["23-10","11:20","AEP","HTL",29000],
    ["23-10","13:40","AEP","HTL",29000],["24-10","09:55","HTL","AEP",29000],
    ["25-10","06:00","HTL","AEP",29000],["25-10","09:00","HTL","RECO",22000],
    ["25-10","16:30","HTL","AEP",29000]
    ].map((r)=>[r[0],r[1],r[2],r[3],r[4],0,0,"","TRANSFER","REALIZADO",r[2]==="HTL"?"OUT":"IN"]);
    const samples={gp:{name:"GP TRAVEL",week:"19/10/2026 al 25/10/2026",issued:"30/10/2026",data:gpSource},summa:{name:"GRUPO SUMMA",week:"20/10/2026 al 25/10/2026",issued:"27/10/2026",data:summaSource}};
    const overviews=Object.entries(samples).map(([key,s])=>{
      const sum=i=>s.data.reduce((a,r)=>a+r[i],0);
      return Object.freeze({key,name:s.name,count:s.data.length,base:sum(4),parking:sum(5),guide:sum(6),total:sum(4)+sum(5)+sum(6),week:s.week,source:key==="gp"?"Excel facilitado":"Imagen del reporte"});
    });
root.GamoAgencyReports={
  page(){return markup;},
  overview(){return overviews.map(o=>({...o}));},
  mount(){
    "use strict";
    const money=(n)=>"$ "+new Intl.NumberFormat("es-AR",{maximumFractionDigits:0}).format(n);
    const $=(q)=>document.querySelector(q);
    const escapeText=(x)=>String(x).replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    function render(){
    const key=$("#agency").value,mode=$("#mode").value,s=samples[key],rows=s.data;
    const sum=(idx)=>rows.reduce((a,r)=>a+r[idx],0),base=sum(4),park=sum(5),guide=sum(6),total=base+park+guide;
    const counts={IN:0,OUT:0,OTRO:0};rows.forEach((r)=>counts[r[10]]++);
    $("#k-count").textContent=rows.length;$("#k-in").textContent=counts.IN;$("#k-out").textContent=counts.OUT;$("#k-others").textContent=counts.OTRO;$("#k-total").textContent=money(total);
    $("#report-title").textContent=mode==="detallado"?"REPORTE DE SERVICIOS":"REPORTE EJECUTIVO DE SERVICIOS";
    $("#partner").innerHTML=key==="gp"?'<img class="gp" src="gp-travel-logo.svg" alt="GP Travel">':'<div class="partner-text">GRUPO<br>SUMMA</div>';
    $("#meta-agency").textContent=s.name;$("#meta-week").textContent=s.week;$("#meta-issue").textContent=s.issued;
    const sourceNote=$("#source-note");
    if(sourceNote) sourceNote.innerHTML=key==="gp"
      ? '<strong>Excel GP Travel:</strong> 22 servicios y $993.500. <strong>Pendiente de conciliar:</strong> la imagen muestra $1.053.500; los registros 7 y 12 difieren en destino y tarifa (+$60.000).'
      : '<strong>Grupo Summa:</strong> 11 servicios por $312.000, transcritos de la imagen facilitada. Pendiente de contrastar con el Excel original de esa agencia.';

    const detailed=mode==="detallado";
    const cols=detailed?["#","AGENCIA","CHOFER","GUÍA","SERVICIO","FECHA","HORA","ORIGEN","DESTINO","VEHÍCULO","OBSERVACIÓN","PARKING","TARIFA BASE","PRECIO TOTAL"]:["#","AGENCIA","SERVICIO","FECHA","HORA","ORIGEN","DESTINO","VEHÍCULO","OBSERVACIÓN","PRECIO TOTAL"];
    $("#head").innerHTML="<tr>"+cols.map((c)=>"<th scope=\"col\">"+c+"</th>").join("")+"</tr>";
    const rowCells=(r,i)=>{const cells=detailed?[i+1,s.name,r[7]||"—",r[6]?money(r[6]):"—",r[8],r[0],r[1],r[2],r[3],"STANDARD",r[9],r[5]?money(r[5]):"—",money(r[4]),money(r[4]+r[5]+r[6])]:[i+1,s.name,r[8],r[0],r[1],r[2],r[3],"STANDARD",r[9],money(r[4]+r[5]+r[6])];return "<tr>"+cells.map((c,j)=>"<td"+(j===1?' class=\"agency\"':j===cells.length-1?' class=\"total-cell\"':"")+">"+escapeText(c)+"</td>").join("")+"</tr>";};
    $("#body").innerHTML=rows.map(rowCells).join("");
    $("#foot").innerHTML=detailed?'<tr><td colspan="3">TOTAL</td><td>'+money(guide)+'</td><td colspan="7"></td><td>'+money(park)+'</td><td>'+money(base)+'</td><td class="total-cell">'+money(total)+'</td></tr>':'<tr><td colspan="9">TOTAL GENERAL</td><td class="total-cell">'+money(total)+'</td></tr>';
    $("#summary-list").innerHTML=[["Total de servicios",rows.length],["Servicios IN",counts.IN],["Servicios OUT",counts.OUT],["Otros servicios",counts.OTRO],["Vehículos","STANDARD"]].map(([a,b])=>'<div class="metric-line"><span>'+a+'</span><b>'+b+'</b></div>').join("");
    $("#summary-services").innerHTML=[["IN",counts.IN,"green"],["OUT",counts.OUT,""],["Otros",counts.OTRO,"gold"]].map(([a,b,c])=>'<div class="agency-bar-line"><span>'+a+'</span><div class="agency-bar-rail"><div class="agency-bar '+c+'" style="width:'+(b/rows.length*100)+'%"></div></div><strong>'+(b/rows.length*100).toFixed(1).replace(".",",")+'%</strong></div>').join("");
    $("#summary-amounts").innerHTML=[["Tarifa base",base,""],["Parking",park,"gold"],["Guías",guide,"green"]].map(([a,b,c])=>'<div class="agency-bar-line"><span>'+a+'</span><div class="agency-bar-rail"><div class="agency-bar '+c+'" style="width:'+(b/total*100)+'%"></div></div><strong>'+money(b)+'</strong></div>').join("");
    $("#band-total").textContent=money(total);
    // La selección de formato se realiza desde el filtro integrado.
    }
    $("#agency").addEventListener("change",render);$("#mode").addEventListener("change",render);
    document.querySelectorAll("[data-mode]").forEach((button)=>button.addEventListener("click",()=>{$("#mode").value=button.dataset.mode;render();}));
    $("#print").addEventListener("click",()=>window.print());
    $("#csv").addEventListener("click",()=>{
     const s=samples[$("#agency").value],headers=["N","Agencia","Conductor","Guia","Servicio","Fecha","Hora","Origen","Destino","Vehiculo","Observacion","Parking","Tarifa base","Precio total"];
     const lines=[headers,...s.data.map((r,i)=>[i+1,s.name,r[7],r[6],r[8],r[0]+"/2026",r[1],r[2],r[3],"STANDARD",r[9],r[5],r[4],r[4]+r[5]+r[6]])];
     const escapeCSV=(v)=>{const val=String(v??"");const safe=/^[=+\-@\t\r]/.test(val)?"'"+val:val;return '"'+safe.replace(/"/g,'""')+'"';};
     const csv="\ufeff"+lines.map((r)=>r.map(escapeCSV).join(";")).join("\r\n");
     const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="Gamo_Historico_"+$("#agency").value+"_Oct2026.csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    render();
  }
};
})(window);
