import Link from "next/link";
import type { ReactNode } from "react";

import { Heading, Surface, Text } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary-soft blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-secondary blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-on-brand shadow-primary-lg">
            <Icon name="wallet" size={22} />
          </span>
          <span className="text-xl font-bold tracking-tight text-strong">Splitfin</span>
        </Link>

        <Surface className="p-6 shadow-lg sm:p-8">
          <div className="mb-7 text-center">
            <Heading level={1} variant="section">
              {title}
            </Heading>
            <Text variant="small" tone="muted" className="mt-2">
              {description}
            </Text>
          </div>
          {children}
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </Surface>
      </div>
    </main>
  );
}
