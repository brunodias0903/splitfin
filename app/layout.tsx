import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "../src/index.css";

export const metadata: Metadata = {
  title: "Splitfin",
  description: "Controle suas despesas, parcelas e cartões em um só lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
