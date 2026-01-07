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

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DatePickerTransaction() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("Today");
  const [date, setDate] = React.useState<Date | undefined>(
    parseDate(value) || undefined
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);

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
                  setDate(selectedDate);
                  setValue(formatDate(selectedDate));
                  setMonth(selectedDate);
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
            className="text-[10px] sm:text-xs text-muted-foreground border-dashed rounded-full cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5"
            onClick={(e) => {
              e.preventDefault();
              setValue("Yesterday");
              const parsedDate = parseDate("Yesterday");
              if (parsedDate) {
                setDate(parsedDate);
                setMonth(parsedDate);
              }
            }}
          >
            Yesterday
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] sm:text-xs text-muted-foreground border-dashed rounded-full cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5"
            onClick={(e) => {
              e.preventDefault();
              setValue("Today");
              const parsedDate = parseDate("Today");
              if (parsedDate) {
                setDate(parsedDate);
                setMonth(parsedDate);
              }
            }}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] sm:text-xs text-muted-foreground border-dashed rounded-full cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5"
            onClick={(e) => {
              e.preventDefault();
              setValue("Tomorrow");
              const parsedDate = parseDate("Tomorrow");
              if (parsedDate) {
                setDate(parsedDate);
                setMonth(parsedDate);
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
