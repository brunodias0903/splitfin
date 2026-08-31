"use client";

import { useState, type FormEvent } from "react";

import { authClient } from "@/modules/auth/infrastructure/auth-client";
import { Button, Field, FieldError, FieldGroup, FieldLabel, Input, Text } from "@/shared/ui";

export function RegisterForm() {
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("passwordConfirmation"));

    if (password !== confirmation) {
      setError("As senhas precisam ser iguais.");
      setLoading(false);
      return;
    }

    const result = await authClient.signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password,
      callbackURL: "/dashboard",
    });

    setLoading(false);

    if (result.error) {
      setError("Não foi possível concluir o cadastro. Revise os dados e tente novamente.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="rounded-xl bg-success-soft p-4 text-center">
        <Text className="font-semibold text-success">Confira sua caixa de entrada</Text>
        <Text variant="small" tone="muted" className="mt-1">
          Enviamos um link para confirmar seu e-mail antes do primeiro acesso.
        </Text>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input id="name" name="name" autoComplete="name" minLength={2} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            aria-describedby="password-help"
            required
          />
          <Text id="password-help" variant="caption" tone="muted">
            Use pelo menos 12 caracteres.
          </Text>
        </Field>
        <Field>
          <FieldLabel htmlFor="passwordConfirmation">Confirme a senha</FieldLabel>
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
        Criar conta
      </Button>
    </form>
  );
}
