import {
  CATEGORIES,
  PAYMENT_TYPES,
  type ExpenseCategory,
  type ExpenseData,
  type ExpenseSortOrder,
  type PaymentType,
} from "../domain/expense";

const CATEGORY_SLUGS: Record<ExpenseCategory, string> = {
  Food: "food",
  Transport: "transport",
  Entertainment: "entertainment",
  Shopping: "shopping",
  Bills: "bills",
  Subscription: "subscription",
  Other: "other",
};

const PAYMENT_TYPES_BY_DATABASE_VALUE = {
  pix: "pix",
  credit: "credit_card",
  debit: "debit_card",
  boleto: "boleto",
  cash: "cash",
  other: "other",
} as const satisfies Record<PaymentType, string>;

const PAYMENT_TYPES_BY_APP_VALUE = Object.fromEntries(
  Object.entries(PAYMENT_TYPES_BY_DATABASE_VALUE).map(([app, database]) => [database, app]),
) as Record<string, PaymentType>;

export class InvalidExpenseInputError extends Error {
  constructor(message = "Invalid expense data.") {
    super(message);
    this.name = "InvalidExpenseInputError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

function isPaymentType(value: unknown): value is PaymentType {
  return typeof value === "string" && (PAYMENT_TYPES as readonly string[]).includes(value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00-04:00`);
  return !Number.isNaN(parsed.getTime()) && toManausParts(parsed).date === value;
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function parseExpenseInput(value: unknown): ExpenseData {
  if (!isRecord(value)) throw new InvalidExpenseInputError();

  const description = typeof value.description === "string" ? value.description.trim() : "";
  const amount = typeof value.amount === "number" ? value.amount : Number.NaN;
  const time = value.time === undefined || value.time === "" ? undefined : value.time;

  if (description.length < 2 || description.length > 160) {
    throw new InvalidExpenseInputError("Description must contain between 2 and 160 characters.");
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 90_000_000_000_000) {
    throw new InvalidExpenseInputError("Amount must be a positive monetary value.");
  }
  if (!isExpenseCategory(value.category)) {
    throw new InvalidExpenseInputError("Unknown expense category.");
  }
  if (!isPaymentType(value.paymentType)) {
    throw new InvalidExpenseInputError("Unknown payment type.");
  }
  if (!isDate(value.date)) throw new InvalidExpenseInputError("Invalid expense date.");
  if (time !== undefined && !isTime(time))
    throw new InvalidExpenseInputError("Invalid expense time.");

  return {
    description,
    amount: Math.round(amount * 100) / 100,
    category: value.category,
    paymentType: value.paymentType,
    date: value.date,
    time,
  };
}

export function parseExpenseId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new InvalidExpenseInputError("Invalid expense identifier.");
  }
  return value;
}

export function categoryToSlug(category: string): string {
  if (!isExpenseCategory(category)) return CATEGORY_SLUGS.Other;
  return CATEGORY_SLUGS[category];
}

export function slugToCategory(slug: string | null): ExpenseCategory {
  return (Object.entries(CATEGORY_SLUGS).find(([, categorySlug]) => categorySlug === slug)?.[0] ??
    "Other") as ExpenseCategory;
}

export function paymentTypeToDatabase(payment: string) {
  if (!isPaymentType(payment)) throw new InvalidExpenseInputError("Unknown payment type.");
  return PAYMENT_TYPES_BY_DATABASE_VALUE[payment];
}

export function paymentTypeFromDatabase(payment: string): PaymentType {
  return PAYMENT_TYPES_BY_APP_VALUE[payment] ?? "other";
}

export function expenseDateTimeToDatabase(date: string, time?: string): Date {
  return new Date(`${date}T${time ?? "12:00"}:00-04:00`);
}

export function toManausParts(value: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Manaus",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

export function parsePageNumber(value: unknown, fallback = 1): number {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseSortOrder(value: unknown): ExpenseSortOrder {
  return value === "oldest" ? "oldest" : "newest";
}
