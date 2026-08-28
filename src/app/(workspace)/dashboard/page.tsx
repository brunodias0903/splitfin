"use client";

import { useFinance } from "../_providers/finance-provider";
import DashboardPage from "@/modules/dashboard/ui/dashboard-page";

export default function DashboardRoute() {
  const { expenses, installments, cards } = useFinance();
  return <DashboardPage expenses={expenses} fixedExpenses={installments} cards={cards} />;
}
