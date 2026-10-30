# Ni Un Cinco

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
| `npm run db:types` | regenera `src/types/database.ts` desde el proyecto Supabase linkeado |

## Probar como PWA en un teléfono real

La emulación de Chrome no reproduce sticky-hover, safe areas, zoom de inputs ni el
flash de tap — hay que probarlo en hardware (ver skill `mobile-native`):

```bash
npm run dev -- --host   # o npm run preview -- --host
```

Abrir la IP que imprime Vite desde el teléfono (misma red Wi-Fi), agregar a la pantalla
de inicio y confirmar que abre en modo standalone.

## Registro rápido desde el botón de acción (iPhone)

`/quick-expense` es la pantalla de registro rápido de gastos (Fase 7). El
atajo de iOS **solo abre esa URL** — la PWA no puede detectar la pulsación
del botón de acción ni leer compras de Apple Pay o del banco automáticamente.
Captura bancaria automática requeriría una integración distinta, no disponible hoy.

**Configurar el atajo (Atajos de Apple):**

1. Abrí la app **Atajos** → pestaña **Automatización** → **+** → **Crear
   automatización personal**.
2. Elegí el disparador **Botón de acción** (iPhone 15 Pro o más nuevo) o
   creá un atajo normal y asignalo desde **Ajustes → Botón de acción →
   Atajo**.
3. Agregá la acción **Abrir URLs** y pegá la URL de la app instalada, por
   ejemplo `https://<tu-dominio>/quick-expense`.
4. Guardá. Un toque en el botón de acción abre la PWA directo en el
   formulario de gasto rápido (hay que haber iniciado sesión antes al
   menos una vez).

**Instalar la PWA:**

- **iPhone (Safari):** abrir la URL de la app → botón compartir → **Agregar
  a pantalla de inicio**. Confirma que abre en modo standalone (sin barra
  de Safari).
- **Android (Chrome):** abrir la URL → menú (⋮) → **Instalar app** (o
  **Agregar a pantalla de inicio**). Chrome también puede mostrar un
  banner de instalación automático.

Si el dispositivo está sin conexión al guardar un gasto rápido, el
movimiento queda en una cola local (IndexedDB) marcado como pendiente —
nunca se muestra como confirmado hasta que el servidor responde — y se
envía solo al recuperar la señal. Detalle completo del funcionamiento
offline en la sección siguiente.

## Funcionamiento sin conexión (Fase 13)

**Qué sigue funcionando sin internet:** navegar las pantallas con datos ya
cargados antes (cache de React Query persistido en IndexedDB, 24 h),
registrar un movimiento, una transferencia, un pago de tarjeta, un aporte
o retiro de meta, o marcar un gasto recurrente como pagado — estas 5
operaciones tienen clave de idempotencia en la base (`client_id` +
`unique(user_id, client_id)`) y se encolan localmente; un reintento nunca
las duplica.

**Qué no funciona sin internet:** crear, editar, archivar o eliminar
cuentas, tarjetas, categorías, presupuestos, metas o recurrentes, anular
cualquier movimiento, o editar el perfil. Ninguna de estas tiene clave de
idempotencia, así que encolarlas arriesgaría duplicados — en vez de eso
muestran un error explícito ("sin conexión, esta acción necesita
internet") y no quedan pendientes.

**Indicador de estado:** una barra fija en la parte inferior de la
pantalla avisa cuando no hay conexión, cuántas operaciones quedan sin
enviar, cuándo se están sincronizando, y si alguna falló con un error real
del servidor (ver "Operaciones sin enviar" en Ajustes, con el mensaje
exacto y botones para reintentar o descartar). Nunca dice "guardado" ni
"listo" para algo que el servidor todavía no confirmó.

**Conflictos entre dispositivos:** las 5 operaciones encolables son
idempotentes por diseño de base de datos, así que un reintento repetido
—incluso desde dos pestañas o dispositivos— nunca genera un duplicado; no
hay "última edición gana" que resolver ahí. El resto de las ediciones
(cuentas, presupuestos, etc.) solo ocurre online, así que sigue la regla
normal de Postgres: la última escritura que llega gana.

**Actualización de la app:** el service worker usa `registerType: 'prompt'`
— cuando hay una versión nueva, aparece un toast "Nueva versión disponible
— Actualizar" en vez de recargar solo (evita perder un formulario a medio
llenar).

**Limitaciones conocidas de iOS, sin promesas falsas:**

- Safari no tiene Background Sync: la cola solo se envía mientras la app
  está abierta (al cargar o al recuperar la señal), no en segundo plano.
- No hay notificaciones push implementadas. En iOS, además, requerirían la
  PWA instalada en la pantalla de inicio.
- iOS puede desalojar el cache del service worker tras ~7 días sin abrir
  la app — puede pedir recargar desde la red la primera vez que se vuelve
  a abrir.
- El modo standalone (sin la barra de Safari) requiere instalación previa
  desde "Agregar a pantalla de inicio".

**Cierre de sesión:** borra el cache de consultas persistido y la cola de
operaciones pendientes — si hay alguna sin enviar, la app avisa antes de
descartarla. Cambiar de cuenta en la misma pestaña también limpia el cache
del usuario anterior antes de cargar el nuevo, para que nunca se vean
datos financieros de una cuenta mientras hay otra activa.

## Estructura

Feature-first: `src/features/<feature>` contiene su propio `components/ hooks/ api/`.
`src/shared` es lo transversal (UI, helpers de dinero/fecha, offline). `src/app` compone
el router y los providers. Detalle completo en el plan de arquitectura, §4.1.
