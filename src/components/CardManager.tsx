import { useState } from "react";
import type { Card } from "../types";
import { useLocale } from "../i18n";

interface CardManagerProps {
  cards: Card[];
  onAddCard: (name: string, last4: string) => void;
  onRemoveCard: (id: string) => void;
}

export default function CardManager({ cards, onAddCard, onRemoveCard }: CardManagerProps) {
  const { t } = useLocale();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || last4.length !== 4) return;
    onAddCard(name.trim(), last4);
    setName("");
    setLast4("");
    setShowForm(false);
  };

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-600">{t.cards}</h3>
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
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-3">
          <input
            type="text"
            placeholder={t.cardName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded text-sm"
          />
          <input
            type="text"
            placeholder={t.cardLast4}
            maxLength={4}
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
            className="w-28 px-2.5 py-1.5 border border-gray-300 rounded text-sm"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm cursor-pointer font-medium"
          >
            {t.addCard}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded text-sm cursor-pointer"
          >
            {t.cancel}
          </button>
        </form>
      )}
      {cards.length === 0 && !showForm ? (
        <p className="text-xs text-gray-400">{t.noCards}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-md text-xs text-gray-700"
            >
              <span>
                {card.name} ••{card.last4}
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
