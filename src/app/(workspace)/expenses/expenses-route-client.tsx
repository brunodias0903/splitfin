"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ExpensesPage from "@/modules/expenses/ui/expenses-page";
import type { Card } from "@/modules/cards/domain/card";
import type {
  Expense,
  ExpenseData,
  ExpensePage,
  ExpenseSortOrder,
} from "@/modules/expenses/domain/expense";
import { useLocale } from "@/shared/i18n";
import {
  createExpenseAction,
  deleteExpenseAction,
  updateExpenseAction,
  type ExpenseActionResult,
} from "./actions";

interface ExpensesRouteClientProps {
  initialPage: ExpensePage;
  initialCategory: string;
  initialOrder: ExpenseSortOrder;
  cards: Card[];
}

export default function ExpensesRouteClient({
  initialPage,
  initialCategory,
  initialOrder,
  cards,
}: ExpensesRouteClientProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [expensePage, setExpensePage] = useState(initialPage);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorFor = (result: ExpenseActionResult) => {
    if (result.ok) return null;
    if (result.reason === "invalid") return t.expenseInvalid;
    if (result.reason === "not-found") return t.expenseNotFound;
    return t.expenseSaveFailed;
  };

  const navigate = (values: { category?: string; order?: ExpenseSortOrder; page?: number }) => {
    const params = new URLSearchParams();
    const category = values.category ?? initialCategory;
    const order = values.order ?? initialOrder;
    const page = values.page ?? expensePage.page;
    if (category !== "All") params.set("category", category);
    if (order !== "newest") params.set("order", order);
    if (page > 1) params.set("page", String(page));
    router.replace(`/expenses${params.size ? `?${params}` : ""}`);
  };

  const addExpense = async (data: ExpenseData) => {
    const previous = expensePage;
    const optimistic: Expense = { id: crypto.randomUUID(), ...data };
    setError(null);
    setPending(true);
    setExpensePage((current) => ({
      ...current,
      items: [optimistic, ...current.items].slice(0, current.pageSize),
      totalItems: current.totalItems + 1,
      totalAmount: current.totalAmount + data.amount,
      averageAmount: (current.totalAmount + data.amount) / (current.totalItems + 1),
      totalPages: Math.max(1, Math.ceil((current.totalItems + 1) / current.pageSize)),
    }));
    const result = await createExpenseAction(data);
    setPending(false);
    if (!result.ok || !result.expense) {
      setExpensePage(previous);
      setError(errorFor(result));
      return false;
    }
    router.refresh();
    return true;
  };

  const updateExpense = async (data: ExpenseData) => {
    if (!editingId) return false;
    const previous = expensePage;
    setError(null);
    setPending(true);
    setExpensePage((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === editingId ? { ...item, ...data } : item)),
    }));
    const result = await updateExpenseAction(editingId, data);
    setPending(false);
    if (!result.ok) {
      setExpensePage(previous);
      setError(errorFor(result));
      return false;
    }
    setEditingId(null);
    router.refresh();
    return true;
  };

  const deleteExpense = async (id: string) => {
    const previous = expensePage;
    const removed = expensePage.items.find((expense) => expense.id === id);
    setError(null);
    setExpensePage((current) => ({
      ...current,
      items: current.items.filter((expense) => expense.id !== id),
      totalItems: Math.max(0, current.totalItems - 1),
      totalAmount: Math.max(0, current.totalAmount - (removed?.amount ?? 0)),
    }));
    const result = await deleteExpenseAction(id);
    if (!result.ok) {
      setExpensePage(previous);
      setError(errorFor(result));
      return;
    }
    if (editingId === id) setEditingId(null);
    router.refresh();
  };

  return (
    <ExpensesPage
      expensePage={expensePage}
      cards={cards}
      filterCategory={initialCategory}
      onFilterChange={(category) => navigate({ category, page: 1 })}
      onAddExpense={addExpense}
      onUpdateExpense={updateExpense}
      onDeleteExpense={deleteExpense}
      editingId={editingId}
      onStartEdit={setEditingId}
      onCancelEdit={() => setEditingId(null)}
      sortOrder={initialOrder}
      onSortChange={(order) => navigate({ order, page: 1 })}
      onPageChange={(page) => navigate({ page })}
      pending={pending}
      error={error}
    />
  );
}
