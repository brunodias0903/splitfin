import Link from "next/link";

import { AuthShell } from "@/modules/auth/ui/auth-shell";
import { ForgotPasswordForm } from "@/modules/auth/ui/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recupere sua senha"
      description="Informe seu e-mail para receber as instruções."
      footer={
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
