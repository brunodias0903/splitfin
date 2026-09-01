import { describe, expect, it } from "vitest";

import { InvalidCardInputError, parseCardInput } from "./persisted-card";

describe("persisted card boundary", () => {
  it("normalizes valid card input", () => {
    expect(
      parseCardInput({
        name: "  Principal  ",
        last4: "4242",
        type: "multiple",
        closingDay: "5",
        dueDay: 12,
      }),
    ).toEqual({
      name: "Principal",
      last4: "4242",
      type: "multiple",
      closingDay: 5,
      dueDay: 12,
    });
  });

  it.each([
    {},
    { name: "P", last4: "4242", type: "credit", closingDay: 5, dueDay: 12 },
    { name: "Principal", last4: "42", type: "credit", closingDay: 5, dueDay: 12 },
    { name: "Principal", last4: "4242", type: "unknown", closingDay: 5, dueDay: 12 },
    { name: "Principal", last4: "4242", type: "credit", closingDay: 0, dueDay: 12 },
  ])("rejects invalid card input", (input) => {
    expect(() => parseCardInput(input)).toThrow(InvalidCardInputError);
  });
});
