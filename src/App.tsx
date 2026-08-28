import { useCallback, useEffect, useState } from "react";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import InstallmentsPage from "./pages/InstallmentsPage";
import CardsPage from "./pages/CardsPage";
import { Button } from "./components/ui";
import { I18nProvider, useLocale } from "./i18n";
import {
  getInstallmentDate,
  validateExpenseData,
  validateFixedExpenseData,
  validateCardData,
} from "./types";
import type { Card, Expense, FixedExpense, ExpenseData, FixedExpenseData } from "./types";

type Page = "dashboard" | "expenses" | "installments" | "cards";

function AppContent() {
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
  const [page, setPage] = useState<Page>("dashboard");
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

  const addCard = useCallback((name: string, last4: string, type: string) => {
    const card: Card = { id: crypto.randomUUID(), name, last4, type: type as Card["type"] };
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

  const navigate = useCallback((p: Page) => {
    setPage(p);
    setEditingId(null);
  }, []);

  const { t } = useLocale();

  return (
    <Layout page={page} onNavigate={navigate}>
      {page === "dashboard" ? (
        <DashboardPage expenses={expenses} fixedExpenses={fixedExpenses} cards={cards} />
      ) : page === "expenses" ? (
        <ExpensesPage
          expenses={expenses}
          cards={cards}
          filterCategory={filterCategory}
          onFilterChange={setFilterCategory}
          onAddExpense={addExpense}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
          editingId={editingId}
          onStartEdit={setEditingId}
          onCancelEdit={() => setEditingId(null)}
        />
      ) : page === "installments" ? (
        <InstallmentsPage
          fixedExpenses={fixedExpenses}
          cards={cards}
          editingId={editingId}
          onStartEdit={setEditingId}
          onCancelEdit={() => setEditingId(null)}
          onAddFixedExpense={addFixedExpense}
          onUpdateFixedExpense={updateFixedExpense}
          onDeleteFixedExpense={deleteFixedExpense}
          onPayInstallment={payInstallment}
        />
      ) : (
        <CardsPage cards={cards} onAddCard={addCard} onRemoveCard={removeCard} />
      )}

      {undo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-strong text-on-brand px-5 py-3 rounded-lg flex items-center gap-4 shadow-lg z-50 animate-slide-up">
          <span>{t.expenseDeleted}</span>
          <Button onClick={undoDelete} size="sm">
            {t.undo}
          </Button>
        </div>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
