# Registrar stock

## Objetivo

Registrar una entrada, salida o ajuste manual sobre un insumo existente.

## Rol y ruta

- Rol: `ADMIN`
- Ruta inicial: `/admin/dashboard/insumos`
- Ruta esperada al terminar: stock actualizado en el listado de insumos

## Antes de empezar

- Haber completado [Crear insumo](crear-insumo.md) para al menos un insumo.
- Tener claro si el movimiento es `Entrada`, `Salida` o `Ajuste manual`.

## Pasos exactos

1. Entrar a `/admin/dashboard/insumos`.
2. Hacer click en `Registrar stock`.
3. Esperar la ruta `/admin/dashboard/insumos/stock`.
4. Elegir el `Tipo de movimiento`.
5. Elegir el `Insumo`.
6. Completar la cantidad segun el tipo de movimiento.
7. Si el movimiento es `Entrada (compra)`, completar `Costo total`.
8. Completar `Motivo o referencia`.
9. Si el movimiento es `Entrada (compra)`, completar `Proveedor` si corresponde.
10. Revisar el bloque `Impacto estimado`.
11. Hacer click en `Confirmar movimiento`.
12. Esperar el mensaje `Movimiento registrado correctamente`.
13. Volver al listado y verificar el nuevo stock del insumo.

## Resultado esperado

El stock del insumo cambia en funcion del movimiento realizado y el inventario queda actualizado para operacion y reporte.

## Verificacion rapida

- El formulario no deja confirmar sin insumo.
- El bloque `Impacto estimado` cambia cuando cambias cantidad o tipo.
- Despues de guardar, el listado refleja el nuevo stock.

## Si algo no coincide

- Si el stock final no parece correcto, repasa si elegiste `Entrada`, `Salida` o `Ajuste manual`.
- Si falta el insumo en el selector, confirma que siga activo en el listado.
- Si el movimiento falla, anota el tipo, cantidad y motivo usado.

## Referencias a otros flujos

- [Crear insumo](crear-insumo.md)
- [Cancelar pedido](../04-pedidos/cancelar-pedido.md)
