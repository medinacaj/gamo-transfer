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

Abrir el servidor en un navegador moderno. El HTML usa rutas relativas y navegación hash: funciona bajo `/gamo-app/` en GitHub Pages. Se recomienda servir por HTTP en vez de abrir como archivo para que el almacenamiento tenga un origen estable.

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

URL prevista: **https://medinacaj.github.io/gamo-app/**

El workflow `.github/workflows/pages.yml` valida el dominio, prepara únicamente los cuatro archivos públicos y despliega desde `main`. En GitHub, configurar **Settings → Pages → Source → GitHub Actions** si aún no está habilitado. Luego ejecutar el workflow o enviar cambios a `main`. La publicación depende de los permisos y ajustes del repositorio.

La preparación local y la existencia del workflow **no prueban que el sitio esté publicado**. Verificar que Actions termine correctamente y abrir la URL pública, comprobando navegación y una reserva. No se confirmó la publicación desde el entorno inicial: la política de red bloqueó la consulta a `medinacaj.github.io` y a la API de GitHub.

## Estructura y evolución

- `domain.js`: datos demo y reglas operativas/financieras, independientes del DOM; reutilizable desde pruebas Node.
- `app.js`: vistas, formularios, persistencia, impresión y exportaciones.
- `index.html` / `styles.css`: shell, diseño adaptable y estilos de impresión.
- `tests/`: pruebas de dominio y navegador.

Es una demostración local; no tiene autenticación real, permisos, auditoría inmutable, GPS, cobros bancarios, facturación fiscal ni servicios externos. Para producción, trasladar las reglas a un servidor con PostgreSQL, autenticación, roles, auditoría y validaciones transaccionales. Evaluar con profesionales las integraciones ARCA y de pagos antes de implementarlas.
