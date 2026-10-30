import { supabase } from '@/shared/lib/supabase';
import { isUniqueViolation } from '@/shared/lib/postgresErrors';
import { registerExecutor } from '@/shared/offline/registry';
import { OP_KIND } from '@/shared/offline/types';
import type { MovementInput, TransferInput, CardPaymentInput } from '@/features/transactions/schema';
import type { GoalContributionInput } from '@/features/budgets/schema';

/**
 * Executors de las 5 operaciones encolables (ver `src/shared/offline/types.ts`).
 * Mismo payload exacto que armaban los hooks en línea de las Fases 6 y 9 —
 * `shared/offline` no puede importar estos tipos (regla de dependencia:
 * `shared` nunca importa de `features`), así que el casteo de `payload`
 * vive acá, en la capa `app`, que sí puede. Importado una sola vez por
 * efecto desde `src/app/providers.tsx`.
 */

registerExecutor(OP_KIND.MOVEMENT, async (payload, userId) => {
  const { clientId, input } = payload as { clientId: string; input: MovementInput };
  const { error } = await supabase
    .from('transactions')
    .insert({ ...input, user_id: userId, client_id: clientId, status: 'confirmed' });
  if (error && !isUniqueViolation(error)) throw error;
});

registerExecutor(OP_KIND.TRANSFER, async (payload) => {
  const { clientIdOut, clientIdIn, input } = payload as {
    clientIdOut: string;
    clientIdIn: string;
    input: TransferInput;
  };
  const { error } = await supabase.rpc('create_transfer', {
    p_from_account_id: input.from_account_id,
    p_to_account_id: input.to_account_id,
    p_amount: input.amount,
    p_currency: input.currency,
    p_occurred_on: input.occurred_on,
    p_notes: input.notes as string,
    p_client_id_out: clientIdOut,
    p_client_id_in: clientIdIn,
  });
  if (error && !isUniqueViolation(error)) throw error;
});

registerExecutor(OP_KIND.CARD_PAYMENT, async (payload) => {
  const { clientId, input } = payload as { clientId: string; input: CardPaymentInput };
  const { error } = await supabase.rpc('create_card_payment', {
    p_card_id: input.card_id,
    p_from_account_id: input.from_account_id,
    p_amount: input.amount,
    p_currency: input.currency,
    p_occurred_on: input.occurred_on,
    p_notes: input.notes as string,
    p_client_id: clientId,
  });
  if (error && !isUniqueViolation(error)) throw error;
});

registerExecutor(OP_KIND.GOAL_CONTRIBUTION, async (payload) => {
  const { clientId, goalId, input } = payload as {
    clientId: string;
    goalId: string;
    input: GoalContributionInput;
  };
  const { error } = await supabase.rpc('create_goal_contribution', {
    p_goal_id: goalId,
    p_type: input.type,
    p_amount: input.amount,
    p_occurred_on: input.occurred_on,
    p_notes: input.notes as string,
    p_client_id: clientId,
  });
  if (error && !isUniqueViolation(error)) throw error;
});

registerExecutor(OP_KIND.RECURRING_PAID, async (payload) => {
  const { clientId, recurringExpenseId, occurredOn } = payload as {
    clientId: string;
    recurringExpenseId: string;
    occurredOn: string;
  };
  const { error } = await supabase.rpc('mark_recurring_expense_paid', {
    p_recurring_expense_id: recurringExpenseId,
    p_occurred_on: occurredOn,
    p_client_id: clientId,
  });
  if (error && !isUniqueViolation(error)) throw error;
});
