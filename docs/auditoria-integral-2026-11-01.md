# GAMO TRANSFER — Auditoría técnica y plan de calidad
**Fecha de corte:** 2026-11-01  
**Objeto:** aplicación administrativa de demostración, repositorio público `medinacaj/gamo-transfer`.

> **Alcance de la evidencia:** inspección del código, verificaciones de sintaxis y pruebas directas de funciones mediante entorno JavaScript simulado. No es una pentest, auditoría legal, prueba de accesibilidad WCAG 2.2 AA completa ni medición real de Core Web Vitals. Los resultados de Playwright en navegadores y el estado del despliegue de GitHub Pages requieren confirmación del sistema CI.

## Diagnóstico y hallazgos priorizados

| Prioridad | Hallazgo | Evidencia | Estado |
| --- | --- | --- | --- |
| P1 | Reportes comerciales incluidos en JavaScript público | `agency-reports.js`, repositorio público y hosting estático; la URL y el código pueden distribuirse sin sesión | **Riesgo vigente**. No se eliminó información proporcionada por el usuario sin autorización. Bloquea el uso con datos sensibles |
| P1 | No hay identidad ni autorización de servidor | Datos demo en `localStorage`, sin backend del proyecto ni políticas de acceso verificables | **Pendiente de infraestructura**: una pantalla de acceso en HTML no resolvería el riesgo |
| P1 | Prueba de navegador apuntaba a `/gamo-app/` en lugar de la raíz y Chromium fijo en `/usr/bin/chromium` | `tests/browser.py` original | **Corregido**: raíz local y navegador Playwright administrado, con ruta ejecutable opcional |
| P1 | Navegación con hashes heredados (`constructor`, `__proto__`) podía intentar ejecutar miembros de `Object.prototype` | `screens[page]` sin comprobación de propiedad propia | **Corregido** usando `Object.hasOwn` |
| P1 | Modales accesibles visualmente sin aislar siempre el contenido de fondo | Dos implementaciones de modal, una sin tratamiento de fondo | **Corregido** con `inert` y restauración del foco |
| P1 | Historial financiero de GP Travel presenta discrepancia de fuente | Excel: 22 servicios, ARS 993.500; imagen: ARS 1.053.500 | **Pendiente de conciliación** de ARS 60.000. No modificar importes sin respaldo |
| P2 | Tablas y agenda habían forzado desplazamiento lateral | Reglas de ancho mínimo y columnas fijas previas | **Adaptación CSS incorporada**; validación visual real pendiente |
| P2 | Los módulos administrativos podían indexarse | Documento `index.html` sin instrucción de robots | **Corregido** con `noindex, nofollow, noarchive` en el documento y el redireccionamiento |
| P2 | QA visual no estaba integrado en CI | GitHub Pages ejecutaba pruebas Node, no Playwright | **Agregado** flujo separado `browser-qa.yml`; todavía debe verificarse su ejecución exitosa |
| P2 | Código CSS con múltiples capas de sobrescrituras y JS de interfaz extenso | `styles.css` y `app.js` contienen reglas agregadas en varias iteraciones | **Deuda técnica**: planificar consolidación con comparación visual antes/después |
| P2 | Falta medición RUM y compatibilidad cross-browser demostrada | No se ha leído un conjunto de datos LCP/INP/CLS de visitantes ni resultados Safari/Firefox | **No verificado** |
| P3 | Detalles de microinteracción y estética | No se identificaron como limitaciones de negocio críticas | **No priorizar** por encima de datos, navegación y QA |

No se identificó una vulnerabilidad P0 demostrada mediante la inspección realizada. Esto **no equivale** a acreditar ausencia de fallos críticos.

## Cambios de este ciclo

1. `tests/browser.py`: servidor HTTP de pruebas con ruta correcta, inicialización comprobada, Playwright sin ruta rígida de Chromium y comprobación del contenido adaptativo en varios anchos.
2. `.github/workflows/browser-qa.yml`: suite Chromium separada del despliegue principal, activable por push de archivos de aplicación, PR o ejecución manual. La suite no bloquea automáticamente la publicación de Pages.
3. `app.js`: fallback seguro para hashes que no representan rutas declaradas; fondo `inert` en ambos tipos de modal; cierre con Escape y protección ante listas vacías de controles.
4. `tests/ui-integration.test.js` y `tests/browser.py`: pruebas de navegación inválida, foco de modales, escape HTML de entradas persistidas y metadatos del panel.
5. `index.html`: no indexación, tamaño intrínseco del logotipo y mantenimiento de la identidad corporativa.
6. `reportes-agencias.html`: instrucción de no indexación para la antigua ruta HTML.
7. Se preservaron las cifras y la separación entre **reportes históricos documentados** y **datos operativos ficticios**.

## Verificaciones realizadas directamente

- `Gamo.seed("2026-11-01")` generó estado válido de demostración; `Gamo.validateState` devolvió verdadero.
- Se evaluaron rutas `#/constructor`, `#/__proto__`, `#/toString` y `#/inicio` con stubs DOM; todas quedaron en el inicio.
- La cadena de prueba `<img src=x onerror=alert(1)>`, insertada en el nombre de una empresa simulada, se mostró escapada como texto en el HTML generado.
- `csvCell("=HYPERLINK('evil')")` produjo una celda de CSV con prefijo de neutralización.
- La sintaxis de `app.js` fue comprobada por evaluación de función en JavaScript.
- **No** se ejecutó Playwright real, Lighthouse, lector de pantalla, auditoría de cookies ni pentest desde este entorno. El archivo de workflow no acredita por sí solo que GitHub Actions haya terminado correctamente.

## Aplicabilidad de las especialidades

| Disciplina | Decisión proporcional a esta fase |
| --- | --- |
| Full-stack y cloud | Mantener la demo estática, sin frameworks nuevos. Para producción: servicio privado y base de datos con respaldo, autenticación y RLS |
| UX/UI y responsive | Mantener navegación agrupada, tablas adaptables sin barras laterales y sin franjas decorativas; comprobarlas en navegador |
| WCAG 2.2 AA | Objetivo pendiente de auditoría manual: teclado, lector de pantalla, contraste completo, zoom 200–400 % y modales |
| Rendimiento | Sin librerías de interfaz adicionales, pero no se afirman LCP, INP, CLS ni percentiles medidos; medirlos en una URL accesible |
| Seguridad | CSP básica en meta y escape contextual; reglas HTTP como HSTS, `frame-ancestors`, rate limiting y WAF requieren control del hosting/origen pertinente |
| SEO | El panel administrativo debe permanecer **no indexado**. Si se busca posicionamiento público, crear una landing comercial separada con datos verificados; no añadir LocalBusiness ni reseñas ficticias |
| Marketing/CRO | No instalar GA4/GTM o banners de cookies por inercia: no hay embudo comercial público definido en esta demo |
| Privacidad/legal | No considerar `localStorage` ni GitHub Pages almacenamiento seguro de pasajeros; revisar tratamiento contractual y normativas pertinentes antes de operar con personas reales |
| DevOps y observabilidad | El despliegue Pages continúa independiente de QA navegador; añadir alertas y monitoreo cuando exista un servicio operativo |
| Mapas, Cloudflare y pagos | No aplicables por defecto a esta consola administrativa; evaluar al integrar rutas reales, dominio propio, infraestructura o ventas en línea |

## Condiciones de entrada a producción

- Confirmar titularidad y derecho a publicar cada fuente de datos. Retirar de la distribución pública los contenidos que deban ser privados antes de poner un acceso autenticado.
- Aprovisionar backend exclusivo de Gamo Transfer, autenticación real, separación de organizaciones y agencias, permisos de servidor y auditoría de cambios.
- Migrar y conciliar registros mediante proceso trazable; no usar importes pendientes de conciliación como facturas oficiales.
- Ejecutar y aprobar pruebas Node, E2E, navegador móvil, Firefox, Safari y chequeos manuales de accesibilidad.
- Obtener evidencia de despliegue real, copias y restauración, monitoreo y mediciones representativas de rendimiento.

## Próxima mejora de mayor impacto

**Establecer una separación efectiva entre demo pública y operación privada**. La arquitectura protegida es prioritaria frente a añadir mapas, animaciones, herramientas publicitarias o más componentes visuales.

Revisar el plan de roles en [`docs/seguridad-y-accesos.md`](seguridad-y-accesos.md). Si el dueño no aprueba un nuevo backend/organización, conservar el proyecto estrictamente como demo y no agregar registros personales.
