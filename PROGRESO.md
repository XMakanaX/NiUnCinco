# Registro de fases — App de Finanzas Personales

Seguimiento del plan maestro (`PLAN_DESARROLLO_FINANZAS.md`, 15 fases). Se actualiza **cada vez que se cierra una fase**: marcar casilla, fecha, commit y notas. No marcar una fase como completa sin haber corrido lint/typecheck/build/tests y reportado el resultado real (regla global 6 del plan maestro).

Leyenda: ✅ completa · 🟡 parcial / en curso · ⬜ no iniciada.

| # | Fase | Estado | Cerrada el | Commit |
|---|---|---|---|---|
| 1 | Diagnóstico y arquitectura | ✅ | 2026-10-28 | `806a9a5` |
| 2 | Sistema de diseño | ✅ | 2026-10-28 | `76974a5` |
| 3 | Estructura principal y navegación | 🟡 | — | — |
| 4 | Supabase, autenticación y base de datos | ⬜ | — | — |
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

### 🟡 Fase 3 — Estructura principal y navegación (en curso)
Hecho (adelantado junto con la Fase 1): carpetas modulares, routing, layout responsive, tab bar móvil + sidebar escritorio, 4 de 6 pantallas (Inicio/Movimientos/Cuentas/Ajustes).
Falta: rutas **Presupuestos** e **Informes**, pantalla de error/ruta inexistente, `/quick-expense` (solo la ruta — su lógica es Fase 7), estados vacíos que expliquen cómo empezar, componentes compartidos de formulario/diálogo/mensaje/carga reusando los de la Fase 2.

### ⬜ Fases 4-15
Sin empezar. Dependen de que exista un proyecto Supabase conectado (`.env.local`) a partir de la Fase 4.

---

## Cómo actualizar este archivo

Al cerrar una fase: cambiar su casilla en la tabla a ✅ (o 🟡 si queda parcial), completar fecha y commit, y agregar un párrafo breve en "Detalle" con qué se hizo, qué pruebas corrieron y qué quedó pendiente — mismo contenido que el reporte de cierre de fase que pide el plan maestro, sin inventar resultados de pruebas que no se ejecutaron.
