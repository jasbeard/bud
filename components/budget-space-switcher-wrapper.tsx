"use client";

import * as React from "react";
import { Suspense, useState, useEffect } from "react";
import useSWR from "swr";
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
import { BudgetSpaceSwitcher } from "./budget-space-switcher";

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

interface BudgetSpace {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

interface BudgetSpacesResponse {
  spaces: BudgetSpace[];
  plan: string;
}

async function fetcher(url: string): Promise<BudgetSpacesResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) {
      return { spaces: [], plan: "Basic" };
    }
    throw new Error("Failed to fetch budgetspaces");
  }
  return response.json();
}

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
  const { data, error } = useSWR<BudgetSpacesResponse>(
    "/api/budgetspaces/all",
    fetcher,
    {
      suspense: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      fallbackData: undefined, // Explicitly set to undefined to avoid SSR issues
    }
  );

  if (error || !data || data.spaces.length === 0) {
    return null;
  }

  // Map to the format expected by BudgetSpaceSwitcher
  const spaces = data.spaces.map((space) => ({
    name: space.name,
    logo: getIconForBudgetSpace(space.name),
    plan: data.plan || "Basic",
  }));

  return <BudgetSpaceSwitcher spaces={spaces} />;
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
      <BudgetSpaceSwitcherContent />
    </Suspense>
  );
}
