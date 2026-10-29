# Gamo APP — Demo de gestión de transporte ejecutivo

Demo interactiva para presentar a un cliente una plataforma de reservas, despacho, flota, clientes y finanzas de transporte ejecutivo en **Argentina**.

## Vista en línea
Una vez habilitado GitHub Pages: `https://medinacaj.github.io/gamo-app/`

## Funciones del demo
- Tablero con indicadores y próximos servicios.
- Reservas: crear, editar, buscar, filtrar y cambiar el estado.
- Agenda de servicios por día.
- Conductores y asignaciones.
- Flota y estado de vehículos.
- Clientes corporativos y particulares.
- Finanzas: ingresos, saldos por cobrar, gastos estimados y cobros.
- Exportación CSV de reservas.
- Diseño adaptado a escritorio, tablet y móvil.

## Características técnicas
- HTML, CSS y JavaScript puros: no necesita instalación ni compilación.
- Sin dependencias externas.
- Los cambios se guardan **solo en el navegador** mediante `localStorage`.
- Todos los nombres, reservas, tarifas y resultados son **datos ficticios para demostración**. No representa un sistema de producción.
- Moneda: ARS. Horario: Buenos Aires (America/Argentina/Buenos_Aires).

## Publicación en GitHub Pages
1. Entrar a **Settings → Pages** en este repositorio.
2. En **Build and deployment**, elegir **Deploy from a branch**.
3. Seleccionar rama **main** y carpeta **/(root)**, luego guardar.
4. Abrir `https://medinacaj.github.io/gamo-app/` una vez que GitHub confirme la publicación.

## Uso local
Abrir `index.html` en el navegador (o levantar un servidor estático con `python3 -m http.server 8000`).

## Alcance y límites
Es una demostración de interfaz y flujos operativos: **no** tiene inicio de sesión real, backend, sincronización entre dispositivos, seguimiento GPS, datos reales de vuelos, integración de pagos ni facturación fiscal. No ingresar datos personales reales. Para producción se requerirán autenticación, permisos, base de datos, validaciones de servidor, respaldos y cumplimiento normativo argentino.

© Gamo APP — Demo conceptual.
