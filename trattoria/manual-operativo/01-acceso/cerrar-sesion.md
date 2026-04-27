# Cerrar sesion

## Objetivo

Salir del panel interno y volver al estado no autenticado.

## Rol y ruta

- Rol: `ADMIN`
- Ruta inicial sugerida: cualquier pantalla interna, por ejemplo `/admin/dashboard`
- Ruta esperada al terminar: `/login`

## Antes de empezar

- Haber completado [Iniciar sesion](iniciar-sesion.md).
- Estar dentro del panel interno.

## Pasos exactos

1. Ubicar el boton `Cerrar sesion` en el header o en la navegacion del panel.
2. Hacer click en `Cerrar sesion`.
3. Esperar la redireccion fuera del panel.
4. Confirmar que vuelvas a `/login`.
5. Verificar que reaparezca el boton `Ingresar`.

## Resultado esperado

La sesion actual se cierra y el usuario vuelve a la pantalla de acceso.

## Verificacion rapida

- La URL final es `/login`.
- Se ve nuevamente el formulario de login.
- Si intentas abrir una ruta interna en otra pestana, deberia pedir acceso otra vez.

## Si algo no coincide

- Si no aparece `Cerrar sesion`, vuelve al dashboard y busca en el header del panel.
- Si sigues dentro del panel despues del click, recarga la pagina para confirmar si la sesion realmente se cerro.
- Si la app queda en un estado intermedio, vuelve manualmente a `/login`.

## Referencias a otros flujos

- [Iniciar sesion](iniciar-sesion.md)
