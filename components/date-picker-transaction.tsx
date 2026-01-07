"use client";

import * as React from "react";
import { parseDate } from "chrono-node";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export interface DatePickerTransactionProps {
  /**
   * The current value (formatted date string or relative date like "Today", "Yesterday", "Tomorrow")
   */
  value?: string;
  /**
   * Callback fired when the value changes. Receives the formatted date string.
   */
  onChange?: (value: string) => void;
  /**
   * Optional callback fired when the date changes. Receives the Date object.
   * Useful when you need both the formatted string and the Date object.
   */
  onDateChange?: (date: Date | undefined) => void;
  /**
   * Default value for uncontrolled usage
   */
  defaultValue?: string;
}

export function DatePickerTransaction({
  value: controlledValue,
  onChange,
  onDateChange,
  defaultValue = "Today",
}: DatePickerTransactionProps) {
  const [open, setOpen] = React.useState(false);

  // Determine if component is controlled
  const isControlled = controlledValue !== undefined;

  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = React.useState(defaultValue);

  // Use controlled value if provided, otherwise use internal state
  const value = isControlled ? controlledValue : internalValue;

  // Parse the current value to get the Date object
  const getDateFromValue = React.useCallback((val: string) => {
    return parseDate(val) || undefined;
  }, []);

  const [date, setDate] = React.useState<Date | undefined>(() =>
    getDateFromValue(value)
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);

  // Sync date when value prop changes (controlled mode)
  React.useEffect(() => {
    if (isControlled) {
      const newDate = getDateFromValue(controlledValue);
      setDate(newDate);
      setMonth(newDate);
    }
  }, [controlledValue, isControlled, getDateFromValue]);

  // Handle value change
  const handleValueChange = React.useCallback(
    (newValue: string, newDate: Date | undefined) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
      onDateChange?.(newDate);
    },
    [isControlled, onChange, onDateChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="p-2.5 sm:p-3 bg-muted rounded-md flex flex-col gap-1.5 sm:gap-2">
        <PopoverTrigger asChild>
          <button
            type="button"
            className="text-left w-full hover:opacity-80 transition-opacity"
          >
            <div className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">
              Date
            </div>
            <div className="font-medium text-sm sm:text-base">
              <span>{value}</span>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <div className="p-4">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  const formattedDate = formatDate(selectedDate);
                  setDate(selectedDate);
                  setMonth(selectedDate);
                  handleValueChange(formattedDate, selectedDate);
                }
                setOpen(false);
              }}
            />
          </div>
        </PopoverContent>
        <div className="flex gap-1.5 sm:gap-2 items-center flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] sm:text-xs text-muted-foreground border-dashed rounded-full cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-background hover:border-muted-foreground"
            onClick={(e) => {
              e.preventDefault();
              const parsedDate = parseDate("Yesterday");
              if (parsedDate) {
                setDate(parsedDate);
                setMonth(parsedDate);
                handleValueChange("Yesterday", parsedDate);
              }
            }}
          >
            Yesterday
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] sm:text-xs text-muted-foreground border-dashed rounded-full cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-background hover:border-muted-foreground"
            onClick={(e) => {
              e.preventDefault();
              const parsedDate = parseDate("Today");
              if (parsedDate) {
                setDate(parsedDate);
                setMonth(parsedDate);
                handleValueChange("Today", parsedDate);
              }
            }}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] sm:text-xs text-muted-foreground border-dashed rounded-full cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-background hover:border-muted-foreground"
            onClick={(e) => {
              e.preventDefault();
              const parsedDate = parseDate("Tomorrow");
              if (parsedDate) {
                setDate(parsedDate);
                setMonth(parsedDate);
                handleValueChange("Tomorrow", parsedDate);
              }
            }}
          >
            Tomorrow
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(true)}
            className="cursor-pointer text-muted-foreground hover:text-foreground p-1 h-auto"
          >
            <CalendarIcon className="size-3.5 sm:size-4" />
          </Button>
        </div>
      </div>
    </Popover>
  );
}
