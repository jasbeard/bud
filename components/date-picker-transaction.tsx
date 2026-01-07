"use client";

import * as React from "react";
import { parseDate } from "chrono-node";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 justify-between">
        <div className="flex">
          <Label htmlFor="date" className="align-baseline">
            Date
          </Label>
        </div>
        <div className="text-muted-foreground px-1 text-xs">
          Scheduled for <span className="font-medium">{formatDate(date)}</span>
        </div>
      </div>
      <div className="relative flex gap-2">
        <Input
          id="date"
          value={value}
          placeholder="Today / tommorrow / next week"
          className="bg-background pr-10"
          onChange={(e) => {
            setValue(e.target.value);
            const date = parseDate(e.target.value);
            if (date) {
              setDate(date);
              setMonth(date);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-picker"
              variant="ghost"
              className="cursor-pointer absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                setDate(date);
                setValue(formatDate(date));
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs text-muted-foreground border-dashed rounded-full cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            setValue("Yesterday");
            const date = parseDate("Yesterday");
            if (date) {
              setDate(date);
              setMonth(date);
            }
          }}
        >
          Yesterday
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs text-muted-foreground border-dashed rounded-full cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            setValue("Today");
            const date = parseDate("Today");
            if (date) {
              setDate(date);
              setMonth(date);
            }
          }}
        >
          Today
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs text-muted-foreground border-dashed rounded-full cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            setValue("Tomorrow");
            const date = parseDate("Tomorrow");
            if (date) {
              setDate(date);
              setMonth(date);
            }
          }}
        >
          Tomorrow
        </Button>
      </div>
    </div>
  );
}
