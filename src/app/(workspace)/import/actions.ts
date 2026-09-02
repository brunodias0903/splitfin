"use server";

import { revalidatePath } from "next/cache";

import {
  importLegacyData,
  type LegacyImportResult,
} from "@/modules/imports/infrastructure/legacy-import-service";

export type LegacyImportActionResult =
  { ok: true; result: LegacyImportResult } | { ok: false; reason: "unexpected" };

export async function importLegacyDataAction(input: unknown): Promise<LegacyImportActionResult> {
  try {
    const result = await importLegacyData(input);
    revalidatePath("/dashboard");
    revalidatePath("/expenses");
    revalidatePath("/installments");
    revalidatePath("/cards");
    return { ok: true, result };
  } catch (error) {
    console.error("Legacy import action failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false, reason: "unexpected" };
  }
}
