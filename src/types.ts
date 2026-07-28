export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  paymentType?: string;
  cardId?: string;
  date: string;
  time?: string;
}

export const CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Bills",
  "Subscription",
  "Other",
] as const;

export type ExpenseCategory = (typeof CATEGORIES)[number];

export const PAYMENT_TYPES = ["pix", "credit", "debit", "boleto", "cash", "other"] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const CARD_TYPES = ["credit", "debit", "multiple"] as const;

export type CardType = (typeof CARD_TYPES)[number];

export interface Card {
  id: string;
  name: string;
  last4: string;
  type: CardType;
}

export interface FixedExpense {
  id: string;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  category: string;
  startDate: string;
  active: boolean;
  cardId?: string;
}

export interface ExpenseData {
  description: string;
  amount: number;
  paymentType: string;
  cardId?: string;
  category: string;
  date: string;
  time?: string;
}

export interface FixedExpenseData {
  description: string;
  totalAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  category: string;
  startDate: string;
  cardId?: string;
}

export function validateExpenseData(data: unknown): data is Expense {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.description === "string" &&
    typeof d.amount === "number" &&
    typeof d.category === "string" &&
    typeof d.date === "string" &&
    (d.time === undefined || typeof d.time === "string") &&
    (d.paymentType === undefined || typeof d.paymentType === "string") &&
    (d.cardId === undefined || typeof d.cardId === "string")
  );
}

export function validateFixedExpenseData(data: unknown): data is FixedExpense {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.description === "string" &&
    typeof d.totalAmount === "number" &&
    typeof d.totalInstallments === "number" &&
    typeof d.paidInstallments === "number" &&
    typeof d.category === "string" &&
    typeof d.startDate === "string" &&
    typeof d.active === "boolean"
  );
}

export function getInstallmentDate(startDate: string, index: number): string {
  const date = new Date(startDate + "T00:00:00");
  date.setMonth(date.getMonth() + index);
  return date.toISOString().split("T")[0];
}

export function validateCardData(data: unknown): data is Card {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    typeof d.last4 === "string" &&
    (d.type === undefined || typeof d.type === "string")
  );
}
