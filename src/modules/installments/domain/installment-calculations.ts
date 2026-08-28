export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getInstallmentAmount(totalAmount: number, totalInstallments: number): number {
  if (!Number.isInteger(totalInstallments) || totalInstallments <= 0) {
    throw new RangeError("totalInstallments must be a positive integer");
  }
  return roundMoney(totalAmount / totalInstallments);
}

export function getInstallmentDate(startDate: string, index: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !Number.isInteger(index) || index < 0) {
    throw new RangeError("Invalid installment date or index");
  }

  const [year, month, day] = startDate.split("-").map(Number);
  const targetMonth = month - 1 + index;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  const result = new Date(Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDay)));
  return result.toISOString().slice(0, 10);
}
