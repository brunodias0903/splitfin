import { useState } from "react";
import type { Card, Expense } from "../types";
import { CATEGORIES } from "../types";
import { useLocale } from "../i18n";

type SortOrder = "newest" | "oldest";

interface ExpenseListProps {
  expenses: Expense[];
  allExpenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onStartEdit: (id: string | null) => void;
  filterCategory: string;
  onFilterChange: (cat: string) => void;
  cards: Card[];
}

function getSortKey(e: Expense): string {
  return e.time ? `${e.date}T${e.time}` : `${e.date}T00:00`;
}

function sortExpenses(list: Expense[], order: SortOrder): Expense[] {
  return [...list].sort((a, b) => {
    const ka = getSortKey(a);
    const kb = getSortKey(b);
    return order === "newest" ? kb.localeCompare(ka) : ka.localeCompare(kb);
  });
}

function downloadCSV(expenses: Expense[]) {
  const header = "Description,Amount,Payment,Category,Date,Time";
  const rows = expenses.map(
    (e) =>
      `"${e.description}",${e.amount},"${e.paymentType ?? ""}","${e.category}","${e.date}","${e.time ?? ""}"`,
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExpenseList({
  expenses,
  allExpenses,
  onDeleteExpense,
  onStartEdit,
  filterCategory,
  onFilterChange,
  cards,
}: ExpenseListProps) {
  const { t, formatCurrency, formatDate } = useLocale();
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const sorted = sortExpenses(expenses, sortOrder);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = CATEGORIES.map((cat) => {
    const catExpenses = expenses.filter((e) => e.category === cat);
    const sum = catExpenses.reduce((s, e) => s + e.amount, 0);
    return { category: cat, total: sum };
  }).filter((c) => c.total > 0);

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-3 gap-2 flex-wrap">
        <h2 className="text-lg font-semibold text-gray-700">{t.expenses}</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-2.5 py-1.5 pr-8 border border-gray-300 rounded text-sm bg-white"
          >
            <option value="All">{t.allCategories}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t.categories[cat]}
              </option>
            ))}
          </select>
          {allExpenses.length > 0 && (
            <button
              onClick={() => downloadCSV(allExpenses)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm cursor-pointer font-medium whitespace-nowrap"
            >
              {t.exportCSV}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setSortOrder("newest")}
          className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
            sortOrder === "newest"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-gray-100 text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.sortNewest}
        </button>
        <button
          onClick={() => setSortOrder("oldest")}
          className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
            sortOrder === "oldest"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-gray-100 text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.sortOldest}
        </button>
      </div>

      {categoryTotals.length > 0 && (
        <div className="flex gap-2 mb-3 pb-3 border-b border-gray-200 overflow-x-auto scrollbar-none">
          {categoryTotals.map(({ category, total: catTotal }) => (
            <div
              key={category}
              className="bg-gray-100 px-3 py-1.5 rounded-md text-sm flex gap-2 whitespace-nowrap"
            >
              <span className="text-gray-500">{t.categories[category]}</span>
              <span className="font-semibold text-indigo-600">{formatCurrency(catTotal)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-lg font-semibold mb-3 text-indigo-600">
        {t.total}: {formatCurrency(total)}
      </div>

      {sorted.length === 0 ? (
        <p className="text-gray-400 text-center py-5">
          {filterCategory === "All" ? t.noExpenses : t.noExpensesCategory}
        </p>
      ) : (
        <ul className="list-none">
          {sorted.map((expense) => (
            <li
              key={expense.id}
              className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium text-gray-800 truncate">{expense.description}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm text-gray-500">{t.categories[expense.category]}</span>
                  {expense.paymentType && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {t.paymentTypes[expense.paymentType] ?? expense.paymentType}
                    </span>
                  )}
                  {expense.cardId &&
                    (() => {
                      const card = cards.find((c) => c.id === expense.cardId);
                      return card ? (
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                          {card.name} ••{card.last4}
                        </span>
                      ) : null;
                    })()}
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(expense.date)}
                  {expense.time && ` ${expense.time.slice(0, 5)}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-semibold text-sm md:text-base whitespace-nowrap">
                  {formatCurrency(expense.amount)}
                </span>
                <button
                  onClick={() => onStartEdit(expense.id)}
                  className="px-2.5 py-2 md:py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs md:text-sm cursor-pointer md:min-h-0 min-h-[36px]"
                >
                  <span className="md:hidden">✏️</span>
                  <span className="hidden md:inline">{t.edit}</span>
                </button>
                <button
                  onClick={() => onDeleteExpense(expense.id)}
                  className="px-2.5 py-2 md:py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs md:text-sm cursor-pointer md:min-h-0 min-h-[36px]"
                >
                  <span className="md:hidden">🗑️</span>
                  <span className="hidden md:inline">{t.delete}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
