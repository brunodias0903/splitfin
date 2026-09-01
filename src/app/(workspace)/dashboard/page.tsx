import { redirect } from "next/navigation";

import { getSession } from "@/modules/auth/infrastructure/session";
import { listLatestExpenses } from "@/modules/expenses/infrastructure/expense-service";
import DashboardRouteClient from "./dashboard-route-client";

export default async function DashboardRoute() {
  if (!(await getSession())) redirect("/login");
  const expenses = await listLatestExpenses();
  return <DashboardRouteClient expenses={expenses} />;
}
