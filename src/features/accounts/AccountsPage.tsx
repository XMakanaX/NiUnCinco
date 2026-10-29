import { useState } from 'react';
import { Plus, Wallet, CreditCard, Shapes } from 'lucide-react';
import { Tabs, TabPanel } from '@/shared/ui/Tabs';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageMessage } from '@/shared/ui/PageMessage';
import { useAccounts, type Account } from '@/features/accounts/api/useAccounts';
import { useCards, type Card } from '@/features/accounts/api/useCards';
import { useCategories, type Category } from '@/features/categories/api/useCategories';
import { AccountFormDialog } from '@/features/accounts/components/AccountFormDialog';
import { AccountListItem } from '@/features/accounts/components/AccountListItem';
import { CardFormDialog } from '@/features/accounts/components/CardFormDialog';
import { CardListItem } from '@/features/accounts/components/CardListItem';
import { CardDetailDialog } from '@/features/accounts/components/CardDetailDialog';
import { CategoryFormDialog } from '@/features/categories/components/CategoryFormDialog';
import { CategoryListItem } from '@/features/categories/components/CategoryListItem';

const TABS = [
  { value: 'accounts', label: 'Cuentas' },
  { value: 'cards', label: 'Tarjetas' },
  { value: 'categories', label: 'Categorías' },
];

function AccountsTab() {
  const { data: accounts, isPending, isError } = useAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (account: Account) => {
    setEditing(account);
    setDialogOpen(true);
  };

  if (isPending) return <LoadingState />;
  if (isError) return <PageMessage tone="error">No se pudieron cargar las cuentas.</PageMessage>;

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={openCreate} className="self-end">
        <Plus className="size-4" aria-hidden />
        Nueva cuenta
      </Button>
      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin cuentas todavía"
          description="Agregá tu primera cuenta de efectivo, bancaria u otra para empezar a registrar movimientos."
        />
      ) : (
        accounts.map((account) => (
          <AccountListItem key={account.id} account={account} onEdit={() => openEdit(account)} />
        ))
      )}
      <AccountFormDialog open={dialogOpen} onOpenChange={setDialogOpen} account={editing} />
    </div>
  );
}

function CardsTab() {
  const { data: cards, isPending, isError } = useCards();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const detailCard = cards?.find((c) => c.id === detailCardId) ?? null;

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (card: Card) => {
    setEditing(card);
    setDialogOpen(true);
  };

  if (isPending) return <LoadingState />;
  if (isError) return <PageMessage tone="error">No se pudieron cargar las tarjetas.</PageMessage>;

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={openCreate} className="self-end">
        <Plus className="size-4" aria-hidden />
        Nueva tarjeta
      </Button>
      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin tarjetas todavía"
          description="Registrá tu primera tarjeta de débito o crédito."
        />
      ) : (
        cards.map((card) => (
          <CardListItem
            key={card.id}
            card={card}
            onEdit={() => openEdit(card)}
            onViewDetail={() => setDetailCardId(card.id)}
          />
        ))
      )}
      <CardFormDialog open={dialogOpen} onOpenChange={setDialogOpen} card={editing} />
      <CardDetailDialog
        card={detailCard}
        open={detailCardId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailCardId(null);
        }}
      />
    </div>
  );
}

function CategoriesTab() {
  const { data: categories, isPending, isError } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (category: Category) => {
    setEditing(category);
    setDialogOpen(true);
  };

  if (isPending) return <LoadingState />;
  if (isError) return <PageMessage tone="error">No se pudieron cargar las categorías.</PageMessage>;

  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={openCreate} className="self-end">
        <Plus className="size-4" aria-hidden />
        Nueva categoría
      </Button>
      {categories.length === 0 ? (
        <EmptyState
          icon={Shapes}
          title="Sin categorías todavía"
          description="Creá categorías y subcategorías para clasificar tus movimientos."
        />
      ) : (
        categories.map((category) => (
          <CategoryListItem
            key={category.id}
            category={category}
            parentName={category.parent_id ? nameById.get(category.parent_id) ?? null : null}
            onEdit={() => openEdit(category)}
          />
        ))
      )}
      <CategoryFormDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} />
    </div>
  );
}

export function AccountsPage() {
  const [tab, setTab] = useState('accounts');

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold text-ink">Cuentas</h1>
      <Tabs items={TABS} value={tab} onValueChange={setTab}>
        <TabPanel value="accounts">
          <AccountsTab />
        </TabPanel>
        <TabPanel value="cards">
          <CardsTab />
        </TabPanel>
        <TabPanel value="categories">
          <CategoriesTab />
        </TabPanel>
      </Tabs>
    </div>
  );
}
