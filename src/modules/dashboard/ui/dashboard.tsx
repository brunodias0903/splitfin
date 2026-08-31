import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Card } from "@/modules/cards/domain/card";
import { CATEGORIES, type Expense } from "@/modules/expenses/domain/expense";
import { getInstallmentDate } from "@/modules/installments/domain/installment-calculations";
import type { InstallmentPlan } from "@/modules/installments/domain/installment";
import { useLocale } from "@/shared/i18n";
import { Icon } from "@/shared/ui/icons";
import { Heading, NativeSelect, Surface, Text } from "@/shared/ui";

const CHART_COLORS = [
  "var(--data-1)",
  "var(--data-2)",
  "var(--data-3)",
  "var(--data-4)",
  "var(--data-5)",
  "var(--data-6)",
];

interface DashboardProps {
  expenses: Expense[];
  fixedExpenses: InstallmentPlan[];
  cards: Card[];
}

function getYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function isSameMonth(dateStr: string, yearMonth: string): boolean {
  return dateStr.slice(0, 7) === yearMonth;
}

export default function Dashboard({ expenses, fixedExpenses, cards }: DashboardProps) {
  const { t, formatCurrency, formatDate, formatMonth } = useLocale();
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
    <div className="flex flex-col gap-6">
      {/* Month selector */}
      <div className="flex items-center justify-between gap-3">
        <Text variant="small" tone="muted" className="hidden font-semibold sm:block">
          {t.analysisPeriod}
        </Text>
        <NativeSelect
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          aria-label={t.analysisPeriod}
          className="max-w-[210px] font-semibold capitalize"
        >
          {monthOptions.map((ym) => (
            <option key={ym} value={ym}>
              {formatMonth(ym)}
            </option>
          ))}
        </NativeSelect>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Surface className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-primary-soft" />
          <div className="relative flex items-start justify-between">
            <span className="eyebrow">{t.thisMonth}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Icon name="wallet" size={18} />
            </span>
          </div>
          <p className="relative mt-4 text-2xl font-bold tracking-tight text-strong sm:text-[1.7rem]">
            {formatCurrency(thisMonthTotal)}
          </p>
          <span
            className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${percentChange >= 0 ? "bg-danger-soft text-danger-strong" : "bg-success-soft text-success"}`}
          >
            {percentChange >= 0 ? "+" : ""}
            {percentChange.toFixed(1)}% {t.vsLastMonth}
          </span>
        </Surface>
        <Surface className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <span className="eyebrow">{t.lastMonth}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-soft text-warning">
              <Icon name="calendar" size={18} />
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight text-strong sm:text-[1.7rem]">
            {formatCurrency(lastMonthTotal)}
          </p>
          <span className="mt-2 block text-xs font-medium text-muted-foreground">
            {t.consolidatedHistory}
          </span>
        </Surface>
        <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-on-brand shadow-primary-lg sm:p-6">
          <div className="absolute -bottom-12 -right-8 h-32 w-32 rounded-full border-[22px] border-on-brand/8" />
          <div className="relative flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-on-brand/90">
              {t.forecast}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface/12 text-on-brand">
              <Icon name="trend" size={18} />
            </span>
          </div>
          <p className="relative mt-4 text-2xl font-bold tracking-tight sm:text-[1.7rem]">
            {formatCurrency(cardForecast.reduce((s, c) => s + c.total, 0))}
          </p>
          <span className="relative mt-2 block text-xs font-medium text-on-brand/90">
            {t.byCard}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Donut chart */}
        <Surface className="p-5 sm:p-6">
          <Heading level={3} variant="section" className="mb-3">
            {t.byCategory}
          </Heading>
          {categoryData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t.noData}</p>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
                {categoryData.map((d, i) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span>{d.name}</span>
                    <span className="font-bold text-foreground">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Surface>

        {/* Card forecast */}
        <Surface className="p-5 sm:p-6">
          <Heading level={3} variant="section" className="mb-5">
            {t.byCard}
          </Heading>
          {cardForecast.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t.noData}</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {cardForecast.map((item, index) => (
                <div
                  key={item.cardName}
                  className="flex items-center justify-between rounded-xl bg-surface-subtle px-4 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-xs font-bold text-primary shadow-sm">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {item.cardName}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-strong">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Surface>
      </div>

      {/* Upcoming installments */}
      <Surface className="overflow-hidden">
        <div className="border-b border-border-subtle px-5 py-4 sm:px-6">
          <Heading level={3} variant="section">
            {t.nextInstallments}
          </Heading>
        </div>
        {upcomingPayments.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t.noUpcoming}</p>
        ) : (
          <div className="flex flex-col px-5 py-1 sm:px-6">
            {upcomingPayments.map((expense) => {
              const card = cards.find((c) => c.id === expense.cardId);
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between gap-4 border-b border-border-subtle py-4 last:border-b-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {expense.description}
                    </span>
                    <span className="mt-0.5 text-xs text-subtle-foreground">
                      {expense.paidInstallments + 1}/{expense.totalInstallments}
                      {card && ` — ${card.name}`}
                      {" — "}
                      {formatDate(expense.nextDate)}
                    </span>
                  </div>
                  <span className="whitespace-nowrap text-sm font-bold text-primary">
                    {formatCurrency(expense.installmentAmount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Surface>
    </div>
  );
}
