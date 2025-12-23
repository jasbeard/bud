"use client";

import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

interface LandingBadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  children: ReactNode;
}

export function LandingBadge({ children, ...props }: LandingBadgeProps) {
  return <Badge {...props}>{children}</Badge>;
}
