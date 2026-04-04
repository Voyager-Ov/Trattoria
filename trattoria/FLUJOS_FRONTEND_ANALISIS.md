# Flujos de Frontend para QA / Análisis Funcional (Trattoria)

Este documento es una guía operativa **paso a paso** para recorrer el frontend completo y registrar hallazgos antes de pasar cambios al equipo de desarrollo.

---

## 0) Preparación de sesión de análisis

1. Abrir la app en la ruta pública `/`.
2. Tener dos usuarios de prueba:
   - Usuario ADMIN.
   - Usuario EMPLEADO.
3. Preparar una plantilla de registro por flujo:
   - Flujo
   - Paso exacto
   - Resultado esperado
   - Resultado observado
   - Evidencia (captura/video)
   - Severidad (alta/media/baja)

---

## 1) Flujo público (cliente final): catálogo + carrito + pedido por WhatsApp

### 1.1 Navegación inicial
1. Ir a `/`.
2. Verificar header y botón de usuario (icono perfil).
3. Usar buscador/filtro por categorías.

### 1.2 Exploración de categorías y productos
1. Click en una categoría.
2. Validar listado de productos.
3. En cada producto:
   - Click en “Agregar”/acción equivalente de carrito.
   - Ajustar cantidad con `+` y `-`.

### 1.3 Carrito
1. Click en botón flotante “Tu Carrito”.
2. Validar detalle de productos.
3. Probar:
   - Subir cantidad.
   - Bajar cantidad.
   - Eliminar ítem (ícono papelera).
4. Click en **“Continuar Pedido”**.

### 1.4 Checkout público
1. Completar:
   - Nombre
   - Teléfono
   - Dirección (si tipo entrega = delivery)
   - Método de pago
   - Campo “paga con” (si efectivo)
2. Cambiar tipo de entrega:
   - Delivery
   - Retiro
3. Click en **“Confirmar vía WhatsApp”**.
4. Validar:
   - Se crea pedido.
   - Se redirige a WhatsApp.
   - El mensaje incluye ítems, total y tipo de entrega.

### 1.5 Casos borde públicos
1. Intentar confirmar con campos incompletos.
2. Intentar cuando local está cerrado.
3. Verificar carrito vacío.

---

## 2) Flujo de autenticación

### 2.1 Login por email/contraseña
1. Ir a `/login`.
2. Completar email y contraseña.
3. Click **“Ingresar”**.
4. Validar redirección según rol:
   - ADMIN → `/admin/dashboard`
   - EMPLEADO → `/empleado`

### 2.2 Login con Google
1. En `/login`, click botón **“Google”**.
2. Completar OAuth.
3. Validar redirección por rol.

### 2.3 Logout
1. Desde sidebar/header, click **“Cerrar Sesión”**.
2. Verificar regreso a estado no autenticado.

---

## 3) Flujo ADMIN: Dashboard general

1. Iniciar sesión como ADMIN.
2. Entrar a `/admin/dashboard`.
3. Revisar KPIs y tarjetas.
4. Click en accesos rápidos (por ejemplo gestión de pedidos).
5. Validar breadcrumbs y navegación lateral.

---

## 4) Flujo ADMIN: Pedidos (incluye cancelar pedido)

### 4.1 Listado de pedidos
1. Ir a `/admin/dashboard/pedidos`.
2. Validar filtros/tabla/estados.
3. Abrir un pedido desde la lista.

### 4.2 Crear pedido manual
1. Desde listado, click **“Nuevo Pedido”**.
2. Completar cliente + productos/promociones.
3. Click **“Confirmar Pedido”**.
4. Verificar que aparece en listado.

### 4.3 Cambiar estado de pedido
1. En listado o detalle, seleccionar nuevo estado.
2. Confirmar acción.
3. Verificar actualización visual y persistencia.

### 4.4 **Cancelar pedido** (flujo crítico pedido por vos)
1. En listado `/admin/dashboard/pedidos`, abrir acción de cancelar.
2. En panel/modal “Cancelar Pedido”:
   - Completar motivo de cancelación.
   - Definir si descontar/revertir stock según toggle.
3. Click **“Confirmar Cancelación”**.
4. Verificar:
   - Estado final = CANCELADO.
   - Registro en historial del pedido.
   - Ajuste de stock acorde a la opción marcada.

### 4.5 Cobrar pedido
1. En listado o detalle, abrir flujo de cobro.
2. Confirmar en modal “Cobrar Pedido”.
3. Click **“Confirmar Cobro”**.
4. Validar estado de pago.

---

## 5) Flujo ADMIN: Menú y Productos

### 5.1 Listado de productos
1. Ir a `/admin/dashboard/productos`.
2. Validar filtros, cards/lista y acciones.

### 5.2 Crear producto
1. Click **“Nuevo Producto”** (o ruta `/admin/dashboard/productos/nuevo`).
2. Completar datos principales.
3. Asociar categoría.
4. Cargar receta/insumos.
5. Guardar.

### 5.3 Editar producto
1. Abrir detalle de producto.
2. Click **“Editar Producto”**.
3. Modificar campos.
4. Click **“Guardar Cambios”**.

### 5.4 Eliminar producto
1. En detalle o listado, click **“Eliminar”**.
2. Confirmar acción.
3. Validar que no aparezca en catálogo/gestión según reglas.

---

## 6) Flujo ADMIN: Categorías

1. Ir a `/admin/dashboard/productos/categorias`.
2. Crear categoría:
   - Click “Nueva Categoría”.
   - Completar nombre/orden.
   - Guardar.
3. Editar categoría existente.
4. Eliminar categoría.
5. Probar modo promociones (`esPromocion`) en alta/edición.

---

## 7) Flujo ADMIN: Promociones

### 7.1 Crear promoción
1. Ir a productos/promociones o usar acción “Nueva Promoción”.
2. Completar nombre, precios y productos incluidos.
3. Guardar.

### 7.2 Editar promoción
1. Abrir detalle promoción.
2. Click **“Editar Oferta”**.
3. Cambiar datos.
4. Click **“Guardar Cambios”**.

### 7.3 Eliminar promoción
1. Desde edición/detalle, click **“Eliminar”**.
2. Confirmar.
3. Validar que desaparece del listado.

---

## 8) Flujo ADMIN: Insumos (incluye crear insumo)

### 8.1 Listado de inventario
1. Ir a `/admin/dashboard/insumos`.
2. Revisar métricas (activos, stock crítico, etc.).
3. Usar búsqueda/filtros.

### 8.2 **Crear insumo** (flujo crítico pedido por vos)
1. En `/admin/dashboard/insumos`, click **“Nuevo Insumo”**.
2. Completar:
   - Nombre
   - Categoría
   - Unidad
   - Costo unitario
   - Stock inicial
   - Stock mínimo
3. Guardar.
4. Validar toast de éxito y aparición en la tabla.

### 8.3 Editar insumo
1. Abrir detalle de insumo.
2. Click **“Editar”**.
3. Modificar campos.
4. Guardar cambios.

### 8.4 Registrar stock
1. Click **“Registrar Stock”**.
2. Seleccionar tipo de movimiento (entrada/salida/ajuste).
3. Completar cantidad + motivo.
4. Confirmar.
5. Verificar nuevo stock estimado y persistencia.

### 8.5 Archivar/eliminar insumo
1. En acciones, elegir eliminar/archivar.
2. Confirmar en diálogo.
3. Validar impacto en listado.

---

## 9) Flujo ADMIN: Empleados / Usuarios

1. Ir a `/admin/dashboard/usuarios`.
2. Click **“Nuevo Empleado”**.
3. Completar datos requeridos.
4. Click **“Crear Empleado”**.
5. Validar aparición en listado.
6. Probar acciones de estado/edición si están habilitadas.

---

## 10) Flujo ADMIN: Reportes

### 10.1 Dashboard de reportes
1. Ir a `/admin/dashboard/reportes`.
2. Revisar tabs/secciones:
   - Pedidos
   - Productos
   - Inventario
   - Financiero/Rentabilidad

### 10.2 Reporte de ingresos
1. Ir a `/admin/dashboard/reportes/ingresos`.
2. Cambiar rango de fechas.
3. Verificar totales y gráficos.

### 10.3 Reporte de egresos
1. Ir a `/admin/dashboard/reportes/egresos`.
2. Click **“Nuevo Gasto”**.
3. Completar formulario.
4. Guardar.
5. Probar editar y eliminar gasto (confirmación incluida).

---

## 11) Flujo ADMIN: Configuración

1. Ir a `/admin/dashboard/configuracion`.
2. Revisar bloques:
   - WhatsApp
   - Métodos de pago
   - Horarios del negocio
   - Delivery/rangos
3. Modificar campo de cada bloque.
4. Click **“Guardar Cambios”**.
5. Validar impacto en front público (checkout/carrito).

---

## 12) Flujo ADMIN/EMPLEADO: Perfil y seguridad

1. Ir a `/admin/dashboard/perfil` o `/empleado/perfil`.
2. Editar datos de perfil.
3. Guardar.
4. En admin, probar seguridad:
   - Configurar/cambiar contraseña.
   - Vincular/desvincular Google.

---

## 13) Flujo EMPLEADO: Dashboard

1. Login como EMPLEADO.
2. Entrar a `/empleado`.
3. Usar accesos rápidos:
   - Gestionar pedidos
   - Nuevo pedido
4. Validar cola de pedidos.

---

## 14) Flujo EMPLEADO: Pedidos

1. Ir a `/empleado/pedidos`.
2. Probar listado + filtros.
3. Crear desde `/empleado/pedidos/nuevo` con **“Confirmar Pedido”**.
4. Abrir detalle `/empleado/pedidos/[id]` y validar cambios de estado/cobro según permisos.

---

## 15) Flujo EMPLEADO: Insumos

1. Ir a `/empleado/insumos`.
2. Crear con **“Nuevo Insumo”**.
3. Registrar movimientos desde **“Registrar Stock”**.
4. Editar/eliminar según permisos del rol.

---

## 16) Flujo EMPLEADO: Productos y promociones

1. Ir a `/empleado/productos`.
2. Probar:
   - Nuevo producto
   - Nueva promoción
   - Editar
   - Eliminar
3. Validar restricciones por rol si aplican.

---

## 17) Matriz rápida de “botones clave” para tu checklist

- Acceso:
  - Ingresar
  - Google
  - Cerrar Sesión
- Pedidos:
  - Nuevo Pedido
  - Confirmar Pedido
  - Confirmar Cancelación
  - Confirmar Cobro
- Insumos:
  - Nuevo Insumo
  - Registrar Stock
  - Guardar Cambios
  - Confirmar (diálogo)
- Productos/promos:
  - Nuevo Producto
  - Nueva Promoción
  - Editar
  - Eliminar
  - Guardar Cambios
- Config/reportes:
  - Guardar Cambios
  - Nuevo Gasto
  - Registrar Gasto

---

## 18) Orden sugerido para una ronda de análisis “perfecta”

1. Público (catálogo + carrito + checkout WhatsApp).
2. Login y permisos por rol.
3. Admin > Pedidos (crear/cambiar estado/cancelar/cobrar).
4. Admin > Insumos (crear/editar/stock/archivar).
5. Admin > Productos/Categorías/Promos.
6. Admin > Empleados.
7. Admin > Reportes + Configuración.
8. Empleado > flujos equivalentes permitidos.
9. Perfil/seguridad + logout.

---

## 19) Cómo vamos a trabajar vos y yo en la próxima etapa

Cuando me digas “me quedé en X paso”, te devuelvo:
1. Diagnóstico rápido de UX/funcionalidad.
2. Riesgo (negocio/técnico).
3. Cambio exacto sugerido (copy, validación, layout, estados, API).
4. Criterio de aceptación (QA).
5. Mensaje listo para dev (ticket corto y claro).

