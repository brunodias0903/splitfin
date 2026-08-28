import { useState, useEffect } from "react";
import type { Card } from "@/modules/cards/domain/card";
import { CATEGORIES } from "@/modules/expenses/domain/expense";
import type { InstallmentData, InstallmentPlan } from "../domain/installment";
import { useLocale } from "@/shared/i18n";
import { Icon } from "@/shared/ui/icons";
import { Button, Heading, Input, Label, NativeSelect, Text } from "@/shared/ui";

interface FixedExpenseFormProps {
  onSubmit: (data: InstallmentData) => void;
  editingFixedExpense?: InstallmentPlan;
  onCancelEdit: () => void;
  cards: Card[];
}

export default function FixedExpenseForm({
  onSubmit,
  editingFixedExpense,
  onCancelEdit,
  cards,
}: FixedExpenseFormProps) {
  const { t, formatCurrency } = useLocale();
  const [description, setDescription] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("1");
  const [paidInstallments, setPaidInstallments] = useState("0");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [cardId, setCardId] = useState("");

  useEffect(() => {
    if (editingFixedExpense) {
      const installmentValue =
        editingFixedExpense.totalAmount / editingFixedExpense.totalInstallments;
      setDescription(editingFixedExpense.description);
      setInstallmentAmount(String(installmentValue));
      setTotalInstallments(String(editingFixedExpense.totalInstallments));
      setPaidInstallments(String(editingFixedExpense.paidInstallments));
      setCategory(editingFixedExpense.category);
      setStartDate(editingFixedExpense.startDate);
      setCardId(editingFixedExpense.cardId ?? "");
    }
  }, [editingFixedExpense]);

  const resetForm = () => {
    setDescription("");
    setInstallmentAmount("");
    setTotalInstallments("1");
    setPaidInstallments("0");
    setCategory(CATEGORIES[0]);
    setStartDate(new Date().toISOString().split("T")[0]);
    setCardId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const installment = parseFloat(installmentAmount);
    const installments = parseInt(totalInstallments, 10);
    if (!description.trim() || !installmentAmount || !totalInstallments) return;
    onSubmit({
      description: description.trim(),
      totalAmount: installment * installments,
      totalInstallments: installments,
      paidInstallments: parseInt(paidInstallments, 10),
      category,
      startDate,
      cardId: cardId || undefined,
    });
    resetForm();
  };

  const isEditing = !!editingFixedExpense;
  const installment = parseFloat(installmentAmount) || 0;
  const installments = parseInt(totalInstallments, 10) || 1;
  const paid = Math.min(parseInt(paidInstallments, 10) || 0, installments);
  const total = installment * installments;
  const remaining = (installments - paid) * installment;

  return (
    <form onSubmit={handleSubmit} className="surface ds-form-card">
      <div className="mb-1 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon name={isEditing ? "edit" : "plus"} size={19} />
        </span>
        <div>
          <Text variant="eyebrow" tone="muted">
            {t.commitment}
          </Text>
          <Heading level={2} variant="section" className="mt-0.5">
            {isEditing ? t.editInstallment : t.addInstallment}
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
        placeholder={t.installmentAmount}
        step="0.01"
        min="0"
        value={installmentAmount}
        onChange={(e) => setInstallmentAmount(e.target.value)}
        required
        aria-label={t.installmentAmount}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="total-installments" className="text-xs text-muted-foreground">
            {t.totalInstallments}
          </Label>
          <Input
            id="total-installments"
            type="number"
            min="1"
            value={totalInstallments}
            onChange={(e) => setTotalInstallments(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="paid-installments" className="text-xs text-muted-foreground">
            {t.paidInstallments}
          </Label>
          <Input
            id="paid-installments"
            type="number"
            min="0"
            value={paidInstallments}
            onChange={(e) => setPaidInstallments(e.target.value)}
            required
          />
        </div>
      </div>
      {installment > 0 && (
        <div className="flex flex-wrap gap-3 rounded-xl bg-primary-soft/70 px-3.5 py-3 text-xs font-semibold">
          <span className="text-primary">
            {t.totalAmount}: {formatCurrency(total)}
          </span>
          {remaining > 0 && (
            <span className="text-muted-foreground">
              {t.remaining}: {formatCurrency(remaining)}
            </span>
          )}
        </div>
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
      {cards.length > 0 && (
        <NativeSelect
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          aria-label={t.cards}
          className="w-full"
        >
          <option value="">{t.noCard}</option>
          {cards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.name} ••{card.last4}
            </option>
          ))}
        </NativeSelect>
      )}
      <Input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
        aria-label={t.date}
      />
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {isEditing ? t.update : t.addInstallment}
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
