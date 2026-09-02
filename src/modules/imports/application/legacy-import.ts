import { parseCardInput } from "@/modules/cards/application/persisted-card";
import type { CardData } from "@/modules/cards/domain/card";
import { parseExpenseInput } from "@/modules/expenses/application/persisted-expense";
import type { ExpenseData } from "@/modules/expenses/domain/expense";
import { parseInstallmentInput } from "@/modules/installments/application/persisted-installment";
import type { InstallmentData } from "@/modules/installments/domain/installment";

export const LEGACY_STORAGE_KEYS = ["cards", "expenses", "fixedExpenses"] as const;

export interface LegacyImportPayload {
  cards: unknown[];
  expenses: unknown[];
  fixedExpenses: unknown[];
}

export interface ParsedLegacyItem<T> {
  sourceId: string;
  sourceCardId?: string;
  data: T;
}

export interface ParsedLegacyImport {
  cards: ParsedLegacyItem<CardData>[];
  expenses: ParsedLegacyItem<ExpenseData>[];
  installments: ParsedLegacyItem<InstallmentData>[];
  invalid: { cards: number; expenses: number; installments: number };
  unresolvedCardReferences: number;
}

function sourceId(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const id = (value as Record<string, unknown>).id;
  return typeof id === "string" && id.length > 0 && id.length <= 200 ? id : null;
}

function sourceCardId(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const id = (value as Record<string, unknown>).cardId;
  return typeof id === "string" && id.length > 0 && id.length <= 200 ? id : undefined;
}

function parseItems<T>(
  values: unknown[],
  parse: (value: unknown) => T,
): { valid: ParsedLegacyItem<T>[]; invalid: number } {
  const valid: ParsedLegacyItem<T>[] = [];
  const seen = new Set<string>();
  let invalid = 0;

  for (const value of values) {
    const id = sourceId(value);
    if (!id || seen.has(id)) {
      invalid += 1;
      continue;
    }
    try {
      valid.push({ sourceId: id, sourceCardId: sourceCardId(value), data: parse(value) });
      seen.add(id);
    } catch {
      invalid += 1;
    }
  }
  return { valid, invalid };
}

export function parseLegacyImport(value: unknown): ParsedLegacyImport {
  const input =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const cardsInput = Array.isArray(input.cards) ? input.cards : [];
  const expensesInput = Array.isArray(input.expenses) ? input.expenses : [];
  const installmentsInput = Array.isArray(input.fixedExpenses) ? input.fixedExpenses : [];

  const cards = parseItems(cardsInput, parseCardInput);
  const expenses = parseItems(expensesInput, (item) => {
    const record = item as Record<string, unknown>;
    return parseExpenseInput({
      ...record,
      paymentType: record.paymentType ?? "other",
      cardId: undefined,
    });
  });
  const installments = parseItems(installmentsInput, (item) =>
    parseInstallmentInput({ ...(item as Record<string, unknown>), cardId: undefined }),
  );
  const cardIds = new Set(cards.valid.map(({ sourceId: id }) => id));
  const unresolvedCardReferences = [...expenses.valid, ...installments.valid].filter(
    ({ sourceCardId: id }) => id && !cardIds.has(id),
  ).length;

  return {
    cards: cards.valid,
    expenses: expenses.valid,
    installments: installments.valid,
    invalid: {
      cards: cards.invalid,
      expenses: expenses.invalid,
      installments: installments.invalid,
    },
    unresolvedCardReferences,
  };
}

export function normalizeLegacyPayload(value: unknown): LegacyImportPayload {
  const input =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return {
    cards: Array.isArray(input.cards) ? input.cards : [],
    expenses: Array.isArray(input.expenses) ? input.expenses : [],
    fixedExpenses: Array.isArray(input.fixedExpenses) ? input.fixedExpenses : [],
  };
}

export function serializeLegacyPayload(value: unknown): string {
  return JSON.stringify(normalizeLegacyPayload(value));
}

export async function legacyPayloadKey(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(serializeLegacyPayload(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
