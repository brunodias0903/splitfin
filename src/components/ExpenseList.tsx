import type { Expense } from "../types";
import { CATEGORIES } from "../types";
import { useLocale } from "../i18n";

interface ExpenseListProps {
  expenses: Expense[];
  allExpenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onStartEdit: (id: string | null) => void;
  filterCategory: string;
  onFilterChange: (cat: string) => void;
}

function downloadCSV(expenses: Expense[]) {
  const header = "Description,Amount,Category,Date";
  const rows = expenses.map((e) => `"${e.description}",${e.amount},"${e.category}","${e.date}"`);
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
}: ExpenseListProps) {
  const { t, formatCurrency, formatDate } = useLocale();
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

      {categoryTotals.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-gray-200">
          {categoryTotals.map(({ category, total: catTotal }) => (
            <div key={category} className="bg-gray-100 px-3 py-1.5 rounded-md text-sm flex gap-2">
              <span className="text-gray-500">{t.categories[category]}</span>
              <span className="font-semibold text-indigo-600">{formatCurrency(catTotal)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-lg font-semibold mb-3 text-indigo-600">
        {t.total}: {formatCurrency(total)}
      </div>

      {expenses.length === 0 ? (
        <p className="text-gray-400 text-center py-5">
          {filterCategory === "All" ? t.noExpenses : t.noExpensesCategory}
        </p>
      ) : (
        <ul className="list-none">
          {expenses.map((expense) => (
            <li
              key={expense.id}
              className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-gray-800">{expense.description}</span>
                <span className="text-sm text-gray-500">{t.categories[expense.category]}</span>
                <span className="text-xs text-gray-400">{formatDate(expense.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">{formatCurrency(expense.amount)}</span>
                <button
                  onClick={() => onStartEdit(expense.id)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm cursor-pointer"
                >
                  {t.edit}
                </button>
                <button
                  onClick={() => onDeleteExpense(expense.id)}
                  className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm cursor-pointer"
                >
                  {t.delete}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
