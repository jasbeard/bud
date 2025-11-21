"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type TransactionKind = { value: string; label: string };
type ComboboxProps = {
  options: TransactionKind[];
  placeholder: string;
  searchPlaceholder: string;
  searchNotFoundText: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onCreateNew?: (value: string) => void;
  showQuickActions?: boolean;
} & React.ComponentProps<"button">;

export function Combobox({
  options,
  placeholder,
  searchPlaceholder,
  searchNotFoundText,
  value: controlledValue,
  onValueChange,
  onCreateNew,
  showQuickActions = true,
  ...props
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const setValue = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) {
            setSearchInput("");
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            {...props}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal text-muted-foreground",
              props.className
            )}
          >
            {value
              ? options.find((option) => option.value === value)?.label ||
                searchInput ||
                placeholder
              : placeholder}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[200px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-9"
              value={searchInput}
              onValueChange={setSearchInput}
            />
            <CommandList>
              <CommandEmpty>
                {onCreateNew && searchInput.trim() ? (
                  <CommandItem
                    onSelect={() => {
                      onCreateNew(searchInput.trim());
                      setSearchInput("");
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    Create {searchInput.trim()}
                  </CommandItem>
                ) : (
                  searchNotFoundText
                )}
              </CommandEmpty>
              <CommandGroup>
                {options
                  .filter(
                    (option) =>
                      option.label
                        .toLowerCase()
                        .includes(searchInput.toLowerCase()) ||
                      option.value
                        .toLowerCase()
                        .includes(searchInput.toLowerCase())
                  )
                  .map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue);
                        setSearchInput("");
                        setOpen(false);
                      }}
                    >
                      {option.label}
                      <Check
                        className={cn(
                          "ml-auto",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                {onCreateNew &&
                  searchInput.trim() &&
                  !options.some(
                    (opt) =>
                      opt.label.toLowerCase() ===
                        searchInput.trim().toLowerCase() ||
                      opt.value.toLowerCase() ===
                        searchInput.trim().toLowerCase()
                  ) && (
                    <CommandItem
                      onSelect={() => {
                        onCreateNew(searchInput.trim());
                        setSearchInput("");
                        setOpen(false);
                      }}
                      className="cursor-pointer font-medium"
                    >
                      + Create {searchInput.trim()}
                    </CommandItem>
                  )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showQuickActions && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-muted-foreground border-dashed rounded-full cursor-pointer"
            onClick={() => setValue("food")}
          >
            Food
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-muted-foreground border-dashed rounded-full cursor-pointer"
            onClick={() => setValue("transportation")}
          >
            Transportation
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-muted-foreground border-dashed rounded-full cursor-pointer"
            onClick={() => setValue("bill")}
          >
            Bill
          </Button>
        </div>
      )}
    </>
  );
}
