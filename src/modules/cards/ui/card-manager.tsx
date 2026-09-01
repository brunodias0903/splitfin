import { useRef, useState } from "react";
import { CARD_TYPES, type Card, type CardData } from "../domain/card";
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
  onAddCard: (data: CardData) => Promise<boolean>;
  onUpdateCard: (id: string, data: CardData) => Promise<boolean>;
  onRemoveCard: (id: string) => Promise<void>;
  pending?: boolean;
}

export default function CardManager({
  cards,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
  pending,
}: CardManagerProps) {
  const { t } = useLocale();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");
  const [cardType, setCardType] = useState<string>(CARD_TYPES[2]);
  const [closingDay, setClosingDay] = useState("5");
  const [dueDay, setDueDay] = useState("12");
  const [editingId, setEditingId] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const resetForm = () => {
    setName("");
    setLast4("");
    setCardType(CARD_TYPES[2]);
    setClosingDay("5");
    setDueDay("12");
    setEditingId(null);
    setShowForm(false);
  };

  const startEditing = (card: Card) => {
    setName(card.name);
    setLast4(card.last4);
    setCardType(card.type);
    setClosingDay(String(card.closingDay));
    setDueDay(String(card.dueDay));
    setEditingId(card.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !name.trim() || last4.length !== 4) return;
    submittingRef.current = true;
    const data: CardData = {
      name: name.trim(),
      last4,
      type: cardType as CardData["type"],
      closingDay: Number(closingDay),
      dueDay: Number(dueDay),
    };
    const succeeded = editingId ? await onUpdateCard(editingId, data) : await onAddCard(data);
    submittingRef.current = false;
    if (!succeeded) return;
    resetForm();
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
          className="mb-7 grid gap-3 rounded-2xl border border-primary-muted bg-primary-soft/40 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-5"
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
          <Input
            type="number"
            min="1"
            max="31"
            value={closingDay}
            onChange={(event) => setClosingDay(event.target.value)}
            aria-label={t.cardClosingDay}
            placeholder={t.cardClosingDay}
          />
          <Input
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(event) => setDueDay(event.target.value)}
            aria-label={t.cardDueDay}
            placeholder={t.cardDueDay}
          />
          <div className="flex gap-2 sm:col-span-2 sm:justify-end lg:col-span-5">
            <Button type="submit" className="flex-1 sm:flex-none" disabled={pending}>
              {pending ? t.saving : editingId ? t.update : t.addCard}
            </Button>
            <Button
              type="button"
              onClick={resetForm}
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
                    onClick={() => startEditing(card)}
                    label={t.edit}
                    variant="ghost"
                    size="icon-sm"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-on-brand/45 opacity-100 transition-all hover:bg-surface/10 hover:text-on-brand sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Icon name="edit" size={15} />
                  </IconButton>
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
                    <p className="mt-1 text-[10px] text-on-brand/55">
                      {t.cardCloses} {card.closingDay} · {t.cardDue} {card.dueDay}
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
