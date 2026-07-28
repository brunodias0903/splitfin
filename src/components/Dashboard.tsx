import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Card, Expense, FixedExpense } from "../types";
import { CATEGORIES, getInstallmentDate } from "../types";
import { useLocale } from "../i18n";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

interface DashboardProps {
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  cards: Card[];
}

function getYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function isSameMonth(dateStr: string, yearMonth: string): boolean {
  return dateStr.slice(0, 7) === yearMonth;
}

export default function Dashboard({ expenses, fixedExpenses, cards }: DashboardProps) {
  const { t, formatCurrency, formatDate } = useLocale();
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(currentYM);

  const prevMonth = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [selectedMonth]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(getYearMonth(e.date)));
    fixedExpenses.forEach((e) => {
      for (let i = 0; i < e.totalInstallments; i++) {
        set.add(getYearMonth(getInstallmentDate(e.startDate, i)));
      }
    });
    const sorted = Array.from(set).sort().reverse();
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const ym = `${today.getFullYear()}-${String(today.getMonth() + 1 + i).padStart(2, "0")}`;
      if (!sorted.includes(ym)) sorted.push(ym);
    }
    return sorted.sort().reverse();
  }, [expenses, fixedExpenses]);

  const { thisMonthExpenses, thisMonthTotal } = useMemo(() => {
    const filtered = expenses.filter((e) => isSameMonth(e.date, selectedMonth));
    const total = filtered.reduce((s, e) => s + e.amount, 0);
    return { thisMonthExpenses: filtered, thisMonthTotal: total };
  }, [expenses, selectedMonth]);

  const lastMonthTotal = useMemo(() => {
    return expenses.filter((e) => isSameMonth(e.date, prevMonth)).reduce((s, e) => s + e.amount, 0);
  }, [expenses, prevMonth]);

  const percentChange = useMemo(() => {
    if (lastMonthTotal === 0) return thisMonthTotal > 0 ? 100 : 0;
    return ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  }, [lastMonthTotal, thisMonthTotal]);

  const categoryData = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const total = thisMonthExpenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + e.amount, 0);
      return { name: t.categories[cat], value: total };
    }).filter((d) => d.value > 0);
  }, [thisMonthExpenses, t]);

  const cardForecast = useMemo(() => {
    const cardTotals: Record<string, number> = {};
    fixedExpenses
      .filter((e) => e.active && e.cardId)
      .forEach((e) => {
        const installmentAmount = e.totalAmount / e.totalInstallments;
        const nextDate = getInstallmentDate(e.startDate, e.paidInstallments);
        if (isSameMonth(nextDate, selectedMonth)) {
          cardTotals[e.cardId!] = (cardTotals[e.cardId!] || 0) + installmentAmount;
        }
      });
    return Object.entries(cardTotals)
      .map(([cardId, total]) => {
        const card = cards.find((c) => c.id === cardId);
        return {
          cardName: card ? `${card.name} ••${card.last4}` : t.noCard,
          total,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [fixedExpenses, cards, selectedMonth, t]);

  const upcomingPayments = useMemo(() => {
    return fixedExpenses
      .filter((e) => e.active)
      .map((e) => {
        const installmentAmount = e.totalAmount / e.totalInstallments;
        const nextDate = getInstallmentDate(e.startDate, e.paidInstallments);
        return {
          ...e,
          installmentAmount,
          nextDate,
        };
      })
      .filter((e) => getYearMonth(e.nextDate) >= currentYM)
      .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
      .slice(0, 5);
  }, [fixedExpenses, currentYM]);

  return (
    <div className="flex flex-col gap-5">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 pr-10 border border-gray-300 rounded text-sm bg-white"
        >
          {monthOptions.map((ym) => (
            <option key={ym} value={ym}>
              {new Date(`${ym}-01`).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
              })}
            </option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {t.thisMonth}
          </span>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(thisMonthTotal)}</p>
          <span
            className={`text-xs font-medium ${percentChange >= 0 ? "text-red-500" : "text-emerald-500"}`}
          >
            {percentChange >= 0 ? "+" : ""}
            {percentChange.toFixed(1)}% {t.vsLastMonth}
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {t.lastMonth}
          </span>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(lastMonthTotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {t.forecast}
          </span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {formatCurrency(cardForecast.reduce((s, c) => s + c.total, 0))}
          </p>
          <span className="text-xs text-gray-400">{t.byCard}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut chart */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.byCategory}</h3>
          {categoryData.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">{t.noData}</p>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                {categoryData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span>{d.name}</span>
                    <span className="font-medium">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card forecast */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.byCard}</h3>
          {cardForecast.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">{t.noData}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {cardForecast.map((item) => (
                <div key={item.cardName} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.cardName}</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming installments */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.nextInstallments}</h3>
        {upcomingPayments.length === 0 ? (
          <p className="text-gray-400 text-center py-5 text-sm">{t.noUpcoming}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingPayments.map((expense) => {
              const card = cards.find((c) => c.id === expense.cardId);
              return (
                <div
                  key={expense.id}
                  className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-800">{expense.description}</span>
                    <span className="text-xs text-gray-400">
                      {expense.paidInstallments + 1}/{expense.totalInstallments}
                      {card && ` — ${card.name}`}
                      {" — "}
                      {formatDate(expense.nextDate)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">
                    {formatCurrency(expense.installmentAmount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
