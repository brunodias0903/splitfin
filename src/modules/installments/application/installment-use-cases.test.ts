import { describe, expect, it } from "vitest";
import {
  createInstallmentPlan,
  detachCard,
  payNextInstallment,
  updateInstallmentPlan,
} from "./installment-use-cases";
import type { InstallmentData, InstallmentPlan } from "../domain/installment";

const data: InstallmentData = {
  description: "Notebook",
  totalAmount: 2999.9,
  totalInstallments: 10,
  paidInstallments: 2,
  category: "Shopping",
  startDate: "2026-01-31",
  cardId: "card-1",
};

function idSequence() {
  let id = 0;
  return () => `id-${++id}`;
}

describe("installment use cases", () => {
  it("creates a plan and the expenses already paid", () => {
    const result = createInstallmentPlan(data, idSequence());

    expect(result.plan).toMatchObject({ id: "id-1", active: true });
    expect(result.paidExpenses).toHaveLength(2);
    expect(result.paidExpenses[1]).toMatchObject({ amount: 299.99, date: "2026-02-28" });
  });

  it("updates plan progress and completion state", () => {
    const initial = createInstallmentPlan(data, idSequence()).plan;
    const completed = updateInstallmentPlan([initial], initial.id, {
      ...data,
      paidInstallments: 10,
    });

    expect(completed[0]).toMatchObject({ paidInstallments: 10, active: false });
  });

  it("pays the next installment exactly once", () => {
    const initial = createInstallmentPlan(data, idSequence()).plan;
    const result = payNextInstallment(initial, () => "expense-3");

    expect(result.plan.paidInstallments).toBe(3);
    expect(result.expense).toMatchObject({
      id: "expense-3",
      description: "Notebook (3/10)",
      amount: 299.99,
      date: "2026-03-31",
    });
  });

  it("does not create a payment for a completed plan", () => {
    const completed: InstallmentPlan = {
      ...createInstallmentPlan(data, idSequence()).plan,
      paidInstallments: 10,
      active: false,
    };

    expect(payNextInstallment(completed, () => "unused")).toEqual({ plan: completed });
  });

  it("detaches a removed card without changing other plans", () => {
    const plan = createInstallmentPlan(data, idSequence()).plan;
    const [detached] = detachCard([plan], "card-1");

    expect(detached.cardId).toBeUndefined();
  });
});
