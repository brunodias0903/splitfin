import { useState, useEffect } from "react";
import { CATEGORIES, type Expense, type ExpenseData } from "../types";
import { useLocale } from "../i18n";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseData) => void;
  editingExpense?: Expense;
  onCancelEdit: () => void;
}

export default function ExpenseForm({ onSubmit, editingExpense, onCancelEdit }: ExpenseFormProps) {
  const { t } = useLocale();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setAmount(String(editingExpense.amount));
      setCategory(editingExpense.category);
      setDate(editingExpense.date);
    }
  }, [editingExpense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    onSubmit({
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
    });
    if (!editingExpense) {
      setDescription("");
      setAmount("");
      setCategory(CATEGORIES[0]);
      setDate(new Date().toISOString().split("T")[0]);
    }
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
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        className="px-3 py-2.5 border border-gray-300 rounded text-base"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-base cursor-pointer font-medium"
        >
          {isEditing ? t.update : t.addExpense}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex-1 py-2.5 bg-gray-400 hover:bg-gray-500 text-white rounded text-base cursor-pointer font-medium"
          >
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
