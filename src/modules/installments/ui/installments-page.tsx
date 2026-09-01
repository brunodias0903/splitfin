import type { Card } from "@/modules/cards/domain/card";
import type { InstallmentData, InstallmentPlan } from "../domain/installment";
import FixedExpenseForm from "./installment-form";
import FixedExpenseList from "./installment-list";
import { useLocale } from "@/shared/i18n";
import { Heading, Text } from "@/shared/ui";

interface InstallmentsPageProps {
  fixedExpenses: InstallmentPlan[];
  cards: Card[];
  editingId: string | null;
  onStartEdit: (id: string | null) => void;
  onCancelEdit: () => void;
  onAddFixedExpense: (data: InstallmentData) => Promise<boolean>;
  onUpdateFixedExpense: (data: InstallmentData) => Promise<boolean>;
  onDeleteFixedExpense: (id: string) => Promise<void>;
  onPayInstallment: (id: string) => Promise<void>;
  pending?: boolean;
  error?: string | null;
}

export default function InstallmentsPage({
  fixedExpenses,
  cards,
  editingId,
  onStartEdit,
  onCancelEdit,
  onAddFixedExpense,
  onUpdateFixedExpense,
  onDeleteFixedExpense,
  onPayInstallment,
  pending,
  error,
}: InstallmentsPageProps) {
  const { t } = useLocale();
  const editingFixedExpense = editingId ? fixedExpenses.find((e) => e.id === editingId) : undefined;

  return (
    <div className="ds-page">
      <div>
        <Text variant="eyebrow" tone="muted" className="mb-2">
          {t.planning}
        </Text>
        <Heading level={1} variant="page">
          {t.installmentsTab}
        </Heading>
        <Text variant="small" tone="muted" className="mt-1.5">
          {t.installmentsSubtitle}
        </Text>
      </div>
      <div className="ds-content-grid">
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <FixedExpenseForm
          onSubmit={editingId ? onUpdateFixedExpense : onAddFixedExpense}
          editingFixedExpense={editingFixedExpense}
          onCancelEdit={onCancelEdit}
          cards={cards}
          pending={pending}
        />
        <FixedExpenseList
          fixedExpenses={fixedExpenses}
          cards={cards}
          onDeleteFixedExpense={onDeleteFixedExpense}
          onStartEdit={onStartEdit}
          onPayInstallment={onPayInstallment}
        />
      </div>
    </div>
  );
}
