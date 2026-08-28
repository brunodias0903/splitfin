import type { ComponentProps } from "react";

import { Button } from "@/shared/ui/button";

type IconButtonProps = Omit<ComponentProps<typeof Button>, "aria-label" | "size"> & {
  label: string;
  size?: "icon-xs" | "icon-sm" | "icon" | "icon-lg";
};

function IconButton({ label, title = label, size = "icon", ...props }: IconButtonProps) {
  return <Button aria-label={label} title={title} size={size} {...props} />;
}

export { IconButton };
