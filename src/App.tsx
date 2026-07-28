import { useCallback, useEffect, useState } from "react";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import FixedExpenseForm from "./components/FixedExpenseForm";
import FixedExpenseList from "./components/FixedExpenseList";
import CardManager from "./components/CardManager";
import { I18nProvider, useLocale, type Locale } from "./i18n";
import {
  getInstallmentDate,
  validateExpenseData,
  validateFixedExpenseData,
  validateCardData,
} from "./types";
import type { Card, Expense, FixedExpense, ExpenseData, FixedExpenseData } from "./types";

type Tab = "expenses" | "installments";

function AppContent() {
  const { t, locale, setLocale } = useLocale();
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem("expenses");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(validateExpenseData);
    } catch {
      return [];
    }
  });
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() => {
    try {
      const saved = localStorage.getItem("fixedExpenses");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(validateFixedExpenseData);
    } catch {
      return [];
    }
  });
  const [cards, setCards] = useState<Card[]>(() => {
    try {
      const saved = localStorage.getItem("cards");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(validateCardData);
    } catch {
      return [];
    }
  });
  const [tab, setTab] = useState<Tab>("expenses");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [undo, setUndo] = useState<Expense | null>(null);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("fixedExpenses", JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
  }, [cards]);

  const addExpense = useCallback((data: ExpenseData) => {
    const expense: Expense = { id: crypto.randomUUID(), ...data };
    setExpenses((prev) => [expense, ...prev]);
  }, []);

  const updateExpense = useCallback(
    (data: ExpenseData) => {
      setExpenses((prev) => prev.map((e) => (e.id === editingId ? { ...e, ...data } : e)));
      setEditingId(null);
    },
    [editingId],
  );

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => {
      const target = prev.find((e) => e.id === id);
      if (target) setUndo(target);
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  const undoDelete = useCallback(() => {
    if (!undo) return;
    setExpenses((prev) => [undo, ...prev]);
    setUndo(null);
  }, [undo]);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 4000);
    return () => clearTimeout(timer);
  }, [undo]);

  const addCard = useCallback((name: string, last4: string) => {
    const card: Card = { id: crypto.randomUUID(), name, last4 };
    setCards((prev) => [...prev, card]);
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setFixedExpenses((prev) =>
      prev.map((e) => (e.cardId === id ? { ...e, cardId: undefined } : e)),
    );
  }, []);

  const addFixedExpense = useCallback((data: FixedExpenseData) => {
    const id = crypto.randomUUID();
    const installmentAmount = data.totalAmount / data.totalInstallments;
    const fixed: FixedExpense = {
      id,
      description: data.description,
      totalAmount: data.totalAmount,
      totalInstallments: data.totalInstallments,
      paidInstallments: data.paidInstallments,
      category: data.category,
      startDate: data.startDate,
      active: data.paidInstallments < data.totalInstallments,
      cardId: data.cardId,
    };
    const newExpenses: Expense[] = [];
    for (let i = 0; i < data.paidInstallments; i++) {
      newExpenses.push({
        id: crypto.randomUUID(),
        description: `${data.description} (${i + 1}/${data.totalInstallments})`,
        amount: installmentAmount,
        category: data.category,
        date: getInstallmentDate(data.startDate, i),
      });
    }
    setFixedExpenses((prev) => [fixed, ...prev]);
    if (newExpenses.length > 0) {
      setExpenses((prev) => [...newExpenses, ...prev]);
    }
  }, []);

  const updateFixedExpense = useCallback(
    (data: FixedExpenseData) => {
      setFixedExpenses((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                description: data.description,
                totalAmount: data.totalAmount,
                totalInstallments: data.totalInstallments,
                paidInstallments: data.paidInstallments,
                category: data.category,
                startDate: data.startDate,
                active: data.paidInstallments < data.totalInstallments,
                cardId: data.cardId,
              }
            : e,
        ),
      );
      setEditingId(null);
    },
    [editingId],
  );

  const deleteFixedExpense = useCallback((id: string) => {
    setFixedExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const payInstallment = useCallback((id: string) => {
    setFixedExpenses((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const nextPaid = e.paidInstallments + 1;
        const installmentAmount = e.totalAmount / e.totalInstallments;
        const expense: Expense = {
          id: crypto.randomUUID(),
          description: `${e.description} (${nextPaid}/${e.totalInstallments})`,
          amount: installmentAmount,
          category: e.category,
          date: getInstallmentDate(e.startDate, e.paidInstallments),
        };
        setExpenses((prevExpenses) => [expense, ...prevExpenses]);
        return {
          ...e,
          paidInstallments: nextPaid,
          active: nextPaid < e.totalInstallments,
        };
      }),
    );
  }, []);

  const editingExpense = editingId ? expenses.find((e) => e.id === editingId) : undefined;

  const editingFixedExpense = editingId ? fixedExpenses.find((e) => e.id === editingId) : undefined;

  const filteredExpenses =
    filterCategory === "All" ? expenses : expenses.filter((e) => e.category === filterCategory);

  return (
    <div className="max-w-xl mx-auto mt-10 p-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t.appTitle}</h1>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="px-2.5 py-1.5 pr-8 border border-gray-300 rounded text-sm bg-white cursor-pointer"
        >
          <option value="pt-BR">🇧🇷 Português</option>
          <option value="en">🇺🇸 English</option>
        </select>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => {
            setTab("expenses");
            setEditingId(null);
          }}
          className={`flex-1 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
            tab === "expenses"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.expensesTab}
        </button>
        <button
          onClick={() => {
            setTab("installments");
            setEditingId(null);
          }}
          className={`flex-1 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
            tab === "installments"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.installmentsTab}
        </button>
      </div>

      {tab === "expenses" ? (
        <>
          <ExpenseForm
            onSubmit={editingId ? updateExpense : addExpense}
            editingExpense={editingExpense}
            onCancelEdit={() => setEditingId(null)}
          />
          <ExpenseList
            expenses={filteredExpenses}
            allExpenses={expenses}
            onDeleteExpense={deleteExpense}
            onStartEdit={setEditingId}
            filterCategory={filterCategory}
            onFilterChange={setFilterCategory}
          />
        </>
      ) : (
        <>
          <CardManager cards={cards} onAddCard={addCard} onRemoveCard={removeCard} />
          <FixedExpenseForm
            onSubmit={editingId ? updateFixedExpense : addFixedExpense}
            editingFixedExpense={editingFixedExpense}
            onCancelEdit={() => setEditingId(null)}
            cards={cards}
          />
          <FixedExpenseList
            fixedExpenses={fixedExpenses}
            cards={cards}
            onDeleteFixedExpense={deleteFixedExpense}
            onStartEdit={setEditingId}
            onPayInstallment={payInstallment}
          />
        </>
      )}

      {undo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-3 rounded-lg flex items-center gap-4 shadow-lg z-50 animate-slide-up">
          <span>{t.expenseDeleted}</span>
          <button
            onClick={undoDelete}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded text-sm font-medium cursor-pointer"
          >
            {t.undo}
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
