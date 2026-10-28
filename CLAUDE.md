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

## Estado actual

**`PROGRESO.md`** es el registro oficial de avance: tabla de las 15 fases con estado (✅/🟡/⬜), fecha de cierre y commit, más un detalle por fase. Se actualiza **cada vez que se cierra una fase** — ahí, no acá. Antes de retomar trabajo o reportar avance, leer ese archivo primero.

Resumen rápido (ver `PROGRESO.md` para el detalle real):

- Fases 1 y 2 completas.
- Fase 3 parcial — adelantada junto con la Fase 1 sin autorización en su momento (routing/shell), reconciliado con el usuario: se completa después de la Fase 2 reusando sus componentes.
- Fases 4-15 sin empezar. No hay proyecto Supabase conectado (`.env.local` sin crear); nada desplegado a Vercel.
- Dependencias/decisiones técnicas notables de cada fase: ver `PROGRESO.md` → sección "Detalle".

No declarar cerrada una fase del plan maestro sin correr lint/typecheck/build/tests, reportar el resultado real, y actualizar `PROGRESO.md`.
