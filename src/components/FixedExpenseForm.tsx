import { useState, useEffect } from "react";
import { CATEGORIES, type Card, type FixedExpense, type FixedExpenseData } from "../types";
import { useLocale } from "../i18n";

interface FixedExpenseFormProps {
  onSubmit: (data: FixedExpenseData) => void;
  editingFixedExpense?: FixedExpense;
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
    <form
      onSubmit={handleSubmit}
      className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-5 flex flex-col gap-3"
    >
      <h2 className="text-lg font-semibold text-gray-700">
        {isEditing ? t.editInstallment : t.addInstallment}
      </h2>
      <input
        type="text"
        placeholder={t.description}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        className="px-3 py-2.5 border border-gray-300 rounded text-base"
      />
      <input
        type="number"
        placeholder={t.installmentAmount}
        step="0.01"
        min="0"
        value={installmentAmount}
        onChange={(e) => setInstallmentAmount(e.target.value)}
        required
        className="px-3 py-2.5 border border-gray-300 rounded text-base"
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">{t.totalInstallments}</label>
          <input
            type="number"
            min="1"
            value={totalInstallments}
            onChange={(e) => setTotalInstallments(e.target.value)}
            required
            className="px-3 py-2.5 border border-gray-300 rounded text-base"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">{t.paidInstallments}</label>
          <input
            type="number"
            min="0"
            value={paidInstallments}
            onChange={(e) => setPaidInstallments(e.target.value)}
            required
            className="px-3 py-2.5 border border-gray-300 rounded text-base"
          />
        </div>
      </div>
      {installment > 0 && (
        <div className="flex gap-4 text-sm font-medium">
          <span className="text-indigo-600">
            {t.totalAmount}: {formatCurrency(total)}
          </span>
          {remaining > 0 && (
            <span className="text-gray-500">
              {t.remaining}: {formatCurrency(remaining)}
            </span>
          )}
        </div>
      )}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="px-3 py-2.5 pr-10 border border-gray-300 rounded text-base bg-white"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {t.categories[cat]}
          </option>
        ))}
      </select>
      {cards.length > 0 && (
        <select
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          className="px-3 py-2.5 pr-10 border border-gray-300 rounded text-base bg-white"
        >
          <option value="">{t.noCard}</option>
          {cards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.name} ••{card.last4}
            </option>
          ))}
        </select>
      )}
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
        className="px-3 py-2.5 border border-gray-300 rounded text-base"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-3 md:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-base cursor-pointer font-medium min-h-[44px]"
        >
          {isEditing ? t.update : t.addInstallment}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              onCancelEdit();
            }}
            className="flex-1 py-3 md:py-2.5 bg-gray-400 hover:bg-gray-500 text-white rounded text-base cursor-pointer font-medium min-h-[44px]"
          >
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
