import "server-only";

import type { Expense, ExpenseData, ExpensePage, ExpenseSortOrder } from "../domain/expense";
import {
  categoryToSlug,
  expenseDateTimeToDatabase,
  paymentTypeFromDatabase,
  paymentTypeToDatabase,
  slugToCategory,
  toManausParts,
} from "../application/persisted-expense";
import { getDatabase } from "@/shared/db/client";
import { createPostgresExpenseRepository } from "./postgres-expense-repository";

const PAGE_SIZE = 10;

function repository() {
  return createPostgresExpenseRepository({ database: getDatabase() });
}

function toExpense(row: {
  id: string;
  description: string;
  amountCents: number;
  paymentType: string;
  occurredAt: Date;
  cardId: string | null;
  categorySlug: string | null;
}): Expense {
  const { date, time } = toManausParts(row.occurredAt);
  return {
    id: row.id,
    description: row.description,
    amount: row.amountCents / 100,
    category: slugToCategory(row.categorySlug),
    paymentType: paymentTypeFromDatabase(row.paymentType),
    cardId: row.cardId ?? undefined,
    date,
    time,
  };
}

async function valuesFromInput(data: ExpenseData) {
  const expenseRepository = repository();
  const category = await expenseRepository.findCategoryBySlug(categoryToSlug(data.category));
  if (!category) throw new Error("Canonical expense category is missing from the database.");

  return {
    values: {
      description: data.description,
      amountCents: Math.round(data.amount * 100),
      paymentType: paymentTypeToDatabase(data.paymentType),
      occurredAt: expenseDateTimeToDatabase(data.date, data.time),
      categoryId: category.id,
      cardId: null,
    },
    expenseRepository,
  };
}

export async function listExpensePage(input: {
  page: number;
  category?: string;
  order: ExpenseSortOrder;
}): Promise<ExpensePage> {
  const result = await repository().listPage({
    page: input.page,
    pageSize: PAGE_SIZE,
    categorySlug: input.category ? categoryToSlug(input.category) : undefined,
    order: input.order,
  });
  const totalPages = Math.max(1, Math.ceil(result.totalItems / PAGE_SIZE));

  if (input.page > totalPages) {
    return listExpensePage({ ...input, page: totalPages });
  }

  return {
    items: result.items.map(toExpense),
    page: input.page,
    pageSize: PAGE_SIZE,
    totalItems: result.totalItems,
    totalPages,
    totalAmount: result.totalAmountCents / 100,
    averageAmount: result.totalItems ? result.totalAmountCents / result.totalItems / 100 : 0,
  };
}

export async function listLatestExpenses(limit = 100): Promise<Expense[]> {
  const result = await repository().listPage({
    page: 1,
    pageSize: Math.min(Math.max(limit, 1), 100),
    order: "newest",
  });
  return result.items.map(toExpense);
}

export async function createPersistedExpense(data: ExpenseData): Promise<Expense> {
  const { expenseRepository, values } = await valuesFromInput(data);
  const created = await expenseRepository.create(values);
  return toExpense({ ...created, categorySlug: categoryToSlug(data.category) });
}

export async function updatePersistedExpense(
  id: string,
  data: ExpenseData,
): Promise<Expense | null> {
  const { expenseRepository, values } = await valuesFromInput(data);
  const updated = await expenseRepository.update(id, values);
  return updated ? toExpense({ ...updated, categorySlug: categoryToSlug(data.category) }) : null;
}

export async function deletePersistedExpense(id: string): Promise<boolean> {
  return repository().remove(id);
}
