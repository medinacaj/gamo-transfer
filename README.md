# GAMO TRANSFER · Transporte ejecutivo B2B internacional

Demo comercial funcional para un operador argentino cuyos clientes contratan viajes para terceros. La **empresa contratante** recibe el documento y paga; los **pasajeros** reciben el traslado. No requiere backend, instalación de dependencias ni compilación.

## Identidad corporativa

Paleta propuesta a partir del logo de GAMO TRANSFER, con colores planos y sin gradientes:

| Color | Código | Uso |
|---|---|---|
| Azul marino | `#002B49` | Navegación, cabecera destacada y marca |
| Azul corporativo | `#006BA0` | Botones, enlaces, gráficos y foco |
| Celeste | `#009EDB` | Acentos decorativos |
| Azul hielo | `#E7F3FA` | Fondos de avisos y selecciones |
| Gris claro | `#F4F7FA` | Fondo general |
| Blanco | `#FFFFFF` | Tarjetas y formularios |

El azul corporativo mantiene contraste con texto blanco. El celeste se reserva para detalles y no para texto pequeño sobre blanco. Verde, ámbar y rojo conservan significado funcional de éxito, advertencia y error.

## Ejecutar

Desde la raíz del repositorio:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Abrir el servidor en un navegador moderno. El HTML usa rutas relativas y navegación hash: funciona bajo `/gamo-transfer/` en GitHub Pages. Se recomienda servir por HTTP en vez de abrir como archivo para que el almacenamiento tenga un origen estable.

## Recorrido para presentar al cliente

1. **Resumen:** indicadores operativos, facturación, cobros y saldos separados por ARS, USD y EUR; evolución mensual con conversión histórica identificada.
2. **Reservas:** crear o editar pasajeros, empresa, horarios argentinos, ruta, vuelo, equipaje, asignación, tarifa y costos. Buscar por texto, empresa, fecha o estado; exportar CSV.
3. **Agenda:** elegir fecha y vista diaria/semanal; abrir un servicio para asignarlo. Alertas por falta de recursos, conflictos, capacidad, categoría y vencimientos.
4. **Empresas:** consultar fichas fiscales extranjeras sin exigir CUIT, contactos, acuerdos de tarifas, crédito, historial de servicios, documentos y cobros. Tarifas acordadas se guardan como referencia; la tarifa pactada efectiva se registra en cada reserva.
5. **Facturación internacional:** preparar documento, elegir empresa, período opcional y moneda, seleccionar varios viajes completados, comprobar el total y guardar. Por ejemplo, Iberia Meetings tiene dos viajes en EUR pendientes para consolidar al restaurar el demo.
6. Abrir el documento y **marcar emitida (DEMO)** con un número único. Usar **Imprimir / guardar PDF** para obtener la versión profesional mediante el diálogo del navegador.
7. **Registrar pago:** admite pagos parciales y monedas diferentes; indicar conversión a la moneda del documento, cotización ARS y comisión. El saldo y el historial se actualizan automáticamente.
8. **Cuentas por cobrar:** saldos por empresa y moneda, vencimientos por antigüedad, comisiones y diferencias de cambio.
9. **Conductores y flota:** crear/editar fichas, disponibilidad, vencimientos y mantenimiento. En “Servicios y gastos” del conductor se registran liquidaciones parciales simuladas en ARS por servicio completado.
10. **Rentabilidad y reportes:** costos por viaje y análisis por empresa, conductor, vehículo, país, moneda y mes. Exportaciones CSV con BOM UTF-8, separador punto y coma y protección frente a fórmulas.

Incluye **6 conductores, 8 vehículos, 28 reservas, 8 empresas extranjeras y un cliente particular**, documentos pagados, parciales y vencidos. Las fechas demo se generan en torno al día argentino de inicialización/restauración. Todos los datos identificatorios son ficticios.

## Reglas del demo

- Estados operativos independientes de emisión (`Preparada`, `Emitida`, `Anulada`) y cobro (pendiente, parcial, pagada o vencida). Una factura parcialmente pagada puede estar vencida: su antigüedad aparece en Cuentas por cobrar.
- Un documento consolida solo viajes **completados de una empresa y una moneda**. Los documentos preparados también reservan servicios para evitar duplicados. No se cambian viajes documentados; se anula el documento con motivo registrado antes de corregirlos. No se anulan documentos con pagos.
- No se suman monedas diferentes sin conversión. Cada viaje, documento y pago conserva su tipo de cambio, fecha y fuente **ficticios**. No hay consulta de cotizaciones reales ni actualización retroactiva.
- El importe bruto del pago se aplica a la deuda. Las comisiones son gasto del operador en la moneda recibida. Neto ARS = (bruto − comisión) × cotización ARS del pago. Diferencia cambiaria = bruto ARS − importe aplicado × cotización histórica del documento.
- Rentabilidad estimada = tarifa de servicios completados convertida a ARS − costos ARS de cada viaje. Se distingue de facturación y dinero recibido; no incluye impuestos ni costos fijos. Gastos de referencia de flota no se duplican en los costos por viaje. La comisión del conductor es una referencia comercial; el costo efectivo se ingresa por viaje.
- Las liquidaciones a conductores no vuelven a descontarse como gasto: cancelan el costo ya registrado. No se modifica un viaje con liquidaciones registradas.
- Conflictos de asignación: ventana demo de **90 minutos**, sin cálculo de duración real de rutas. Verificar manualmente el despacho real. Cambiar la disponibilidad de un recurso muestra alertas sobre reservas existentes.
- Tipo de comprobante y estado fiscal configurables. **No se asigna automáticamente factura E**, no se presupone exportación de servicios ni se emiten comprobantes fiscales. Requiere validación contable y normativa ARCA.

## Persistencia y privacidad

El estado se guarda en `localStorage` bajo `gamo.demo.v1` al confirmar cambios, solo en ese navegador y origen. No existe sincronización entre dispositivos. El botón ↺ de la barra lateral permite descargar una copia JSON y restaurar los datos iniciales escribiendo **RESTAURAR**. No se incluye importación de copias en este demo.

Si el almacenamiento no puede leerse, el sitio conserva el contenido original, muestra una advertencia y bloquea nuevas escrituras hasta la restauración explícita. Si otra pestaña modifica los datos, es necesario recargar antes de seguir. No ingresar información personal real, credenciales ni secretos.

## Verificaciones

Reglas de dominio, sin instalar paquetes, con Node.js 24:

```bash
node --test tests/domain.test.js
node --check domain.js
node --check app.js
```

Pruebas funcionales opcionales: requieren Python, el paquete `playwright` y Chromium. En el entorno cloud preparado ya están disponibles. El archivo usa `/usr/bin/chromium`; ajustar la ruta si se ejecuta en otro sistema.

```bash
python3 tests/browser.py
```

El runner levanta su servidor en el puerto 8765 y usa contextos aislados; no modifica los datos de un navegador de usuario. Comprueba navegación, creación/edición, consolidación sin duplicados, pagos parciales y cruzados, persistencia, exportaciones, restauración, liquidaciones, protección del contenido y vista móvil. Detecta errores JavaScript. Capturas y PDF de validación se guardan en `/tmp/gamo-*`.

## GitHub Pages

URL prevista: **https://medinacaj.github.io/gamo-transfer/**

El workflow `.github/workflows/pages.yml` valida el dominio, prepara los archivos estáticos de la aplicación y sus logotipos y despliega desde `main`. En GitHub, configurar **Settings → Pages → Source → GitHub Actions** si aún no está habilitado. Luego ejecutar el workflow o enviar cambios a `main`. La publicación depende de los permisos y ajustes del repositorio.

La preparación local y la existencia del workflow **no prueban que el sitio esté publicado**. Verificar que Actions termine correctamente y abrir la URL pública, comprobando navegación y una reserva. No se confirmó la publicación desde el entorno inicial: la política de red bloqueó la consulta a `medinacaj.github.io` y a la API de GitHub.

## Estructura y evolución

- `domain.js`: datos demo y reglas operativas/financieras, independientes del DOM; reutilizable desde pruebas Node.
- `app.js`: vistas, formularios, persistencia, impresión y exportaciones.
- `index.html` / `styles.css`: shell, diseño adaptable y estilos de impresión.
- `tests/`: pruebas de dominio y navegador.

Es una demostración local; no tiene autenticación real, permisos, auditoría inmutable, GPS, cobros bancarios, facturación fiscal ni servicios externos. Para producción, trasladar las reglas a un servidor con PostgreSQL, autenticación, roles, auditoría y validaciones transaccionales. Evaluar con profesionales las integraciones ARCA y de pagos antes de implementarlas.

## Vista de reportes por agencia (demo)

Se incluye `reportes-agencias.html` con plantillas visuales de reporte detallado y ejecutivo, selector de agencia, resúmenes calculados, impresión/PDF y exportación CSV. Incluye los logotipos optimizados extraídos del archivo aportado: `gamo-logo.svg` y `gp-travel-logo.svg`. Los servicios del módulo son datos de demostración; **no están conectados a la base de reservas ni sustituyen la contabilidad o facturación del operador**. Se mantienen los reportes gerenciales existentes en `#/reportes`.

### Integración del módulo de agencias

Los reportes por agencia ahora son la ruta `#/reportes-agencias` de la aplicación principal. Reutilizan el mismo encabezado, navegación, tipografía, controles, estilos y diseño responsive que el resto del panel. `agency-reports.js` contiene la vista de ejemplo y `reportes-agencias.html` redirige los enlaces anteriores. La impresión PDF usa la vista de documento y mantiene los logotipos. La información sigue siendo demostrativa, sin conexión a facturación.

## Primera fase · Histórico de agencias (octubre de 2026)

La sección `#/reportes-agencias` muestra **registros históricos aportados** y ya no cifras de ejemplo inventadas para estos documentos. **GP Travel:** se transcribieron las 22 filas del Excel adjunto, con tarifa base ARS 880.000, estacionamiento ARS 81.500, guía ARS 32.000 y total ARS 993.500. **Grupo Summa:** 11 filas transcritas de la imagen, total ARS 312.000; la transcripción debe verificarse contra el original tabular si se obtiene.

**Conciliación:** la imagen de GP Travel muestra ARS 1.053.500, ARS 60.000 por encima de su Excel. Los servicios 7 y 12 son HTL → AEP por ARS 30.000 en el Excel, frente a HTL → EZE por ARS 60.000 en la imagen. El sistema usa el Excel para esos dos registros, muestra la diferencia al usuario y no la resuelve de forma automática.

No se publica ningún nombre de conductor. Los importes históricos **no se suman** a las métricas ficticias de facturación, reservas, cobros o rentabilidad. No existe sincronización operativa ni base de datos remota y los datos mostrados en GitHub Pages son accesibles al público. Antes de producción, verificar autorizaciones de publicación y conciliaciones con las agencias.

## Actualización de interfaz · fase 2 (octubre de 2026)

- **Centro de operaciones**: la página inicial prioriza servicios del día, alertas, reservas confirmadas, recursos y próximos servicios. El recorrido mostrado proviene de la próxima reserva demo, nunca de una ruta fija.
- **Datos identificados**: histórico documentado de agencias separado de reservas, cobros y facturas simulados. No se suman monedas distintas sin conversión.
- **Estados consistentes**: etiquetas visuales para reservas, conductores, vehículos y documentos, conservando texto legible además del color.
- **Filtros de reservas**: búsqueda general, estado, empresa y filtros avanzados por fecha desde/hasta, origen, destino, conductor y vehículo. Botón para limpiar filtros.
- **Filtros de histórico**: agencia, formato, rango de fechas y recorrido. La exportación CSV respeta los filtros seleccionados.
- **Preferencias**: botones de tema claro/oscuro y vista compacta/cómoda en la barra superior. Se conservan localmente en `gamo.ui.preferences.v1` y no modifican reservas o facturas.
- **Legibilidad**: superficies, bordes y contraste unificados; impresión PDF en fondo claro independientemente del tema.
- **Verificación**: las pruebas `tests/ui-preferences.test.js`, `tests/ui-integration.test.js` y `tests/agency-reports.test.js` cubren las nuevas funciones. El workflow de Pages ejecuta `node --test tests/*.test.js` y verifica la sintaxis antes de publicar.

### Seguridad antes de operar con datos reales

**Esta actualización no habilita autenticación de producción.** GitHub Pages es un alojamiento estático y el repositorio es público: no se pueden ocultar datos enviados en JavaScript simplemente con una pantalla de login. No agregar pasajeros reales, teléfonos, identificaciones, cobros o secretos a este repositorio ni al demo. Para implementar permisos reales se requiere un backend exclusivo y autorización de acceso a nivel de base de datos; ver [Modelo de seguridad y accesos](docs/seguridad-y-accesos.md).

### Jerarquía visual por sección

El resumen principal agrupa **Operación y despacho**, **Servicios históricos** y **Facturación y cobros** con espaciado visible entre áreas, títulos tipográficos y paneles de contenido independientes. Los grandes contenedores de fondo coloreado se reemplazaron por espacio en blanco; no hay franjas de color en las tarjetas. La navegación lateral agrupa los 11 módulos en **Principal, Operación, Clientes, Finanzas y Reportes**, sin cambiar sus rutas.

En el resto de la aplicación (reservas, flota, conductores, empresas, reportes, finanzas y formularios), se mantiene un sistema de niveles: **fondo de página → bloque de filtros o encabezado → tarjeta/panel → datos interiores**. La misma jerarquía tiene correspondencia en modo oscuro y en la vista compacta. Estos cambios son de presentación; no modifican datos, rutas ni importes.


### Tablas y agenda adaptables — sin desplazamiento horizontal

Las tablas generales mantienen su presentación tabular únicamente cuando el ancho de su propio panel permite mostrarla. Si el contenedor no es suficientemente ancho, cada registro se transforma en una ficha con etiquetas por campo (`data-label`), conservando servicios, pasajeros, recorridos, asignaciones, importes y acciones. Los informes de agencias (10 y 14 columnas) usan fichas adaptables en pantalla; sus totales siguen visibles en el resumen, y el PDF conserva su formato tabular de impresión.

La agenda semanal distribuye los días en 7, 4, 2 o 1 columnas según el ancho de pantalla, sin barra horizontal; la vista diaria siempre utiliza una sola columna. Se eliminan los antiguos mínimos de anchura de las tablas en la hoja de estilo final y se ajustan palabras largas dentro de cada campo.

Pruebas incorporadas: `tests/ui-integration.test.js` y `tests/agency-reports.test.js` validan las etiquetas, mientras `tests/browser.py` incluye comprobación de desbordamiento a 390, 768, 1200 y 1600 píxeles para todos los módulos.


## Auditoría y pruebas de regresión (2026-11-01)

- Informe de hallazgos, prioridades P0–P3, evidencia y decisiones de aplicabilidad: [Auditoría integral](docs/auditoria-integral-2026-11-01.md).
- El panel es administrativo y **no se debe indexar**: `index.html` y `reportes-agencias.html` contienen `noindex`. Esto **no constituye control de acceso**; los reportes que forman parte del JavaScript público siguen siendo accesibles.
- Se resolvieron casos de URL inválida que aprovechaban propiedades heredadas (`constructor`, `__proto__`) y se aplicó `inert` en ambos tipos de modal.
- La suite `tests/browser.py` ahora sirve la raíz real del repositorio y utiliza el Chromium instalado por Playwright, sin rutas locales fijas.
- `.github/workflows/browser-qa.yml` ejecuta la suite de Chromium por separado del despliegue de GitHub Pages. Su presencia **no implica que sus pruebas ya hayan pasado**.

Para ejecutar pruebas localmente, desde la raíz del repositorio:

```bash
node --test tests/*.test.js
python -m pip install "playwright==1.55.0"
python -m playwright install chromium
python -m unittest discover -s tests -p browser.py -v
```

Requiere Python compatible, Node.js y navegador Playwright descargado. Las mediciones reales LCP/INP/CLS, el chequeo de accesibilidad WCAG 2.2 AA y las pruebas Firefox/Safari siguen pendientes. No incluir datos reales de pasajeros ni secretos en esta demo pública.

## Mejoras funcionales y accesibilidad — ciclo 2026-11-01 (II)

- **Botones seguros en formularios:** el generador reutilizable de acciones crea `<button type="button">`. Esto impide que **Cancelar**, **Descargar copia** y otros botones secundarios actúen accidentalmente como `submit`. El único botón de confirmación sigue siendo `Guardar`.
- **CSV coherente con filtros:** `Exportar CSV` en Reservas ahora utiliza el mismo conjunto de registros filtrados mostrado por la tabla. Sin filtros activos exporta todas las reservas; con una búsqueda sin resultados genera solo el encabezado.
- **Acceso por teclado:** un control `Saltar al contenido principal` permite enfocar el contenido sin alterar el hash que controla la navegación.
- **Compatibilidad de actualización:** `index.html` referencia versiones nuevas de CSS y del archivo de aplicación para reducir problemas por recursos antiguos en caché.
- **Pruebas de regresión:** `tests/browser.py` verifica cancelación sin efectos, salto al contenido y correspondencia de filas del CSV. `tests/ui-integration.test.js` comprueba estructura del modal, control de foco, y reutilización de filtros.
- **Verificación directa de funciones:** con DOM simulado, una búsqueda produjo **11 de 28 reservas**, y el CSV produjo **11 filas**, mientras una búsqueda sin resultados produjo **0 filas**; cancelar restauró el estado no inerte del fondo. Estas verificaciones no sustituyen un ensayo real en navegador.

El despliegue en GitHub Pages, los indicadores Core Web Vitals y la conformidad WCAG 2.2 AA completa continúan pendientes de validación independiente.

## Sombras y elevación de tarjetas (2026-11-01)

Se restauró la profundidad visual de **indicadores, fichas de clientes/conductores/vehículos, tarjetas de histórico, agenda y paneles** sin introducir franjas de color ni bordes superiores gruesos. En equipos con ratón/trackpad, el cursor genera una sombra de elevación más perceptible y un desplazamiento sutil de 2 px en tarjetas pequeñas; los paneles grandes solo cambian su sombra. Los elementos con controles visibles también responden al foco de teclado.

El comportamiento se adapta al tema claro/oscuro, no aplica animaciones de movimiento cuando el usuario solicita reducción de movimiento y elimina las sombras al imprimir. Se versionó `styles.css` para evitar caché antigua. Las pruebas de estructura CSS están en `tests/ui-integration.test.js`; la prueba de sombras calculadas al hacer hover en Chromium está en `tests/browser.py`.

**Estado de verificación:** código y estructura CSS comprobados. La comparación visual y la ejecución E2E real todavía requieren resultados del workflow de navegador.


## Simplificación de niveles de tarjetas (2026-11-01)

Se eliminó el efecto de **tarjeta dentro de otra tarjeta** sin quitar las sombras o las acciones:

- **Tablas y reservas:** el generador de paneles detecta tablas y usa `panel--collection`, que conserva el título y los controles, pero no dibuja un recuadro ni sombra alrededor de las filas adaptables. La tabla de Reservas también utiliza ese estilo.
- **Histórico por agencia del resumen:** se retiró el panel exterior y el encabezado duplicado; quedan dos tarjetas independientes (una por agencia) y una nota documental sin marco.
- **Fichas de entidades:** los metadatos internos son filas simples, no otra tarjeta. En el documento de agencias, los bloques informativos conservan su estructura de columnas sin recuadros adicionales.
- **Consistencia:** las tarjetas individuales continúan con sombra/hover discreto. No se añadieron franjas decorativas ni colores adicionales.
- **Validación:** pruebas de estructura y simulación JavaScript; pruebas de estilos calculados en Chromium añadidas al workflow, pero aún pendientes de ejecución confirmada. La versión de recursos `v10` evita servir archivos antiguos desde caché.

Esta actualización no altera reservas, reportes ni montos históricos.


### Contraste de superficies del sistema (2026-11-01)

Se separó el fondo de aplicación del blanco de las tarjetas mediante el token `--canvas`: **#DADAD8** en modo claro y **#10100F** en modo oscuro. No se añadieron contenedores ni bordes decorativos; las tarjetas existentes conservan su color y sus sombras/hover. El color se controla desde la definición original de cada tema, sin crear otra capa de sobrescrituras CSS. `index.html` utiliza `styles.css?v=20261101-neutral-v12` para evitar caché previa. Las pruebas de regresión verifican las diferencias de superficie y el mantenimiento de los componentes planos. La validación visual del sitio publicado sigue pendiente.


## Centro de operaciones y vista compacta efectiva (2026-11-01)

- Las tres áreas del resumen conservan una composición plana (sin contenedores exteriores decorativos) y encabezados **sin numeración**: **Operación y despacho**, **Servicios históricos** y **Facturación y cobros**. Entre áreas se muestra un **separador horizontal neutro de un píxel**, con espacio adicional; sin barras verticales ni acentos de color.
- El modo **Vista compacta** ahora reduce realmente márgenes y espacios, tamaño/altura de KPIs, relleno de tarjetas, encabezados, filtros, agenda y gráfico de facturación. Se conservan todos los datos y acciones.
- Se corrigió la precedencia de los valores adaptativos de tablas: el modo compacto tiene relleno reducido tanto en tabla ancha como en fichas de datos por ancho de contenedor. La versión cómoda conserva más aire y continúa siendo el valor inicial.
- El botón sigue permitiendo alternar y almacenar la elección; en compacto utiliza una apariencia activa distinguible. Se respeta modo oscuro, dispositivos móviles, navegación por teclado e impresión.
- Versión de estilos: `styles.css?v=20261101-sections-density-v13` para evitar persistencia de recursos antiguos.
- Regresiones: pruebas estáticas en `tests/ui-integration.test.js` y prueba de navegador en `tests/browser.py` que compara **alturas reales** de KPI y gráfico, relleno de tabla, y `borderTopWidth` de separadores en ambos temas.

**Alcance de evidencia:** cambios y sintaxis confirmados; la ejecución de Playwright y el resultado visual publicado no se declaran verificados hasta disponer de un resultado real de CI o navegador.


## Publicación y control de caché

GitHub Pages ejecuta las pruebas Node antes de publicar. La prueba de integración que comprobaba un identificador de archivo `app.js?v=20261101-ux-v8` quedó desactualizada frente a nuevas versiones y podía **bloquear la publicación del sitio**, aunque las mejoras ya estuvieran guardadas en GitHub. Se sustituyó por una prueba que valida los archivos existentes y exige una referencia versionada, sin fijar números antiguos.

A partir de este cambio, el flujo `.github/workflows/pages.yml` **genera automáticamente** versiones con los primeros 12 caracteres del SHA de cada commit para `styles.css`, `domain.js`, `ui-preferences.js`, `agency-reports.js` y `app.js`, solo en el artefacto publicado. Ya no depende de que el desarrollador modifique manualmente parámetros `?v=` en el repositorio.

En cada publicación correcta se genera `build-info.txt` con el SHA íntegro utilizado. Desde la URL pública `https://medinacaj.github.io/gamo-transfer/build-info.txt` es posible contrastar la revisión desplegada con el último commit de `main`. El archivo se crea **solo al desplegar**; que exista el código en GitHub no confirma que ya esté disponible en la web.

Si una versión antigua continúa viéndose, comprobar primero el estado de la acción `Validate and deploy GAMO TRANSFER` y comparar `build-info.txt`. Si el commit coincide, recién entonces comprobar caché de HTML del navegador/CDN o usar una sesión privada. No borrar `localStorage` por defecto: las reservas demo guardadas localmente son independientes de la caché de archivos.


### Verificación posterior a cada despliegue

El workflow de Pages ahora ejecuta `scripts/verify_deployment.py` **después** de `actions/deploy-pages`. Valida el contenido público de `build-info.txt`, el SHA completo, el HTML con sus cinco referencias de versión y la descarga efectiva de CSS y JavaScript. Las peticiones incorporan un parámetro exclusivo de comprobación para evitar respuestas intermedias antiguas. Hay reintentos limitados para tolerar la propagación habitual del CDN; si no coincide el commit, el trabajo termina con error explícito.

Antes del despliegue se verifica la sintaxis Python y se ejecutan cuatro pruebas aisladas del verificador en `tests/test_deployment.py`: versión válida, commit antiguo, referencia JS obsoleta y respuesta incompleta. Estas pruebas **no sustituyen** el resultado del despliegue real ni una inspección visual.

La suite `Browser QA - Gamo Transfer` guarda una captura de cualquier prueba que falle en `/tmp/gamo-failed-*.png` y la adjunta como artefacto de GitHub Actions. Se ajustó un selector de la prueba de hover para evaluar una tarjeta elevada, no el contenedor deliberadamente plano de la tabla.


### Actualización automática del HTML conservado en caché

Se incorporó `version-check.js` con ejecución ligera al abrir la web. El HTML del artefacto publicado incluye ahora una marca `<meta name="gamo-build">` con el SHA exacto del despliegue. El detector consulta `build-info.txt` con `cache: "no-store"` y, si descubre una versión posterior, recarga **una sola vez** con un parámetro único `?gamo-build=...`. Conserva el fragmento de navegación (por ejemplo `#/reservas`) y no borra ni modifica las reservas de `localStorage`. Un fallo de conexión no interrumpe la aplicación; un marcador en `sessionStorage` previene bucles cuando la CDN todavía sirve HTML antiguo.

El workflow versiona automáticamente `version-check.js` junto con el resto de los scripts y CSS, y comprueba la marca del HTML público tras desplegar. Se añadieron `tests/version-check.test.js` (sincronización, ausencia de red, prevención de bucles, mantenimiento de ruta) y se ampliaron las pruebas del verificador Python. El detector se desactiva en entornos de desarrollo sin una marca de commit válida.

El mecanismo **no garantiza que el navegador reciba por primera vez el nuevo detector** mientras siga cargando un HTML de una versión que aún no lo incluía. En ese caso, abrir la URL con un parámetro único de consulta o una ventana privada sigue siendo el procedimiento de recuperación hasta que se actualice la caché del HTML.


### Compatibilidad de navegadores y evidencias visuales

El workflow `Browser QA - Gamo Transfer` mantiene la suite completa de Chromium e incorpora un trabajo paralelo en **Firefox y WebKit** (motor utilizado por Safari) con pruebas de navegación y vista móvil. Se selecciona el navegador mediante `GAMO_BROWSER` y se evitan argumentos de ejecución exclusivos de Chromium en los otros motores. Las capturas producidas ante fallos se adjuntan a GitHub Actions.

**Limitación:** usar WebKit sobre Linux sirve para detectar incompatibilidades del motor, pero no equivale a validar Safari real en macOS/iOS. Los resultados de estos trabajos seguirán pendientes hasta disponer de ejecuciones exitosas en el CI. Estos trabajos no bloquean el despliegue principal.


### Línea base de rendimiento en CI

La suite completa de Chromium incorpora `test_local_loading_baseline`. Produce el artefacto `gamo-loading-baseline.json` con los tiempos DOMContentLoaded/load, cantidad de recursos solicitados y bytes transferidos en el servidor HTTP local de pruebas. Se adjunta junto con las capturas visuales en cada ejecución de `Browser QA`.

Estas métricas sirven para comparar versiones en condiciones similares de CI. **No** representan mediciones de usuarios reales, resultados certificados de Core Web Vitals ni garantía de rendimiento en producción. El workflow sigue pendiente de resultado verificado en GitHub Actions.


### Estabilización de estilos del resumen

Se eliminó la antigua definición de contenedor con fondo, borde, radio y sombra en `.dashboard-zone`, junto con reglas heredadas de márgenes para densidad compacta y pantalla móvil que ya habían sido reemplazadas por la jerarquía editorial actual. Se preservaron las variables utilizadas por tarjetas y encabezados, los separadores neutros, los títulos sin numeración y la reducción de densidad. Se añadió una prueba de regresión para impedir que regrese la antigua tarjeta exterior.

La consolidación de otras reglas CSS requiere comparación visual real de antes/después. No se ha ejecutado una transformación masiva sin ese control, para evitar alterar el diseño aprobado.
