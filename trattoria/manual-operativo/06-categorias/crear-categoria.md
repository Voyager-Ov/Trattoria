# Crear categoria

## Objetivo

Crear una categoria nueva del menu para organizar productos y, si aplica, promociones.

## Rol y ruta

- Rol: `ADMIN`
- Ruta inicial: `/admin/dashboard/productos/categorias`
- Ruta esperada al terminar: categoria visible en la tabla de categorias

## Antes de empezar

- Haber completado [Iniciar sesion](../01-acceso/iniciar-sesion.md).
- Tener decidido nombre, slug y uso de la categoria.

## Pasos exactos

1. Entrar a `/admin/dashboard/productos/categorias`.
2. Hacer click en `Nueva Categoria`.
3. Esperar la apertura del panel lateral.
4. Si quieres, cargar `Imagen de la Categoria`.
5. Completar `Nombre de la Categoria`.
6. Revisar o ajustar `URL Slug`.
7. Completar `Descripcion` si quieres dejar contexto visible en el menu.
8. Definir si activas `Modo Promociones`.
9. Hacer click en `Crear Categoria`.
10. Esperar el mensaje de exito.
11. Verificar que la categoria aparezca en la tabla con su `Slug` y su estado.

## Resultado esperado

La categoria queda lista para ser usada despues en el alta de productos y, si corresponde, en el flujo de promociones.

## Verificacion rapida

- La categoria nueva aparece en la tabla.
- El `Slug` queda visible y coherente con el nombre.
- Si activaste `Modo Promociones`, la categoria queda identificada para ese uso.

## Si algo no coincide

- Si el nombre ya existe, cambia el nombre o el slug antes de guardar otra vez.
- Si no estas seguro sobre `Modo Promociones`, dejalo apagado para categorias de productos normales.
- Si la categoria no aparece, recarga la tabla y revisa el toast.

## Referencias a otros flujos

- [Crear producto con receta](../07-productos/crear-producto-con-receta.md)
- [Crear promocion con productos](../08-promociones/crear-promocion-con-productos.md)
