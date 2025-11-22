"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "./ui/item";
import {
  ChevronRightIcon,
  CircleCheckIcon,
  CircleDashedIcon,
} from "lucide-react";
import { usePagePath } from "@/lib/utils";
import { AppPages } from "@/lib/types";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";

export function OnboardingPopover() {
  const path = usePagePath({ mode: "path" }) as AppPages;
  const exemptedPaths = [AppPages.HOME, AppPages.ONBOARDING];

  // Only fetch onboarding status when not on exempted paths
  const shouldFetch = !exemptedPaths.includes(path);
  const { isOnboarded, isLoading } = useOnboardingStatus(shouldFetch);

  // Don't render on exempted paths
  if (!shouldFetch) return null;

  // Show nothing while loading
  if (isLoading) return null;

  // Hide popover if user is already onboarded
  if (isOnboarded) return null;

  // Show popover if user is not onboarded
  return <BaseOnboardingPopover />;
}

function BaseOnboardingPopover() {
  const router = useRouter();

  const handleSelectBudgetCycle = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("onboarding", "true");
    router.push(url.pathname + url.search);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="text-xs font-semibold cursor-pointer items-center justify-center flex flex-col gap-0 p-6 absolute bottom-0 right-0 z-10 mb-6 mr-6 rounded-full"
        >
          <span>Getting Started</span>
          <div className="text-muted-foreground">10% complete</div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        alignOffset={6}
        sideOffset={6}
        className="w-90"
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Getting Started</h4>
            <p className="text-muted-foreground text-sm">
              {/* 1. Explore bud by working through the tasks below to get started quickly. */}
              Kickstart your journey with bud by completing the introductory
              steps.
              {/* 3. Kickstart your experience with bud by following these recommended onboarding tasks. */}
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid items-center">
              <Item variant="outline" size="sm" asChild>
                <a href="#">
                  <ItemMedia>
                    <CircleCheckIcon className="size-5 fill-green-500 text-white" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Create your first budgetspace</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRightIcon className="size-4" />
                  </ItemActions>
                </a>
              </Item>
            </div>
            <div className="grid items-center">
              <Item variant="outline" size="sm" asChild>
                <Button
                  variant="ghost"
                  className="cursor-pointer h-auto justify-start"
                  onClick={handleSelectBudgetCycle}
                >
                  <ItemMedia>
                    <CircleDashedIcon className="size-5 text-muted-foreground" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Select your budget cycle</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRightIcon className="size-4" />
                  </ItemActions>
                </Button>
              </Item>
            </div>
            <div className="grid items-center">
              <Item variant="outline" size="sm" asChild>
                <a href="#">
                  <ItemMedia>
                    <CircleDashedIcon className="size-5 text-muted-foreground" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Plan a budget</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRightIcon className="size-4" />
                  </ItemActions>
                </a>
              </Item>
            </div>
            <div className="grid items-center">
              <Item variant="outline" size="sm" asChild>
                <a href="#">
                  <ItemMedia>
                    <CircleDashedIcon className="size-5 text-muted-foreground" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Add a transaction</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRightIcon className="size-4" />
                  </ItemActions>
                </a>
              </Item>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
