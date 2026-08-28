import type { Card, Expense, ExpenseData } from "../types";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";
import { useLocale } from "../i18n";
import { Heading, Text } from "../components/ui";

interface ExpensesPageProps {
  expenses: Expense[];
  cards: Card[];
  filterCategory: string;
  onFilterChange: (cat: string) => void;
  onAddExpense: (data: ExpenseData) => void;
  onUpdateExpense: (data: ExpenseData) => void;
  onDeleteExpense: (id: string) => void;
  editingId: string | null;
  onStartEdit: (id: string | null) => void;
  onCancelEdit: () => void;
}

export default function ExpensesPage({
  expenses,
  cards,
  filterCategory,
  onFilterChange,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  editingId,
  onStartEdit,
  onCancelEdit,
}: ExpensesPageProps) {
  const { t } = useLocale();
  const editingExpense = editingId ? expenses.find((e) => e.id === editingId) : undefined;
  const filteredExpenses =
    filterCategory === "All" ? expenses : expenses.filter((e) => e.category === filterCategory);

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
        <ExpenseForm
          onSubmit={editingId ? onUpdateExpense : onAddExpense}
          editingExpense={editingExpense}
          onCancelEdit={onCancelEdit}
          cards={cards}
        />

        <ExpenseList
          expenses={filteredExpenses}
          allExpenses={expenses}
          onDeleteExpense={onDeleteExpense}
          onStartEdit={onStartEdit}
          filterCategory={filterCategory}
          onFilterChange={onFilterChange}
          cards={cards}
        />
      </div>
    </div>
  );
}
