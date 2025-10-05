import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export enum CycleChoises {
  MONTHLY = "monthly",
  CUSTOM = "custom",
}

type CycleChoiceCardProps = {
  defaultValue: CycleChoises.MONTHLY | CycleChoises.CUSTOM;
  value: CycleChoises.MONTHLY | CycleChoises.CUSTOM;
  onValueChange: (value: CycleChoises.MONTHLY | CycleChoises.CUSTOM) => void;
};

export function CycleChoiceCard({
  defaultValue,
  value,
  onValueChange,
}: CycleChoiceCardProps) {
  return (
    <div className="w-full max-w-md">
      <FieldGroup>
        <FieldSet>
          <FieldLabel>Budget cycle</FieldLabel>
          <FieldDescription>
            Select a budget cycle for your budgetspace.
          </FieldDescription>
          <RadioGroup
            defaultValue={defaultValue}
            value={value}
            onValueChange={onValueChange}
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
                    Customize your budget cycles. (E.g weekly, overlapping)
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value={CycleChoises.CUSTOM} id="custom-cycle" />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </FieldSet>
      </FieldGroup>
    </div>
  );
}
