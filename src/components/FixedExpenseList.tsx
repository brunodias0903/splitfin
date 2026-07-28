import { getInstallmentDate } from "../types";
import type { Card, FixedExpense } from "../types";
import { useLocale } from "../i18n";

interface FixedExpenseListProps {
  fixedExpenses: FixedExpense[];
  cards: Card[];
  onDeleteFixedExpense: (id: string) => void;
  onStartEdit: (id: string | null) => void;
  onPayInstallment: (id: string) => void;
}

export default function FixedExpenseList({
  fixedExpenses,
  cards,
  onDeleteFixedExpense,
  onStartEdit,
  onPayInstallment,
}: FixedExpenseListProps) {
  const { t, formatCurrency, formatDate } = useLocale();

  const cardMap = new Map(cards.map((c) => [c.id, c]));

  const activeExpenses = fixedExpenses.filter((e) => e.active);
  const completedExpenses = fixedExpenses.filter((e) => !e.active);

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">{t.installments}</h2>

      {fixedExpenses.length === 0 ? (
        <p className="text-gray-400 text-center py-5">{t.noInstallments}</p>
      ) : (
        <>
          {activeExpenses.map((expense) => {
            const installmentAmount = expense.totalAmount / expense.totalInstallments;
            const remaining = expense.totalInstallments - expense.paidInstallments;
            const progress = (expense.paidInstallments / expense.totalInstallments) * 100;

            return (
              <div key={expense.id} className="py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-wrap items-center gap-1 min-w-0">
                      <span className="font-medium text-gray-800">{expense.description}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {t.categories[expense.category]}
                      </span>
                      {expense.cardId && cardMap.get(expense.cardId) && (
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {cardMap.get(expense.cardId)!.name} ••{cardMap.get(expense.cardId)!.last4}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                        {formatCurrency(installmentAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {remaining > 0 && (
                      <button
                        onClick={() => onPayInstallment(expense.id)}
                        className="flex-1 px-3 py-2 md:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs md:text-sm cursor-pointer font-medium min-h-[36px] md:min-h-0"
                      >
                        {t.payInstallment}
                      </button>
                    )}
                    <button
                      onClick={() => onStartEdit(expense.id)}
                      className="px-3 py-2 md:py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs md:text-sm cursor-pointer min-h-[36px] md:min-h-0"
                    >
                      {t.edit}
                    </button>
                    <button
                      onClick={() => onDeleteFixedExpense(expense.id)}
                      className="px-3 py-2 md:py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs md:text-sm cursor-pointer min-h-[36px] md:min-h-0"
                    >
                      {t.delete}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                    {expense.paidInstallments} {t.installmentOf} {expense.totalInstallments}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs md:text-sm text-gray-500">
                  <span>
                    {formatCurrency(installmentAmount)}/{t.installmentAmount.toLowerCase()}
                  </span>
                  <span>
                    {t.totalAmount}: {formatCurrency(expense.totalAmount)}
                  </span>
                  {remaining > 0 && (
                    <span>
                      {t.remaining}: {formatCurrency(installmentAmount * remaining)}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-400 mt-0.5">
                  {t.date}:{" "}
                  {formatDate(getInstallmentDate(expense.startDate, expense.paidInstallments))}
                </div>
              </div>
            );
          })}

          {completedExpenses.length > 0 && (
            <>
              <div className="text-sm font-semibold text-gray-500 mt-4 mb-2">
                {t.installmentComplete}
              </div>
              {completedExpenses.map((expense) => {
                const installmentAmount = expense.totalAmount / expense.totalInstallments;
                return (
                  <div
                    key={expense.id}
                    className="py-3 border-b border-gray-100 last:border-b-0 opacity-60"
                  >
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <div className="flex flex-wrap items-center gap-1 min-w-0">
                        <span className="font-medium text-gray-800">{expense.description}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {t.categories[expense.category]}
                        </span>
                        {expense.cardId && cardMap.get(expense.cardId) && (
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {cardMap.get(expense.cardId)!.name} ••
                            {cardMap.get(expense.cardId)!.last4}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onStartEdit(expense.id)}
                          className="px-3 py-2 md:py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs md:text-sm cursor-pointer min-h-[36px] md:min-h-0"
                        >
                          {t.edit}
                        </button>
                        <button
                          onClick={() => onDeleteFixedExpense(expense.id)}
                          className="px-3 py-2 md:py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs md:text-sm cursor-pointer min-h-[36px] md:min-h-0"
                        >
                          {t.delete}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: "100%" }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                        {expense.paidInstallments} {t.installmentOf} {expense.totalInstallments}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs md:text-sm text-gray-500">
                      <span>
                        {formatCurrency(installmentAmount)}/{t.installmentAmount.toLowerCase()}
                      </span>
                      <span>
                        {t.totalAmount}: {formatCurrency(expense.totalAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}
