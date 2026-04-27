# Reglas de negocio

## Objetivo

Resumir las reglas transversales del panel admin para testing, soporte y futuras ampliaciones.

## Acceso y permisos

- Todo `/admin` requiere rol `ADMIN`.
- Un usuario sin sesion valida es redirigido a logout y luego a login.
- Un usuario `EMPLEADO` no puede entrar al panel admin y es redirigido a `/empleado`.
- Por diseno actual, un `ADMIN` tampoco usa el portal de empleado.

## Reglas del dashboard inicial

- Las metricas sensibles del dashboard son solo para `ADMIN`.
- `Ventas totales` y `ventas por periodo` consideran solo pedidos `cobrados`, no cancelados y no borrados.
- El estado de cobro manda sobre el ingreso. Un pedido cobrado cuenta como ingreso aunque no este finalizado.
- `Pedidos pendientes` cuenta pedidos en `RECIBIDO`, `PENDIENTE` y `EN_PREPARACION`.
- La meta mensual puede medirse por `revenue` o por `profit`.
- Si la meta mensual es `profit`, el sistema resta egresos del mes al total vendido del mes.

## Reglas de reportes

- El dashboard de reportes guarda el preset de fechas en `localStorage`.
- La vista de ingresos muestra ventas cobradas y permite filtrar por `Hoy`, `Ultimos 7 dias`, `Ultimos 30 dias` o historico completo.
- La vista de egresos trabaja solo con egresos no eliminados logicamente.
- El listado de egresos usa borrado logico mediante `deletedAt`.
- Crear, editar y eliminar egresos revalida tanto `/admin/dashboard/reportes/egresos` como `/admin/dashboard/reportes`.

## Reglas de egresos

- Solo `ADMIN` puede leer, crear, editar y eliminar egresos.
- Cada egreso recibe numeracion secuencial con prefijo `E-`.
- Todo alta, modificacion o baja de egreso genera auditoria.
- Los egresos se agrupan por categoria para estadisticas.
- Una compra de insumos puede generar un egreso automatico en categoria `INSUMOS`.

## Reglas de configuracion

- Solo `ADMIN` puede guardar configuraciones del negocio.
- La configuracion se valida por clave antes de persistir.
- `Mercado Pago` no guarda secreto en base de datos.
- El secreto de Mercado Pago vive en variable de entorno `MERCADOPAGO_ACCESS_TOKEN`.
- Los cambios de configuracion revalidan:
  - `/admin/dashboard/configuracion`
  - `/admin/dashboard/pedidos`
  - `/`
- Los metodos de pago son configurables y no deben quedar completamente hardcodeados.
- `EFECTIVO` funciona como metodo base y debe seguir existiendo en la operacion actual.

## Reglas de busqueda global

- La busqueda del header se activa con 2 o mas caracteres.
- Busca sobre pedidos, productos y empleados.
- Los resultados llevan al listado filtrado del modulo correspondiente.
- Tiene shortcut `Ctrl+K` o `Cmd+K`.

## Reglas de usuarios internos

- La pantalla de empleados permite alta de usuario interno.
- Un usuario puede cambiar entre rol `ADMIN` y `EMPLEADO`.
- Un usuario puede pasar entre `ACTIVO` e `INACTIVO`.
- La vista trabaja sobre usuarios no borrados logicamente.

## Regla clave sobre caja

- En Notion existe una especificacion completa de `Caja` por usuario.
- En el repo actual no existe aun una ruta `/caja`, ni un modelo `Caja`, ni una asociacion real de cobros a caja.
- Hoy el sistema implementado resuelve solo partes del problema desde:
  - cobro de pedidos
  - reportes de ingresos
  - reportes de egresos
  - configuracion de metodos de pago

## Resultado esperado

Estas reglas sirven como contrato operativo minimo para documentar y probar el panel admin sin mezclar funcionalidades ya implementadas con funcionalidades solo especificadas.
