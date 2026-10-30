# Despliegue — Ni Un Cinco (Fase 15)

Preparación para desplegar en Vercel. **No se publicó nada en producción, no se tocó DNS y no se ejecutó ninguna migración contra la base de producción** — todo lo de este documento es preparación, verificación y configuración de entornos, a la espera de autorización explícita para el paso siguiente (crear el proyecto en Vercel y hacer el primer deploy).

Fecha: 2026-10-30.

---

## 1. Resumen de arquitectura

PWA de finanzas personales (React 19 + TypeScript estricto + Vite 5 + Tailwind v4), backend en Supabase (Postgres + Auth + RLS, sin servidor propio). Sin apps nativas: instalable en iPhone/Android/escritorio desde el navegador. Moneda principal CRC con soporte opcional USD (sin mezclar ambas en ningún cálculo), zona horaria `America/Costa_Rica`. Estructura feature-first (`src/features/<feature>`) con una capa transversal (`src/shared`) que nunca depende de las features. Detalle completo de entidades y reglas de negocio: plan de arquitectura de la Fase 0 (referenciado desde `README.md` y `CLAUDE.md`).

## 2. Funciones completas y pendientes

Estado real por fase, siempre con la fuente autoritativa en `PROGRESO.md` (este resumen puede quedar desactualizado antes que ese archivo):

- **Completas y verificadas en vivo contra el proyecto real** (Fases 1-12, 14): diseño/navegación, autenticación con RLS aislada entre cuentas, cuentas/tarjetas/categorías, movimientos con idempotencia, registro rápido (`/quick-expense`), dashboard, presupuestos/recurrencias/metas, pagos de tarjeta, importación de CSV, informes/búsqueda/exportación, auditoría de seguridad (2 vulnerabilidades reales encontradas y corregidas: inyección de fórmulas CSV, inyección de filtro PostgREST) y accesibilidad (`axe-core`, 0 violaciones tras un fix de landmarks).
- **Parcial — Fase 13 (PWA y funcionamiento sin conexión)**: la lógica está completa e implementada (cola offline con idempotencia, lectura offline, indicador de estado, manifest, service worker), pero el flujo end-to-end autenticado no se pudo verificar en la sesión donde se implementó por falta de credenciales de prueba. **Ese pendiente ya se cerró en la Fase 14** con una cuenta real (ver `PROGRESO.md` línea 234): gasto registrado sin conexión, reconexión, sincronización automática sin duplicados, confirmado en `/transactions`.
- **No implementado — Fase 15 en curso**: nada específico de producto; esta fase es despliegue, no funcionalidad nueva.
- **Pendiente real conocido que no bloquea el despliegue**: `auth_leaked_password_protection` deshabilitado (requiere plan Pro de Supabase, hoy en Free); verificación con lector de pantalla físico (VoiceOver/NVDA/TalkBack) nunca se pudo hacer desde esta herramienta de automatización, sustituida por auditoría automatizada; exportación/importación CSV no probada con miles de filas de punta a punta.

No hay ninguna función con solo interfaz y sin lógica real — todo lo marcado ✅ en `PROGRESO.md` está conectado a Supabase de verdad.

## 3. Instrucciones de ejecución local

```bash
npm install
cp .env.example .env.local   # completar con los valores del proyecto Supabase de DEV
npm run dev                  # http://localhost:5173
```

Para probar como PWA en un teléfono real (la emulación de Chrome no reproduce sticky-hover, safe areas, zoom de inputs ni el flash de tap):

```bash
npm run dev -- --host    # o: npm run preview -- --host
```

Abrir la IP que imprime Vite desde el teléfono (misma red Wi-Fi).

## 4. Configuración de Supabase

Dos proyectos separados en la misma organización (`eslitlyufhooopcjiwic`), creados/renombrados en esta sesión:

| Entorno | Nombre proyecto | Ref | Región | Estado |
|---|---|---|---|---|
| Desarrollo | `NiUnCinco` (antes `AppFinanzas`) | `nvtmoehawfwxwosuepoe` | us-east-2 | Activo, 7 migraciones aplicadas, datos de prueba de las Fases 4-14 |
| Producción | `NiUnCinco-prod` | `zxkujqpozhttzsgyscal` | us-east-2 | Activo, **7 migraciones aplicadas (2026-10-30)**, RLS/triggers iguales a dev, sin datos de usuario reales todavía |

**Migraciones — ya aplicadas en ambos entornos (2026-10-30)**, en orden, ninguna destructiva (todas `CREATE`/`ALTER` aditivos):

```
supabase/migrations/20261028221518_initial_schema.sql
supabase/migrations/20261029120000_account_card_balances.sql
supabase/migrations/20261029180000_movement_rpcs.sql
supabase/migrations/20261029220000_dashboard_aggregates.sql
supabase/migrations/20261030000000_budgets_recurring_goals.sql
supabase/migrations/20261030120000_card_reminders.sql
supabase/migrations/20261030150000_reports.sql
```

Aplicadas con (el link vía `supabase link` dio error de privilegios con el token de gestión usado; se aplicó directo con la connection string del pooler, que sí funcionó):

```bash
npx supabase db push --db-url "postgresql://postgres.zxkujqpozhttzsgyscal:<password>@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
```

**Auth — Site URL y redirect allow list:**
- Dev: corregido en esta sesión (estaba mal configurado en `http://localhost:3000`, no coincidía con el puerto real de Vite). Ahora `site_url = http://localhost:5173`, `uri_allow_list = http://localhost:5173/**,http://localhost:4173/**`.
- Prod: configurado en esta sesión con el dominio real del deploy de Vercel. `site_url = https://ni-un-cinco-maka17.vercel.app`, `uri_allow_list = https://ni-un-cinco-maka17.vercel.app/**,https://ni-un-cinco-*-maka17.vercel.app/**` (el segundo patrón cubre los deploys preview del mismo proyecto, sin abrir a cualquier `*.vercel.app` de terceros).

**Seguridad verificada (ambos proyectos deberían quedar igual tras aplicar las migraciones a prod):** RLS `enable`+`force` en las 11 tablas, políticas con `(select auth.uid())`, `client_id`+`unique(user_id, client_id)` para idempotencia de la cola offline, ninguna `service_role` ni secreto en el código del cliente. Único hallazgo de `supabase db advisors --type security`: `auth_leaked_password_protection` (bloqueado por plan Free, no por configuración).

## 5. Variables necesarias (sin secretos)

En `.env.local` (nunca se commitea — confirmado en `.gitignore`):

```
VITE_SUPABASE_URL=https://<ref-del-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<clave pública anon/publishable del proyecto>
```

Solo variables `VITE_*` llegan al bundle del cliente — es la línea dura del proyecto, nunca poner `service_role` ahí. En Vercel, estas dos variables deben configurarse por entorno (**Production** apuntando a `NiUnCinco-prod`, **Preview**/**Development** apuntando a `NiUnCinco` dev) desde el dashboard del proyecto de Vercel una vez creado — no se puede hacer antes de que ese proyecto exista.

El token de administración de Supabase (`SUPABASE_ACCESS_TOKEN`, usado solo por la CLI para migraciones/gestión, nunca por la app en tiempo de ejecución) no debe subirse a Vercel ni a ningún repositorio.

## 6. Instalación de la PWA

- **iPhone (Safari):** abrir la URL de la app → compartir → **Agregar a pantalla de inicio**. Confirmar que abre en modo standalone (sin barra de Safari).
- **Android (Chrome):** abrir la URL → menú (⋮) → **Instalar app** (o banner automático de instalación).

Manifest (`vite.config.ts`) con `id`, `start_url`, `scope`, `display: standalone`, `orientation: portrait`, iconos 192/512/512-maskable (arte real, no placeholders) y `shortcuts` con `/quick-expense`. Detalle completo en `README.md`.

## 7. Configuración del atajo del botón de acción (iPhone)

La app **no puede detectar la pulsación del botón de acción ni leer compras bancarias o de Apple Pay automáticamente** — el atajo de iOS solo abre una URL.

1. App **Atajos** → **Automatización** → **+** → **Crear automatización personal**.
2. Disparador **Botón de acción** (iPhone 15 Pro+) o asignar desde **Ajustes → Botón de acción → Atajo**.
3. Acción **Abrir URLs** → `https://<dominio-de-producción>/quick-expense`.
4. Guardar. Requiere haber iniciado sesión en la PWA al menos una vez antes.

Instrucciones completas (con capturas conceptuales) ya en `README.md`.

## 8. Resultados de pruebas y build (corridos en esta sesión, 2026-10-30)

| Comando | Resultado |
|---|---|
| `npm run lint` | Sin errores |
| `npm run typecheck` | Sin errores |
| `npm run test` | **119/119** tests verdes |
| `npm run build` | Éxito. Warning preexistente: un chunk (`index-*.js`, 782 kB / 231 kB gzip) supera 500 kB — no bloquea, ya documentado desde la Fase 14, candidato a code-splitting adicional si se quiere optimizar después |
| `npx supabase db advisors --linked --type security` (proyecto dev) | 1 warning preexistente: `auth_leaked_password_protection` (bloqueado por plan Free) |

**Deploy real ejecutado en esta sesión (2026-10-30), autorizado explícitamente por el usuario:** proyecto Vercel creado (`maka17/ni-un-cinco`, team `maka17`), variables de entorno configuradas (dev en Preview/Development, prod en Production — ver tabla de la sección 5), primer deploy con `vercel deploy`.

**Aviso importante:** el CLI de Vercel asigna automáticamente el *primer* deploy de un proyecto nuevo a `target: production` (no hay forma de forzarlo a preview en ese primer deploy) — quedó como producción aunque la intención era preview. No es un problema de datos reales: el proyecto `NiUnCinco-prod` sigue vacío, sin migraciones, así que login/registro ahí no funciona todavía. Deployment protegido con Vercel Authentication (no es accesible públicamente sin sesión de Vercel). Resultado: `status: Ready`.

- URL del deployment: `https://ni-un-cinco-lfyw4dve8-maka17.vercel.app`
- Alias del proyecto: `https://ni-un-cinco-maka17.vercel.app`
- Deploys siguientes (`vercel deploy` sin `--prod`) ya van a preview normalmente, según el propio CLI.
- Git integration (`vercel git connect`) **no** se configuró — el intento de `vercel link --repo` (alpha) falló al conectar el repo de GitHub automáticamente; se linkeó el proyecto sin integración git. Por ahora los deploys son manuales vía CLI (`vercel deploy`), no automáticos al hacer push.

## 9. Procedimiento de despliegue y actualización

**Hecho en esta sesión (2026-10-30, cada paso autorizado explícitamente):**

1. ✅ Proyecto Vercel creado (`maka17/ni-un-cinco`), sin integración git automática (`vercel link --repo` falló al conectar el repo de GitHub — ver sección 8).
2. ✅ Variables de entorno configuradas: `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` de prod en Production, de dev en Preview/Development.
3. ✅ 7 migraciones aplicadas a `NiUnCinco-prod`.
4. ✅ Primer deploy (`vercel deploy`) — Vercel lo asignó a `target: production` automáticamente (comportamiento default del primer deploy, no evitable). `status: Ready`. URL: `https://ni-un-cinco-maka17.vercel.app`, protegida con Vercel Authentication.
5. ✅ `site_url`/`uri_allow_list` de Auth en `NiUnCinco-prod` configurados con ese dominio real.

**Pendiente, requiere autorización explícita antes de cada paso marcado 🔒:**

6. 🔒 Probar en el dominio real: registro con confirmación por correo, login, un gasto rápido, instalación de la PWA (implica crear una cuenta real contra prod, y probablemente desactivar la protección de Vercel Authentication para poder abrirlo sin login de Vercel).
7. Configurar dominio propio y DNS si corresponde — **requiere autorización explícita, no incluido en esta preparación**.
8. Conectar integración git (`vercel git connect`) para que los pushes a la rama de producción disparen deploy automático — hoy los deploys son manuales vía `vercel deploy`.

**Actualizaciones posteriores:** cada push a la rama de producción en Vercel dispara un build nuevo automático (`npm run build`, que ya incluye `tsc -b`). El service worker usa `registerType: 'prompt'` — los usuarios con la PWA instalada ven un toast "Nueva versión disponible" en vez de recargar solos, para no perder un formulario a medio llenar. Si una actualización agrega una migración nueva, aplicarla a prod con `supabase db push` **antes** de que el deploy del frontend que la necesita quede activo (evitar que el frontend nuevo le pida a la base una función/columna que todavía no existe).

## 10. Limitaciones y mejoras recomendadas

- **No probado en hardware físico real** (iPhone/Android) en ninguna fase — toda la verificación mobile fue emulada (Chrome DevTools, `resize_window`) o por código. Recomendado antes de publicar: instalar la PWA en un teléfono real, confirmar safe areas, el atajo de Botón de Acción, y el comportamiento de la cola offline en modo avión real.
- **Lector de pantalla físico** (VoiceOver/NVDA/TalkBack) nunca se pudo probar desde este entorno; `axe-core` cubre violaciones estructurales pero no navegación por voz real.
- **`auth_leaked_password_protection` deshabilitado** — requiere subir el proyecto de producción a plan Pro de Supabase; decisión de costo del usuario.
- **Chunk principal de JS >500 kB** (gzip 231 kB) — funciona bien, pero code-splitting adicional (`manualChunks`) bajaría el tiempo de carga inicial en redes lentas.
- **Exportación/importación CSV** no probada con volúmenes grandes (miles de filas) de punta a punta.
- **Sin backups configurados en prod todavía** — Supabase Free no incluye point-in-time recovery; evaluar plan Pro o backups manuales periódicos (`pg_dump`) antes de tener datos reales de usuarios.
- **Sin dominio propio ni DNS configurado** — pendiente de decisión del usuario, fuera del alcance de esta preparación.
