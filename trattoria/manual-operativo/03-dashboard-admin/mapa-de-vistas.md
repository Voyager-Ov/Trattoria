# Mapa de vistas

## Objetivo

Tener una vista completa de las pantallas del panel admin, para que cualquier persona entienda que existe hoy en la UI y desde que ruta se usa.

## Vista marco

- Layout base: `/admin/dashboard`
- Acceso permitido: solo usuarios con rol `ADMIN`
- Navegacion principal: `Dashboard`, `Pedidos`, `Menu y Productos`, `Insumos`, `Empleados`, `Reportes`
- Navegacion de cuenta: `Mi Perfil`, `Configuracion`
- Busqueda global en header: busca pedidos, productos y empleados con minimo 2 caracteres

## Vistas principales

### 1. Dashboard

- Ruta: `/admin/dashboard`
- Objetivo: dar una lectura rapida del negocio del dia
- Contenido principal:
  - KPI de ventas totales, ventas del dia, pedidos del dia, pedidos pendientes, clientes activos y meta mensual
  - grafico de ingresos semanales
  - actividad reciente de pedidos
- Uso tipico: entrar, revisar estado general y saltar al modulo operativo siguiente

### 2. Pedidos

- Ruta: `/admin/dashboard/pedidos`
- Objetivo: operar pedidos manuales y pedidos entrantes
- Casos de uso relacionados:
  - crear pedido manual
  - cobrar pedido
  - cancelar pedido
  - revisar detalle de pedido
- Referencias:
  - [Crear pedido manual](../04-pedidos/crear-pedido-manual.md)
  - [Cobrar pedido](../04-pedidos/cobrar-pedido.md)
  - [Cancelar pedido](../04-pedidos/cancelar-pedido.md)

### 3. Menu y Productos

- Ruta base: `/admin/dashboard/productos`
- Objetivo: administrar productos, categorias y promociones
- Subvistas visibles desde la navegacion o rutas internas:
  - `/admin/dashboard/productos`
  - `/admin/dashboard/productos/nuevo`
  - `/admin/dashboard/productos/[id]`
  - `/admin/dashboard/productos/[id]/editar`
  - `/admin/dashboard/productos/categorias`
  - `/admin/dashboard/productos/promociones/nueva`
  - `/admin/dashboard/productos/promociones/[id]`
  - `/admin/dashboard/productos/promociones/[id]/editar`
- Referencias:
  - [Crear categoria](../06-categorias/crear-categoria.md)
  - [Crear producto con receta](../07-productos/crear-producto-con-receta.md)
  - [Crear promocion con productos](../08-promociones/crear-promocion-con-productos.md)

### 4. Insumos

- Ruta base: `/admin/dashboard/insumos`
- Objetivo: administrar stock e insumos operativos
- Subvistas principales:
  - `/admin/dashboard/insumos`
  - `/admin/dashboard/insumos/nuevo`
  - `/admin/dashboard/insumos/stock`
  - `/admin/dashboard/insumos/[id]`
  - `/admin/dashboard/insumos/[id]/editar`
- Referencias:
  - [Crear insumo](../05-insumos/crear-insumo.md)
  - [Registrar stock](../05-insumos/registrar-stock.md)

### 5. Empleados

- Ruta: `/admin/dashboard/usuarios`
- Objetivo: gestionar accesos internos
- Contenido principal:
  - metricas de personal total, activos, admins y staff
  - buscador por nombre o mail
  - filtro por rol
  - alta de empleado
  - cambio de rol
  - activacion o suspension de acceso

### 6. Reportes

- Ruta base: `/admin/dashboard/reportes`
- Objetivo: concentrar analitica operativa y financiera
- Subvistas directas:
  - `/admin/dashboard/reportes`
  - `/admin/dashboard/reportes/ingresos`
  - `/admin/dashboard/reportes/egresos`
- Secciones internas del dashboard de reportes:
  - `Resumen`
  - `Financiero`
  - `Productos`
  - `Pedidos`
  - `Inventario`
  - `Rentabilidad`

### 7. Mi Perfil

- Ruta: `/admin/dashboard/perfil`
- Objetivo: mantener datos personales, seguridad y cuentas vinculadas
- Contenido principal:
  - informacion personal
  - seguridad
  - cuentas vinculadas

### 8. Configuracion

- Ruta: `/admin/dashboard/configuracion`
- Objetivo: administrar parametros operativos del negocio
- Secciones visibles:
  - `General`
  - `Delivery`
  - `Pagos`
  - `Horarios`
  - `Objetivos`
- Configuraciones cargadas desde servidor:
  - perfil del negocio
  - horarios y dias cerrados
  - metodos de pago
  - integracion Mercado Pago
  - ajustes operativos
  - WhatsApp
  - delivery
  - meta mensual

## Resultado esperado

Queda claro que el panel admin no es una sola pantalla sino un conjunto de vistas conectadas por una navegacion comun y protegidas por rol.
