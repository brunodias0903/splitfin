"use server";

import { revalidatePath } from "next/cache";

import type { InstallmentPlan } from "@/modules/installments/domain/installment";
import {
  InvalidInstallmentInputError,
  parseInstallmentId,
  parseInstallmentInput,
  parseInstallmentUpdateInput,
  parsePaidInstallments,
} from "@/modules/installments/application/persisted-installment";
import {
  archivePersistedInstallment,
  createPersistedInstallment,
  payPersistedInstallment,
  updatePersistedInstallment,
} from "@/modules/installments/infrastructure/installment-service";

export type InstallmentActionResult =
  | { ok: true; plan?: InstallmentPlan }
  | { ok: false; reason: "invalid" | "not-found" | "unexpected" };

function refresh() {
  revalidatePath("/installments");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

function failure(error: unknown): InstallmentActionResult {
  if (error instanceof InvalidInstallmentInputError) return { ok: false, reason: "invalid" };
  console.error("Installment persistence action failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return { ok: false, reason: "unexpected" };
}

export async function createInstallmentAction(input: unknown): Promise<InstallmentActionResult> {
  try {
    const plan = await createPersistedInstallment(parseInstallmentInput(input));
    refresh();
    return { ok: true, plan };
  } catch (error) {
    return failure(error);
  }
}

export async function updateInstallmentAction(
  id: unknown,
  input: unknown,
): Promise<InstallmentActionResult> {
  try {
    const plan = await updatePersistedInstallment(
      parseInstallmentId(id),
      parseInstallmentUpdateInput(input),
    );
    if (!plan) return { ok: false, reason: "not-found" };
    refresh();
    return { ok: true, plan };
  } catch (error) {
    return failure(error);
  }
}

export async function payInstallmentAction(
  id: unknown,
  expectedPaidInstallments: unknown,
): Promise<InstallmentActionResult> {
  try {
    const plan = await payPersistedInstallment(
      parseInstallmentId(id),
      parsePaidInstallments(expectedPaidInstallments),
    );
    if (!plan) return { ok: false, reason: "not-found" };
    refresh();
    return { ok: true, plan };
  } catch (error) {
    return failure(error);
  }
}

export async function archiveInstallmentAction(id: unknown): Promise<InstallmentActionResult> {
  try {
    if (!(await archivePersistedInstallment(parseInstallmentId(id)))) {
      return { ok: false, reason: "not-found" };
    }
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
