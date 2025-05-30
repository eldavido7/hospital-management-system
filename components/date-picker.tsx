"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  id?: string;
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function DatePicker({
  id,
  selected,
  onSelect,
  disabled = false,
  placeholder = "Select date",
  required = false,
  className,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(selected);

  // Update local state when selected prop changes
  React.useEffect(() => {
    if (selected) {
      setDate(selected);
    }
  }, [selected]);

  // Handle date selection
  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (onSelect) {
      onSelect(newDate);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            captionLayout="dropdown-buttons"
            fromYear={1900}
            toYear={new Date().getFullYear()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
