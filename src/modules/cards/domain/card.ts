export const CARD_TYPES = ["credit", "debit", "multiple"] as const;

export type CardType = (typeof CARD_TYPES)[number];

export interface Card {
  id: string;
  name: string;
  last4: string;
  type: CardType;
}

export function isCard(data: unknown): data is Card {
  if (typeof data !== "object" || data === null) return false;
  const value = data as Record<string, unknown>;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    /^\d{4}$/.test(String(value.last4)) &&
    CARD_TYPES.includes(value.type as CardType)
  );
}
