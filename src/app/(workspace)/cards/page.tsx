"use client";

import { useFinance } from "../_providers/finance-provider";
import CardsPage from "@/modules/cards/ui/cards-page";

export default function CardsRoute() {
  const { cards, addCard, removeCard } = useFinance();
  return <CardsPage cards={cards} onAddCard={addCard} onRemoveCard={removeCard} />;
}
