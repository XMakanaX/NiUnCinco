# Registro de fases — Ni Un Cinco

Seguimiento del plan maestro (`PLAN_DESARROLLO_FINANZAS.md`, 15 fases). Se actualiza **cada vez que se cierra una fase**: marcar casilla, fecha, commit y notas. No marcar una fase como completa sin haber corrido lint/typecheck/build/tests y reportado el resultado real (regla global 6 del plan maestro).

Leyenda: ✅ completa · 🟡 parcial / en curso · ⬜ no iniciada.

| # | Fase | Estado | Cerrada el | Commit |
|---|---|---|---|---|
| 1 | Diagnóstico y arquitectura | ✅ | 2026-10-28 | `806a9a5` |
| 2 | Sistema de diseño | ✅ | 2026-10-28 | `76974a5` |
| 3 | Estructura principal y navegación | ✅ | 2026-10-28 | `806a9a5`/`de63c08` |
| 4 | Supabase, autenticación y base de datos | ✅ | 2026-10-28 | `806a9a5`/`de63c08` |
| 5 | Cuentas, tarjetas y categorías | ✅ | 2026-10-29 | _pendiente de commit_ |
| 6 | Movimientos financieros | ✅ | 2026-10-29 | _pendiente de commit_ |
| 7 | Registro rápido y atajo de iPhone | ⬜ | — | — |
| 8 | Dashboard financiero | ⬜ | — | — |
| 9 | Presupuestos, recurrencias y metas | ⬜ | — | — |
| 10 | Pagos y ciclo de tarjetas de crédito | ⬜ | — | — |
| 11 | Importación de CSV | ⬜ | — | — |
| 12 | Informes, búsqueda y exportación | ⬜ | — | — |
| 13 | PWA y funcionamiento sin conexión | ⬜ | — | — |
| 14 | Auditoría, seguridad y pruebas | ⬜ | — | — |
| 15 | Preparación de despliegue y entrega | ⬜ | — | — |

---

## Detalle

### ✅ Fase 1 — Diagnóstico y arquitectura
Entregada y aprobada. Arquitectura, entidades, reglas de negocio, navegación, seguridad y plan por fases definidos. Andamiaje técnico (Vite/TS/Tailwind/PWA, shell de navegación, helpers de dinero/fecha) construido en esta misma tanda — **se adelantó a la Fase 3 sin autorización explícita en su momento**; reconciliado el 2026-10-28 con el usuario, que decidió mantenerlo como base técnica en vez de revertirlo.

### ✅ Fase 2 — Sistema de diseño
Tokens de color/tipografía/radio/sombra (claro+oscuro, sin FOUC), componentes base (`Button`, `Input`, `Select`, `Dialog`, `Card`, `Money`, `Badge`, `EmptyState`, `Skeleton`, `ThemeToggle`), vitrina en `/dev/design-system`. Lint/typecheck/build verdes, 12/12 tests, revisado visualmente en Chrome (claro/oscuro, foco de teclado, sin errores de consola).

### ✅ Fase 3 — Estructura principal y navegación
Completado sobre lo adelantado en Fase 1: 6 pantallas (Inicio/Movimientos/Cuentas/Presupuestos/Informes/Ajustes) con nav de 6 ítems (iconos + texto, sidebar escritorio / tab bar móvil), estados vacíos con `EmptyState` explicando cómo empezar en cada pantalla (datos no ficticios, solo mensaje de "no hay datos aún"), ruta `/quick-expense` (solo el placeholder — lógica es Fase 7, no enlazada en el nav por diseño), página 404 (ruta `*` dentro del shell) y `ErrorPage` (errorElement de React Router para errores inesperados de render). Componentes compartidos nuevos: `PageMessage` (mensajes inline info/success/error) y `LoadingState` (skeleton de carga de página); se reusaron `Dialog`, `Input`, `Button`, `EmptyState`, `Skeleton` de la Fase 2. Páginas placeholder migradas de clases `neutral-*` sueltas a los tokens del sistema de diseño (`ink`/`surface`/`border`).
Verificado: `npm run lint` (sin errores), `npm run typecheck` (sin errores), `npm run build` (éxito, warning de tamaño de chunk >500kB sin bloquear), `npm run test` (12/12 tests verdes — no se agregaron tests nuevos, son los mismos de Fase 2). Revisado visualmente en Chrome con `npm run dev`: sidebar de escritorio con 6 ítems, estado vacío de Inicio y Presupuestos, ruta 404 con botón "Volver al inicio" funcional, `/quick-expense` sin nav visible, sin errores de consola.
Pendiente para fases futuras: contenido real de cada pantalla (Fases 5-12), guard de sesión y rutas `/register`/`/reset-password` (Fase 4).

### ✅ Fase 4 — Supabase, autenticación y base de datos
Proyecto Supabase conectado (`.env.local` con URL + anon key). Migración `supabase/migrations/20261028221518_initial_schema.sql`: 11 tablas (`profiles`, `accounts`, `cards`, `categories`, `transactions`, `transfers`, `card_payments`, `budgets`, `recurring_expenses`, `goals`, `goal_contributions`), RLS `enable` + `force` en todas con policies `to authenticated using ((select auth.uid()) = user_id)`, índices en toda FK, trigger `handle_new_user` que crea perfil + 9 categorías iniciales al registrarse, trigger `set_updated_at` en las tablas con ese campo. Aplicada al proyecto real vía `supabase db push` (autorizado explícitamente), historial de migraciones reparado (`migration repair --status applied`). Detalle completo y resultado de las pruebas de aislamiento: `supabase/README.md`.

Auth: páginas `/login`, `/register`, `/reset-password`, `/update-password` (react-hook-form + zod), `RequireAuth`/`GuestOnly` como layouts de ruta, store `useAuthStore` (zustand) sincronizado con `supabase.auth.onAuthStateChange`. `/settings` ahora lee y edita el perfil real (nombre, moneda principal) vía TanStack Query, y permite cerrar sesión. `src/types/database.ts` generado con `npm run db:types` (`supabase gen types ... --linked`) — ya no es el stub a mano.

Verificado: `npm run lint`, `npm run typecheck`, `npm run build` y `npm run test` (20/20 — se agregaron 8 tests de los schemas zod de auth) sin errores. `supabase db advisors --linked --type security` sin hallazgos. Probado en el navegador contra el proyecto real: registro con confirmación por correo, login, edición de perfil persistida, cierre de sesión, y aislamiento RLS entre dos cuentas de prueba reales (lectura/`update`/`delete` cruzados devuelven 0 filas, sin error — ver `supabase/README.md`).

Pendiente para fases futuras: lógica de negocio (saldos, RPCs atómicas de transferencias/pagos de tarjeta — Fases 5-10), borrar las dos cuentas de prueba del dashboard si se quiere el proyecto limpio (requiere `service_role`, no tocada en esta sesión).

### ✅ Fase 5 — Cuentas, tarjetas y categorías
Migración `20261029120000_account_card_balances.sql` (aplicada al proyecto real vía `supabase db push`, autorizado explícitamente): vistas `account_balances` y `card_balances` (`security_invoker = true`, heredan RLS de las tablas base) como fuente única de saldo/deuda/crédito disponible — solo cuentan `transactions.status = 'confirmed'`. Saldo de cuenta = ingresos − gastos − transferencias salientes + entrantes − pagos de tarjeta hechos desde esa cuenta. Deuda/crédito disponible de tarjeta solo aplica a crédito (débito ya se refleja en el saldo de su cuenta enlazada) = gastos con esa tarjeta − pagos hechos a esa tarjeta. `src/types/database.ts` regenerado con `supabase gen types`.

UI: `/accounts` reescrita con pestañas (Base UI `Tabs`, componente nuevo `shared/ui/Tabs.tsx`) Cuentas/Tarjetas/Categorías. CRUD completo en los tres: diálogos de formulario (`react-hook-form` + `zod`), confirmación de borrado (`shared/ui/ConfirmDialog.tsx` sobre `AlertDialog` de Base UI), archivar/restaurar, selector de color (`shared/ui/ColorSwatchPicker.tsx`, 8 colores fijos). Tarjetas de crédito piden límite/corte/vencimiento solo cuando `card_type = 'credit'` (validado con `.refine` en el schema); tarjetas pueden enlazarse a una cuenta. Categorías soportan subcategorías vía `parent_id` (un nivel, select de categorías raíz). Ningún dato sensible de tarjeta (número, CVV, PIN) se pide ni se guarda.

Borrar vs. archivar (regla 10 del plan): cuentas/tarjetas dependen de la FK `restrict` de la base — si el borrado falla con Postgres `23503` (hay movimientos asociados), la UI archiva en su lugar y avisa. Categorías usan FK `set null`/`cascade` (la base sí permite borrarlas), así que el chequeo de "¿tiene movimientos, presupuestos o subcategorías?" corre en la app (`useDeleteCategory`) antes de borrar.

Verificado: `npm run lint`, `npm run typecheck`, `npm run test` (30/30 — se agregaron 10 tests de los schemas zod de cuenta/tarjeta/categoría) y `npm run build` sin errores. Probado en el navegador contra el proyecto real (sesión ya autenticada): crear cuenta de efectivo (saldo ₡0,00 vía la vista), crear tarjeta de crédito con límite ₡500.000 (deuda ₡0,00, disponible ₡500.000,00 — ambos calculados por `card_balances`), toggle débito/crédito muestra/oculta campos de crédito correctamente, archivar/restaurar cuenta, eliminar cuenta y tarjeta sin movimientos (caso limpio), categorías semilla (9) visibles con badge de tipo, crear subcategoría con categoría padre y eliminarla. No se pudo probar en esta sesión el camino "eliminar con movimientos asociados → se archiva en su lugar" porque todavía no existe UI de movimientos (Fase 6); la lógica de captura del error `23503` / `CATEGORY_IN_USE` se revisó por código. Datos de prueba creados en esta sesión se borraron al cerrar — el proyecto queda con las 9 categorías semilla y sin cuentas/tarjetas.

Pendiente para fases futuras: movimientos (Fase 6) para ejercitar el caso de borrado bloqueado y los saldos con datos reales; balance de cuenta todavía no considera transacciones `type = 'transfer'`/`'card_payment'` directamente — se apoya en las tablas `transfers`/`card_payments` dedicadas, que Fase 6 deberá poblar de forma atómica junto con las filas de `transactions`.

### ✅ Fase 6 — Movimientos financieros
Migración `20261029180000_movement_rpcs.sql` (aplicada vía `supabase db push`, autorizado explícitamente): agrega `status` (`confirmed`/`voided`) a `transfers` y `card_payments` (antes no lo tenían), actualiza `account_balances`/`card_balances` (Fase 5) para ignorarlos cuando están anulados, y 4 funciones RPC `security invoker`: `create_transfer`/`create_card_payment` (insertan la fila de `transfers`/`card_payments` + su(s) fila(s) en `transactions` en una sola operación atómica — regla global 14) y `void_transfer`/`void_card_payment` (anulan ambas filas a la vez, nunca borran). Ingreso/gasto no necesita RPC: es un solo `insert` en `transactions`, ya atómico. `src/types/database.ts` regenerado.

Reglas de negocio implementadas tal como las pide el plan: compra con tarjeta de crédito = gasto + sube deuda (vía `card_balances`); compra con débito = gasto + baja saldo de cuenta; transferencia entre cuentas propias = dos filas `type='transfer'` (una por cuenta, mismo `transfer_id`) que la vista de saldos nunca cuenta como ingreso/gasto; pago de tarjeta = baja deuda y saldo de la cuenta de origen, sin volver a contar la compra original como gasto. Transferencia exige que origen y destino tengan la misma moneda (validado en el formulario — conversión entre monedas queda fuera de alcance de esta fase).

Protección contra doble clic/reintentos de red (regla global del plan): cada diálogo genera su propio `client_id` (UUID) al abrirse y lo reutiliza en reintentos dentro de esa misma apertura; un `client_id` repetido viola el `unique(user_id, client_id)` de `transactions` y el cliente lo trata como éxito silencioso (`isUniqueViolation`, `shared/lib/postgresErrors.ts`) en vez de duplicar el movimiento.

UI: `/transactions` reescrita — barra de filtros (fecha desde/hasta, texto en comercio/notas, tipo, cuenta, tarjeta, categoría), 3 acciones (`Ingreso/Gasto`, `Transferencia`, `Pago de tarjeta`) cada una con su diálogo (`MovementFormDialog`, `TransferFormDialog`, `CardPaymentFormDialog`), lista de movimientos con ícono/color por tipo, badge "Anulado" en movimientos anulados (atenuados, sin botón de anular), confirmación (`ConfirmDialog`) antes de anular. La categoría del formulario de ingreso/gasto se filtra por `kind` (gasto muestra categorías de gasto, ingreso las de ingreso).

Verificado: `npm run lint`, `npm run typecheck`, `npm run test` (38/38 — se agregaron 8 tests de los schemas zod de movimiento/transferencia/pago) y `npm run build` sin errores. Probado en el navegador contra el proyecto real con datos de prueba (2 cuentas, 1 tarjeta de crédito): gasto con cuenta reduce su saldo; transferencia entre cuentas aparece como dos filas neutras (no ingreso/gasto) y mueve el saldo exacto entre ambas; gasto con tarjeta de crédito sube la deuda y baja el crédito disponible (`card_balances`); pago de tarjeta reduce deuda y saldo de la cuenta de origen sin contarse como gasto nuevo; anular un gasto revierte el saldo de la cuenta; anular una transferencia anula ambas filas ligadas a la vez (RPC `void_transfer`) y revierte ambos saldos; filtro de búsqueda por texto probado. Todos los saldos verificados dieron el resultado matemático esperado (ver cálculos en el historial de la sesión). Datos de prueba (cuentas "Cuenta A"/"Cuenta B", tarjeta "Visa Test" y sus movimientos) se dejaron en el proyecto real como evidencia funcional — no son datos inventados, son el resultado de las pruebas descritas arriba; se pueden borrar desde la propia UI cuando se quiera.

Pendiente para fases futuras: conversión de moneda en transferencias/pagos entre cuentas de distinta moneda (fuera de alcance, bloqueado explícitamente en el formulario); pruebas de integración automatizadas contra Supabase (por ahora, igual que Fases 4-5, la verificación de RLS/cálculos es manual en navegador — no hay arnés de pruebas de integración configurado en el proyecto).

### ⬜ Fases 7-15
Sin empezar.

---

## Cómo actualizar este archivo

Al cerrar una fase: cambiar su casilla en la tabla a ✅ (o 🟡 si queda parcial), completar fecha y commit, y agregar un párrafo breve en "Detalle" con qué se hizo, qué pruebas corrieron y qué quedó pendiente — mismo contenido que el reporte de cierre de fase que pide el plan maestro, sin inventar resultados de pruebas que no se ejecutaron.
