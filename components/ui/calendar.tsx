"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { addMonths, isSameDay, isWithinInterval, startOfMonth } from "date-fns";
import type { DateRange } from "react-day-picker";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type CalendarProps = {
  mode?: "single" | "range" | "multiple";
  selected?: Date | DateRange | Date[] | undefined;
  onSelect?: (date: Date | DateRange | undefined) => void;
  defaultMonth?: Date;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  disabledDates?: Date[];
  numberOfMonths?: number;
  showOutsideDays?: boolean;
  captionLayout?: "buttons" | "dropdown" | "dropdown-buttons";
  fromYear?: number;
  toYear?: number;
};

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  defaultMonth = new Date(),
  minDate,
  maxDate,
  className = "",
  disabledDates = [],
  numberOfMonths = 1,
  showOutsideDays = true,
  captionLayout = "dropdown-buttons",
  fromYear = 1900,
  toYear = new Date().getFullYear(),
}: CalendarProps) {
  // Initialize current date state
  const [currentDate, setCurrentDate] = useState(defaultMonth);
  const [months, setMonths] = useState<Date[]>([]);

  // Initialize months array
  useEffect(() => {
    const newMonths = [];
    for (let i = 0; i < numberOfMonths; i++) {
      newMonths.push(addMonths(startOfMonth(currentDate), i));
    }
    setMonths(newMonths);
  }, [currentDate, numberOfMonths]);

  // Handle month navigation
  const goToPrevMonth = (): void => {
    setCurrentDate((prevDate) => addMonths(prevDate, -1));
  };

  const goToNextMonth = (): void => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1));
  };

  // Handle date selection
  const handleSelectDate = (day: number, month: number, year: number): void => {
    const newDate = new Date(year, month, day);

    // Check if date is disabled
    if (isDateDisabled(newDate)) return;

    if (mode === "single") {
      if (onSelect) onSelect(newDate);
    } else if (mode === "range") {
      const range = selected as DateRange | undefined;

      if (!range || (range.from && range.to)) {
        // Start a new range
        if (onSelect) onSelect({ from: newDate, to: undefined });
      } else if (range.from && !range.to) {
        // Complete the range
        if (newDate < range.from) {
          // If selecting a date before the start, swap them
          if (onSelect) onSelect({ from: newDate, to: range.from });
        } else {
          if (onSelect) onSelect({ from: range.from, to: newDate });
        }
      }
    } else if (mode === "multiple") {
      // Multiple mode not implemented yet
      if (onSelect) onSelect(newDate);
    }
  };

  // Helper to check if date is disabled
  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;

    return disabledDates.some(
      (disabledDate: Date) =>
        disabledDate.getFullYear() === date.getFullYear() &&
        disabledDate.getMonth() === date.getMonth() &&
        disabledDate.getDate() === date.getDate()
    );
  };

  // Check if a date is selected
  const isDateSelected = (
    day: number,
    month: number,
    year: number
  ): boolean => {
    const date = new Date(year, month, day);

    if (mode === "single" && selected instanceof Date) {
      return isSameDay(date, selected);
    } else if (
      mode === "range" &&
      selected &&
      typeof selected === "object" &&
      "from" in selected
    ) {
      const range = selected as DateRange;
      if (range.from && range.to) {
        return isWithinInterval(date, { start: range.from, end: range.to });
      } else if (range.from) {
        return isSameDay(date, range.from);
      }
    } else if (mode === "multiple" && Array.isArray(selected)) {
      return selected.some((selectedDate) => isSameDay(date, selectedDate));
    }

    return false;
  };

  // Check if a date is the range start or end
  const isRangeStart = (day: number, month: number, year: number): boolean => {
    if (
      mode !== "range" ||
      !selected ||
      typeof selected !== "object" ||
      !("from" in selected)
    )
      return false;

    const date = new Date(year, month, day);
    const range = selected as DateRange;

    return range.from ? isSameDay(date, range.from) : false;
  };

  const isRangeEnd = (day: number, month: number, year: number): boolean => {
    if (
      mode !== "range" ||
      !selected ||
      typeof selected !== "object" ||
      !("to" in selected)
    )
      return false;

    const date = new Date(year, month, day);
    const range = selected as DateRange;

    return range.to ? isSameDay(date, range.to) : false;
  };

  // Check if a date is today
  const isToday = (day: number, month: number, year: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Generate calendar grid for a specific month
  const renderCalendarMonth = (monthDate: Date): React.ReactNode => {
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();

    // Get first day of the month and total days in month
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get days from previous month to display
    const daysFromPrevMonth = firstDayOfMonth;
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Get days needed from next month
    const remainingCells = (daysFromPrevMonth + daysInMonth) % 7;
    const daysFromNextMonth = remainingCells ? 7 - remainingCells : 0;

    const calendarDays: React.ReactElement[] = [];

    // Previous month days
    if (showOutsideDays) {
      for (
        let i = prevMonthDays - daysFromPrevMonth + 1;
        i <= prevMonthDays;
        i++
      ) {
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;

        calendarDays.push(
          <button
            key={`prev-${i}`}
            className={`
              h-10 w-10 rounded-full text-gray-400 hover:bg-gray-100
              ${isDateSelected(i, prevMonth, prevYear) ? "bg-blue-100" : ""}
              ${
                isRangeStart(i, prevMonth, prevYear)
                  ? "bg-blue-600 text-white"
                  : ""
              }
              ${
                isRangeEnd(i, prevMonth, prevYear)
                  ? "bg-blue-600 text-white"
                  : ""
              }
            `}
            onClick={() => handleSelectDate(i, prevMonth, prevYear)}
            disabled={isDateDisabled(new Date(prevYear, prevMonth, i))}
          >
            {i}
          </button>
        );
      }
    } else {
      // Empty cells for previous month
      for (let i = 0; i < daysFromPrevMonth; i++) {
        calendarDays.push(
          <div key={`empty-prev-${i}`} className="h-10 w-10"></div>
        );
      }
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const disabled = isDateDisabled(date);
      const isSelected = isDateSelected(i, month, year);
      const isStart = isRangeStart(i, month, year);
      const isEnd = isRangeEnd(i, month, year);

      calendarDays.push(
        <button
          key={`current-${i}`}
          className={`
            h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
            ${isToday(i, month, year) ? "border border-blue-400" : ""}
            ${
              isStart || isEnd
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : isSelected
                ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
                : disabled
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
          onClick={() => handleSelectDate(i, month, year)}
          disabled={disabled}
        >
          {i}
        </button>
      );
    }

    // Next month days
    if (showOutsideDays) {
      for (let i = 1; i <= daysFromNextMonth; i++) {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;

        calendarDays.push(
          <button
            key={`next-${i}`}
            className={`
              h-10 w-10 rounded-full text-gray-400 hover:bg-gray-100
              ${isDateSelected(i, nextMonth, nextYear) ? "bg-blue-100" : ""}
              ${
                isRangeStart(i, nextMonth, nextYear)
                  ? "bg-blue-600 text-white"
                  : ""
              }
              ${
                isRangeEnd(i, nextMonth, nextYear)
                  ? "bg-blue-600 text-white"
                  : ""
              }
            `}
            onClick={() => handleSelectDate(i, nextMonth, nextYear)}
            disabled={isDateDisabled(new Date(nextYear, nextMonth, i))}
          >
            {i}
          </button>
        );
      }
    } else {
      // Empty cells for next month
      for (let i = 0; i < daysFromNextMonth; i++) {
        calendarDays.push(
          <div key={`empty-next-${i}`} className="h-10 w-10"></div>
        );
      }
    }

    return (
      <div className="calendar-month">
        <div className="text-center mb-4">
          <h2 className="font-semibold text-gray-800">
            {MONTHS[month]} {year}
          </h2>
        </div>

        {/* Calendar days header */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">{calendarDays}</div>
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg p-4 select-none ${className}`}
    >
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <button
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={goToPrevMonth}
          title="previous month"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        <button
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={goToNextMonth}
          title="next month"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Calendar months */}
      <div
        className={`grid ${
          numberOfMonths > 1 ? "grid-cols-2 gap-4" : "grid-cols-1"
        }`}
      >
        {months.map((month, index) => (
          <div key={`month-${index}`}>{renderCalendarMonth(month)}</div>
        ))}
      </div>

      {/* Today button */}
      <div className="mt-4 flex justify-center">
        <button
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          onClick={() => {
            const today = new Date();
            setCurrentDate(startOfMonth(today));
            if (mode === "single") {
              if (onSelect) onSelect(today);
            } else if (mode === "range") {
              if (onSelect) onSelect({ from: today, to: today });
            }
          }}
        >
          Today
        </button>
      </div>
    </div>
  );
}

// Date Picker Component that uses the Calendar
export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
}: {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Format date as MM/DD/YYYY
  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Handle date selection from calendar
  const handleDateChange = (date: Date): void => {
    setSelectedDate(date);
    setIsOpen(false);
    if (onChange) onChange(date);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className="flex items-center border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon size={18} className="text-gray-500 mr-2" />
        <input
          type="text"
          readOnly
          placeholder={placeholder}
          value={formatDate(selectedDate)}
          className="flex-grow outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-72">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={
              handleDateChange as (date: Date | DateRange | undefined) => void
            }
            captionLayout="dropdown-buttons"
            fromYear={1900}
            toYear={new Date().getFullYear()}
          />
        </div>
      )}
    </div>
  );
}
