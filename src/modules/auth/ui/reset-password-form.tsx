"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/modules/auth/infrastructure/auth-client";
import { Button, Field, FieldError, FieldGroup, FieldLabel, Input } from "@/shared/ui";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = searchParams.get("token");

    if (!token) {
      setError("Este link é inválido ou está incompleto.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("passwordConfirmation"));

    if (password !== confirmation) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    setLoading(true);
    setError(undefined);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);

    if (result.error) {
      setError("Este link expirou ou já foi utilizado. Solicite um novo.");
      return;
    }

    router.push("/login?reset=success");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="password">Nova senha</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="passwordConfirmation">Confirme a nova senha</FieldLabel>
          <Input
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </Field>
      </FieldGroup>
      <FieldError>{error}</FieldError>
      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Redefinir senha
      </Button>
    </form>
  );
}
