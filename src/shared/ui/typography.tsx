import type { ComponentProps, ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const headingVariants = cva("font-heading text-foreground", {
  variants: {
    variant: {
      page: "text-[clamp(1.55rem,3vw,2rem)] leading-tight font-bold tracking-[-0.035em]",
      section: "text-base font-semibold tracking-[-0.015em]",
      card: "text-sm font-semibold tracking-[-0.01em]",
    },
  },
  defaultVariants: { variant: "section" },
});

type HeadingProps = ComponentProps<"h1"> &
  VariantProps<typeof headingVariants> & {
    level?: 1 | 2 | 3 | 4;
  };

function Heading({ className, level = 2, variant, ...props }: HeadingProps) {
  const Component = `h${level}` as ElementType;
  return <Component className={cn(headingVariants({ variant }), className)} {...props} />;
}

const textVariants = cva("text-foreground", {
  variants: {
    variant: {
      body: "text-base",
      small: "text-sm",
      caption: "text-xs",
      eyebrow: "text-[0.6875rem] font-bold tracking-[0.1em] uppercase",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      subtle: "text-subtle-foreground",
      primary: "text-primary",
      danger: "text-destructive",
      success: "text-success",
    },
  },
  defaultVariants: { variant: "body", tone: "default" },
});

type TextProps = ComponentProps<"p"> &
  VariantProps<typeof textVariants> & {
    as?: "p" | "span" | "div";
  };

function Text({ as: Component = "p", className, variant, tone, ...props }: TextProps) {
  return <Component className={cn(textVariants({ variant, tone }), className)} {...props} />;
}

export { Heading, Text, headingVariants, textVariants };
