import { describe, expect, it } from "vitest";

import { parseLegacyImport } from "./legacy-import";

const card = {
  id: "legacy-card",
  name: "Principal",
  last4: "4242",
  type: "credit",
  closingDay: 5,
  dueDay: 12,
};

describe("legacy import", () => {
  it("validates records and preserves legacy relationships", () => {
    const parsed = parseLegacyImport({
      cards: [card, card],
      expenses: [
        {
          id: "legacy-expense",
          description: "Mercado",
          amount: 50,
          category: "Food",
          date: "2026-09-01",
          cardId: card.id,
        },
      ],
      fixedExpenses: [],
    });

    expect(parsed.cards).toHaveLength(1);
    expect(parsed.invalid.cards).toBe(1);
    expect(parsed.expenses[0]).toMatchObject({
      sourceCardId: "legacy-card",
      data: { paymentType: "other", cardId: undefined },
    });
    expect(parsed.unresolvedCardReferences).toBe(0);
  });

  it("skips invalid data and reports unresolved card references", () => {
    const parsed = parseLegacyImport({
      expenses: [
        { id: "invalid", description: "X" },
        {
          id: "valid",
          description: "Transporte",
          amount: 20,
          category: "Transport",
          paymentType: "pix",
          date: "2026-09-01",
          cardId: "missing-card",
        },
      ],
    });

    expect(parsed.invalid.expenses).toBe(1);
    expect(parsed.expenses).toHaveLength(1);
    expect(parsed.unresolvedCardReferences).toBe(1);
  });
});
