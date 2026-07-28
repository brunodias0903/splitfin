import type { Card } from "../types";
import CardManager from "../components/CardManager";
import { useLocale } from "../i18n";

interface CardsPageProps {
  cards: Card[];
  onAddCard: (name: string, last4: string, type: string) => void;
  onRemoveCard: (id: string) => void;
}

export default function CardsPage({ cards, onAddCard, onRemoveCard }: CardsPageProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t.cards}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie seus cartões de crédito e débito</p>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <CardManager cards={cards} onAddCard={onAddCard} onRemoveCard={onRemoveCard} />
      </div>
    </div>
  );
}
