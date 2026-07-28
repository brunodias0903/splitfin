import type { Card, Expense, ExpenseData } from "../types";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";
import { useLocale } from "../i18n";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t.expensesTab}</h1>
      </div>

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
  );
}
