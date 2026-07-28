import { useLocale, type Locale } from "../i18n";

type Page = "dashboard" | "expenses" | "installments" | "cards";

interface LayoutProps {
  page: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { page: Page; labelKey: keyof ReturnType<typeof useLocale>["t"]; icon: string }[] =
  [
    { page: "dashboard", labelKey: "navDashboard" as never, icon: "📊" },
    { page: "expenses", labelKey: "navExpenses" as never, icon: "💰" },
    { page: "installments", labelKey: "navInstallments" as never, icon: "📦" },
    { page: "cards", labelKey: "navCards" as never, icon: "💳" },
  ];

export default function Layout({ page, onNavigate, children }: LayoutProps) {
  const { t, locale, setLocale } = useLocale();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 flex-shrink-0 bg-indigo-950 text-white flex-col">
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-lg font-bold tracking-tight">{t.appTitle}</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                page === item.page
                  ? "bg-indigo-800 text-white"
                  : "text-indigo-200 hover:bg-indigo-900 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{t[item.labelKey] as string}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 pb-4">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="w-full px-2.5 py-2 rounded-lg text-sm bg-indigo-900 text-indigo-200 border border-indigo-700 cursor-pointer"
          >
            <option value="pt-BR">🇧🇷 Português</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-4 md:px-6 md:py-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 flex safe-area-bottom">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium cursor-pointer transition-colors min-h-0 ${
              page === item.page ? "text-indigo-600" : "text-gray-400"
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span>{t[item.labelKey] as string}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
