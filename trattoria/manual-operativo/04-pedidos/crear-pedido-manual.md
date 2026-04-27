# Crear pedido manual

## Objetivo

Registrar un pedido interno desde el panel admin para ventas de mostrador, telefono o carga manual.

## Rol y ruta

- Rol: `ADMIN`
- Ruta inicial: `/admin/dashboard/pedidos`
- Ruta esperada al terminar: pedido visible en el listado de pedidos

## Antes de empezar

- Haber completado [Iniciar sesion](../01-acceso/iniciar-sesion.md).
- Tener al menos un producto o promocion visible en el buscador del formulario.
- Si no aparecen items en el buscador, revisa [Crear producto con receta](../07-productos/crear-producto-con-receta.md) y [Crear promocion con productos](../08-promociones/crear-promocion-con-productos.md).

## Pasos exactos

1. Entrar a `/admin/dashboard/pedidos`.
2. Verificar que exista el buscador `Buscar por # de orden o cliente`.
3. Hacer click en `Nuevo Pedido`.
4. Esperar la ruta `/admin/dashboard/pedidos/nuevo`.
5. En la seccion de cliente, buscar un cliente existente o escribir el nombre manualmente.
6. Si cargas el cliente manual, completar `Telefono`.
7. Si aplica, completar `Direccion`.
8. En `Buscar Productos`, escribir un termino como `pizza` o `bebida`.
9. Elegir si vas a cargar `Productos` o `Promociones`.
10. Hacer click sobre una tarjeta para agregarla al carrito interno.
11. Revisar el bloque `Carrito` y ajustar cantidades si hace falta.
12. Confirmar el total.
13. Hacer click en `Confirmar Pedido`.
14. Esperar el toast `Pedido creado correctamente`.
15. Verificar que la app vuelva al listado y que el pedido se pueda encontrar por nombre o numero.

## Resultado esperado

El pedido queda creado en el sistema, aparece en el listado y puede usarse despues para cobrar, cancelar o seguir el estado.

## Verificacion rapida

- El formulario deja agregar productos al carrito interno.
- El total cambia cuando agregas o modificas cantidades.
- Despues de confirmar, vuelves al listado de pedidos.
- El pedido nuevo se encuentra usando el buscador del listado.

## Si algo no coincide

- Si el carrito no acepta items, revisa que el buscador de productos devuelva resultados.
- Si no encuentras el pedido al volver al listado, usa el nombre del cliente o recarga con `Refrescar pedidos`.
- Si el alta falla, anota si el problema fue en cliente, carrito o confirmacion final.

## Referencias a otros flujos

- [Cancelar pedido](cancelar-pedido.md)
- [Cobrar pedido](cobrar-pedido.md)
- [Crear producto con receta](../07-productos/crear-producto-con-receta.md)
- [Crear promocion con productos](../08-promociones/crear-promocion-con-productos.md)
