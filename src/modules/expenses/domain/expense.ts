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

export interface ExpenseData {
  description: string;
  amount: number;
  paymentType: string;
  cardId?: string;
  category: string;
  date: string;
  time?: string;
}

export type ExpenseSortOrder = "newest" | "oldest";

export interface ExpensePage {
  items: Expense[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  totalAmount: number;
  averageAmount: number;
}

export function isExpense(data: unknown): data is Expense {
  if (typeof data !== "object" || data === null) return false;
  const value = data as Record<string, unknown>;
  return (
    typeof value.id === "string" &&
    typeof value.description === "string" &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    typeof value.category === "string" &&
    typeof value.date === "string" &&
    (value.time === undefined || typeof value.time === "string") &&
    (value.paymentType === undefined || typeof value.paymentType === "string") &&
    (value.cardId === undefined || typeof value.cardId === "string")
  );
}
