import type { Card, FixedExpense, FixedExpenseData } from "../types";
import FixedExpenseForm from "../components/FixedExpenseForm";
import FixedExpenseList from "../components/FixedExpenseList";
import { useLocale } from "../i18n";
import { Heading, Text } from "../components/ui";

interface InstallmentsPageProps {
  fixedExpenses: FixedExpense[];
  cards: Card[];
  editingId: string | null;
  onStartEdit: (id: string | null) => void;
  onCancelEdit: () => void;
  onAddFixedExpense: (data: FixedExpenseData) => void;
  onUpdateFixedExpense: (data: FixedExpenseData) => void;
  onDeleteFixedExpense: (id: string) => void;
  onPayInstallment: (id: string) => void;
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
        <FixedExpenseForm
          onSubmit={editingId ? onUpdateFixedExpense : onAddFixedExpense}
          editingFixedExpense={editingFixedExpense}
          onCancelEdit={onCancelEdit}
          cards={cards}
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
