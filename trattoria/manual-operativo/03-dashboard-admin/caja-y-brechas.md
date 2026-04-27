# Caja y brechas

## Objetivo

Dejar documentado que la funcionalidad de caja ya esta especificada en Notion, pero no esta cerrada como modulo implementado dentro del panel admin actual.

## Fuente funcional

- Notion: `Documentacion sistema de cajas`
- Paginas revisadas:
  - `Caja`
  - `Metodos de Pago`
  - `Cierre de Caja`
  - `Modelo de datos`
  - `Flujos de trabajo`

## Lo que Notion define

- Debe existir una caja por usuario o sesion operativa.
- Un usuario puede tener solo una caja abierta activa.
- Si cambia de dispositivo, debe seguir usando la misma caja abierta.
- Puede haber varias cajas abiertas al mismo tiempo si pertenecen a usuarios distintos.
- Todo cobro debe quedar asociado a una caja abierta.
- El sistema debe permitir registrar egresos desde caja reutilizando el modelo de egresos existente.
- El cierre de caja debe calcular efectivo esperado, efectivo contado y diferencia.
- Si hay diferencia, debe ser obligatorio dejar observacion.
- Los eventos de apertura, cobro, egreso, cancelacion y cierre deben quedar auditados.

## Lo que hoy si existe en el repo

- Cobro de pedidos.
- Reporte de ingresos.
- Reporte de egresos.
- Configuracion de metodos de pago.
- Auditoria de egresos.
- Soporte de pago en efectivo dentro de flujos de pedido.

## Lo que no existe aun como implementacion cerrada

- Ruta `/caja`.
- Modelo Prisma `Caja`, `CajaUsuario` o similar.
- Entidad de `Cobro` separada con `cajaId`.
- Apertura y cierre de caja por usuario.
- Arqueo con diferencia.
- Historial de caja.
- Asociacion real entre cobro y caja abierta.

## Conclusion operativa

- Si hoy documentamos el panel admin real, `Caja` debe aparecer como funcionalidad planificada o especificada, no como modulo terminado.
- Si hoy documentamos el comportamiento financiero real, hay que hablar de `Pedidos + Ingresos + Egresos + Configuracion de pagos`.
- Si mas adelante se implementa el modulo `Caja`, esta carpeta debe actualizarse para separar:
  - flujo financiero actual
  - flujo de caja por sesion

## Impacto en testing manual

- No corresponde pedir al tester que abra o cierre caja en el sistema actual.
- Si corresponde validar:
  - cobro de pedido
  - metodo de pago aplicado
  - reflejo del cobro en ingresos
  - alta de egreso y reflejo en reportes
  - configuracion de metodos de pago
