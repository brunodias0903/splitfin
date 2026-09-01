import { describe, expect, it } from "vitest";

import {
  InvalidInstallmentInputError,
  parseInstallmentInput,
  parseInstallmentUpdateInput,
} from "./persisted-installment";

const valid = {
  description: "Notebook",
  totalAmount: 3000,
  totalInstallments: 6,
  paidInstallments: 2,
  category: "Shopping",
  startDate: "2026-09-01",
  cardId: "12345678-1234-4123-8123-123456789abc",
};

describe("persisted installment boundary", () => {
  it("normalizes creation and excludes paid progress from common updates", () => {
    expect(parseInstallmentInput(valid)).toEqual(valid);
    expect(parseInstallmentUpdateInput(valid)).not.toHaveProperty("paidInstallments");
  });

  it.each([
    { ...valid, totalInstallments: 1 },
    { ...valid, paidInstallments: 7 },
    { ...valid, totalAmount: 0 },
    { ...valid, cardId: "invalid" },
  ])("rejects inconsistent installment input", (input) => {
    expect(() => parseInstallmentInput(input)).toThrow(InvalidInstallmentInputError);
  });
});
