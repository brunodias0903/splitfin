import type { Card } from "../types";
import CardManager from "../components/CardManager";
import { useLocale } from "../i18n";
import { Heading, Surface, Text } from "../components/ui";

interface CardsPageProps {
  cards: Card[];
  onAddCard: (name: string, last4: string, type: string) => void;
  onRemoveCard: (id: string) => void;
}

export default function CardsPage({ cards, onAddCard, onRemoveCard }: CardsPageProps) {
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
        <CardManager cards={cards} onAddCard={onAddCard} onRemoveCard={onRemoveCard} />
      </Surface>
    </div>
  );
}
