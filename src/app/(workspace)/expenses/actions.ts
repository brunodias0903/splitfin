"use server";

import { revalidatePath } from "next/cache";

import type { Expense } from "@/modules/expenses/domain/expense";
import {
  InvalidExpenseInputError,
  parseExpenseId,
  parseExpenseInput,
} from "@/modules/expenses/application/persisted-expense";
import {
  createPersistedExpense,
  deletePersistedExpense,
  updatePersistedExpense,
} from "@/modules/expenses/infrastructure/expense-service";

export type ExpenseActionResult =
  { ok: true; expense?: Expense } | { ok: false; reason: "invalid" | "not-found" | "unexpected" };

function refreshExpenseViews() {
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

function failure(error: unknown): ExpenseActionResult {
  if (error instanceof InvalidExpenseInputError) return { ok: false, reason: "invalid" };
  console.error("Expense persistence action failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return { ok: false, reason: "unexpected" };
}

export async function createExpenseAction(input: unknown): Promise<ExpenseActionResult> {
  try {
    const expense = await createPersistedExpense(parseExpenseInput(input));
    refreshExpenseViews();
    return { ok: true, expense };
  } catch (error) {
    return failure(error);
  }
}

export async function updateExpenseAction(
  id: unknown,
  input: unknown,
): Promise<ExpenseActionResult> {
  try {
    const expense = await updatePersistedExpense(parseExpenseId(id), parseExpenseInput(input));
    if (!expense) return { ok: false, reason: "not-found" };
    refreshExpenseViews();
    return { ok: true, expense };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteExpenseAction(id: unknown): Promise<ExpenseActionResult> {
  try {
    const deleted = await deletePersistedExpense(parseExpenseId(id));
    if (!deleted) return { ok: false, reason: "not-found" };
    refreshExpenseViews();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
