import "server-only";

import type {
  InstallmentData,
  InstallmentPlan,
  InstallmentUpdateData,
} from "../domain/installment";
import { categoryToSlug, slugToCategory } from "@/modules/expenses/application/persisted-expense";
import { createPostgresExpenseRepository } from "@/modules/expenses/infrastructure/postgres-expense-repository";
import { getDatabase } from "@/shared/db/client";
import { createPostgresInstallmentRepository } from "./postgres-installment-repository";

function repositories() {
  const database = getDatabase();
  return {
    installments: createPostgresInstallmentRepository({ database }),
    expenses: createPostgresExpenseRepository({ database }),
  };
}

function toPlan(row: {
  id: string;
  description: string;
  totalAmountCents: number;
  totalInstallments: number;
  paidInstallments: number;
  startsOn: string;
  cardId: string | null;
  categorySlug: string | null;
}): InstallmentPlan {
  return {
    id: row.id,
    description: row.description,
    totalAmount: row.totalAmountCents / 100,
    totalInstallments: row.totalInstallments,
    paidInstallments: row.paidInstallments,
    category: slugToCategory(row.categorySlug),
    startDate: row.startsOn,
    active: row.paidInstallments < row.totalInstallments,
    cardId: row.cardId ?? undefined,
  };
}

async function categoryIdFor(category: string) {
  const { expenses } = repositories();
  const result = await expenses.findCategoryBySlug(categoryToSlug(category));
  if (!result) throw new Error("Canonical installment category is missing.");
  return result.id;
}

export async function listInstallments(): Promise<InstallmentPlan[]> {
  return (await repositories().installments.listDetailed()).map(toPlan);
}

export async function createPersistedInstallment(data: InstallmentData): Promise<InstallmentPlan> {
  const { installments } = repositories();
  const plan = await installments.create({
    description: data.description,
    totalAmountCents: Math.round(data.totalAmount * 100),
    totalInstallments: data.totalInstallments,
    paidInstallments: 0,
    startsOn: data.startDate,
    categoryId: await categoryIdFor(data.category),
    cardId: data.cardId ?? null,
  });

  for (let index = 0; index < data.paidInstallments; index += 1) {
    await installments.payNext(plan.id, index);
  }
  return (await listInstallments()).find(({ id }) => id === plan.id)!;
}

export async function updatePersistedInstallment(
  id: string,
  data: InstallmentUpdateData,
): Promise<InstallmentPlan | null> {
  const { installments } = repositories();
  const current = await installments.findById(id);
  if (!current || data.totalInstallments < current.paidInstallments) return null;
  const hasGeneratedExpenses = current.paidInstallments > 0;
  const updated = await installments.update(id, {
    description: data.description,
    totalAmountCents: hasGeneratedExpenses
      ? current.totalAmountCents
      : Math.round(data.totalAmount * 100),
    totalInstallments: hasGeneratedExpenses ? current.totalInstallments : data.totalInstallments,
    startsOn: hasGeneratedExpenses ? current.startsOn : data.startDate,
    categoryId: await categoryIdFor(data.category),
    cardId: data.cardId ?? null,
  });
  if (!updated) return null;
  return (await listInstallments()).find((plan) => plan.id === id) ?? null;
}

export async function payPersistedInstallment(
  id: string,
  expectedPaidInstallments: number,
): Promise<InstallmentPlan | null> {
  const updated = await repositories().installments.payNext(id, expectedPaidInstallments);
  if (!updated) return null;
  return (await listInstallments()).find((plan) => plan.id === id) ?? null;
}

export async function archivePersistedInstallment(id: string): Promise<boolean> {
  return repositories().installments.archive(id);
}
