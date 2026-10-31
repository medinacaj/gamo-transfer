# GAMO TRANSFER · Seguridad y accesos para producción

> Estado: **plan técnico preparado, NO desplegado**. La aplicación actual es una demostración estática en GitHub Pages, con reservas ficticias en `localStorage`. No debe usarse para información personal ni financiera de producción.

## Limitación de seguridad actual

- El repositorio `medinacaj/gamo-transfer` es **público**. Los archivos `agency-reports.js` contienen importes históricos de GP Travel y Grupo Summa que fueron incorporados para la primera fase. Cualquier visitante puede consultar sus fuentes y datos.
- Una pantalla de inicio de sesión añadida al HTML **no restringiría** los archivos públicos. Por ese motivo no se implementa un login cosmético ni un listado de usuarios en JavaScript.
- La persistencia actual es local al navegador: no existen sesiones compartidas, permisos efectivos, bloqueo de acceso, auditoría inmutable ni respaldo remoto.
- Las métricas de reservas, facturas y cobros permanecen ficticias y deben mostrarse siempre separadas de los informes históricos.

## Modelo de acceso recomendado

| Rol | Consultar servicios | Crear/editar servicios | Cobros/facturas | Tarifas | Administrar usuarios |
| --- | --- | --- | --- | --- | --- |
| Administrador | Sí | Sí | Sí | Sí | Sí |
| Operaciones | Sí | Sí | Solo lectura según permiso | Consultar autorizadas | No |
| Finanzas | Sí | No | Sí | Sí | No |
| Consulta/Agencia | Solo los de su agencia | No | Solo documentos propios autorizados | No | No |

La autorización debe validarse en el **servidor o directamente en PostgreSQL con RLS**. Nunca confiar en un rol declarado por el navegador, en `localStorage` ni en el metadato editable por el usuario.

## Arquitectura propuesta

1. Crear un proyecto de backend **exclusivo de Gamo Transfer**, diferenciado de otros proyectos. El dueño debe elegir la organización y aceptar eventuales costos. **No se ha creado ni configurado ninguno durante esta fase.**
2. Implementar autenticación mediante Supabase Auth, con sesiones reales, recuperación de acceso y MFA opcional para administradores.
3. Crear tablas `organizations`, `memberships`, `agencies`, `bookings`, `drivers`, `vehicles`, `invoices`, `payments`, `report_snapshots`, `audit_log`. Todas las tablas de negocio incluyen `organization_id`; las de agencia incluyen `agency_id` cuando aplique.
4. Activar **RLS en toda tabla expuesta** desde el primer día y otorgar acceso solo a usuarios autenticados autorizados. Restringir lectura por organización y, en clientes externos, por agencia; escritura por rol.
5. Almacenar la asignación de roles en una tabla protegida o en `app_metadata` mantenido por el backend, **nunca** en `user_metadata`. Prohibir que un usuario modifique su rol u organización.
6. Importar servicios históricos con referencia documental y conciliación; no confundir sus importes con facturas y cobros. Registrar fuente, fecha, revisión, autor de la importación y estado conciliado/no conciliado.
7. Migrar las reservas existentes que realmente se quieran conservar, retirarlas de archivos estáticos y eliminar la exposición pública de datos comerciales **antes de poner el login de producción**.
8. Mantener una auditoría de mutaciones desde servidor con ID del actor, instante, entidad y operación; las modificaciones a cobros y facturas deben ser trazables.
9. Habilitar copias automáticas, políticas de retención, HTTPS, pruebas de restauración y alertas por accesos anómalos.
10. Revalidar prácticas legales y contables locales (Argentina) antes de emitir documentos fiscales. La aplicación actual no genera facturas válidas fiscalmente.

## Reglas de aceptación para la etapa de producción

- Un usuario sin sesión recibe **0 filas** de las APIs de servicios, tarifas y clientes.
- Un usuario de una agencia no puede consultar identificadores de otra agencia (incluidos accesos directos por URL/ID).
- Un operador no puede elevar sus permisos desde el navegador, alterar precios históricos protegidos ni emitir documentos financieros sin autorización.
- Una acción denegada no modifica la base de datos.
- Una sesión revocada no puede seguir operando con permisos efectivos.
- La interfaz no introduce componentes que prometan seguridad mientras la API o el almacenamiento permanezcan públicos.

## Estado de la primera fase actual

**Implementado:** interfaz de módulos, controles visuales, filtros y reportes de referencia.

**Pendiente de conexión de backend:** login verdadero, cuentas por usuario, roles y permisos efectivos, importación protegida, sincronización y auditoría.

No se ha conectado ni modificado ninguna base de datos de otro proyecto. Este documento es una guía de implementación y no equivale a una revisión de seguridad en producción.
