# Finanzas

App de finanzas personales (PWA) — React + TypeScript + Vite + Tailwind CSS + Supabase.
Moneda principal CRC, soporte opcional USD, zona horaria `America/Costa_Rica`.

Arquitectura, schema, reglas de negocio y plan de fases completos en el documento de
Fase 0: `.claude/plans` del asistente (o pedir el resumen).

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar con los valores del proyecto Supabase
npm run dev                  # http://localhost:5173 — también accesible por IP en la red local
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | servidor de desarrollo |
| `npm run build` | typecheck + build de producción |
| `npm run preview` | sirve el build, con el service worker activo |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b` sin emitir |
| `npm run test` / `test:watch` | Vitest |
| `npm run format` | Prettier (con orden de clases de Tailwind) |
| `npm run db:types` | regenera `src/types/database.ts` desde Supabase local |

## Probar como PWA en un teléfono real

La emulación de Chrome no reproduce sticky-hover, safe areas, zoom de inputs ni el
flash de tap — hay que probarlo en hardware (ver skill `mobile-native`):

```bash
npm run dev -- --host   # o npm run preview -- --host
```

Abrir la IP que imprime Vite desde el teléfono (misma red Wi-Fi), agregar a la pantalla
de inicio y confirmar que abre en modo standalone.

## Estructura

Feature-first: `src/features/<feature>` contiene su propio `components/ hooks/ api/`.
`src/shared` es lo transversal (UI, helpers de dinero/fecha, offline). `src/app` compone
el router y los providers. Detalle completo en el plan de arquitectura, §4.1.
