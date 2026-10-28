# Registro de fases — Ni Un Cinco

Seguimiento del plan maestro (`PLAN_DESARROLLO_FINANZAS.md`, 15 fases). Se actualiza **cada vez que se cierra una fase**: marcar casilla, fecha, commit y notas. No marcar una fase como completa sin haber corrido lint/typecheck/build/tests y reportado el resultado real (regla global 6 del plan maestro).

Leyenda: ✅ completa · 🟡 parcial / en curso · ⬜ no iniciada.

| # | Fase | Estado | Cerrada el | Commit |
|---|---|---|---|---|
| 1 | Diagnóstico y arquitectura | ✅ | 2026-10-28 | `806a9a5` |
| 2 | Sistema de diseño | ✅ | 2026-10-28 | `76974a5` |
| 3 | Estructura principal y navegación | ✅ | 2026-10-28 | _pendiente de commit_ |
| 4 | Supabase, autenticación y base de datos | ✅ | 2026-10-28 | _pendiente de commit_ |
| 5 | Cuentas, tarjetas y categorías | ⬜ | — | — |
| 6 | Movimientos financieros | ⬜ | — | — |
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

### ⬜ Fases 5-15
Sin empezar.

---

## Cómo actualizar este archivo

Al cerrar una fase: cambiar su casilla en la tabla a ✅ (o 🟡 si queda parcial), completar fecha y commit, y agregar un párrafo breve en "Detalle" con qué se hizo, qué pruebas corrieron y qué quedó pendiente — mismo contenido que el reporte de cierre de fase que pide el plan maestro, sin inventar resultados de pruebas que no se ejecutaron.
