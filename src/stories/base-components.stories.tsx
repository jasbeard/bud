import type { Story } from "@ladle/react";
import { Button as BaseButton } from "@/components/ui/button";
import { CycleSelect as BaseCycleSelect } from "@/components/cycle-select";

export const Button: Story = () => (
  <BaseButton variant="outline" className="rounded-full text-red-200">
    My Button u
  </BaseButton>
);

export const CycleSelect: Story = () => (
  <BaseCycleSelect defaultMonth={new Date(2025, 5, 12)} numberOfMonths={2} />
);
