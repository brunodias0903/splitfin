import { useState, useEffect } from "react";
import type { Card } from "@/modules/cards/domain/card";
import { CATEGORIES, PAYMENT_TYPES, type Expense, type ExpenseData } from "../domain/expense";
import { useLocale } from "@/shared/i18n";
import { Icon } from "@/shared/ui/icons";
import { Button, Heading, Input, NativeSelect, Text } from "@/shared/ui";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseData) => void;
  editingExpense?: Expense;
  onCancelEdit: () => void;
  cards: Card[];
}

export default function ExpenseForm({
  onSubmit,
  editingExpense,
  onCancelEdit,
  cards,
}: ExpenseFormProps) {
  const { t } = useLocale();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<string>(PAYMENT_TYPES[0]);
  const [cardId, setCardId] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("");

  const isCardPayment = paymentType === "credit" || paymentType === "debit";

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setAmount(String(editingExpense.amount));
      setPaymentType(editingExpense.paymentType ?? PAYMENT_TYPES[0]);
      setCardId(editingExpense.cardId ?? "");
      setCategory(editingExpense.category);
      setDate(editingExpense.date);
      setTime(editingExpense.time ?? "");
    }
  }, [editingExpense]);

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setPaymentType(PAYMENT_TYPES[0]);
    setCardId("");
    setCategory(CATEGORIES[0]);
    setDate(new Date().toISOString().split("T")[0]);
    setTime("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    onSubmit({
      description: description.trim(),
      amount: parseFloat(amount),
      paymentType,
      cardId: isCardPayment && cardId ? cardId : undefined,
      category,
      date,
      time: time || undefined,
    });
    resetForm();
  };

  const isEditing = !!editingExpense;

  return (
    <form onSubmit={handleSubmit} className="surface ds-form-card">
      <div className="mb-1 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon name={isEditing ? "edit" : "plus"} size={19} />
        </span>
        <div>
          <Text variant="eyebrow" tone="muted">
            {t.entry}
          </Text>
          <Heading level={2} variant="section" className="mt-0.5">
            {isEditing ? t.editExpense : t.addExpense}
          </Heading>
        </div>
      </div>
      <Input
        type="text"
        placeholder={t.description}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        aria-label={t.description}
      />
      <Input
        type="number"
        placeholder={t.amount}
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        aria-label={t.amount}
      />
      <NativeSelect
        value={paymentType}
        onChange={(e) => {
          setPaymentType(e.target.value);
          setCardId("");
        }}
        aria-label={t.paymentType}
        className="w-full"
      >
        {PAYMENT_TYPES.map((pt) => (
          <option key={pt} value={pt}>
            {t.paymentTypes[pt]}
          </option>
        ))}
      </NativeSelect>
      {isCardPayment && (
        <NativeSelect
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          aria-label={t.cards}
          className="w-full"
        >
          <option value="">{t.noCard}</option>
          {cards
            .filter((c) => c.type === "multiple" || c.type === paymentType)
            .map((card) => (
              <option key={card.id} value={card.id}>
                {card.name} ••{card.last4} ({t.cardTypes[card.type]})
              </option>
            ))}
        </NativeSelect>
      )}
      <NativeSelect
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        aria-label={t.allCategories}
        className="w-full"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {t.categories[cat]}
          </option>
        ))}
      </NativeSelect>
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          aria-label={t.date}
        />
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label="Hora"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {isEditing ? t.update : t.addExpense}
        </Button>
        {isEditing && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              resetForm();
              onCancelEdit();
            }}
            className="flex-1"
          >
            {t.cancel}
          </Button>
        )}
      </div>
    </form>
  );
}
