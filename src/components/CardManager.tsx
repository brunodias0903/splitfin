import { useState } from "react";
import { CARD_TYPES, type Card } from "../types";
import { useLocale } from "../i18n";

interface CardManagerProps {
  cards: Card[];
  onAddCard: (name: string, last4: string, type: string) => void;
  onRemoveCard: (id: string) => void;
}

export default function CardManager({ cards, onAddCard, onRemoveCard }: CardManagerProps) {
  const { t } = useLocale();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");
  const [cardType, setCardType] = useState<string>(CARD_TYPES[2]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || last4.length !== 4) return;
    onAddCard(name.trim(), last4, cardType);
    setName("");
    setLast4("");
    setCardType(CARD_TYPES[2]);
    setShowForm(false);
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      credit: "bg-blue-100 text-blue-700",
      debit: "bg-emerald-100 text-emerald-700",
      multiple: "bg-purple-100 text-purple-700",
    };
    return colors[type] ?? "bg-gray-100 text-gray-600";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{t.cards}</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
          >
            + {t.addCard}
          </button>
        )}
      </div>
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <input
            type="text"
            placeholder={t.cardName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded text-sm"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t.cardLast4}
              maxLength={4}
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
              className="w-28 px-2.5 py-1.5 border border-gray-300 rounded text-sm"
            />
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded text-sm bg-white"
            >
              {CARD_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {t.cardTypes[ct]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 md:py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm cursor-pointer font-medium min-h-[44px] md:min-h-0"
            >
              {t.addCard}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 md:py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded text-sm cursor-pointer min-h-[44px] md:min-h-0"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      )}
      {cards.length === 0 && !showForm ? (
        <p className="text-xs text-gray-400">{t.noCards}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1.5 rounded-md text-xs text-gray-700"
            >
              <span>
                {card.name} ••{card.last4}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeBadge(card.type)}`}
              >
                {t.cardTypes[card.type] ?? card.type}
              </span>
              <button
                onClick={() => onRemoveCard(card.id)}
                className="text-gray-400 hover:text-red-500 cursor-pointer text-sm leading-none ml-0.5"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
