"use client";

import { Button, Heading, Text } from "@/shared/ui";
import { useLocale } from "@/shared/i18n";

export default function ExpensesError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useLocale();

  return (
    <div className="ds-page">
      <section role="alert" className="surface mx-auto max-w-xl p-8 text-center">
        <Heading level={1} variant="section">
          {t.expenseLoadFailedTitle}
        </Heading>
        <Text tone="muted" className="mt-2">
          {t.expenseLoadFailed}
        </Text>
        <Button className="mt-6" onClick={reset}>
          {t.tryAgain}
        </Button>
      </section>
    </div>
  );
}
