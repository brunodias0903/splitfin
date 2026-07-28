import { describe, it, expect } from "vitest";
import {
  getInstallmentDate,
  validateExpenseData,
  validateFixedExpenseData,
  validateCardData,
} from "../types";

describe("getInstallmentDate", () => {
  it("returns the start date for index 0", () => {
    expect(getInstallmentDate("2026-01-15", 0)).toBe("2026-01-15");
  });

  it("adds months correctly", () => {
    expect(getInstallmentDate("2026-01-15", 1)).toBe("2026-02-15");
    expect(getInstallmentDate("2026-01-15", 5)).toBe("2026-06-15");
  });

  it("handles year rollover", () => {
    expect(getInstallmentDate("2026-10-15", 3)).toBe("2027-01-15");
    expect(getInstallmentDate("2026-12-01", 1)).toBe("2027-01-01");
  });
});

describe("validateExpenseData", () => {
  it("validates a correct expense", () => {
    const expense = {
      id: "123",
      description: "Test",
      amount: 100,
      category: "Food",
      date: "2026-01-01",
    };
    expect(validateExpenseData(expense)).toBe(true);
  });

  it("rejects null", () => {
    expect(validateExpenseData(null)).toBe(false);
  });

  it("rejects missing id", () => {
    const data = { description: "Test", amount: 100, category: "Food", date: "2026-01-01" };
    expect(validateExpenseData(data)).toBe(false);
  });

  it("rejects wrong types", () => {
    const data = {
      id: "123",
      description: "Test",
      amount: "100",
      category: "Food",
      date: "2026-01-01",
    };
    expect(validateExpenseData(data)).toBe(false);
  });
});

describe("validateFixedExpenseData", () => {
  it("validates a correct fixed expense", () => {
    const expense = {
      id: "123",
      description: "Test",
      totalAmount: 1200,
      totalInstallments: 12,
      paidInstallments: 2,
      category: "Shopping",
      startDate: "2026-01-01",
      active: true,
    };
    expect(validateFixedExpenseData(expense)).toBe(true);
  });

  it("accepts optional cardId", () => {
    const expense = {
      id: "123",
      description: "Test",
      totalAmount: 1200,
      totalInstallments: 12,
      paidInstallments: 2,
      category: "Shopping",
      startDate: "2026-01-01",
      active: true,
      cardId: "card-1",
    };
    expect(validateFixedExpenseData(expense)).toBe(true);
  });

  it("rejects null", () => {
    expect(validateFixedExpenseData(null)).toBe(false);
  });

  it("rejects missing active", () => {
    const data = {
      id: "123",
      description: "Test",
      totalAmount: 1200,
      totalInstallments: 12,
      paidInstallments: 2,
      category: "Shopping",
      startDate: "2026-01-01",
    };
    expect(validateFixedExpenseData(data)).toBe(false);
  });
});

describe("validateCardData", () => {
  it("validates a correct card", () => {
    const card = { id: "1", name: "Nubank", last4: "1234" };
    expect(validateCardData(card)).toBe(true);
  });

  it("rejects null", () => {
    expect(validateCardData(null)).toBe(false);
  });

  it("rejects missing last4", () => {
    const data = { id: "1", name: "Nubank" };
    expect(validateCardData(data)).toBe(false);
  });
});
