import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function OnboardingPopover() {
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
        className="w-80"
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
          <div className="grid gap-2"></div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
