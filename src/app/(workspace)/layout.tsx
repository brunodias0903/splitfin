import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { FinanceProvider } from "./_providers/finance-provider";
import { getSession } from "@/modules/auth/infrastructure/session";
import { I18nProvider } from "@/shared/i18n";
import AppShell from "@/shared/layout/app-shell";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <I18nProvider>
      <FinanceProvider>
        <AppShell user={session.user}>{children}</AppShell>
      </FinanceProvider>
    </I18nProvider>
  );
}
