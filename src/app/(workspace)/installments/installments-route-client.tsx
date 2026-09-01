"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Card } from "@/modules/cards/domain/card";
import type { InstallmentData, InstallmentPlan } from "@/modules/installments/domain/installment";
import InstallmentsPage from "@/modules/installments/ui/installments-page";
import { useLocale } from "@/shared/i18n";
import {
  archiveInstallmentAction,
  createInstallmentAction,
  payInstallmentAction,
  updateInstallmentAction,
  type InstallmentActionResult,
} from "./actions";

export default function InstallmentsRouteClient({
  initialPlans,
  cards,
}: {
  initialPlans: InstallmentPlan[];
  cards: Card[];
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [plans, setPlans] = useState(initialPlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const message = (result: InstallmentActionResult) =>
    result.ok
      ? null
      : result.reason === "invalid"
        ? t.installmentInvalid
        : result.reason === "not-found"
          ? t.installmentNotFound
          : t.installmentSaveFailed;

  const create = async (data: InstallmentData) => {
    setPending(true);
    setError(null);
    const result = await createInstallmentAction(data);
    setPending(false);
    if (!result.ok || !result.plan) {
      setError(message(result));
      return false;
    }
    setPlans((current) => [result.plan!, ...current]);
    router.refresh();
    return true;
  };

  const update = async (data: InstallmentData) => {
    if (!editingId) return false;
    setPending(true);
    setError(null);
    const result = await updateInstallmentAction(editingId, data);
    setPending(false);
    if (!result.ok || !result.plan) {
      setError(message(result));
      return false;
    }
    setPlans((current) => current.map((plan) => (plan.id === editingId ? result.plan! : plan)));
    setEditingId(null);
    router.refresh();
    return true;
  };

  const archive = async (id: string) => {
    const previous = plans;
    setPlans((current) => current.filter((plan) => plan.id !== id));
    const result = await archiveInstallmentAction(id);
    if (!result.ok) {
      setPlans(previous);
      setError(message(result));
      return;
    }
    router.refresh();
  };

  const pay = async (id: string) => {
    const current = plans.find((plan) => plan.id === id);
    if (!current) return;
    setPending(true);
    setError(null);
    const result = await payInstallmentAction(id, current.paidInstallments);
    setPending(false);
    if (!result.ok || !result.plan) {
      setError(message(result));
      return;
    }
    setPlans((current) => current.map((plan) => (plan.id === id ? result.plan! : plan)));
    router.refresh();
  };

  return (
    <InstallmentsPage
      fixedExpenses={plans}
      cards={cards}
      editingId={editingId}
      onStartEdit={setEditingId}
      onCancelEdit={() => setEditingId(null)}
      onAddFixedExpense={create}
      onUpdateFixedExpense={update}
      onDeleteFixedExpense={archive}
      onPayInstallment={pay}
      pending={pending}
      error={error}
    />
  );
}
