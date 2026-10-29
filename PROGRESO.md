# Registro de fases — Ni Un Cinco

Seguimiento del plan maestro (`PLAN_DESARROLLO_FINANZAS.md`, 15 fases). Se actualiza **cada vez que se cierra una fase**: marcar casilla, fecha, commit y notas. No marcar una fase como completa sin haber corrido lint/typecheck/build/tests y reportado el resultado real (regla global 6 del plan maestro).

Leyenda: ✅ completa · 🟡 parcial / en curso · ⬜ no iniciada.

| # | Fase | Estado | Cerrada el | Commit |
|---|---|---|---|---|
| 1 | Diagnóstico y arquitectura | ✅ | 2026-10-28 | `806a9a5` |
| 2 | Sistema de diseño | ✅ | 2026-10-28 | `76974a5` |
| 3 | Estructura principal y navegación | ✅ | 2026-10-28 | `806a9a5`/`de63c08` |
| 4 | Supabase, autenticación y base de datos | ✅ | 2026-10-28 | `806a9a5`/`de63c08` |
| 5 | Cuentas, tarjetas y categorías | ✅ | 2026-10-29 | `5cc92ef` |
| 6 | Movimientos financieros | ✅ | 2026-10-29 | `49431e9` |
| 7 | Registro rápido y atajo de iPhone | ✅ | 2026-10-29 | `24170cc` |
| 8 | Dashboard financiero | ✅ | 2026-10-29 | `423bf53` |
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

### ✅ Fase 7 — Registro rápido y atajo de iPhone
`/quick-expense` reescrita (antes era el placeholder de Fase 3): pantalla de una sola vista, sin nav, pensada para registrar un gasto en menos de 10 segundos — importe con teclado numérico (`inputMode="decimal"`, foco automático), chips de "Pagar con" (cuentas + tarjetas combinadas) y de categoría (solo `kind='expense'`), comercio/descripción opcional, un botón "Guardar". Reusa `movementSchema`/`useCreateMovement` de la Fase 6 sin tocar el backend — ningún movimiento ni RPC nuevo.

Valores predeterminados y accesos frecuentes (plan: "valores predeterminados configurables" + "acceso rápido a categorías y tarjetas frecuentes"): store `useQuickExpensePrefs` (zustand + `persist`, `src/features/quick-expense/store.ts`) guarda en el dispositivo la última cuenta/tarjeta/categoría usada y un contador de frecuencia por id; los chips de "Pagar con" y "Categoría" se ordenan por más usados primero. Es preferencia local, no dato financiero — nunca se sube a Supabase. Moneda por defecto = `profiles.base_currency` del usuario.

Después de guardar: toast de confirmación, el formulario se resetea (importe y comercio) pero mantiene cuenta/tarjeta y categoría seleccionadas para encadenar varios registros rápidos sin volver a elegir — eso cumple "guardar, confirmar y registrar otro gasto rápidamente". `client_id` se regenera en cada guardado exitoso (protección de doble envío ya validada en Fase 6).

Cola offline (regla global 12 del plan maestro — nunca mostrar como sincronizado algo que el servidor no confirmó): `src/features/quick-expense/offline/` — `queue.ts` (IndexedDB vía `idb`, store `pending`) + `usePendingQuickExpenses.ts`. Si el insert falla por error de red (`!navigator.onLine`, `TypeError`, o mensaje con "fetch"/"network" — `isNetworkError`), el gasto se guarda en la cola local en vez de mostrarse como error; la pantalla muestra "N gasto(s) pendiente(s) de enviar (sin conexión)". Se reintenta solo al evento `online` del navegador y al montar la página, reusando el mismo `client_id` (idempotente por el `unique(user_id, client_id)` de Fase 4). Esto es específico de `/quick-expense` — el soporte offline general de toda la PWA es Fase 13, no se adelantó.

README actualizado con instrucciones de Atajos de Apple (disparador "Botón de acción" → acción "Abrir URLs" → `/quick-expense`) e instalación de la PWA en iPhone (Safari → compartir → agregar a inicio) y Android (Chrome → instalar app). Se aclara explícitamente que el atajo solo abre la URL — la app no detecta la pulsación del botón ni lee compras bancarias o de Apple Pay automáticamente (regla global 11).

Verificado: `npm run lint`, `npm run typecheck`, `npm run test` (38/38 — no se agregaron tests nuevos, es el mismo schema de movimiento de Fase 6) y `npm run build` sin errores. Probado en el navegador contra el proyecto real (`npm run dev`): creada una cuenta de prueba ("Efectivo Prueba") porque el proyecto no tenía cuentas/tarjetas; estado vacío correcto antes de crearla. Con cuenta disponible: chips de cuenta/categoría funcionan, registro de gasto real (₡2.500,00, categoría Alimentación, comercio "Soda prueba") aparece correcto en `/transactions`. Camino offline probado interceptando `fetch`/`navigator.onLine` por consola del navegador (no hay forma de cortar la red real desde las herramientas disponibles en esta sesión): el gasto quedó en la cola con aviso "1 gasto pendiente de enviar (sin conexión)" y nunca se mostró como confirmado; al restaurar `fetch`/`onLine` y disparar el evento `online`, se sincronizó solo y apareció en `/transactions` sin duplicados. No se pudo probar en hardware real (iPhone/Android) en esta sesión — solo navegador de escritorio; `resize_window` de la herramienta de Chrome no cambió el viewport de captura, así que el layout mobile (safe areas, zoom de inputs, tap) queda sin verificar visualmente y debe probarse en un teléfono real antes de dar la Fase 7 por completamente cerrada en ese aspecto (ver sección README "Probar como PWA en un teléfono real"). Datos de prueba ("Efectivo Prueba" y sus dos movimientos) se dejaron en el proyecto real como evidencia funcional.

Pendiente: validación en hardware real (iPhone con Atajos configurado, Android); Fase 13 deberá decidir si la cola offline de quick-expense se generaliza a toda la app o se mantiene como mecanismo propio de esta pantalla.

### ✅ Fase 8 — Dashboard financiero
`/` (`DashboardPage`) reescrita con datos reales. Migración `20261029220000_dashboard_aggregates.sql` (aplicada vía `supabase db push`, autorizado explícitamente): dos funciones `security invoker` de solo lectura — `dashboard_period_totals(moneda, desde, hasta)` (ingreso/gasto agregados) y `dashboard_category_breakdown(moneda, desde, hasta, tipo)` (gasto por categoría) — para no traer todo el historial de movimientos al cliente solo para sumarlo ahí (regla explícita de la Fase 8). `src/types/database.ts` regenerado con `supabase gen types`.

Selector de moneda (CRC/USD, arranca en `profiles.base_currency`) y de periodo (mes, con flechas; no deja avanzar a meses futuros). Todo el dashboard queda filtrado a una sola moneda a la vez — nunca se suma CRC+USD (regla global 20): saldo disponible y deuda de tarjetas se calculan sumando `account_balances`/`card_balances` (vistas de Fase 5) solo de cuentas/tarjetas activas de esa moneda; si no hay ninguna, se muestra un aviso explícito en vez de un cero engañoso.

Widgets: disponible en cuentas, deuda de tarjetas, patrimonio neto (disponible − deuda), crédito disponible por tarjeta, ingresos/gastos/balance del mes con barras (`IncomeExpenseBars`) y comparación en % contra el mismo rango del mes anterior — la comparación solo se muestra si el mes anterior tuvo datos (`pctChange` devuelve `null` si el total previo es 0, siguiendo "si existen datos suficientes"), gasto por categoría (`CategoryBarChart`, barras horizontales con el color que el usuario ya le asignó a cada categoría), presupuestos del mes y próximos pagos (consultan `budgets`/`recurring_expenses` reales — existen desde la Fase 4 pero su CRUD es Fase 9, así que hoy muestran el estado vacío real con link a Presupuestos, no datos inventados), y últimos 5 movimientos (reusa `TransactionListItem` de Fase 6; `useTransactions` ahora acepta `limit` para no traer todo el historial en este widget). Sin librería de gráficos nueva: barras en CSS/SVG simple, evita una dependencia de ~90kB+ para dos tipos de barra.

`src/shared/lib/date.ts` suma `monthRange(mesesAtrás)` y `monthLabel(año, mes)` para el selector de periodo — con tests nuevos que fijan la fecha del sistema cerca de medianoche en Costa Rica para cubrir el mismo borde de zona horaria que ya cubría `toDateOnly`. Las mutaciones de movimientos/transferencias/pagos (`useTransactions.ts`, Fase 6) ahora también invalidan la query `dashboard` para que el resumen se actualice solo tras registrar o anular algo.

Verificado: `npm run lint`, `npm run typecheck`, `npm run test` (41/41 — 3 tests nuevos de `monthRange`/`monthLabel`) y `npm run build` sin errores. `supabase db advisors --linked --type security` sin hallazgos nuevos (el único warning es preexistente, de Auth, no relacionado). Probado en el navegador contra el proyecto real: con los movimientos de prueba de la Fase 6 (₡1.000,00 + ₡2.500,00 en "Efectivo Prueba", categoría Alimentación), octubre 2026 muestra gasto ₡3.500,00, balance −₡3.500,00, disponible en cuentas −₡3.500,00 y patrimonio neto −₡3.500,00 — coincide con los movimientos reales; "Gastos por categoría" muestra Alimentación ₡3.500,00. Mes anterior (septiembre) en cero, sin comparación mostrada (correcto). Cambiar a USD pone todo en cero con el aviso de "no hay cuentas en dólares todavía" (no mezcla monedas). Flecha de mes siguiente deshabilitada en el mes actual.

Pendiente: presupuestos/recurrencias/metas reales (Fase 9, que llenará los dos widgets hoy vacíos); no se pudo probar visualmente en hardware móvil real en esta sesión, solo navegador de escritorio.

### 🔧 Auditoría responsive (trabajo transversal, no es una fase del plan maestro)
Las Fases 7 y 8 habían dejado anotado que el layout móvil nunca se verificó en un viewport
real (`resize_window` de la herramienta de Chrome no cambiaba el viewport de captura). Esta
sesión hizo una auditoría de las 8 fases cerradas (320-430px / 768-1024px / desktop) contra
código y corrigió lo encontrado. Confirmado por grep antes de tocar nada: 23 prefijos
`sm:`/`md:`/`lg:` en 50 archivos `.tsx` (9 en `index.css`), 0 usos de `max-h` y 0 de
`truncate`/`min-w-0`/`break-words`/`line-clamp` en todo `src/`.

7 errores críticos corregidos: diálogos sin alto máximo (`Dialog.tsx`, `ConfirmDialog.tsx` —
los 6 formularios, hasta 10 campos, quedaban recortados por arriba y por abajo a la vez, sin
scroll y con el botón cerrar fuera de pantalla), filas de lista sin `min-w-0`/`truncate`
(scroll horizontal de toda la página con nombres largos), `ColorSwatchPicker` desbordando el
diálogo (312px rígidos en 240px disponibles), popup de `Select` sin alto máximo, KPIs del
dashboard en `text-3xl` desbordando columnas de 138px, tab bar de 6 ítems sin encogerse en
320px, y ausencia total de `env(safe-area-inset-left/right)`.

Cambios: `Dialog.tsx` pasa a hoja inferior (`max-h-[90dvh]`, scroll interno, asa, cabecera fija)
en <768px y modal centrado (`max-h-[85dvh]`) en md+ — estrena `--ease-drawer`, declarada desde
la Fase 2 y sin usar. `Select`/`ConfirmDialog` con alto máximo y scroll propios. Nueva variante
`Button size="icon"` (44×44 exactos, plan maestro regla 13) reemplaza los botones solo-icono
que eran `size="sm"` (36px) en las 4 filas de lista. `Money` con `whitespace-nowrap` y `lg`
responsive (`text-2xl` → `md:text-3xl`). `min-w-0`/`truncate`/`shrink-0` aplicado en las 4 filas
de lista, el dashboard y `CategoryBarChart`. `AppShell` gana `max-w-5xl` centrado, insets
laterales, y el tab link trunca en vez de desbordar. Filtros de `/transactions` (7 controles)
extraídos a `TransactionFilters.tsx`: en móvil solo "Buscar" + botón "Filtros (N)" que abre el
resto en la hoja inferior; en desktop, grid visible siempre. `QuickExpensePage`: importe con
`clamp()` en vez de ancho fijo, chips con `truncate`, botón de guardar sin desbordar. `index.html`
suma `interactive-widget=resizes-content` para que el teclado de Android no tape la hoja inferior.

Verificado: `npm run lint` (0 errores, 0 warnings tras corregir un import sin usar), `npm run
typecheck` (sin errores), `npm run test` (41/41 — mismos tests, no se agregaron), `npm run build`
(éxito, mismo warning preexistente de chunk >500kB). Probado en el navegador contra `/login` y
`/dev/design-system` (únicas rutas sin autenticación): sin desbordamiento horizontal en 1920px
(detector `scrollWidth > clientWidth` sobre todos los elementos), y el diálogo de ejemplo
(`ConfirmDialog` vía "Abrir diálogo") verificado por `getBoundingClientRect`: centrado exacto en
ambos ejes, `max-height` = 85% del viewport (confirma que el breakpoint `md:` se está aplicando,
no el de móvil). **No se pudo verificar en viewport móvil real**: `resize_window` de la
herramienta de Chrome sigue sin cambiar `window.innerWidth` (se probó explícitamente y quedó en
1920 tras pedir 390×780) — el mismo límite que ya habían anotado las Fases 7 y 8, y no hay
credenciales de prueba en esta sesión para ejercitar las pantallas autenticadas (dashboard,
movimientos, cuentas, quick-expense) donde vive la mayoría de las correcciones. Sigue pendiente,
igual que antes, la verificación en hardware real (iPhone/Android) con `npm run dev -- --host`.

### ⬜ Fases 9-15
Sin empezar.

---

## Cómo actualizar este archivo

Al cerrar una fase: cambiar su casilla en la tabla a ✅ (o 🟡 si queda parcial), completar fecha y commit, y agregar un párrafo breve en "Detalle" con qué se hizo, qué pruebas corrieron y qué quedó pendiente — mismo contenido que el reporte de cierre de fase que pide el plan maestro, sin inventar resultados de pruebas que no se ejecutaron.
