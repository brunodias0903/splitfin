import { useMemo } from "react";
import type { Card, Expense, FixedExpense } from "../types";
import Dashboard from "../components/Dashboard";
import { useLocale } from "../i18n";

interface DashboardPageProps {
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  cards: Card[];
}

export default function DashboardPage({ expenses, fixedExpenses, cards }: DashboardPageProps) {
  const { t, formatCurrency, formatDate } = useLocale();

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) =>
        `${b.date}T${b.time ?? "00:00"}`.localeCompare(`${a.date}T${a.time ?? "00:00"}`),
      )
      .slice(0, 5);
  }, [expenses]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t.greeting}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.subtitle}</p>
      </div>

      <Dashboard expenses={expenses} fixedExpenses={fixedExpenses} cards={cards} />

      {recentExpenses.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.recentExpenses}</h3>
          <div className="flex flex-col gap-1.5">
            {recentExpenses.map((e) => (
              <div
                key={e.id}
                className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-gray-800">{e.description}</span>
                  <span className="text-xs text-gray-400">
                    {formatDate(e.date)}
                    {e.time && ` ${e.time.slice(0, 5)}`}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {formatCurrency(e.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
