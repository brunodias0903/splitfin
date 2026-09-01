"use server";

import { revalidatePath } from "next/cache";

import type { Card } from "@/modules/cards/domain/card";
import {
  InvalidCardInputError,
  parseCardId,
  parseCardInput,
} from "@/modules/cards/application/persisted-card";
import {
  archivePersistedCard,
  createPersistedCard,
  updatePersistedCard,
} from "@/modules/cards/infrastructure/card-service";

export type CardActionResult =
  { ok: true; card?: Card } | { ok: false; reason: "invalid" | "not-found" | "unexpected" };

function refresh() {
  revalidatePath("/cards");
  revalidatePath("/expenses");
  revalidatePath("/installments");
  revalidatePath("/dashboard");
}

function failure(error: unknown): CardActionResult {
  if (error instanceof InvalidCardInputError) return { ok: false, reason: "invalid" };
  console.error("Card persistence action failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return { ok: false, reason: "unexpected" };
}

export async function createCardAction(input: unknown): Promise<CardActionResult> {
  try {
    const card = await createPersistedCard(parseCardInput(input));
    refresh();
    return { ok: true, card };
  } catch (error) {
    return failure(error);
  }
}

export async function updateCardAction(id: unknown, input: unknown): Promise<CardActionResult> {
  try {
    const card = await updatePersistedCard(parseCardId(id), parseCardInput(input));
    if (!card) return { ok: false, reason: "not-found" };
    refresh();
    return { ok: true, card };
  } catch (error) {
    return failure(error);
  }
}

export async function archiveCardAction(id: unknown): Promise<CardActionResult> {
  try {
    if (!(await archivePersistedCard(parseCardId(id)))) return { ok: false, reason: "not-found" };
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
