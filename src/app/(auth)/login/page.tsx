import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/modules/auth/infrastructure/session";
import { AuthShell } from "@/modules/auth/ui/auth-shell";
import { LoginForm } from "@/modules/auth/ui/login-form";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <AuthShell
      title="Entre na sua conta"
      description="Acesse seus dados financeiros com segurança."
      footer={
        <>
          Ainda não tem uma conta?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
