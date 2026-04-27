# Cancelar pedido

## Objetivo

Cancelar un pedido existente, registrar el motivo y decidir si el impacto de stock se toma como merma.

## Rol y ruta

- Rol: `ADMIN`
- Ruta inicial: `/admin/dashboard/pedidos`
- Ruta esperada al terminar: pedido con estado `Cancelado`

## Antes de empezar

- Haber completado [Iniciar sesion](../01-acceso/iniciar-sesion.md).
- Tener identificado un pedido a cancelar.
- Si necesitas uno para practicar, primero usa [Crear pedido manual](crear-pedido-manual.md).

## Pasos exactos

1. Entrar a `/admin/dashboard/pedidos`.
2. Buscar el pedido con `Buscar por # de orden o cliente`.
3. En la fila del pedido, ubicar el badge de estado actual.
4. Hacer click sobre el estado del pedido para abrir el selector.
5. Elegir la opcion `Cancelado`.
6. Esperar que se abra el panel `Cancelar Pedido`.
7. Completar `Motivo de Cancelacion`.
8. Si quieres registrar perdida de inventario, activar `Descontar insumos (Merma)`.
9. Hacer click en `Confirmar Cancelacion`.
10. Esperar el mensaje de exito.
11. Verificar en el listado que el pedido quede como `Cancelado`.

## Resultado esperado

El pedido pasa a estado cancelado, queda guardado el motivo y el sistema aplica la politica de stock elegida al momento de cancelar.

## Verificacion rapida

- El panel de cancelacion no deja confirmar sin motivo.
- El estado final del pedido queda como `Cancelado`.
- La cancelacion se puede volver a ver desde el listado o el detalle del pedido.

## Si algo no coincide

- Si no se abre el panel, intenta la misma accion desde `Ver detalle completo`.
- Si el pedido no cambia de estado, recarga el listado antes de volver a intentar.
- Si no estas seguro sobre el switch de merma, no lo actives hasta validar el criterio operativo.

## Referencias a otros flujos

- [Crear pedido manual](crear-pedido-manual.md)
- [Cobrar pedido](cobrar-pedido.md)
- [Registrar stock](../05-insumos/registrar-stock.md)
