"use client";

import type { Expense } from "@/modules/expenses/domain/expense";
import type { Card } from "@/modules/cards/domain/card";
import type { InstallmentPlan } from "@/modules/installments/domain/installment";
import DashboardPage from "@/modules/dashboard/ui/dashboard-page";

export default function DashboardRouteClient({
  expenses,
  installments,
  cards,
}: {
  expenses: Expense[];
  installments: InstallmentPlan[];
  cards: Card[];
}) {
  return <DashboardPage expenses={expenses} fixedExpenses={installments} cards={cards} />;
}
