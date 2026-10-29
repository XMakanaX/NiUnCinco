import { useState } from 'react';
import { Plus, PiggyBank, Repeat, Target } from 'lucide-react';
import { Tabs, TabPanel } from '@/shared/ui/Tabs';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageMessage } from '@/shared/ui/PageMessage';
import { useBudgets, type Budget } from '@/features/budgets/api/useBudgets';
import { useRecurringExpenses, type RecurringExpense } from '@/features/budgets/api/useRecurringExpenses';
import { useGoals, type Goal } from '@/features/budgets/api/useGoals';
import { useCategories } from '@/features/categories/api/useCategories';
import { BudgetFormDialog } from '@/features/budgets/components/BudgetFormDialog';
import { BudgetListItem } from '@/features/budgets/components/BudgetListItem';
import { categoryNameFor } from '@/features/budgets/lib/categoryName';
import { RecurringExpenseFormDialog } from '@/features/budgets/components/RecurringExpenseFormDialog';
import { RecurringExpenseListItem } from '@/features/budgets/components/RecurringExpenseListItem';
import { GoalFormDialog } from '@/features/budgets/components/GoalFormDialog';
import { GoalContributionDialog } from '@/features/budgets/components/GoalContributionDialog';
import { GoalListItem } from '@/features/budgets/components/GoalListItem';

const TABS = [
  { value: 'budgets', label: 'Presupuestos' },
  { value: 'recurring', label: 'Recurrentes' },
  { value: 'goals', label: 'Metas' },
];

function BudgetsTab() {
  const { data: budgets, isPending, isError } = useBudgets();
  const { data: categories = [] } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (budget: Budget) => {
    setEditing(budget);
    setDialogOpen(true);
  };

  if (isPending) return <LoadingState />;
  if (isError) return <PageMessage tone="error">No se pudieron cargar los presupuestos.</PageMessage>;

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={openCreate} className="self-end">
        <Plus className="size-4" aria-hidden />
        Nuevo presupuesto
      </Button>
      {budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Sin presupuestos todavía"
          description="Creá un límite general o por categoría para un mes y seguí cuánto llevás gastado."
        />
      ) : (
        budgets.map((budget) => (
          <BudgetListItem
            key={budget.id}
            budget={budget}
            categoryName={categoryNameFor(categories, budget.category_id)}
            onEdit={() => openEdit(budget)}
          />
        ))
      )}
      <BudgetFormDialog open={dialogOpen} onOpenChange={setDialogOpen} budget={editing} />
    </div>
  );
}

function RecurringTab() {
  const { data: recurringExpenses, isPending, isError } = useRecurringExpenses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (recurringExpense: RecurringExpense) => {
    setEditing(recurringExpense);
    setDialogOpen(true);
  };

  if (isPending) return <LoadingState />;
  if (isError) return <PageMessage tone="error">No se pudieron cargar los gastos recurrentes.</PageMessage>;

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={openCreate} className="self-end">
        <Plus className="size-4" aria-hidden />
        Nuevo recurrente
      </Button>
      {recurringExpenses.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Sin gastos recurrentes todavía"
          description="Registrá servicios, alquiler o suscripciones para ver sus próximos vencimientos."
        />
      ) : (
        <>
          <PageMessage tone="info">
            El recordatorio solo marca la suscripción como prioritaria en esta lista: la app no envía
            notificaciones ni correos todavía.
          </PageMessage>
          {recurringExpenses.map((recurringExpense) => (
            <RecurringExpenseListItem
              key={recurringExpense.id}
              recurringExpense={recurringExpense}
              onEdit={() => openEdit(recurringExpense)}
            />
          ))}
        </>
      )}
      <RecurringExpenseFormDialog open={dialogOpen} onOpenChange={setDialogOpen} recurringExpense={editing} />
    </div>
  );
}

function GoalsTab() {
  const { data: goals, isPending, isError } = useGoals();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setDialogOpen(true);
  };

  if (isPending) return <LoadingState />;
  if (isError) return <PageMessage tone="error">No se pudieron cargar las metas.</PageMessage>;

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={openCreate} className="self-end">
        <Plus className="size-4" aria-hidden />
        Nueva meta
      </Button>
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Sin metas todavía"
          description="Definí un importe objetivo y registrá aportes para ver tu progreso."
        />
      ) : (
        goals.map((goal) => (
          <GoalListItem
            key={goal.id}
            goal={goal}
            onEdit={() => openEdit(goal)}
            onContribute={() => setContributionGoal(goal)}
          />
        ))
      )}
      <GoalFormDialog open={dialogOpen} onOpenChange={setDialogOpen} goal={editing} />
      <GoalContributionDialog
        open={contributionGoal !== null}
        onOpenChange={(open) => !open && setContributionGoal(null)}
        goal={contributionGoal}
      />
    </div>
  );
}

export function BudgetsPage() {
  const [tab, setTab] = useState('budgets');

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold text-ink">Presupuestos</h1>
      <Tabs items={TABS} value={tab} onValueChange={setTab}>
        <TabPanel value="budgets">
          <BudgetsTab />
        </TabPanel>
        <TabPanel value="recurring">
          <RecurringTab />
        </TabPanel>
        <TabPanel value="goals">
          <GoalsTab />
        </TabPanel>
      </Tabs>
    </div>
  );
}
