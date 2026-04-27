# Manual Operativo Trattoria

Este manual esta pensado para un operador `ADMIN` que necesita usar la aplicacion paso a paso y, al mismo tiempo, dejar un recorrido util para testing manual.

## Como usar este manual

- Sigue los flujos en el orden recomendado si es la primera vez.
- Si solo necesitas una tarea puntual, entra directo a la carpeta del flujo correspondiente.
- Cada archivo termina con una `Verificacion rapida` para confirmar que el paso quedo bien.
- Las capturas oficiales estan en [assets](assets/).
- Cuando un paso ya esta explicado en otro archivo, este manual enlaza al flujo correcto en vez de repetirlo.

## Orden recomendado

1. [01-acceso](01-acceso/README.md)
2. [02-catalogo-publico](02-catalogo-publico/README.md)
3. [03-dashboard-admin](03-dashboard-admin/README.md)
4. [04-pedidos](04-pedidos/README.md)
5. [05-insumos](05-insumos/README.md)
6. [06-categorias](06-categorias/README.md)
7. [07-productos](07-productos/README.md)
8. [08-promociones](08-promociones/README.md)

## Dependencias entre flujos

| Flujo | Depende de | Se usa despues en |
| --- | --- | --- |
| Iniciar sesion | Tener credenciales `ADMIN` | Todos los flujos internos |
| Catalogo publico | No requiere login | Testing de carrito y pedido por WhatsApp |
| Crear insumo | Iniciar sesion | Crear producto con receta |
| Crear categoria | Iniciar sesion | Crear producto y, si aplica, crear promocion |
| Crear producto con receta | Crear insumo y crear categoria | Crear promocion con productos |
| Crear promocion con productos | Crear producto con receta | Catalogo interno y pruebas comerciales |

## Alcance de esta version

- Incluye flujo publico, acceso, dashboard, pedidos, insumos, categorias, productos y promociones.
- Ahora tambien incluye documentacion funcional base del panel admin: vistas, reglas, flujos, usuarios, reportes, perfil y configuracion.
- El modulo `Caja` queda documentado como especificacion existente en Notion y brecha de implementacion en el repo actual.
- Las rutas y labels se tomaron de la UI actual del repo.

## Capturas incluidas

- [01-login.png](assets/01-login.png)
- [02-catalogo-home.png](assets/02-catalogo-home.png)
- [03-checkout-publico.png](assets/03-checkout-publico.png)
- [04-dashboard-admin.png](assets/04-dashboard-admin.png)
- [05-nuevo-insumo.png](assets/05-nuevo-insumo.png)
- [06-nuevo-producto.png](assets/06-nuevo-producto.png)
- [07-nueva-promocion.png](assets/07-nueva-promocion.png)
