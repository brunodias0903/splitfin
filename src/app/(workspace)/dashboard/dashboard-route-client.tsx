"use client";

import type { Expense } from "@/modules/expenses/domain/expense";
import DashboardPage from "@/modules/dashboard/ui/dashboard-page";
import { useFinance } from "../_providers/finance-provider";

export default function DashboardRouteClient({ expenses }: { expenses: Expense[] }) {
  const { installments, cards } = useFinance();
  return <DashboardPage expenses={expenses} fixedExpenses={installments} cards={cards} />;
}
