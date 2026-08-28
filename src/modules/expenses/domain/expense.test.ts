import { describe, expect, it } from "vitest";
import { isExpense } from "./expense";

describe("expense validation", () => {
  it("accepts a valid persisted expense", () => {
    expect(
      isExpense({
        id: "expense-1",
        description: "Market",
        amount: 100,
        category: "Food",
        date: "2026-01-01",
      }),
    ).toBe(true);
  });

  it("rejects invalid or non-finite amounts", () => {
    expect(isExpense(null)).toBe(false);
    expect(
      isExpense({
        id: "expense-1",
        description: "Market",
        amount: Number.NaN,
        category: "Food",
        date: "2026-01-01",
      }),
    ).toBe(false);
  });
});
