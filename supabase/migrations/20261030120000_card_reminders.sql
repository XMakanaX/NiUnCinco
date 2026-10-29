-- Fase 10: recordatorio configurable de vencimiento de tarjeta de
-- crédito. Es solo un umbral visual (días antes del vencimiento en que
-- la UI resalta el pago) — igual que el aviso de Fase 9 en gastos
-- recurrentes, no existe mecanismo de notificación/correo confirmado,
-- así que nunca se afirma que se "envía" un recordatorio.

alter table public.cards
  add column reminder_days_before int null check (reminder_days_before between 1 and 30);
