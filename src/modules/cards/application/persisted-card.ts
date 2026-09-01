import { CARD_TYPES, type CardData, type CardType } from "../domain/card";

export class InvalidCardInputError extends Error {
  constructor() {
    super("Invalid card data.");
    this.name = "InvalidCardInputError";
  }
}

export function parseCardInput(value: unknown): CardData {
  if (typeof value !== "object" || value === null) throw new InvalidCardInputError();
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const last4 = typeof input.last4 === "string" ? input.last4 : "";
  const type = input.type;
  const closingDay = Number(input.closingDay);
  const dueDay = Number(input.dueDay);

  if (
    name.length < 2 ||
    name.length > 80 ||
    !/^\d{4}$/.test(last4) ||
    typeof type !== "string" ||
    !(CARD_TYPES as readonly string[]).includes(type) ||
    !Number.isInteger(closingDay) ||
    closingDay < 1 ||
    closingDay > 31 ||
    !Number.isInteger(dueDay) ||
    dueDay < 1 ||
    dueDay > 31
  ) {
    throw new InvalidCardInputError();
  }

  return { name, last4, type: type as CardType, closingDay, dueDay };
}

export function parseCardId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new InvalidCardInputError();
  }
  return value;
}
