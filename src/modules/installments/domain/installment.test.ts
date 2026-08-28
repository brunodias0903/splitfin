import { describe, expect, it } from "vitest";
import { isInstallmentPlan } from "./installment";

describe("installment validation", () => {
  it("accepts consistent progress", () => {
    expect(
      isInstallmentPlan({
        id: "plan-1",
        description: "Notebook",
        totalAmount: 3000,
        totalInstallments: 10,
        paidInstallments: 2,
        category: "Shopping",
        startDate: "2026-01-01",
        active: true,
      }),
    ).toBe(true);
  });

  it("rejects progress beyond the installment count", () => {
    expect(
      isInstallmentPlan({
        id: "plan-1",
        description: "Notebook",
        totalAmount: 3000,
        totalInstallments: 10,
        paidInstallments: 11,
        category: "Shopping",
        startDate: "2026-01-01",
        active: true,
      }),
    ).toBe(false);
  });
});
