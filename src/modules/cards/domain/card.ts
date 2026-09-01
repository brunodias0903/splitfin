export const CARD_TYPES = ["credit", "debit", "multiple"] as const;

export type CardType = (typeof CARD_TYPES)[number];

export interface Card {
  id: string;
  name: string;
  last4: string;
  type: CardType;
  closingDay: number;
  dueDay: number;
}

export type CardData = Omit<Card, "id">;

export function isCard(data: unknown): data is Card {
  if (typeof data !== "object" || data === null) return false;
  const value = data as Record<string, unknown>;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    /^\d{4}$/.test(String(value.last4)) &&
    CARD_TYPES.includes(value.type as CardType) &&
    Number.isInteger(value.closingDay) &&
    Number(value.closingDay) >= 1 &&
    Number(value.closingDay) <= 31 &&
    Number.isInteger(value.dueDay) &&
    Number(value.dueDay) >= 1 &&
    Number(value.dueDay) <= 31
  );
}
