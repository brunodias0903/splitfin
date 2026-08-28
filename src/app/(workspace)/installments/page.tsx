"use client";

import { useFinance } from "../_providers/finance-provider";
import InstallmentsPage from "@/modules/installments/ui/installments-page";

export default function InstallmentsRoute() {
  const finance = useFinance();
  return (
    <InstallmentsPage
      fixedExpenses={finance.installments}
      cards={finance.cards}
      editingId={finance.editingId}
      onStartEdit={finance.startEditing}
      onCancelEdit={finance.cancelEditing}
      onAddFixedExpense={finance.addInstallment}
      onUpdateFixedExpense={finance.editInstallment}
      onDeleteFixedExpense={finance.deleteInstallment}
      onPayInstallment={finance.payInstallment}
    />
  );
}
