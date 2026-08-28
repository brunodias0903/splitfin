import { useMemo } from "react";
import type { Card } from "@/modules/cards/domain/card";
import type { Expense } from "@/modules/expenses/domain/expense";
import type { InstallmentPlan } from "@/modules/installments/domain/installment";
import Dashboard from "./dashboard";
import { useLocale } from "@/shared/i18n";
import { Heading, Surface, Text } from "@/shared/ui";

interface DashboardPageProps {
  expenses: Expense[];
  fixedExpenses: InstallmentPlan[];
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
    <div className="ds-page">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Text variant="eyebrow" tone="muted" className="mb-2">
            {t.overview}
          </Text>
          <Heading level={1} variant="page">
            {t.greeting}
          </Heading>
          <Text variant="small" tone="muted" className="mt-1.5">
            {t.subtitle}
          </Text>
        </div>
        <div className="hidden rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-sm sm:block">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            day: "2-digit",
            month: "short",
          })}
        </div>
      </div>

      <Dashboard expenses={expenses} fixedExpenses={fixedExpenses} cards={cards} />

      {recentExpenses.length > 0 && (
        <Surface className="overflow-hidden">
          <div className="ds-card-header">
            <Heading level={3} variant="section">
              {t.recentExpenses}
            </Heading>
            <span className="text-xs font-semibold text-subtle-foreground">
              {recentExpenses.length} {t.items}
            </span>
          </div>
          <div className="flex flex-col px-5 py-2 sm:px-6">
            {recentExpenses.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-4 border-b border-border-subtle py-3.5 last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{e.description}</span>
                  <span className="mt-0.5 text-xs text-subtle-foreground">
                    {formatDate(e.date)}
                    {e.time && ` ${e.time.slice(0, 5)}`}
                  </span>
                </div>
                <span className="whitespace-nowrap text-sm font-bold text-strong">
                  {formatCurrency(e.amount)}
                </span>
              </div>
            ))}
          </div>
        </Surface>
      )}
    </div>
  );
}
