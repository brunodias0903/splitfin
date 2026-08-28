import { useState } from "react";
import { CARD_TYPES, type Card } from "../domain/card";
import { useLocale } from "@/shared/i18n";
import { Icon } from "@/shared/ui/icons";
import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Heading,
  IconButton,
  Input,
  NativeSelect,
  Text,
} from "@/shared/ui";

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
      credit: "bg-surface/12 text-on-brand/90 ring-1 ring-on-brand/10",
      debit: "bg-surface/12 text-on-brand/90 ring-1 ring-on-brand/10",
      multiple: "bg-surface/12 text-on-brand/90 ring-1 ring-on-brand/10",
    };
    return colors[type] ?? "bg-surface/12 text-on-brand ring-1 ring-on-brand/10";
  };

  const cardTheme = (type: string) => {
    const themes: Record<string, string> = {
      credit: "from-card-credit-from via-card-credit-mid to-card-credit-to",
      debit: "from-card-debit-from via-card-debit-mid to-card-debit-to",
      multiple: "from-card-multiple-from via-card-multiple-mid to-card-multiple-to",
    };
    return themes[type] ?? "from-card-default-from via-card-default-mid to-card-default-to";
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Text variant="eyebrow" tone="muted" className="mb-1">
            {t.paymentMethods}
          </Text>
          <div className="flex items-center gap-2.5">
            <Heading level={2} variant="section">
              {t.cards}
            </Heading>
            {cards.length > 0 && <Badge variant="secondary">{cards.length}</Badge>}
          </div>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Icon name="plus" size={16} /> {t.addCard}
          </Button>
        )}
      </div>
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-7 grid gap-3 rounded-2xl border border-primary-muted bg-primary-soft/40 p-4 sm:grid-cols-[minmax(0,1fr)_150px_minmax(160px,.7fr)] sm:p-5"
        >
          <Input
            type="text"
            placeholder={t.cardName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={t.cardName}
          />
          <Input
            type="text"
            placeholder={t.cardLast4}
            maxLength={4}
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
            aria-label={t.cardLast4}
          />
          <NativeSelect
            value={cardType}
            onChange={(e) => setCardType(e.target.value)}
            aria-label={t.cardType}
            className="w-full"
          >
            {CARD_TYPES.map((ct) => (
              <option key={ct} value={ct}>
                {t.cardTypes[ct]}
              </option>
            ))}
          </NativeSelect>
          <div className="flex gap-2 sm:col-span-3 sm:justify-end">
            <Button type="submit" className="flex-1 sm:flex-none">
              {t.addCard}
            </Button>
            <Button
              type="button"
              onClick={() => setShowForm(false)}
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              {t.cancel}
            </Button>
          </div>
        </form>
      )}
      {cards.length === 0 && !showForm ? (
        <Empty className="border border-border bg-surface-subtle/40 py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-11 rounded-xl text-subtle-foreground">
              <Icon name="cards" size={20} />
            </EmptyMedia>
            <EmptyTitle>{t.noCards}</EmptyTitle>
            <EmptyDescription>{t.emptyCardHint}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`group relative aspect-[1.586/1] min-h-44 overflow-hidden rounded-[1.25rem] bg-gradient-to-br ${cardTheme(card.type)} p-5 text-on-brand shadow-payment-card transition-transform hover:-translate-y-1`}
            >
              <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border-[28px] border-on-brand/5" />
              <div className="absolute -bottom-24 -left-12 h-52 w-52 rounded-full bg-surface/5 blur-sm" />
              <div className="relative flex items-start justify-between">
                <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-card-chip-from to-card-chip-to text-card-chip-text">
                  <span className="h-3 w-5 rounded-sm border border-card-chip-text/30" />
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${typeBadge(card.type)}`}
                  >
                    {t.cardTypes[card.type] ?? card.type}
                  </Badge>
                  <IconButton
                    onClick={() => onRemoveCard(card.id)}
                    label={t.delete}
                    variant="ghost"
                    size="icon-sm"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-on-brand/45 opacity-100 transition-all hover:bg-surface/10 hover:text-danger-muted sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Icon name="trash" size={15} />
                  </IconButton>
                </div>
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <p className="font-mono text-lg tracking-[0.18em] text-on-brand/95">
                  •••• {card.last4}
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-on-brand/45">
                      {t.cardHolder}
                    </p>
                    <p className="mt-0.5 max-w-44 truncate text-sm font-semibold text-on-brand/90">
                      {card.name}
                    </p>
                  </div>
                  <Icon name="wallet" size={22} className="text-on-brand/35" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
