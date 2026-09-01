export interface InstallmentPlan {
  id: string;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  category: string;
  startDate: string;
  active: boolean;
  cardId?: string;
}

export interface InstallmentData {
  description: string;
  totalAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  category: string;
  startDate: string;
  cardId?: string;
}

export type InstallmentUpdateData = Omit<InstallmentData, "paidInstallments">;

export function isInstallmentPlan(data: unknown): data is InstallmentPlan {
  if (typeof data !== "object" || data === null) return false;
  const value = data as Record<string, unknown>;
  return (
    typeof value.id === "string" &&
    typeof value.description === "string" &&
    typeof value.totalAmount === "number" &&
    Number.isFinite(value.totalAmount) &&
    typeof value.totalInstallments === "number" &&
    Number.isInteger(value.totalInstallments) &&
    value.totalInstallments > 0 &&
    typeof value.paidInstallments === "number" &&
    Number.isInteger(value.paidInstallments) &&
    value.paidInstallments >= 0 &&
    value.paidInstallments <= value.totalInstallments &&
    typeof value.category === "string" &&
    typeof value.startDate === "string" &&
    typeof value.active === "boolean" &&
    (value.cardId === undefined || typeof value.cardId === "string")
  );
}
