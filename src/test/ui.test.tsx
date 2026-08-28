import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge, Button, Heading, Input, NativeSelect, Surface, Text } from "../components/ui";

describe("design system components", () => {
  it("renders semantic heading levels independently from visual variants", () => {
    render(
      <Heading level={3} variant="page">
        Financial overview
      </Heading>,
    );

    expect(screen.getByRole("heading", { level: 3, name: "Financial overview" })).toBeVisible();
  });

  it("supports text variants while preserving the requested element", () => {
    render(
      <Text as="span" variant="caption" tone="muted">
        Supporting text
      </Text>,
    );

    const text = screen.getByText("Supporting text");
    expect(text.tagName).toBe("SPAN");
    expect(text).toHaveClass("text-xs", "text-muted-foreground");
  });

  it.each(["default", "secondary", "success", "destructive", "ghost", "link"] as const)(
    "renders the %s button variant",
    (variant) => {
      render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole("button", { name: variant })).toBeEnabled();
    },
  );

  it("disables a loading button and exposes its busy state", () => {
    render(<Button loading>Saving</Button>);
    const button = screen.getByRole("button", { name: /saving/i });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toBeVisible();
  });

  it("keeps native form semantics", () => {
    render(
      <>
        <Input aria-label="Description" />
        <NativeSelect aria-label="Category">
          <option value="food">Food</option>
        </NativeSelect>
      </>,
    );

    expect(screen.getByRole("textbox", { name: "Description" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Category" })).toHaveValue("food");
  });

  it("renders surface and badge primitives", () => {
    render(
      <Surface data-testid="surface">
        <Badge>Active</Badge>
      </Surface>,
    );

    expect(screen.getByTestId("surface")).toHaveAttribute("data-slot", "surface");
    expect(screen.getByText("Active")).toBeVisible();
  });
});
