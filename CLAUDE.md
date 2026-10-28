# CLAUDE.md — App de Finanzas Personales

Instrucciones de proyecto para Claude Code en este repositorio. Complementan (no reemplazan) las reglas globales del usuario.

## Qué es esto

PWA de finanzas personales en CRC (colones costarricenses) con soporte opcional USD, zona horaria `America/Costa_Rica`. Instalable en iPhone, Android y escritorio desde una sola base de código. Sin apps nativas separadas.

## Plan maestro — fuente de verdad

**`PLAN_DESARROLLO_FINANZAS.md`** en la raíz del repo es el plan maestro oficial: 15 fases, cada una con su prompt y criterio de aceptación, más 20 reglas globales obligatorias y un "prompt de control" para cerrar cada fase. Ante cualquier duda de alcance o prioridad, ese documento manda.

Trabajar **una fase a la vez**, en el orden del documento, y esperar autorización explícita del usuario antes de avanzar a la siguiente. No asumir aprobación por silencio.

## Reglas globales obligatorias (resumen operativo)

Lista completa en `PLAN_DESARROLLO_FINANZAS.md`. Las que más impactan el día a día de implementación:

- Inspeccionar código/arquitectura existente antes de cambiar algo; preservar lo que funcione.
- No implementar fases futuras sin autorización explícita.
- Al cerrar una fase: correr lint, typecheck, build y tests disponibles; corregir y volver a comprobar. Reportar qué se ejecutó y su resultado real — **nunca afirmar que una prueba pasó sin haberla corrido**.
- No inventar datos, credenciales, resultados de pruebas, tasas de cambio ni estado de despliegue.
- No desplegar a producción, tocar DNS ni correr migraciones destructivas sin autorización explícita.
- No guardar número completo de tarjeta, CVV, PIN ni credenciales bancarias.
- Nunca exponer la `service_role` key de Supabase ni ningún secreto en el cliente. Solo `VITE_*` llega al bundle.
- RLS activo en todas las tablas con datos personales, siempre. Nunca desactivarlo para facilitar desarrollo.
- Evitar dependencias redundantes — revisar `package.json` antes de instalar algo nuevo.
- Mobile-first, accesible, responsive, compatible con safe areas de iPhone.
- Animación discreta y rápida; respetar `prefers-reduced-motion`.
- La app no puede detectar la pulsación del botón de acción del iPhone ni leer compras bancarias automáticamente — el atajo de iOS solo abre `/quick-expense`.
- Operación local pendiente de sincronizar nunca se muestra como confirmada hasta que el servidor responda.
- Transferencia entre cuentas propias no es ingreso ni gasto. Pago de tarjeta no vuelve a contar la compra como gasto.
- Saldos con regla de cálculo consistente y una sola fuente de verdad.
- Operación que toca varios registros a la vez: transacción SQL o RPC atómica, no varias llamadas sueltas desde el cliente.
- Nunca sumar CRC y USD sin tasa de conversión explícita, con criterio y fecha identificables.

## Skills instaladas

En `.agents/skills/` (y espejadas en `.claude/skills/`). Invocar la que corresponda a la fase en curso, no antes. No afirmar que se usó una skill si no está disponible.

Invocables por el modelo: `apple-design`, `emil-design-eng`, `mobile-native`, `break-ui`, `animate`, `animation-performance`, `vercel-react-best-practices`, `vercel-composition-patterns`, `vercel-optimize`, `web-design-guidelines`, `deploy-to-vercel`, `supabase`, `supabase-postgres-best-practices`.

Presentes en disco pero **no** auto-invocables (`disable-model-invocation` o ausentes del registro) — usar su contenido como referencia leída, no como skill ejecutada: `pick-ui-library`, `review-animations`.

## Stack actual

React 19 + TypeScript (estricto) + Vite 5 + Tailwind v4 + Supabase (`@supabase/supabase-js`) + React Router 7 + TanStack Query 5 + Zustand + React Hook Form + Zod + `idb` + `vite-plugin-pwa`. Detalle completo y por qué de cada elección: `README.md` y el plan de arquitectura de la Fase 0 (`.claude/plans/actu-como-arquitecto-de-parsed-shannon.md`).

Explícitamente descartado por redundante: axios, dexie, date-fns/dayjs (salvo que aparezca aritmética de fechas compleja), redux/jotai/recoil, librerías de componentes completas (MUI/Chakra/Ant), currency.js.

## Estructura de carpetas

Feature-first. `src/features/<feature>/` (components/hooks/api/schema propios). `src/shared/` es transversal: `ui/`, `lib/` (`supabase.ts`, `money.ts`, `date.ts`, `queryClient.ts`), `offline/`, `hooks/`. `src/app/` compone router y providers. Regla de dependencia: `shared` nunca importa de `features`; una feature no importa de otra.

## Convenciones de dinero y fecha

- Dinero: `numeric(14,2)` en Postgres, nunca `float`. Formateo siempre con `Intl.NumberFormat`, nunca concatenación manual de símbolo (`src/shared/lib/money.ts`).
- Fecha contable: `date` (no `timestamptz`) derivada con `Intl.DateTimeFormat` fijando `timeZone: 'America/Costa_Rica'` (`src/shared/lib/date.ts`, constante `APP_TIME_ZONE`). Nunca `toISOString()` para la fecha contable — usa UTC y desplaza el día cerca de medianoche en Costa Rica.
- Conversión CRC↔USD: la tasa (`fx_rate`) se congela en el momento de la transacción y no se recalcula retroactivamente.

## Seguridad — líneas duras

- RLS en toda tabla de usuario, políticas por operación, `(select auth.uid())` en lugar de `auth.uid()` (una evaluación por consulta, no por fila).
- `client_id` (UUID de cliente) + `unique(user_id, client_id)` en `transactions`: la idempotencia de la cola offline la impone la base de datos, no el cliente.
- IndexedDB es cache, nunca fuente de verdad; se borra completa al cerrar sesión.

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run build        # typecheck + build de producción
npm run preview       # sirve el build, service worker activo
npm run lint          # ESLint
npm run typecheck     # tsc -b
npm run test          # Vitest (test:watch para modo watch)
npm run format        # Prettier
npm run db:types       # regenera src/types/database.ts desde Supabase local
```

Probar PWA en hardware real: `npm run dev -- --host` o `npm run preview -- --host`, abrir la IP impresa desde el teléfono. La emulación de Chrome no reproduce sticky-hover, safe areas, zoom de inputs ni el flash de tap.

## Estado actual (ver también el prompt de control al cerrar cada fase)

- **Fase 1 (diagnóstico y arquitectura):** entregada y aprobada.
- **Reconciliación de alcance (decisión del usuario):** el andamiaje técnico construido antes de este documento (Vite/TS/Tailwind/PWA, `AppShell` con tab bar/sidebar, router con páginas placeholder, helpers de dinero/fecha con tests, `vercel.json`) se adelantó a la Fase 3 sin autorización y se construyó antes del sistema de diseño de la Fase 2. El usuario decidió: **mantenerlo como base técnica**, hacer la Fase 2 ahora sobre esa base, y completar lo que falta de Fase 3 después.
- **Fase 2 (sistema de diseño):** entregada. Tokens (`src/index.css`, `@theme` de Tailwind v4): paleta "papel de contabilidad" clara + oscura vía `prefers-color-scheme` y `data-theme` manual (sin FOUC, script inline en `index.html`), tipografía de sistema para UI + monoespaciada de sistema para todo monto (cifras tabulares, firma visual del sistema), radios/sombras/easings. Componentes en `src/shared/ui/`: `Button`, `Input`, `Select` (Base UI), `Dialog` (Base UI), `Card`, `Money`, `Badge`, `EmptyState`, `Skeleton`, `ThemeToggle`. `toast.ts` envuelve sonner. Vitrina de revisión en `/dev/design-system` (no enlazada en nav, retirar antes de producción). Revisado visualmente en claro/oscuro con Chrome (diálogo, select, toggle de tema, toasts) — sin errores de consola. 12 tests unitarios nuevos. Pendiente real: `Menu` de Base UI (no hizo falta todavía) y la paleta de categorías (colores por categoría, Fase 5).
- **Dependencias de la Fase 2:** `@base-ui/react`, `lucide-react`, `class-variance-authority`. Se migró `zod` de v3 a v4.6.7 y `@hookform/resolvers` a v6 porque v3 tenía una vulnerabilidad alta (GHSA-mrhx-c7xc-m3w5, agotamiento de memoria) sin parche en esa rama — se hizo antes de escribir el primer schema para no migrar código ya escrito. Quedan vulnerabilidades de **toolchain de desarrollo only** (vite/vitest/esbuild/workbox, no llegan a producción) que requieren saltos de versión mayor; no se forzaron por riesgo de romper `vite-plugin-pwa` — revisar en Fase 7/14.
- **Fase 3 (estructura/navegación):** parcial. Hecho: carpetas modulares, routing, layout responsive, tab bar móvil + sidebar escritorio, 4 de 6 pantallas (Inicio/Movimientos/Cuentas/Ajustes). Falta: rutas **Presupuestos** e **Informes**, pantalla de error/ruta inexistente, `/quick-expense` (solo la ruta, la lógica es Fase 7), estados vacíos que expliquen cómo empezar, componentes compartidos de formulario/diálogo/mensaje/loading (se completa después de la Fase 2, reusando sus componentes base).
- **Fase 4 (Supabase/Auth/DB):** no iniciada. Sin proyecto Supabase conectado, sin `.env.local`, sin migraciones, sin RLS en código. `src/types/database.ts` es stub vacío.
- **Fases 5-15:** sin empezar.
- Nada desplegado a Vercel, producción sin tocar.

No declarar cerrada una fase del plan maestro sin correr lint/typecheck/build/tests y reportar el resultado real.
