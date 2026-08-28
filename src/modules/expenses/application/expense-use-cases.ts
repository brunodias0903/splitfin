import type { Expense, ExpenseData } from "../domain/expense";

export type IdFactory = () => string;

export function createExpense(data: ExpenseData, createId: IdFactory): Expense {
  return { id: createId(), ...data };
}

export function updateExpense(expenses: Expense[], id: string, data: ExpenseData): Expense[] {
  return expenses.map((expense) => (expense.id === id ? { ...expense, ...data } : expense));
}

export function removeExpense(
  expenses: Expense[],
  id: string,
): { expenses: Expense[]; removed?: Expense } {
  return {
    expenses: expenses.filter((expense) => expense.id !== id),
    removed: expenses.find((expense) => expense.id === id),
  };
}
