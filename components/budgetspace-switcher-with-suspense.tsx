"use client";

import * as React from "react";
import { Suspense, useState, useEffect } from "react";
import {
  IconInnerShadowTop,
  IconDeviceAudioTape,
  IconCommand,
  IconCategory2,
} from "@tabler/icons-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { BudgetSpaceSwitcher } from "./budgetspace-switcher";
import {
  BudgetSpaceProvider,
  useBudgetspace,
} from "@/contexts/budgetspace-context";

// Icon mapping function - maps budgetspace names to icons
const getIconForBudgetSpace = (name: string) => {
  const iconMap: Record<string, React.ElementType> = {
    Household: IconInnerShadowTop,
    Travel: IconDeviceAudioTape,
    Personal: IconCommand,
  };

  // Return mapped icon or default icon
  return iconMap[name] || IconCategory2;
};

export function BudgetSpaceSwitcherSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" disabled>
          <div className="bg-gray-400 flex aspect-square size-8 animate-pulse items-center justify-center rounded-lg" />
          <div className="grid flex-1 gap-1">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-400" />
            <div className="h-3 w-16 animate-pulse rounded bg-gray-400" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function BudgetSpaceSwitcherContent() {
  const { spaces, plan, error } = useBudgetspace();

  // With Suspense, data should be loaded when this renders
  // For empty/error state, show skeleton to maintain consistent layout
  // This prevents layout shifts when transitioning from loading to empty state
  if (error || !spaces || spaces.length === 0) {
    return <BudgetSpaceSwitcherSkeleton />;
  }

  // Map to the format expected by BudgetSpaceSwitcher
  const mappedSpaces = spaces.map((space) => ({
    name: space.name,
    logo: getIconForBudgetSpace(space.name),
    plan: plan || "Basic",
  }));

  return <BudgetSpaceSwitcher spaces={mappedSpaces} />;
}

export function BudgetSpaceSwitcherWithSuspense() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR, show skeleton. Once mounted on client, use Suspense
  if (!isMounted) {
    return <BudgetSpaceSwitcherSkeleton />;
  }

  return (
    <Suspense fallback={<BudgetSpaceSwitcherSkeleton />}>
      <BudgetSpaceProvider>
        <BudgetSpaceSwitcherContent />
      </BudgetSpaceProvider>
    </Suspense>
  );
}
