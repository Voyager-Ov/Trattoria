# Crear promocion con productos

![Nueva promocion](../assets/07-nueva-promocion.png)

## Objetivo

Crear una promocion nueva seleccionando productos existentes, cantidades y precio final de oferta.

## Rol y ruta

- Rol: `ADMIN`
- Ruta inicial: `/admin/dashboard/productos`
- Ruta esperada al terminar: promocion visible dentro de `Menu y Productos`

## Antes de empezar

- Haber completado [Iniciar sesion](../01-acceso/iniciar-sesion.md).
- Tener productos existentes para combinar en la oferta.
- Si quieres clasificar la promo dentro de una categoria especial, tener esa categoria creada.

## Pasos exactos

1. Entrar a `/admin/dashboard/productos`.
2. Hacer click en `Nueva Promocion`.
3. Esperar la ruta `/admin/dashboard/productos/promociones/nueva`.
4. Completar `Nombre de la Promo`.
5. Completar `Descripcion`.
6. Si quieres, cargar una imagen en `Imagen Publicitaria`.
7. Definir `Fecha Desde` y `Fecha Hasta` si la promo tiene vigencia acotada.
8. Marcar dias especificos si la promo solo aplica algunos dias.
9. En `Seleccion de Productos`, buscar un producto por nombre si hace falta.
10. Hacer click sobre cada tarjeta de producto que quieras incluir.
11. Ajustar la cantidad de cada producto con los controles `+` y `-`.
12. Si vas a usar categorias para agrupar la promo, seleccionarlas en `Categorias de Promo`.
13. Completar `Precio de Venta Sugerido`.
14. Revisar el bloque final con `Valor Total Productos`, ahorro y porcentaje.
15. Hacer click en `Publicar Oferta`.
16. Esperar el mensaje `Promocion creada satisfactoriamente`.
17. Verificar que vuelvas al listado de `Menu y Productos`.

## Resultado esperado

La promocion queda creada con sus productos, cantidades, vigencia y precio final, y ya puede aparecer como item tipo `PROMOCION` en el panel.

## Verificacion rapida

- La promo no se puede guardar sin nombre.
- La promo no se puede guardar sin al menos un producto seleccionado.
- El resumen final cambia cuando cambias cantidades o precio final.
- Al volver al listado, la nueva promo aparece como item de tipo `PROMOCION`.

## Si algo no coincide

- Si no hay productos para seleccionar, vuelve a [Crear producto con receta](../07-productos/crear-producto-con-receta.md).
- Si las categorias de promo no son las esperadas, vuelve a [Crear categoria](../06-categorias/crear-categoria.md) y revisa `Modo Promociones`.
- Si la promo se crea pero no la ves en el listado, usa el buscador y revisa filtros de estado.

## Referencias a otros flujos

- [Crear categoria](../06-categorias/crear-categoria.md)
- [Crear producto con receta](../07-productos/crear-producto-con-receta.md)
