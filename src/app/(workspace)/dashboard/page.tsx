import { redirect } from "next/navigation";

import { getSession } from "@/modules/auth/infrastructure/session";
import { listCards } from "@/modules/cards/infrastructure/card-service";
import { listLatestExpenses } from "@/modules/expenses/infrastructure/expense-service";
import { listInstallments } from "@/modules/installments/infrastructure/installment-service";
import DashboardRouteClient from "./dashboard-route-client";

export default async function DashboardRoute() {
  if (!(await getSession())) redirect("/login");
  const [expenses, installments, cards] = await Promise.all([
    listLatestExpenses(),
    listInstallments(),
    listCards(),
  ]);
  return <DashboardRouteClient expenses={expenses} installments={installments} cards={cards} />;
}
