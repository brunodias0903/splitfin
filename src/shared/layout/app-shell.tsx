"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, type Locale } from "@/shared/i18n";
import { Icon, type IconName } from "@/shared/ui/icons";
import { NativeSelect } from "@/shared/ui";

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS: { href: string; labelKey: string; icon: IconName }[] = [
  { href: "/dashboard", labelKey: "navDashboard", icon: "dashboard" },
  { href: "/expenses", labelKey: "navExpenses", icon: "expenses" },
  { href: "/installments", labelKey: "navInstallments", icon: "installments" },
  { href: "/cards", labelKey: "navCards", icon: "cards" },
];

export default function AppShell({ children }: LayoutProps) {
  const { t, locale, setLocale } = useLocale();
  const pathname = usePathname();

  return (
    <div className="app-shell flex min-h-screen">
      <aside className="ds-sidebar sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden bg-sidebar-surface text-on-brand md:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary-highlight/15 blur-3xl" />
        <div className="relative flex items-center gap-3 px-6 pb-9 pt-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-highlight text-on-brand shadow-sidebar-logo">
            <Icon name="wallet" size={21} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Splitfin</h1>
            <p className="text-[11px] font-medium text-on-dark-muted">{t.appTitle}</p>
          </div>
        </div>

        <p className="relative px-7 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-on-dark-muted">
          {t.menu}
        </p>
        <nav className="relative flex-1 space-y-1 px-4" aria-label="Principal">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                  active
                    ? "bg-surface text-strong shadow-active-nav"
                    : "text-on-dark-muted hover:bg-surface/6 hover:text-on-brand"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-on-dark-muted group-hover:text-on-brand"
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                </span>
                <span>{t[item.labelKey as keyof typeof t] as string}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-highlight" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="relative m-4 rounded-2xl border border-on-brand/8 bg-surface/4 p-3.5">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-on-dark-muted">
            {t.language}
          </label>
          <NativeSelect
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            aria-label="Idioma"
            className="w-full [&_[data-slot=native-select]]:border-on-brand/10 [&_[data-slot=native-select]]:bg-sidebar-surface-accent [&_[data-slot=native-select]]:text-on-brand/85"
            size="sm"
          >
            <option value="pt-BR">Português · BR</option>
            <option value="en">English · US</option>
          </NativeSelect>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto pb-24 md:pb-0">
        <header className="flex h-16 items-center justify-between border-b border-border/70 bg-surface/70 px-5 backdrop-blur-lg md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-brand">
              <Icon name="wallet" size={19} />
            </div>
            <span className="font-bold tracking-tight text-strong">Splitfin</span>
          </div>
          <NativeSelect
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            aria-label="Idioma"
            className="w-16"
            size="sm"
          >
            <option value="pt-BR">PT</option>
            <option value="en">EN</option>
          </NativeSelect>
        </header>
        <div className="ds-page-container">{children}</div>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-mobile-nav backdrop-blur-xl md:hidden"
        aria-label="Principal"
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[50px] flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {active && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary-highlight" />
              )}
              <Icon name={item.icon} size={20} />
              <span>{t[item.labelKey as keyof typeof t] as string}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
