import type { Expense } from "@/modules/expenses/domain/expense";
import { getInstallmentAmount, getInstallmentDate } from "../domain/installment-calculations";
import type { InstallmentData, InstallmentPlan } from "../domain/installment";

export function createInstallmentPlan(
  data: InstallmentData,
  createId: () => string,
): { plan: InstallmentPlan; paidExpenses: Expense[] } {
  const plan: InstallmentPlan = {
    id: createId(),
    ...data,
    active: data.paidInstallments < data.totalInstallments,
  };
  const amount = getInstallmentAmount(data.totalAmount, data.totalInstallments);
  const paidExpenses = Array.from({ length: data.paidInstallments }, (_, index) => ({
    id: createId(),
    description: `${data.description} (${index + 1}/${data.totalInstallments})`,
    amount,
    category: data.category,
    date: getInstallmentDate(data.startDate, index),
  }));
  return { plan, paidExpenses };
}

export function updateInstallmentPlan(
  plans: InstallmentPlan[],
  id: string,
  data: InstallmentData,
): InstallmentPlan[] {
  return plans.map((plan) =>
    plan.id === id
      ? { ...plan, ...data, active: data.paidInstallments < data.totalInstallments }
      : plan,
  );
}

export function payNextInstallment(
  plan: InstallmentPlan,
  createId: () => string,
): { plan: InstallmentPlan; expense?: Expense } {
  if (!plan.active || plan.paidInstallments >= plan.totalInstallments) return { plan };
  const installmentNumber = plan.paidInstallments + 1;
  return {
    plan: {
      ...plan,
      paidInstallments: installmentNumber,
      active: installmentNumber < plan.totalInstallments,
    },
    expense: {
      id: createId(),
      description: `${plan.description} (${installmentNumber}/${plan.totalInstallments})`,
      amount: getInstallmentAmount(plan.totalAmount, plan.totalInstallments),
      category: plan.category,
      date: getInstallmentDate(plan.startDate, plan.paidInstallments),
    },
  };
}

export function detachCard(plans: InstallmentPlan[], cardId: string): InstallmentPlan[] {
  return plans.map((plan) => (plan.cardId === cardId ? { ...plan, cardId: undefined } : plan));
}
