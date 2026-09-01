import type { Card, CardData } from "../domain/card";
import CardManager from "./card-manager";
import { useLocale } from "@/shared/i18n";
import { Heading, Surface, Text } from "@/shared/ui";

interface CardsPageProps {
  cards: Card[];
  onAddCard: (data: CardData) => Promise<boolean>;
  onUpdateCard: (id: string, data: CardData) => Promise<boolean>;
  onRemoveCard: (id: string) => Promise<void>;
  pending?: boolean;
  error?: string | null;
}

export default function CardsPage({
  cards,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
  pending,
  error,
}: CardsPageProps) {
  const { t } = useLocale();

  return (
    <div className="ds-page">
      <div>
        <Text variant="eyebrow" tone="muted" className="mb-2">
          {t.wallet}
        </Text>
        <Heading level={1} variant="page">
          {t.cards}
        </Heading>
        <Text variant="small" tone="muted" className="mt-1.5">
          {t.cardsSubtitle}
        </Text>
      </div>

      <Surface className="ds-section-padding">
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <CardManager
          cards={cards}
          onAddCard={onAddCard}
          onUpdateCard={onUpdateCard}
          onRemoveCard={onRemoveCard}
          pending={pending}
        />
      </Surface>
    </div>
  );
}
