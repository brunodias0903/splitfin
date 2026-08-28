import type { ComponentProps } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Surface({ className, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card
      data-slot="surface"
      className={cn("gap-0 py-0 shadow-[var(--shadow-md)] ring-border/85", className)}
      {...props}
    />
  );
}

export { Surface };
