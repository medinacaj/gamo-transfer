# PROMPT MAESTRO — GAMO APP
## Plataforma de gestión de transporte ejecutivo y facturación internacional

### 1. OBJETIVO DEL PROYECTO

Actúa como arquitecto de software, desarrollador full-stack senior, diseñador UX/UI y especialista en gestión administrativa de empresas de transporte.

Desarrolla **GAMO APP**, una aplicación web moderna, profesional y funcional para presentar a un cliente del sector de transporte ejecutivo en Argentina.

**MODELO DE NEGOCIO FUNDAMENTAL:**

Soy un operador de transporte ubicado en Argentina. Presto servicios de traslados aeroportuarios, transporte ejecutivo y movilidad corporativa dentro del territorio argentino.

Mis clientes comerciales principales son **empresas extranjeras** que contratan mis servicios para trasladar pasajeros en Argentina.

La empresa extranjera solicita los servicios, recibe la facturación y realiza los pagos. Los pasajeros son los beneficiarios del traslado, pero normalmente no son quienes pagan.

Este modelo debe reflejarse en toda la aplicación.

### 2. REPOSITORIO

GitHub:

https://github.com/medinacaj/gamo-app

Nombre del producto: GAMO APP.

Revisa los archivos existentes antes de modificarlos.

Desarrolla un demo completamente funcional y prepara su publicación mediante GitHub Pages.

URL prevista:

https://medinacaj.github.io/gamo-app/

Utiliza preferentemente HTML, CSS y JavaScript, sin backend para el demo inicial, y persistencia mediante localStorage.

No declares que la publicación funciona sin verificarla.

### 3. DISEÑO VISUAL

Crea una interfaz empresarial de alta calidad, comparable con un SaaS comercial.

- Sidebar de navegación.
- Dashboard moderno.
- Tarjetas con indicadores.
- Tablas administrativas profesionales.
- Formularios y ventanas modales.
- Gráficos de facturación.
- Navegación responsive.
- Tipografía moderna.
- Iconografía consistente.
- Animaciones discretas.

Paleta sugerida:

- Azul marino: #111D31
- Turquesa: #21B8A3
- Blanco: #FFFFFF
- Gris claro: #F6F8FB

Idioma: español de Argentina.

Zona horaria: America/Argentina/Buenos_Aires.

Moneda operativa principal: ARS.

Monedas comerciales: ARS, USD y EUR, ampliables.

### 4. MÓDULOS PRINCIPALES

#### A. Dashboard

Mostrar:

- Viajes del día.
- Próximos servicios.
- Servicios sin conductor.
- Conductores disponibles.
- Vehículos operativos.
- Servicios completados.
- Ingresos estimados.
- Facturación pendiente.
- Cuentas por cobrar a empresas extranjeras.
- Pagos internacionales recibidos.
- Rentabilidad operativa.

Separar los valores por moneda cuando corresponda. Nunca sumar directamente importes en distintas monedas sin convertirlos a una moneda de reporte con un tipo de cambio identificado.

#### B. Reservas y viajes

Permitir crear, editar, consultar, asignar y finalizar reservas.

Campos:

- Identificador.
- Fecha y hora del servicio.
- Empresa extranjera contratante.
- Pasajero.
- Teléfono de contacto.
- Origen.
- Destino.
- Aeropuerto.
- Número de vuelo.
- Cantidad de pasajeros.
- Equipaje.
- Tipo de vehículo.
- Conductor.
- Precio pactado.
- Moneda.
- Estado operativo.
- Estado de facturación.
- Observaciones.

Un viaje debe estar vinculado a una empresa que lo contrata y a uno o varios pasajeros.

Distinguir claramente:

**EMPRESA CONTRATANTE → RESERVA → PASAJERO → SERVICIO → FACTURACIÓN → COBRO.**

Implementar estados de viaje y facturación independientes.

#### C. Empresas extranjeras

Este módulo es fundamental.

Cada cliente corporativo debe tener su propia ficha:

- Razón social.
- Nombre comercial.
- País.
- Dirección fiscal.
- Número de identificación fiscal extranjero.
- Persona de contacto.
- Correo administrativo.
- Correo de facturación.
- Teléfono.
- Moneda de contratación.
- Condiciones de pago.
- Plazo de crédito.
- Lista de tarifas acordadas.
- Servicios realizados.
- Facturas registradas.
- Pagos recibidos.
- Saldo pendiente.

Permitir contratos y tarifas diferentes por empresa.

Ejemplo: una empresa estadounidense puede tener tarifas pactadas en USD y otra europea en EUR.

No exigir CUIT argentino a una empresa extranjera cuando no corresponda.

#### D. Conductores

Administrar:

- Ficha de conductor.
- Disponibilidad.
- Licencia y vencimientos.
- Servicios asignados.
- Servicios completados.
- Gastos.
- Pagos por servicio.
- Comisiones.
- Liquidaciones pendientes.

#### E. Flota

Registrar:

- Patente.
- Marca.
- Modelo.
- Categoría.
- Capacidad.
- Kilometraje.
- Disponibilidad.
- Vencimientos.
- Mantenimiento.
- Gastos operativos.

Detectar incompatibilidades evidentes de asignación.

#### F. Agenda y despacho

Crear agenda diaria y semanal.

Permitir asignar conductor y vehículo.

Mostrar alertas por reservas sin asignación, conflictos de horarios, vehículos fuera de servicio y servicios próximos.

Los horarios deben utilizar la hora local argentina.

### 5. MÓDULO CENTRAL: FACTURACIÓN A EMPRESAS EXTRANJERAS

Desarrollar una sección denominada **Facturación internacional**.

Debe permitir seleccionar una empresa extranjera y visualizar todos los viajes realizados para ella que estén pendientes de facturar.

El operador podrá seleccionar varios servicios y preparar una única factura comercial o liquidación consolidada, respetando los acuerdos de cada cliente.

Ejemplo:

**Cliente:** Global Mobility Services LLC  
**País:** Estados Unidos  
**Período:** Octubre 2026  
**Moneda:** USD

| Servicio | Pasajero | Importe |
|---|---|---:|
| Ezeiza → Palermo | Pasajero A | USD 85 |
| Aeroparque → Recoleta | Pasajero B | USD 45 |
| Puerto Madero → Ezeiza | Pasajero C | USD 75 |
| **Total** | | **USD 205** |

Implementar:

1. Selección de empresa extranjera.
2. Selección del período.
3. Listado de servicios pendientes.
4. Selección múltiple.
5. Totalización por moneda.
6. Preparación de factura o resumen comercial.
7. Registro de número y fecha de comprobante.
8. Fecha de vencimiento.
9. Estado de emisión.
10. Estado de cobro.
11. Historial de documentos y pagos.
12. Exportación a PDF o impresión profesional.

La facturación consolidada debe evitar duplicar servicios ya incluidos en documentos emitidos, salvo correcciones registradas.

No emitir comprobantes fiscales reales desde el demo.

**Importante:** no asumir que todo servicio facturado a una empresa extranjera califica como exportación de servicios ni asignar automáticamente factura E. Diseñar un campo configurable de tipo de comprobante y estado fiscal, sujeto a validación por el contador y las reglas de ARCA.

### 6. MULTIMONEDA Y TIPO DE CAMBIO

GAMO APP debe contemplar que:

- Los clientes pueden contratar en USD o EUR.
- Los gastos operativos suelen producirse en ARS.
- Una factura puede expresarse en moneda extranjera.
- El pago puede recibirse en una moneda distinta.
- Pueden existir diferencias de cambio y comisiones.

Registrar:

- Moneda de contratación.
- Moneda de facturación.
- Moneda de pago.
- Tipo de cambio utilizado.
- Fecha del tipo de cambio.
- Fuente o criterio de cotización.
- Importe original.
- Equivalente en ARS.
- Comisiones bancarias.
- Diferencia de cambio cuando corresponda.

Guardar el tipo de cambio histórico asociado a cada operación.

No modificar valores históricos si posteriormente cambia la cotización.

Usar tipos de cambio **ficticios y claramente identificados** en el demo; no presentarlos como cotizaciones actuales.

### 7. CUENTAS POR COBRAR INTERNACIONALES

Crear un módulo específico para controlar las deudas de las empresas extranjeras.

Mostrar por cliente:

- Facturación emitida.
- Facturación pendiente.
- Pagos recibidos.
- Pagos parciales.
- Facturas vencidas.
- Saldos por moneda.
- Antigüedad de deuda.
- Comisiones de cobro.

Estados:

- Pendiente de facturación.
- Preparada.
- Emitida.
- Pendiente de cobro.
- Parcialmente pagada.
- Pagada.
- Vencida.
- Anulada.

Los estados del comprobante y del pago deben mantenerse separados internamente.

Permitir registrar pagos mediante transferencia internacional, transferencia local, plataforma de pagos u otros medios.

Una factura puede tener varios pagos asociados.

Mostrar deudas vencidas por rangos de antigüedad.

### 8. RENTABILIDAD OPERATIVA

Calcular para cada servicio:

- Tarifa facturada al cliente.
- Moneda.
- Equivalente en ARS.
- Costo del conductor.
- Combustible.
- Peajes.
- Estacionamiento.
- Otros gastos.
- Margen estimado.

Mostrar rentabilidad por:

- Viaje.
- Conductor.
- Vehículo.
- Empresa extranjera.
- Mes.

Separar ingresos, cobros y rentabilidad.

No confundir importes facturados con dinero efectivamente recibido.

### 9. REPORTES GERENCIALES

Crear informes de:

- Ventas por empresa extranjera.
- Facturación por país.
- Facturación por moneda.
- Servicios por período.
- Cuentas por cobrar.
- Facturas vencidas.
- Rentabilidad por cliente.
- Rentabilidad por conductor.
- Producción por vehículo.
- Evolución mensual de ingresos.

Permitir exportar datos CSV compatibles con Excel.

### 10. DATOS DEMOSTRATIVOS

Cargar información ficticia y consistente:

- 6 conductores.
- 8 vehículos.
- 25 a 30 reservas.
- 8 empresas extranjeras de distintos países.
- Clientes particulares secundarios.
- Servicios aeroportuarios en Ezeiza y Aeroparque.
- Traslados ejecutivos en CABA y alrededores.
- Facturas comerciales en USD y EUR.
- Servicios todavía no facturados.
- Facturas pagadas.
- Facturas parcialmente pagadas.
- Cuentas vencidas.
- Gastos en ARS.

No utilizar información personal real.

Los datos deben mantener integridad referencial y alimentar todos los indicadores.

### 11. INTERACTIVIDAD

Todas las acciones principales deben funcionar:

- Crear y editar reservas.
- Asignar conductores.
- Cambiar estados.
- Consultar clientes extranjeros.
- Preparar una factura consolidada.
- Registrar pagos simulados.
- Calcular saldos.
- Consultar diferencias de moneda.
- Buscar y filtrar.
- Exportar información.
- Actualizar indicadores.
- Conservar información en localStorage.
- Restaurar los datos iniciales mediante una acción explícita.

No incluir botones de apariencia funcional que no hagan nada.

### 12. SEGURIDAD Y LIMITACIONES

El producto es un demo comercial.

No incluir autenticación falsa, integración fiscal ficticiamente presentada como real, transacciones bancarias reales ni seguimiento GPS inexistente.

No introducir credenciales o secretos.

Identificar visiblemente el entorno como DEMO.

Organizar el código para permitir en una fase futura incorporar base de datos PostgreSQL, autenticación, roles, auditoría e integración con ARCA y proveedores de pagos, después de validar sus requisitos.

### 13. PRUEBAS

Verificar:

- Navegación entre módulos.
- Responsive móvil y escritorio.
- Creación y edición de reservas.
- Relación reserva–empresa–pasajero.
- Facturación consolidada sin duplicaciones.
- Pagos parciales.
- Cálculos por moneda.
- Saldos pendientes.
- Persistencia local.
- Exportaciones.
- Restauración de datos.
- Ausencia de errores de JavaScript.
- Funcionamiento en GitHub Pages.

Corregir los problemas detectados.

### 14. ENTREGA FINAL

Implementar directamente en:

https://github.com/medinacaj/gamo-app

Entregar el código completo, README actualizado, demo navegable y resumen de funcionalidades.

Preparar GitHub Pages y verificar el enlace cuando sea posible.

**OBJETIVO FINAL:**

Demostrar cómo un transportista argentino puede administrar viajes, conductores y vehículos, prestar servicios a empresas internacionales, consolidar sus traslados por cliente, registrar facturas en moneda extranjera, controlar los cobros internacionales y conocer la rentabilidad real del negocio.

GAMO APP debe transmitir la imagen de una plataforma profesional de control operativo y financiero para transporte ejecutivo B2B internacional.

No entregar únicamente un diseño visual. Construir una experiencia funcional, coherente y lista para presentar al cliente.