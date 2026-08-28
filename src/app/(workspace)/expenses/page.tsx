"use client";

import { useFinance } from "../_providers/finance-provider";
import ExpensesPage from "@/modules/expenses/ui/expenses-page";

export default function ExpensesRoute() {
  const finance = useFinance();
  return (
    <ExpensesPage
      expenses={finance.expenses}
      cards={finance.cards}
      filterCategory={finance.filterCategory}
      onFilterChange={finance.setFilterCategory}
      onAddExpense={finance.addExpense}
      onUpdateExpense={finance.editExpense}
      onDeleteExpense={finance.deleteExpense}
      editingId={finance.editingId}
      onStartEdit={finance.startEditing}
      onCancelEdit={finance.cancelEditing}
    />
  );
}
