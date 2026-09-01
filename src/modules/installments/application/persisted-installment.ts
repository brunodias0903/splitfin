import { CATEGORIES, type ExpenseCategory } from "@/modules/expenses/domain/expense";
import type { InstallmentData, InstallmentUpdateData } from "../domain/installment";

export class InvalidInstallmentInputError extends Error {
  constructor() {
    super("Invalid installment data.");
    this.name = "InvalidInstallmentInputError";
  }
}

function parseCommon(value: unknown) {
  if (typeof value !== "object" || value === null) throw new InvalidInstallmentInputError();
  const input = value as Record<string, unknown>;
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const totalAmount = Number(input.totalAmount);
  const totalInstallments = Number(input.totalInstallments);
  const category = input.category;
  const startDate = input.startDate;
  const cardId = input.cardId === "" || input.cardId === undefined ? undefined : input.cardId;

  if (
    description.length < 2 ||
    description.length > 160 ||
    !Number.isFinite(totalAmount) ||
    totalAmount <= 0 ||
    !Number.isInteger(totalInstallments) ||
    totalInstallments < 2 ||
    totalInstallments > 999 ||
    typeof category !== "string" ||
    !(CATEGORIES as readonly string[]).includes(category) ||
    typeof startDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    (cardId !== undefined &&
      (typeof cardId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cardId)))
  ) {
    throw new InvalidInstallmentInputError();
  }

  return {
    description,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalInstallments,
    category: category as ExpenseCategory,
    startDate,
    cardId,
  };
}

export function parseInstallmentInput(value: unknown): InstallmentData {
  const common = parseCommon(value);
  const paidInstallments = Number((value as Record<string, unknown>).paidInstallments);
  if (
    !Number.isInteger(paidInstallments) ||
    paidInstallments < 0 ||
    paidInstallments > common.totalInstallments
  ) {
    throw new InvalidInstallmentInputError();
  }
  return { ...common, paidInstallments };
}

export function parseInstallmentUpdateInput(value: unknown): InstallmentUpdateData {
  return parseCommon(value);
}

export function parseInstallmentId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new InvalidInstallmentInputError();
  }
  return value;
}

export function parsePaidInstallments(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999) {
    throw new InvalidInstallmentInputError();
  }
  return parsed;
}
