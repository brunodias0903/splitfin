"use client";

import { useState } from "react";

import type { Card, CardData } from "@/modules/cards/domain/card";
import CardsPage from "@/modules/cards/ui/cards-page";
import { useLocale } from "@/shared/i18n";
import {
  archiveCardAction,
  createCardAction,
  type CardActionResult,
  updateCardAction,
} from "./actions";

export default function CardsRouteClient({ initialCards }: { initialCards: Card[] }) {
  const { t } = useLocale();
  const [cards, setCards] = useState(initialCards);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const message = (result: CardActionResult) =>
    result.ok
      ? null
      : result.reason === "invalid"
        ? t.cardInvalid
        : result.reason === "not-found"
          ? t.cardNotFound
          : t.cardSaveFailed;

  const addCard = async (data: CardData) => {
    const previous = cards;
    const temporaryId = crypto.randomUUID();
    setPending(true);
    setError(null);
    setCards((current) => [{ id: temporaryId, ...data }, ...current]);
    const result = await createCardAction(data);
    setPending(false);
    if (!result.ok || !result.card) {
      setCards(previous);
      setError(message(result));
      return false;
    }
    setCards((current) => current.map((card) => (card.id === temporaryId ? result.card! : card)));
    return true;
  };

  const updateCard = async (id: string, data: CardData) => {
    const previous = cards;
    setPending(true);
    setError(null);
    setCards((current) => current.map((card) => (card.id === id ? { id, ...data } : card)));
    const result = await updateCardAction(id, data);
    setPending(false);
    if (!result.ok || !result.card) {
      setCards(previous);
      setError(message(result));
      return false;
    }
    setCards((current) =>
      current.map((card) => (card.id === result.card?.id ? result.card : card)),
    );
    return true;
  };

  const archiveCard = async (id: string) => {
    const previous = cards;
    setError(null);
    setCards((current) => current.filter((card) => card.id !== id));
    const result = await archiveCardAction(id);
    if (!result.ok) {
      setCards(previous);
      setError(message(result));
      return;
    }
  };

  return (
    <CardsPage
      cards={cards}
      onAddCard={addCard}
      onUpdateCard={updateCard}
      onRemoveCard={archiveCard}
      pending={pending}
      error={error}
    />
  );
}
