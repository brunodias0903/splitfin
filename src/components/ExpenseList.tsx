import { useState } from "react";
import type { Card, Expense } from "../types";
import { CATEGORIES } from "../types";
import { useLocale } from "../i18n";
import { Icon } from "./Icons";
import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Heading,
  IconButton,
  NativeSelect,
  Text,
} from "./ui";

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

const CATEGORY_STYLES: Record<string, string> = {
  Food: "bg-category-food-soft text-category-food ring-category-food-border",
  Transport: "bg-category-transport-soft text-category-transport ring-category-transport-border",
  Entertainment:
    "bg-category-entertainment-soft text-category-entertainment ring-category-entertainment-border",
  Shopping: "bg-category-shopping-soft text-category-shopping ring-category-shopping-border",
  Bills: "bg-category-bills-soft text-category-bills ring-category-bills-border",
  Subscription: "bg-primary-soft text-primary ring-primary-muted",
  Other: "bg-surface-muted text-muted-foreground ring-border",
};

const CATEGORY_DOTS: Record<string, string> = {
  Food: "bg-category-food-marker",
  Transport: "bg-category-transport-marker",
  Entertainment: "bg-category-entertainment-marker",
  Shopping: "bg-category-shopping-marker",
  Bills: "bg-category-bills-marker",
  Subscription: "bg-primary-highlight",
  Other: "bg-muted-foreground",
};

function getSortKey(expense: Expense): string {
  return expense.time ? `${expense.date}T${expense.time}` : `${expense.date}T00:00`;
}

function sortExpenses(list: Expense[], order: SortOrder): Expense[] {
  return [...list].sort((a, b) => {
    const first = getSortKey(a);
    const second = getSortKey(b);
    return order === "newest" ? second.localeCompare(first) : first.localeCompare(second);
  });
}

function downloadCSV(expenses: Expense[]) {
  const header = "Description,Amount,Payment,Category,Date,Time";
  const rows = expenses.map(
    (expense) =>
      `"${expense.description}",${expense.amount},"${expense.paymentType ?? ""}","${expense.category}","${expense.date}","${expense.time ?? ""}"`,
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "expenses.csv";
  anchor.click();
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
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const average = expenses.length ? total / expenses.length : 0;
  const cardMap = new Map(cards.map((card) => [card.id, card]));
  const categoryTotals = CATEGORIES.map((category) => ({
    category,
    total: expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0),
  })).filter(({ total: categoryTotal }) => categoryTotal > 0);

  return (
    <section className="surface min-w-0 overflow-hidden">
      <div className="ds-card-header flex-wrap">
        <div>
          <Text variant="eyebrow" tone="muted" className="mb-1">
            {t.history}
          </Text>
          <Heading level={2} variant="section">
            {t.expenses}
          </Heading>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
          <NativeSelect
            value={filterCategory}
            onChange={(event) => onFilterChange(event.target.value)}
            aria-label={t.allCategories}
            className="min-w-0 sm:min-w-40"
            size="sm"
          >
            <option value="All">{t.allCategories}</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t.categories[category]}
              </option>
            ))}
          </NativeSelect>
          {allExpenses.length > 0 && (
            <Button
              onClick={() => downloadCSV(allExpenses)}
              variant="secondary"
              size="sm"
              className="whitespace-nowrap"
              aria-label={t.exportCSV}
            >
              <Icon name="download" size={16} />
              <span className="hidden sm:inline">{t.exportCSV}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border-subtle border-b border-border-subtle bg-surface-subtle/60">
        <div className="px-4 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-subtle-foreground">
            {t.total}
          </p>
          <p className="mt-1 truncate text-sm font-bold text-strong sm:text-base">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="px-4 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-subtle-foreground">
            {t.average}
          </p>
          <p className="mt-1 truncate text-sm font-bold text-strong sm:text-base">
            {formatCurrency(average)}
          </p>
        </div>
        <div className="px-4 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-subtle-foreground">
            {t.records}
          </p>
          <p className="mt-1 text-sm font-bold text-strong sm:text-base">{sorted.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6">
        <div className="flex gap-1 rounded-xl bg-surface-muted/80 p-1">
          {(["newest", "oldest"] as const).map((order) => (
            <Button
              key={order}
              onClick={() => setSortOrder(order)}
              variant={sortOrder === order ? "outline" : "ghost"}
              size="sm"
              className={
                sortOrder === order ? "bg-surface text-primary shadow-sm" : "text-muted-foreground"
              }
            >
              {order === "newest" ? t.sortNewest : t.sortOldest}
            </Button>
          ))}
        </div>
        <span className="text-xs font-semibold text-subtle-foreground">
          {sorted.length} {t.entries}
        </span>
      </div>

      {categoryTotals.length > 0 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto border-y border-border-subtle px-5 py-3 sm:px-6">
          {categoryTotals.map(({ category, total: categoryTotal }) => (
            <div
              key={category}
              className="flex items-center gap-2 whitespace-nowrap rounded-full border border-border-subtle bg-surface px-2.5 py-1.5 text-xs shadow-sm"
            >
              <span className={`h-2 w-2 rounded-full ${CATEGORY_DOTS[category]}`} />
              <span className="text-muted-foreground">{t.categories[category]}</span>
              <span className="font-bold text-foreground">{formatCurrency(categoryTotal)}</span>
            </div>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 rounded-2xl text-subtle-foreground">
              <Icon name="expenses" size={21} />
            </EmptyMedia>
            <EmptyTitle>
              {filterCategory === "All" ? t.noExpenses : t.noExpensesCategory}
            </EmptyTitle>
            <EmptyDescription>{t.emptyExpenseHint}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div>
          <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_82px] gap-4 border-b border-border-subtle bg-surface-subtle/50 px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-subtle-foreground sm:grid">
            <span>{t.expenseColumn}</span>
            <span>{t.date}</span>
            <span className="text-right">{t.amount}</span>
            <span className="text-right">{t.actions}</span>
          </div>
          <ul className="list-none px-4 sm:px-6">
            {sorted.map((expense) => {
              const card = expense.cardId ? cardMap.get(expense.cardId) : undefined;
              const categoryLabel = t.categories[expense.category];
              return (
                <li
                  key={expense.id}
                  className="group grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 border-b border-border-subtle py-4 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_110px_110px_82px] sm:items-center sm:gap-4"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ring-1 ${CATEGORY_STYLES[expense.category]}`}
                    title={categoryLabel}
                  >
                    {categoryLabel.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-strong">
                      {expense.description}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {categoryLabel}
                      </span>
                      {expense.paymentType && (
                        <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {t.paymentTypes[expense.paymentType] ?? expense.paymentType}
                        </span>
                      )}
                      {card && (
                        <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] text-primary">
                          {card.name} ••{card.last4}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-start-2 text-xs text-subtle-foreground sm:col-start-auto">
                    <span className="sm:block">{formatDate(expense.date)}</span>
                    {expense.time && (
                      <span className="ml-1 sm:ml-0">{expense.time.slice(0, 5)}</span>
                    )}
                  </div>
                  <p className="col-start-2 row-start-3 whitespace-nowrap text-base font-bold text-strong sm:col-start-auto sm:row-start-auto sm:text-right sm:text-sm">
                    {formatCurrency(expense.amount)}
                  </p>
                  <div className="col-start-2 row-start-3 ml-auto flex items-center gap-1.5 sm:col-start-auto sm:row-start-auto">
                    <IconButton
                      onClick={() => onStartEdit(expense.id)}
                      label={t.edit}
                      variant="ghost"
                      size="icon-sm"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-subtle-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                    >
                      <Icon name="edit" size={15} />
                    </IconButton>
                    <IconButton
                      onClick={() => onDeleteExpense(expense.id)}
                      label={t.delete}
                      variant="ghost"
                      size="icon-sm"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-subtle-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <Icon name="trash" size={15} />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
