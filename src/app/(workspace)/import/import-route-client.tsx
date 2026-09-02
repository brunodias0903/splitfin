"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import {
  LEGACY_STORAGE_KEYS,
  legacyPayloadKey,
  normalizeLegacyPayload,
  parseLegacyImport,
  type LegacyImportPayload,
} from "@/modules/imports/application/legacy-import";
import type { LegacyImportResult } from "@/modules/imports/infrastructure/legacy-import-service";
import { useLocale } from "@/shared/i18n";
import { Badge, Button, Heading, Surface, Text } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import { importLegacyDataAction } from "./actions";

const EMPTY_STORAGE_SNAPSHOT = "{}";

function subscribeToLegacyStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("splitfin-local-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("splitfin-local-change", onChange);
  };
}

function getLegacyStorageSnapshot() {
  return JSON.stringify(
    Object.fromEntries(LEGACY_STORAGE_KEYS.map((key) => [key, localStorage.getItem(key)])),
  );
}

function readLegacyData(snapshot: string): {
  payload: LegacyImportPayload;
  malformedSources: number;
  rawStorage: Record<string, string | null>;
} {
  const payload: LegacyImportPayload = { cards: [], expenses: [], fixedExpenses: [] };
  const rawValues = JSON.parse(snapshot) as Record<string, string | null>;
  let malformedSources = 0;
  for (const key of LEGACY_STORAGE_KEYS) {
    const raw = rawValues[key];
    if (!raw) continue;
    try {
      const value: unknown = JSON.parse(raw);
      if (!Array.isArray(value)) {
        malformedSources += 1;
        continue;
      }
      payload[key] = value;
    } catch {
      malformedSources += 1;
    }
  }
  return { payload, malformedSources, rawStorage: rawValues };
}

export default function ImportRouteClient() {
  const { t } = useLocale();
  const storageSnapshot = useSyncExternalStore(
    subscribeToLegacyStorage,
    getLegacyStorageSnapshot,
    () => EMPTY_STORAGE_SNAPSHOT,
  );
  const { payload, malformedSources, rawStorage } = useMemo(
    () => readLegacyData(storageSnapshot),
    [storageSnapshot],
  );
  const [key, setKey] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<LegacyImportResult | null>(null);
  const [error, setError] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    void legacyPayloadKey(payload).then(setKey);
  }, [payload]);

  const preview = useMemo(() => parseLegacyImport(payload), [payload]);
  const validTotal = preview.cards.length + preview.expenses.length + preview.installments.length;
  const invalidTotal =
    Object.values(preview.invalid).reduce((sum, count) => sum + count, 0) + malformedSources;

  const downloadBackup = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            source: "splitfin-local",
            data: payload,
            rawStorage,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `splitfin-local-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importData = async () => {
    if (validTotal === 0) return;
    setPending(true);
    setError(false);
    try {
      const response = await importLegacyDataAction(normalizeLegacyPayload(payload));
      if (!response.ok) {
        setError(true);
        return;
      }
      setResult(response.result);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  const clearLocalData = () => {
    if (!confirmClear) return;
    for (const storageKey of LEGACY_STORAGE_KEYS) localStorage.removeItem(storageKey);
    window.dispatchEvent(new Event("splitfin-local-change"));
    setCleared(true);
    setConfirmClear(false);
  };

  const rows = [
    [t.cards, preview.cards.length, preview.invalid.cards],
    [t.expenses, preview.expenses.length, preview.invalid.expenses],
    [t.installments, preview.installments.length, preview.invalid.installments],
  ];

  return (
    <div className="ds-page">
      <div>
        <Text variant="eyebrow" tone="muted" className="mb-2">
          {t.history}
        </Text>
        <Heading level={1} variant="page">
          {t.importTitle}
        </Heading>
        <Text variant="small" tone="muted" className="mt-1.5">
          {t.importSubtitle}
        </Text>
      </div>

      <Surface className="ds-section-padding">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2} variant="section">
              {t.importPreview}
            </Heading>
            {key && (
              <Text variant="small" tone="muted" className="mt-1 font-mono">
                SHA-256 · {key.slice(0, 12)}
              </Text>
            )}
          </div>
          <Button type="button" variant="outline" onClick={downloadBackup}>
            <Icon name="download" /> {t.importBackup}
          </Button>
        </div>

        {payload && validTotal + invalidTotal === 0 ? (
          <Text tone="muted" className="mt-8 rounded-xl bg-surface-subtle p-5 text-center">
            {cleared ? t.importClearDone : t.importNoData}
          </Text>
        ) : (
          <div className="mt-6 space-y-3">
            {rows.map(([label, valid, invalid]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between rounded-xl border border-border p-4"
              >
                <Text className="font-semibold">{label}</Text>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {valid} {t.importValid}
                  </Badge>
                  {Number(invalid) > 0 && (
                    <Badge variant="destructive">
                      {invalid} {t.importInvalid}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {malformedSources > 0 && (
              <p role="alert" className="text-sm text-danger">
                {malformedSources} {t.importInvalid}
              </p>
            )}
            {preview.unresolvedCardReferences > 0 && (
              <Text variant="small" tone="muted">
                {preview.unresolvedCardReferences} {t.importUnresolvedCards}
              </Text>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-danger-soft p-3 text-sm text-danger">
            {t.importFailed}
          </p>
        )}

        {result ? (
          <div className="mt-6 rounded-2xl border border-success/25 bg-success-soft p-5">
            <Heading level={3} variant="card">
              {t.importSuccess}
            </Heading>
            <Text variant="small" className="mt-2">
              {result.imported.cards} {t.cards} · {result.imported.expenses} {t.expenses} ·{" "}
              {result.imported.installments} {t.installments}
            </Text>
            {result.duplicateBatch && (
              <Text variant="small" className="mt-2">
                {t.importDuplicate}
              </Text>
            )}
            {result.conflicts > 0 && (
              <Text variant="small" className="mt-2">
                {result.conflicts} {t.importConflicts}
              </Text>
            )}
            {result.detachedCardReferences > 0 && (
              <Text variant="small" className="mt-2">
                {result.detachedCardReferences} {t.importDetachedCards}
              </Text>
            )}
            <label className="mt-5 flex items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmClear}
                onChange={(event) => setConfirmClear(event.target.checked)}
              />
              <span>{t.importConfirmClear}</span>
            </label>
            <Button
              type="button"
              variant="destructive"
              className="mt-3"
              disabled={!confirmClear}
              onClick={clearLocalData}
            >
              {t.importClear}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            className="mt-6"
            onClick={importData}
            loading={pending}
            disabled={validTotal === 0}
          >
            <Icon name="import" /> {pending ? t.importing : t.importAction}
          </Button>
        )}
      </Surface>
    </div>
  );
}
