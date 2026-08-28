import { createLocalStorageRepository } from "@/shared/infrastructure/local-storage-repository";
import { isExpense } from "../domain/expense";

export const expenseRepository = createLocalStorageRepository("expenses", isExpense);
