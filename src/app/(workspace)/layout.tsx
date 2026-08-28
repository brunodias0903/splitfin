import type { ReactNode } from "react";
import { FinanceProvider } from "./_providers/finance-provider";
import { I18nProvider } from "@/shared/i18n";
import AppShell from "@/shared/layout/app-shell";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <FinanceProvider>
        <AppShell>{children}</AppShell>
      </FinanceProvider>
    </I18nProvider>
  );
}
