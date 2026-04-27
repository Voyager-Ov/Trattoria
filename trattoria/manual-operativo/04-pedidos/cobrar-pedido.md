# Cobrar pedido

## Objetivo

Marcar un pedido como cobrado y dejar registrado el metodo de pago usado en caja.

## Rol y ruta

- Rol: `ADMIN`
- Ruta inicial: `/admin/dashboard/pedidos`
- Ruta esperada al terminar: pedido con badge `Cobrado`

## Antes de empezar

- Haber completado [Iniciar sesion](../01-acceso/iniciar-sesion.md).
- Tener un pedido pendiente de cobro.
- Si no tienes uno disponible, primero usa [Crear pedido manual](crear-pedido-manual.md).

## Pasos exactos

1. Entrar a `/admin/dashboard/pedidos`.
2. Buscar el pedido que todavia figure como `Pendiente` en pago.
3. En la fila del pedido, hacer click en `Cobrar`.
4. Esperar el panel `Cobrar Pedido`.
5. Elegir el `Metodo de Pago` real usado en la venta.
6. Hacer click en `Confirmar Cobro`.
7. Esperar el mensaje de exito.
8. Verificar que el pedido muestre el badge `Cobrado`.

## Resultado esperado

El pedido queda marcado como cobrado y no deberia volver a ofrecer el boton `Cobrar` como accion principal.

## Verificacion rapida

- El panel de cobro muestra metodos de pago activos.
- Despues de confirmar, el pedido cambia a `Cobrado`.
- El mismo pedido deja de verse como pendiente de pago.

## Si algo no coincide

- Si el boton `Cobrar` no aparece, abre `Detalles` y revisa si ya fue cobrado.
- Si no hay metodos de pago en el panel, revisa la configuracion interna antes de seguir.
- Si el cambio no se refleja al instante, recarga el listado.

## Referencias a otros flujos

- [Crear pedido manual](crear-pedido-manual.md)
- [Cancelar pedido](cancelar-pedido.md)
