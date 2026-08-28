import { describe, expect, it } from "vitest";
import { getInstallmentAmount, getInstallmentDate, roundMoney } from "./installment-calculations";

describe("installment calculations", () => {
  it("rounds monetary values to cents", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(getInstallmentAmount(100, 3)).toBe(33.33);
  });

  it("rejects invalid installment counts", () => {
    expect(() => getInstallmentAmount(100, 0)).toThrow(RangeError);
  });

  it("adds months and rolls over years", () => {
    expect(getInstallmentDate("2026-01-15", 0)).toBe("2026-01-15");
    expect(getInstallmentDate("2026-10-15", 3)).toBe("2027-01-15");
  });

  it("clamps dates to the final day of shorter months", () => {
    expect(getInstallmentDate("2026-01-31", 1)).toBe("2026-02-28");
    expect(getInstallmentDate("2028-01-31", 1)).toBe("2028-02-29");
  });
});
