import { Spinner } from "@/shared/ui";

export default function ExpensesLoading() {
  return (
    <div className="ds-page" aria-busy="true">
      <div className="h-20 animate-pulse rounded-2xl bg-surface-muted" />
      <div className="ds-content-grid">
        <div className="surface flex min-h-72 items-center justify-center">
          <Spinner className="size-6 text-primary" aria-label="Carregando despesas" />
        </div>
        <div className="surface min-h-96 animate-pulse bg-surface-muted" />
      </div>
    </div>
  );
}
