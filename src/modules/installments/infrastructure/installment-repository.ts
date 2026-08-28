import { createLocalStorageRepository } from "@/shared/infrastructure/local-storage-repository";
import { isInstallmentPlan } from "../domain/installment";

export const installmentRepository = createLocalStorageRepository(
  "fixedExpenses",
  isInstallmentPlan,
);
