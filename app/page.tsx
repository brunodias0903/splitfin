"use client";

import dynamic from "next/dynamic";

const SplitfinApp = dynamic(() => import("@/App"), {
  loading: () => <div aria-label="Carregando aplicação" role="status" />,
  ssr: false,
});

export default function HomePage() {
  return <SplitfinApp />;
}
