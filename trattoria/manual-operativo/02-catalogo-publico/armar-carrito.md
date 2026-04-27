# Armar carrito

## Objetivo

Agregar productos desde una categoria, revisar el carrito y ajustar cantidades antes del checkout.

## Rol y ruta

- Rol: publico, sin login
- Ruta inicial sugerida: `/categoria/[slug]`
- Ruta esperada al terminar: carrito con al menos un item listo para continuar

## Antes de empezar

- Haber completado [Recorrer categorias](recorrer-categorias.md).
- Estar dentro de una categoria que tenga productos visibles.

## Pasos exactos

1. Ubicar un producto dentro de la categoria.
2. Hacer click en el boton de agregar del producto.
3. Esperar el aviso de exito `agregado al carrito`.
4. Hacer click en el boton flotante `Tu Carrito`.
5. Verificar que se abra el panel lateral `Mi Pedido`.
6. Confirmar que el item agregado aparezca con cantidad `1`.
7. Usar el boton `+` para subir la cantidad.
8. Usar el boton `-` para volver a bajarla.
9. Usar el icono de papelera para eliminar el item y revisar el estado `Tu carrito esta vacio`.
10. Volver a agregar un producto para dejar el carrito listo.
11. Verificar que aparezca el boton `Continuar Pedido`.

## Resultado esperado

El carrito refleja altas, bajas y eliminacion de items sin recargar la pagina, y deja listo el paso hacia el checkout.

## Verificacion rapida

- Al agregar un producto cambia el contador del carrito.
- El total del carrito cambia cuando cambias la cantidad.
- Si eliminas el ultimo item, aparece el estado vacio.
- Si hay items, aparece `Continuar Pedido`.

## Si algo no coincide

- Si el producto no se agrega, prueba con otro item de la misma categoria.
- Si el carrito no abre, recarga la pagina y vuelve a tocar `Tu Carrito`.
- Si las cantidades no cambian, anota el nombre del producto y la accion exacta que fallo.

## Referencias a otros flujos

- [Recorrer categorias](recorrer-categorias.md)
- [Confirmar pedido por WhatsApp](confirmar-pedido-por-whatsapp.md)
