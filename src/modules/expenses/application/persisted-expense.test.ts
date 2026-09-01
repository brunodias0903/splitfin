import { describe, expect, it } from "vitest";

import {
  InvalidExpenseInputError,
  categoryToSlug,
  expenseDateTimeToDatabase,
  parseExpenseId,
  parseExpenseInput,
  paymentTypeFromDatabase,
  paymentTypeToDatabase,
  slugToCategory,
  toManausParts,
} from "./persisted-expense";

describe("persisted expense boundary", () => {
  it("normalizes valid input and accepts an owned-reference candidate", () => {
    expect(
      parseExpenseInput({
        description: "  Mercado  ",
        amount: 12.345,
        category: "Food",
        paymentType: "credit",
        cardId: "12345678-1234-4123-8123-123456789abc",
        date: "2026-08-31",
        time: "18:45",
      }),
    ).toEqual({
      description: "Mercado",
      amount: 12.35,
      category: "Food",
      paymentType: "credit",
      date: "2026-08-31",
      time: "18:45",
      cardId: "12345678-1234-4123-8123-123456789abc",
    });
  });

  it.each([
    {},
    { description: "x", amount: 10, category: "Food", paymentType: "pix", date: "2026-08-31" },
    { description: "Mercado", amount: 0, category: "Food", paymentType: "pix", date: "2026-08-31" },
    {
      description: "Mercado",
      amount: 10,
      category: "Unknown",
      paymentType: "pix",
      date: "2026-08-31",
    },
    {
      description: "Mercado",
      amount: 10,
      category: "Food",
      paymentType: "pix",
      date: "2026-02-30",
    },
  ])("rejects malformed input", (input) => {
    expect(() => parseExpenseInput(input)).toThrow(InvalidExpenseInputError);
  });

  it("validates identifiers before repository access", () => {
    const id = "12345678-1234-4123-8123-123456789abc";
    expect(parseExpenseId(id)).toBe(id);
    expect(() => parseExpenseId("not-an-id")).toThrow(InvalidExpenseInputError);
  });

  it("maps categories, payments and the product timezone without losing semantics", () => {
    expect(categoryToSlug("Subscription")).toBe("subscription");
    expect(slugToCategory("shopping")).toBe("Shopping");
    expect(paymentTypeToDatabase("boleto")).toBe("boleto");
    expect(paymentTypeFromDatabase("credit_card")).toBe("credit");
    expect(toManausParts(expenseDateTimeToDatabase("2026-08-31", "23:15"))).toEqual({
      date: "2026-08-31",
      time: "23:15",
    });
  });
});
