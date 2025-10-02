import * as React from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";

type Options = { label: string; value: string };
type SelectTransactionProps = {
  options: Options[];
  label?: string;
  placeholder: string;
};

export function SelectTransaction({
  options,
  label,
  placeholder,
  ...props
}: SelectTransactionProps &
  React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <Select>
      <SelectTrigger id={props.id} className={`w-[180px] ${props.className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {label && <SelectLabel>{label}</SelectLabel>}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
