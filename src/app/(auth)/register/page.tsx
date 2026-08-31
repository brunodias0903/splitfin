import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/modules/auth/infrastructure/session";
import { AuthShell } from "@/modules/auth/ui/auth-shell";
import { RegisterForm } from "@/modules/auth/ui/register-form";

export default async function RegisterPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <AuthShell
      title="Crie sua conta"
      description="Comece a organizar sua vida financeira em um só lugar."
      footer={
        <>
          Já possui uma conta?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
