import "server-only";

import type { Card, CardData } from "../domain/card";
import { getDatabase } from "@/shared/db/client";
import { createPostgresCardRepository } from "./postgres-card-repository";

function repository() {
  return createPostgresCardRepository({ database: getDatabase() });
}

function toCard(row: {
  id: string;
  name: string;
  lastFourDigits: string;
  type: Card["type"];
  closingDay: number;
  dueDay: number;
}): Card {
  return {
    id: row.id,
    name: row.name,
    last4: row.lastFourDigits,
    type: row.type,
    closingDay: row.closingDay,
    dueDay: row.dueDay,
  };
}

export async function listCards(): Promise<Card[]> {
  return (await repository().list()).map(toCard);
}

export async function createPersistedCard(data: CardData): Promise<Card> {
  return toCard(
    await repository().create({
      name: data.name,
      lastFourDigits: data.last4,
      type: data.type,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
    }),
  );
}

export async function updatePersistedCard(id: string, data: CardData): Promise<Card | null> {
  const card = await repository().update(id, {
    name: data.name,
    lastFourDigits: data.last4,
    type: data.type,
    closingDay: data.closingDay,
    dueDay: data.dueDay,
  });
  return card ? toCard(card) : null;
}

export async function archivePersistedCard(id: string): Promise<boolean> {
  return repository().archive(id);
}
