import { describe, expect, it } from "vitest";
import { isCard } from "./card";

describe("card validation", () => {
  it("accepts a complete card", () => {
    expect(
      isCard({
        id: "card-1",
        name: "Principal",
        last4: "4242",
        type: "credit",
        closingDay: 5,
        dueDay: 12,
      }),
    ).toBe(true);
  });

  it("rejects legacy or malformed card types", () => {
    expect(isCard({ id: "card-1", name: "Principal", last4: "4242" })).toBe(false);
    expect(isCard({ id: "card-1", name: "Principal", last4: "42", type: "credit" })).toBe(false);
  });
});
