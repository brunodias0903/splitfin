import { redirect } from "next/navigation";

import { getSession } from "@/modules/auth/infrastructure/session";
import { CATEGORIES } from "@/modules/expenses/domain/expense";
import { parsePageNumber, parseSortOrder } from "@/modules/expenses/application/persisted-expense";
import { listExpensePage } from "@/modules/expenses/infrastructure/expense-service";
import ExpensesRouteClient from "./expenses-route-client";

interface ExpensesRouteProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ExpensesRoute({ searchParams }: ExpensesRouteProps) {
  if (!(await getSession())) redirect("/login");
  const params = await searchParams;
  const categoryValue = typeof params.category === "string" ? params.category : undefined;
  const category = (CATEGORIES as readonly string[]).includes(categoryValue ?? "")
    ? categoryValue
    : undefined;
  const order = parseSortOrder(params.order);
  const expensePage = await listExpensePage({
    page: parsePageNumber(params.page),
    category,
    order,
  });

  return (
    <ExpensesRouteClient
      key={`${expensePage.page}:${expensePage.totalItems}:${expensePage.items.map((item) => item.id).join(",")}`}
      initialPage={expensePage}
      initialCategory={category ?? "All"}
      initialOrder={order}
    />
  );
}
