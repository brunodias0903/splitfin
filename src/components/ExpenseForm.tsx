import { useState, useEffect } from "react";
import { CATEGORIES, PAYMENT_TYPES, type Card, type Expense, type ExpenseData } from "../types";
import { useLocale } from "../i18n";

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
    <form
      onSubmit={handleSubmit}
      className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-5 flex flex-col gap-3"
    >
      <h2 className="text-lg font-semibold text-gray-700">
        {isEditing ? t.editExpense : t.addExpense}
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
        placeholder={t.amount}
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        className="px-3 py-2.5 border border-gray-300 rounded text-base"
      />
      <select
        value={paymentType}
        onChange={(e) => {
          setPaymentType(e.target.value);
          setCardId("");
        }}
        className="px-3 py-2.5 pr-10 border border-gray-300 rounded text-base bg-white"
      >
        {PAYMENT_TYPES.map((pt) => (
          <option key={pt} value={pt}>
            {t.paymentTypes[pt]}
          </option>
        ))}
      </select>
      {isCardPayment && (
        <select
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          className="px-3 py-2.5 pr-10 border border-gray-300 rounded text-base bg-white"
        >
          <option value="">{t.noCard}</option>
          {cards
            .filter((c) => c.type === "multiple" || c.type === paymentType)
            .map((card) => (
              <option key={card.id} value={card.id}>
                {card.name} ••{card.last4} ({t.cardTypes[card.type]})
              </option>
            ))}
        </select>
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
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="px-3 py-2.5 border border-gray-300 rounded text-base"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded text-base"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-3 md:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-base cursor-pointer font-medium min-h-[44px]"
        >
          {isEditing ? t.update : t.addExpense}
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
