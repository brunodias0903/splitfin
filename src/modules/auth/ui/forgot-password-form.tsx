"use client";

import { useState, type FormEvent } from "react";

import { authClient } from "@/modules/auth/infrastructure/auth-client";
import { Button, Field, FieldGroup, FieldLabel, Input, Text } from "@/shared/ui";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    await authClient.requestPasswordReset({
      email: String(form.get("email")),
      redirectTo: "/reset-password",
    });

    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="rounded-xl bg-success-soft p-4 text-center">
        <Text className="font-semibold text-success">Solicitação recebida</Text>
        <Text variant="small" tone="muted" className="mt-1">
          Se o e-mail estiver cadastrado, você receberá as próximas instruções.
        </Text>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
      </FieldGroup>
      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Enviar instruções
      </Button>
    </form>
  );
}
