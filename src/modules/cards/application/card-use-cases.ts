import { CARD_TYPES, type Card, type CardType } from "../domain/card";

export function createCard(
  name: string,
  last4: string,
  type: string,
  createId: () => string,
): Card {
  const cardType: CardType = CARD_TYPES.includes(type as CardType)
    ? (type as CardType)
    : "multiple";
  return { id: createId(), name: name.trim(), last4, type: cardType };
}

export function removeCard(cards: Card[], id: string): Card[] {
  return cards.filter((card) => card.id !== id);
}
