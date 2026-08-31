import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/modules/auth/ui/auth-shell";
import { ResetPasswordForm } from "@/modules/auth/ui/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Defina uma nova senha"
      description="Escolha uma senha longa e exclusiva para o Splitfin."
      footer={
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
