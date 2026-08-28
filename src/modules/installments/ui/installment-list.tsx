import type { Card } from "@/modules/cards/domain/card";
import { getInstallmentDate } from "../domain/installment-calculations";
import type { InstallmentPlan } from "../domain/installment";
import { useLocale } from "@/shared/i18n";
import { Icon } from "@/shared/ui/icons";
import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Heading,
  IconButton,
  Text,
} from "@/shared/ui";

interface FixedExpenseListProps {
  fixedExpenses: InstallmentPlan[];
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
  const cardMap = new Map(cards.map((card) => [card.id, card]));
  const activeExpenses = fixedExpenses.filter((expense) => expense.active);
  const completedExpenses = fixedExpenses.filter((expense) => !expense.active);
  const remainingTotal = activeExpenses.reduce((sum, expense) => {
    const installmentAmount = expense.totalAmount / expense.totalInstallments;
    return sum + installmentAmount * (expense.totalInstallments - expense.paidInstallments);
  }, 0);

  return (
    <section className="surface min-w-0 overflow-hidden">
      <div className="ds-card-header">
        <div>
          <Text variant="eyebrow" tone="muted" className="mb-1">
            {t.tracking}
          </Text>
          <Heading level={2} variant="section">
            {t.installments}
          </Heading>
        </div>
        {fixedExpenses.length > 0 && (
          <Badge className="bg-primary-soft text-primary">
            {activeExpenses.length} {t.activePlural}
          </Badge>
        )}
      </div>

      {fixedExpenses.length === 0 ? (
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 rounded-2xl text-subtle-foreground">
              <Icon name="installments" size={21} />
            </EmptyMedia>
            <EmptyTitle>{t.noInstallments}</EmptyTitle>
            <EmptyDescription>{t.emptyInstallmentHint}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 divide-x divide-border-subtle border-b border-border-subtle bg-surface-subtle/60">
            <div className="px-5 py-4 sm:px-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-subtle-foreground">
                {t.inProgress}
              </p>
              <p className="mt-1 text-base font-bold text-strong">{activeExpenses.length}</p>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-subtle-foreground">
                {t.remainingBalance}
              </p>
              <p className="mt-1 truncate text-base font-bold text-strong">
                {formatCurrency(remainingTotal)}
              </p>
            </div>
          </div>

          {activeExpenses.length > 0 && (
            <div className="space-y-3 p-4 sm:p-5">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold uppercase tracking-wider text-subtle-foreground">
                  {t.activeLabel}
                </p>
                <p className="text-xs text-subtle-foreground">{t.nextDue}</p>
              </div>
              {activeExpenses.map((expense) => {
                const installmentAmount = expense.totalAmount / expense.totalInstallments;
                const remaining = expense.totalInstallments - expense.paidInstallments;
                const remainingAmount = installmentAmount * remaining;
                const progress = (expense.paidInstallments / expense.totalInstallments) * 100;
                const nextDate = getInstallmentDate(expense.startDate, expense.paidInstallments);
                const card = expense.cardId ? cardMap.get(expense.cardId) : undefined;

                return (
                  <article
                    key={expense.id}
                    className="rounded-2xl border border-border/80 bg-surface p-4 shadow-list-item transition-shadow hover:shadow-list-item-hover sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold text-strong">
                            {expense.description}
                          </h3>
                          <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {t.categories[expense.category]}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-subtle-foreground">
                          {card && (
                            <span className="inline-flex items-center gap-1 text-primary">
                              <Icon name="cards" size={13} /> {card.name} ••{card.last4}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Icon name="calendar" size={13} /> {formatDate(nextDate)}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-base font-bold text-strong">
                          {formatCurrency(installmentAmount)}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle-foreground">
                          {t.perInstallment}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">
                          {expense.paidInstallments} {t.installmentOf} {expense.totalInstallments}{" "}
                          {t.paidPlural}
                        </span>
                        <span className="font-bold text-primary">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-highlight to-data-5 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex gap-5 text-xs">
                        <div>
                          <p className="text-subtle-foreground">{t.remaining}</p>
                          <p className="mt-0.5 font-bold text-foreground">
                            {formatCurrency(remainingAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-subtle-foreground">{t.totalAmount}</p>
                          <p className="mt-0.5 font-bold text-foreground">
                            {formatCurrency(expense.totalAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          onClick={() => onPayInstallment(expense.id)}
                          variant="success"
                          className="flex-1 sm:flex-none"
                        >
                          <Icon name="check" size={15} /> {t.payInstallment}
                        </Button>
                        <IconButton
                          onClick={() => onStartEdit(expense.id)}
                          label={t.edit}
                          variant="secondary"
                        >
                          <Icon name="edit" size={15} />
                        </IconButton>
                        <IconButton
                          onClick={() => onDeleteFixedExpense(expense.id)}
                          label={t.delete}
                          variant="destructive"
                        >
                          <Icon name="trash" size={15} />
                        </IconButton>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {completedExpenses.length > 0 && (
            <div className="border-t border-border-subtle px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-xs font-bold uppercase tracking-wider text-subtle-foreground">
                  {t.installmentComplete}
                </p>
                <span className="text-xs font-semibold text-success">
                  {completedExpenses.length} {t.completedPlural}
                </span>
              </div>
              <div className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface-subtle/60 px-4">
                {completedExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex flex-wrap items-center gap-3 py-3.5 sm:flex-nowrap"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                      <Icon name="check" size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-muted-foreground">
                        {expense.description}
                      </p>
                      <p className="text-[11px] text-subtle-foreground">
                        {expense.totalInstallments} parcelas · {formatCurrency(expense.totalAmount)}
                      </p>
                    </div>
                    <div className="ml-auto flex gap-1">
                      <IconButton
                        onClick={() => onStartEdit(expense.id)}
                        label={t.edit}
                        variant="ghost"
                        size="icon-sm"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-subtle-foreground hover:bg-surface hover:text-primary"
                      >
                        <Icon name="edit" size={14} />
                      </IconButton>
                      <IconButton
                        onClick={() => onDeleteFixedExpense(expense.id)}
                        label={t.delete}
                        variant="ghost"
                        size="icon-sm"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-subtle-foreground hover:bg-danger-soft hover:text-danger"
                      >
                        <Icon name="trash" size={14} />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
