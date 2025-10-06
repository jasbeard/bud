import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  FieldContent,
  FieldTitle,
} from "@/components/ui/field";
import { InputWithInfoTooltip } from "./input-with-info-tooltip";
import { type DateRange } from "react-day-picker";
import { useState, useCallback, useMemo } from "react";
import { CycleSelect } from "./cycle-select";
import { RadioGroup, RadioGroupItem } from "@radix-ui/react-radio-group";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

export enum CycleChoises {
  MONTHLY = "monthly",
  CUSTOM = "custom",
}

type CycleChoiceCardProps = {
  defaultValue: CycleChoises.MONTHLY | CycleChoises.CUSTOM;
  value: CycleChoises.MONTHLY | CycleChoises.CUSTOM;
  onValueChange: (value: CycleChoises.MONTHLY | CycleChoises.CUSTOM) => void;
} & React.ComponentProps<typeof RadioGroupPrimitive.Root>;

type OnboardingAlertDialogProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Root
>;

export function OnboardingAlertDialog({
  ...props
}: OnboardingAlertDialogProps) {
  const [maxCycles, setMaxCycles] = useState<number>(2);
  const [cycles, setCycles] = useState<DateRange[]>([]);

  // Trim cycles if max is reduced
  const handleMaxCyclesChange = useCallback((next: number) => {
    const safe = Number.isFinite(next) ? Math.max(1, Math.floor(next)) : 1;
    setMaxCycles(safe);
    setCycles((prev) => (prev.length > safe ? prev.slice(0, safe) : prev));
  }, []);

  const [cycleChoice, setCycleChoice] = useState<
    CycleChoises.MONTHLY | CycleChoises.CUSTOM
  >(CycleChoises.MONTHLY);

  const defaultMonth = useMemo(() => new Date(2025, 5, 12), []);
  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Setup your budgetspace</AlertDialogTitle>
          <AlertDialogDescription>
            Get started by setting up your budgetspace. Choose your preferred
            budget cycle and customize your budgeting experience to fit your
            needs.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <InputWithInfoTooltip
              id="name"
              placeholder="Household"
              type="text"
              tooltipMessage="letters, numbers, spaces, hyphens, and underscores are okay"
              className="w-90"
            />
          </Field>
          <Field>
            {/* <FieldLabel>Cycle</FieldLabel>
            <FieldDescription>
              Select a budget cycle to manage your money smarter.
            </FieldDescription>
            <RadioGroup
              {...props}
              defaultValue={cycleChoice}
              value={cycleChoice}
              onValueChange={(current) =>
                current === CycleChoises.MONTHLY
                  ? setCycleChoice(CycleChoises.MONTHLY)
                  : setCycleChoice(CycleChoises.CUSTOM)
              }
              className="flex flex-col"
            >
              <FieldLabel htmlFor="monthly-cycle">
                <Field orientation="horizontal" className="cursor-pointer">
                  <FieldContent>
                    <FieldTitle>Monthly</FieldTitle>
                    <FieldDescription>
                      Track your budget month-to-month.
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem
                    value={CycleChoises.MONTHLY}
                    id="monthly-cycle"
                  />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="custom-cycle">
                <Field orientation="horizontal" className="cursor-pointer">
                  <FieldContent>
                    <FieldTitle>Custom</FieldTitle>
                    <FieldDescription>
                      Overlapping and multi-cycle setups
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem
                    value={CycleChoises.CUSTOM}
                    id="custom-cycle"
                  />
                </Field>
              </FieldLabel>
            </RadioGroup> */}

            <CycleSelect
              id="cycle"
              cycles={cycles}
              onChange={setCycles}
              maxCycles={maxCycles}
              onMaxCyclesChange={handleMaxCyclesChange}
              defaultMonth={defaultMonth}
              numberOfMonths={2}
            />
          </Field>
        </FieldGroup>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
