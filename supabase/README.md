# Supabase — Fase 4

## Esquema

`migrations/20261028221518_initial_schema.sql` crea:

- `profiles` — moneda principal y huso horario del usuario.
- `accounts`, `cards` — cuentas (efectivo/banco/otra) y tarjetas (débito/crédito).
- `categories` — con subcategorías (`parent_id`), sembradas por defecto al crear la cuenta.
- `transactions` — ingresos y gastos, más el lado contable de transferencias y pagos de tarjeta.
- `transfers`, `card_payments` — entre cuentas propias / pago de tarjeta (no son ingreso ni gasto, regla global 17).
- `budgets`, `recurring_expenses`, `goals`, `goal_contributions` — preparadas para las Fases 9-10.

Todas las tablas con datos de usuario tienen `enable row level security` + `force row level security`, con policies `to authenticated using ((select auth.uid()) = user_id)` (o `= id` en `profiles`). El trigger `handle_new_user` (en `auth.users`) crea el perfil y las 9 categorías iniciales al registrarse.

La lógica de negocio (saldos consistentes, RPCs atómicas para transferencias/pagos de tarjeta) **no** está en esta migración — es de las Fases 5-10.

## Aplicar la migración

Sin Docker local disponible en esta máquina, la forma más simple es pegar el contenido de la migración en el **SQL Editor** del dashboard de Supabase (Project > SQL Editor) y ejecutarlo una sola vez contra el proyecto.

Alternativa con el CLI (requiere `npx supabase login` interactivo + contraseña de la base):

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

## Regenerar tipos TypeScript

Una vez aplicada la migración, con el CLI logueado (no hace falta link ni contraseña de base):

```bash
npx supabase gen types typescript --project-id <project-ref> --schema public > src/types/database.ts
```

`src/types/database.ts` tiene por ahora una versión escrita a mano que refleja esta migración — reemplazarla con el comando de arriba apenas sea posible generar contra el proyecto real, y mantenerla sincronizada en cada migración nueva mientras tanto.

## Pruebas de aislamiento entre usuarios

Ejecutadas el 2026-10-28 contra el proyecto real (`nvtmoehawfwxwosuepoe`), con dos cuentas de prueba creadas vía `/register` y confirmadas por correo (`luisra1996cr+fase4test@gmail.com` y `...+fase4testb@gmail.com`):

1. Registro de A → trigger `handle_new_user` creó su `profiles` (CRC, `America/Costa_Rica`) y 9 categorías automáticamente. Verificado por SQL.
2. A editó su perfil (nombre + moneda) desde `/settings` — persistió en la base, sin errores de consola.
3. Logueado como B, vía fetch directo al REST de PostgREST con el `access_token` de B:
   - `select` sobre categorías propias → 200, 9 filas.
   - `select` sobre el perfil de A (`id=eq.<A>`) → 200, **0 filas** (RLS filtra, no error).
   - `select` sobre categorías de A (`user_id=eq.<A>`) → 200, **0 filas**.
   - `update` intentando cambiar `display_name` del perfil de A → 200, **0 filas afectadas**; se confirmó por SQL que el valor de A no cambió.
   - `delete` sobre el perfil de A → 200, **0 filas afectadas**.
4. `supabase db advisors --linked --type security` → sin hallazgos.

Las dos cuentas de prueba quedan en el proyecto (Authentication > Users en el dashboard) — eliminarlas a mano si se quiere un proyecto limpio antes de la Fase 5; no se borraron automáticamente porque eso requiere la `service_role` key, que esta sesión nunca tocó.
