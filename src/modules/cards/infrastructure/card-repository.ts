import { createLocalStorageRepository } from "@/shared/infrastructure/local-storage-repository";
import { isCard } from "../domain/card";

export const cardRepository = createLocalStorageRepository("cards", isCard);
