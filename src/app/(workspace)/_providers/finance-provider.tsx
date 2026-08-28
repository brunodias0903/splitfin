"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/shared/ui";
import { useLocale } from "@/shared/i18n";
import {
  createCard,
  removeCard as removeCardFromList,
} from "@/modules/cards/application/card-use-cases";
import { cardRepository } from "@/modules/cards/infrastructure/card-repository";
import type { Card } from "@/modules/cards/domain/card";
import {
  createExpense,
  removeExpense,
  updateExpense,
} from "@/modules/expenses/application/expense-use-cases";
import { expenseRepository } from "@/modules/expenses/infrastructure/expense-repository";
import type { Expense, ExpenseData } from "@/modules/expenses/domain/expense";
import {
  createInstallmentPlan,
  detachCard,
  payNextInstallment,
  updateInstallmentPlan,
} from "@/modules/installments/application/installment-use-cases";
import { installmentRepository } from "@/modules/installments/infrastructure/installment-repository";
import type { InstallmentData, InstallmentPlan } from "@/modules/installments/domain/installment";

interface FinanceContextValue {
  expenses: Expense[];
  installments: InstallmentPlan[];
  cards: Card[];
  editingId: string | null;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  startEditing: (id: string | null) => void;
  cancelEditing: () => void;
  addExpense: (data: ExpenseData) => void;
  editExpense: (data: ExpenseData) => void;
  deleteExpense: (id: string) => void;
  addInstallment: (data: InstallmentData) => void;
  editInstallment: (data: InstallmentData) => void;
  deleteInstallment: (id: string) => void;
  payInstallment: (id: string) => void;
  addCard: (name: string, last4: string, type: string) => void;
  removeCard: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);
const createId = () => crypto.randomUUID();

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [installments, setInstallments] = useState<InstallmentPlan[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [undo, setUndo] = useState<Expense | null>(null);
  const { t } = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    setExpenses(expenseRepository.load());
    setInstallments(installmentRepository.load());
    setCards(cardRepository.load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) expenseRepository.save(expenses);
  }, [expenses, hydrated]);

  useEffect(() => {
    if (hydrated) installmentRepository.save(installments);
  }, [installments, hydrated]);

  useEffect(() => {
    if (hydrated) cardRepository.save(cards);
  }, [cards, hydrated]);

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(null), 4000);
    return () => window.clearTimeout(timer);
  }, [undo]);

  useEffect(() => {
    setEditingId(null);
  }, [pathname]);

  const addExpense = useCallback((data: ExpenseData) => {
    setExpenses((current) => [createExpense(data, createId), ...current]);
  }, []);

  const editExpense = useCallback(
    (data: ExpenseData) => {
      if (!editingId) return;
      setExpenses((current) => updateExpense(current, editingId, data));
      setEditingId(null);
    },
    [editingId],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      const result = removeExpense(expenses, id);
      setExpenses(result.expenses);
      setUndo(result.removed ?? null);
    },
    [expenses],
  );

  const undoDelete = useCallback(() => {
    if (!undo) return;
    setExpenses((current) => [undo, ...current]);
    setUndo(null);
  }, [undo]);

  const addInstallment = useCallback((data: InstallmentData) => {
    const result = createInstallmentPlan(data, createId);
    setInstallments((current) => [result.plan, ...current]);
    if (result.paidExpenses.length > 0) {
      setExpenses((current) => [...result.paidExpenses, ...current]);
    }
  }, []);

  const editInstallment = useCallback(
    (data: InstallmentData) => {
      if (!editingId) return;
      setInstallments((current) => updateInstallmentPlan(current, editingId, data));
      setEditingId(null);
    },
    [editingId],
  );

  const deleteInstallment = useCallback((id: string) => {
    setInstallments((current) => current.filter((plan) => plan.id !== id));
  }, []);

  const payInstallment = useCallback(
    (id: string) => {
      const target = installments.find((plan) => plan.id === id);
      if (!target) return;
      const result = payNextInstallment(target, createId);
      setInstallments((current) => current.map((plan) => (plan.id === id ? result.plan : plan)));
      if (result.expense) setExpenses((current) => [result.expense!, ...current]);
    },
    [installments],
  );

  const addCard = useCallback((name: string, last4: string, type: string) => {
    setCards((current) => [...current, createCard(name, last4, type, createId)]);
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards((current) => removeCardFromList(current, id));
    setInstallments((current) => detachCard(current, id));
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      expenses,
      installments,
      cards,
      editingId,
      filterCategory,
      setFilterCategory,
      startEditing: setEditingId,
      cancelEditing: () => setEditingId(null),
      addExpense,
      editExpense,
      deleteExpense,
      addInstallment,
      editInstallment,
      deleteInstallment,
      payInstallment,
      addCard,
      removeCard,
    }),
    [
      expenses,
      installments,
      cards,
      editingId,
      filterCategory,
      addExpense,
      editExpense,
      deleteExpense,
      addInstallment,
      editInstallment,
      deleteInstallment,
      payInstallment,
      addCard,
      removeCard,
    ],
  );

  return (
    <FinanceContext value={value}>
      {children}
      {undo && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-slide-up items-center gap-4 rounded-lg bg-strong px-5 py-3 text-on-brand shadow-lg">
          <span>{t.expenseDeleted}</span>
          <Button onClick={undoDelete} size="sm">
            {t.undo}
          </Button>
        </div>
      )}
    </FinanceContext>
  );
}

export function useFinance(): FinanceContextValue {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used inside FinanceProvider");
  return context;
}
