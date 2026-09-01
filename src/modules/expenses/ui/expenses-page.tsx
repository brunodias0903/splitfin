import type { Card } from "@/modules/cards/domain/card";
import type { ExpenseData, ExpensePage, ExpenseSortOrder } from "../domain/expense";
import ExpenseForm from "./expense-form";
import ExpenseList from "./expense-list";
import { useLocale } from "@/shared/i18n";
import { Heading, Text } from "@/shared/ui";

interface ExpensesPageProps {
  expensePage: ExpensePage;
  cards: Card[];
  filterCategory: string;
  onFilterChange: (cat: string) => void;
  onAddExpense: (data: ExpenseData) => Promise<boolean>;
  onUpdateExpense: (data: ExpenseData) => Promise<boolean>;
  onDeleteExpense: (id: string) => void;
  editingId: string | null;
  onStartEdit: (id: string | null) => void;
  onCancelEdit: () => void;
  sortOrder: ExpenseSortOrder;
  onSortChange: (order: ExpenseSortOrder) => void;
  onPageChange: (page: number) => void;
  pending?: boolean;
  error?: string | null;
}

export default function ExpensesPage({
  expensePage,
  cards,
  filterCategory,
  onFilterChange,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  editingId,
  onStartEdit,
  onCancelEdit,
  sortOrder,
  onSortChange,
  onPageChange,
  pending,
  error,
}: ExpensesPageProps) {
  const { t } = useLocale();
  const expenses = expensePage.items;
  const editingExpense = editingId ? expenses.find((e) => e.id === editingId) : undefined;

  return (
    <div className="ds-page">
      <div>
        <Text variant="eyebrow" tone="muted" className="mb-2">
          {t.movements}
        </Text>
        <Heading level={1} variant="page">
          {t.expensesTab}
        </Heading>
        <Text variant="small" tone="muted" className="mt-1.5">
          {t.expensesSubtitle}
        </Text>
      </div>

      <div className="ds-content-grid">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger ds-content-grid-full"
          >
            {error}
          </div>
        )}
        <ExpenseForm
          onSubmit={editingId ? onUpdateExpense : onAddExpense}
          editingExpense={editingExpense}
          onCancelEdit={onCancelEdit}
          cards={cards}
          pending={pending}
        />

        <ExpenseList
          expenses={expenses}
          allExpenses={expenses}
          onDeleteExpense={onDeleteExpense}
          onStartEdit={onStartEdit}
          filterCategory={filterCategory}
          onFilterChange={onFilterChange}
          cards={cards}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
          page={expensePage.page}
          totalPages={expensePage.totalPages}
          totalItems={expensePage.totalItems}
          totalAmount={expensePage.totalAmount}
          averageAmount={expensePage.averageAmount}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
