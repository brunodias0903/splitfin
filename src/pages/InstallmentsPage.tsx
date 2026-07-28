import type { Card, FixedExpense, FixedExpenseData } from "../types";
import FixedExpenseForm from "../components/FixedExpenseForm";
import FixedExpenseList from "../components/FixedExpenseList";
import { useLocale } from "../i18n";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t.installmentsTab}</h1>
      </div>
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
  );
}
