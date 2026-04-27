# Flujos y casos de uso

## Objetivo

Documentar los recorridos mas comunes del panel admin y dejar claro desde que vista empieza cada uno.

## Caso de uso 1: revisar el estado general del negocio

- Actor: `ADMIN`
- Ruta inicial: `/admin/dashboard`
- Flujo:
  1. Ingresar al dashboard.
  2. Revisar KPI del dia y meta mensual.
  3. Leer el grafico semanal.
  4. Revisar actividad reciente.
  5. Decidir si el siguiente paso operativo va a `Pedidos`, `Insumos` o `Reportes`.
- Resultado esperado: el admin entiende en menos de un minuto como esta operando el negocio.

## Caso de uso 2: saltar rapido a una entidad desde el header

- Actor: `ADMIN`
- Punto de entrada: cualquier vista del panel con header desktop
- Flujo:
  1. Presionar `Ctrl+K` o enfocar el buscador.
  2. Escribir al menos 2 caracteres.
  3. Elegir un pedido, producto o empleado.
  4. Entrar al listado filtrado del modulo.
- Resultado esperado: navegar sin volver manualmente al menu lateral.

## Caso de uso 3: analizar ingresos

- Actor: `ADMIN`
- Ruta inicial: `/admin/dashboard/reportes/ingresos`
- Flujo:
  1. Entrar a reportes de ingresos.
  2. Elegir rango de fechas.
  3. Revisar ingresos totales, ticket promedio, ventas en efectivo y ventas digitales.
  4. Filtrar transacciones por numero, cliente, metodo o estado.
  5. Abrir el detalle de una transaccion.
- Resultado esperado: entender que ventas cobradas hubo y por que metodo entraron.

## Caso de uso 4: registrar y auditar un gasto

- Actor: `ADMIN`
- Ruta inicial: `/admin/dashboard/reportes/egresos`
- Flujo:
  1. Entrar a egresos.
  2. Crear un nuevo gasto.
  3. Completar descripcion, monto, categoria, fecha y proveedor si aplica.
  4. Guardar.
  5. Verificar que el gasto aparezca en la lista y en las metricas.
- Resultado esperado: el gasto impacta en reportes y queda auditado.

## Caso de uso 5: administrar accesos del equipo

- Actor: `ADMIN`
- Ruta inicial: `/admin/dashboard/usuarios`
- Flujo:
  1. Entrar a empleados.
  2. Buscar por nombre o mail, o filtrar por rol.
  3. Abrir acciones del usuario.
  4. Cambiar rol o estado.
  5. Confirmar que el badge cambie en la lista.
- Resultado esperado: el admin mantiene control operativo sobre quien entra y con que permisos.

## Caso de uso 6: ajustar parametros del negocio

- Actor: `ADMIN`
- Ruta inicial: `/admin/dashboard/configuracion`
- Flujo:
  1. Entrar a configuracion.
  2. Elegir una seccion: `General`, `Delivery`, `Pagos`, `Horarios` u `Objetivos`.
  3. Editar valores.
  4. Guardar por seccion.
  5. Verificar impacto en panel, pedidos o sitio publico segun el caso.
- Resultado esperado: la aplicacion usa los nuevos parametros sin tocar codigo ni base manualmente.

## Caso de uso 7: mantener el propio acceso

- Actor: `ADMIN`
- Ruta inicial: `/admin/dashboard/perfil`
- Flujo:
  1. Entrar a `Mi Perfil`.
  2. Actualizar informacion personal si hace falta.
  3. Revisar seguridad.
  4. Revisar cuentas vinculadas.
- Resultado esperado: el administrador mantiene vigente su cuenta de acceso.

## Flujo especial: caja en el contexto actual

- En Notion existe un flujo objetivo de abrir caja, cobrar, registrar egreso desde caja y cerrar caja.
- En la implementacion actual del repo no existe una pantalla `/caja`.
- Para documentacion operativa actual, el circuito financiero real se reparte entre:
  - `Pedidos` para cobrar
  - `Reportes > Ingresos` para revisar ventas cobradas
  - `Reportes > Egresos` para registrar y consultar gastos
  - `Configuracion > Pagos` para definir metodos

## Referencias a otros flujos

- [Cobrar pedido](../04-pedidos/cobrar-pedido.md)
- [Crear pedido manual](../04-pedidos/crear-pedido-manual.md)
- [Crear insumo](../05-insumos/crear-insumo.md)
- [Registrar stock](../05-insumos/registrar-stock.md)
- [Crear categoria](../06-categorias/crear-categoria.md)
- [Crear producto con receta](../07-productos/crear-producto-con-receta.md)
- [Crear promocion con productos](../08-promociones/crear-promocion-con-productos.md)
