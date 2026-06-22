"use client";

import React from "react";
import { DayPicker, type DayButton } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  FaCheck,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { cn } from "../../lib/utils";
import type { BookingBasic } from "../../lib/types/booking";
import { MAX_CONCURRENT_BOOKINGS_PER_DAY } from "../../lib/constants/booking";

interface BookingCalendarProps {
  formData: {
    checkIn: Date | null;
    checkOut: Date | null;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      phone: string;
      guests: string;
      checkIn: Date | null;
      checkOut: Date | null;
      pet: boolean;
      request: string;
    }>
  >;
  minDate: Date;
  maxBookingDate: Date;
  existingBookings: BookingBasic[];
  pricingBreakdown: {
    totalNights: number;
    totalAmount: number;
  } | null;
}

// Custom DayButton — theme bg + colored dot for status, orange for user selection
function StatusDayButton({
  day,
  modifiers,
  className,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const isActive = !modifiers.disabled && !modifiers.outside;
  const isRange = modifiers.range_start || modifiers.range_end || modifiers.range_middle;

  // Dot shows booking status — hidden when part of user's selected range
  const dotColor = !isRange
    ? modifiers.checkIn
      ? "bg-blue-400"
      : modifiers.checkOut
        ? "bg-rose-400"
        : modifiers.occupied
          ? "bg-amber-400"
          : modifiers.sameDay
            ? "bg-violet-400"
            : isActive
              ? "bg-emerald-400"
              : null
    : null;

  return (
    <button
      {...props}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 text-sm rounded-full transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",

        // Outside month
        modifiers.outside && "opacity-20 pointer-events-none",

        // Disabled / past
        modifiers.disabled && !modifiers.outside &&
          "opacity-40 pointer-events-none cursor-not-allowed text-muted-foreground",

        // Active dates — subtle themed background
        isActive && !isRange &&
          "bg-primary/10 text-foreground hover:bg-primary/20 cursor-pointer",

        // Today — ring + bold
        modifiers.today &&
          !modifiers.range_start &&
          !modifiers.range_end &&
          "ring-2 ring-primary/60 font-semibold",

        // Range middle — soft orange
        modifiers.range_middle &&
          !modifiers.range_start &&
          !modifiers.range_end &&
          "bg-orange-500/35 text-foreground hover:bg-orange-500/55 cursor-pointer",

        // Range start / end — solid orange circle
        (modifiers.range_start || modifiers.range_end) &&
          "rounded-full bg-orange-500 text-white hover:bg-orange-600 font-semibold cursor-pointer",

        className,
      )}
    >
      <span className="leading-none">{day.date.getDate()}</span>
      {dotColor && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColor)} />
      )}
    </button>
  );
}

export default function BookingCalendar({
  formData,
  setFormData,
  minDate,
  maxBookingDate,
  existingBookings,
  pricingBreakdown,
}: BookingCalendarProps) {
  // Build modifier date arrays from existing bookings
  const activeBookings = existingBookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending",
  );

  const checkInDates: Date[] = [];
  const checkOutDates: Date[] = [];
  const occupiedDates: Date[] = [];
  const sameDayDates: Date[] = [];

  activeBookings.forEach((booking) => {
    const checkIn = new Date(booking.check_in_date);
    checkIn.setHours(0, 0, 0, 0);
    const checkOut = new Date(booking.check_out_date);
    checkOut.setHours(0, 0, 0, 0);

    if (checkIn.getTime() === checkOut.getTime()) {
      sameDayDates.push(new Date(checkIn));
    } else {
      checkInDates.push(new Date(checkIn));
      checkOutDates.push(new Date(checkOut));

      const cur = new Date(checkIn);
      cur.setDate(cur.getDate() + 1);
      while (cur < checkOut) {
        occupiedDates.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
    }
  });

  // Unavailable dates: check-in capacity maxed (>= 2 check-ins same day)
  const getUnavailableDates = (): Date[] => {
    const toYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${da}`;
    };

    const checkInCounts = new Map<string, number>();
    activeBookings.forEach((booking) => {
      const key = toYMD(new Date(booking.check_in_date));
      checkInCounts.set(key, (checkInCounts.get(key) || 0) + 1);
    });

    const unavailable: Date[] = [];
    for (const [dateStr, count] of checkInCounts) {
      if (count >= MAX_CONCURRENT_BOOKINGS_PER_DAY) unavailable.push(new Date(dateStr));
    }
    return unavailable;
  };

  const selected =
    formData.checkIn || formData.checkOut
      ? {
          from: formData.checkIn ?? undefined,
          to: formData.checkOut ?? undefined,
        }
      : undefined;

  return (
    <div>
      <div className="rounded-xl border border-border overflow-hidden">
        <DayPicker
          mode="range"
          selected={selected}
          onSelect={(range) => {
            setFormData((prev) => ({
              ...prev,
              checkIn: range?.from ?? null,
              checkOut: range?.to ?? null,
            }));
          }}
          disabled={[{ before: minDate }, ...getUnavailableDates()]}
          modifiers={{
            checkIn: checkInDates,
            checkOut: checkOutDates,
            occupied: occupiedDates,
            sameDay: sameDayDates,
          }}
          startMonth={minDate}
          endMonth={maxBookingDate}
          navLayout="around"
          fixedWeeks
          showOutsideDays
          formatters={{
            formatWeekdayName: (d) =>
              d.toLocaleDateString("en-US", { weekday: "short" }),
          }}
          components={{
            DayButton: StatusDayButton,
            Chevron: ({ orientation, className }) => {
              if (orientation === "left")
                return <ChevronLeft className={cn("w-4 h-4", className)} />;
              return <ChevronRight className={cn("w-4 h-4", className)} />;
            },
          }}
          classNames={{
            root: "w-full select-none",
            months: "w-full",
            month: "w-full grid grid-cols-[2.5rem_1fr_2.5rem]",
            month_grid: "w-full border-collapse col-span-3",
            month_caption:
              "flex items-center justify-center h-12 bg-primary",
            caption_label: "text-white font-bold text-sm",
            button_previous:
              "flex items-center justify-center bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
            button_next:
              "flex items-center justify-center bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
            weekdays: "flex w-full bg-primary/80 mb-1",
            weekday:
              "flex-1 text-center text-white/85 text-xs font-semibold py-3",
            weeks: "w-full flex flex-col gap-y-1",
            week: "flex w-full gap-x-1",
            day: "flex-1 flex items-center justify-center",
            day_button: "w-11 h-11",
            selected: "",
            today: "",
            range_start: "",
            range_middle: "",
            range_end: "",
            outside: "",
            disabled: "",
            hidden: "invisible",
          }}
        />
      </div>

      {/* Instructions — only when no dates selected */}
      {!formData.checkIn && (
        <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <FaInfoCircle className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-medium">Select Your Dates</span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Click a date to set <strong>check-in</strong>, then click another
            for <strong>check-out</strong>.
          </p>
        </div>
      )}

      {/* Summary when dates selected */}
      {formData.checkIn && formData.checkOut && (
        <>
          {pricingBreakdown && pricingBreakdown.totalNights > 0 ? (
            <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaCheck className="w-4 h-4 text-success" />
                  <span className="text-success text-sm font-medium">
                    {pricingBreakdown.totalNights}{" "}
                    {pricingBreakdown.totalNights === 1 ? "Night" : "Nights"}{" "}
                    Selected
                  </span>
                </div>
                <span className="text-success text-sm font-bold">
                  ₱{pricingBreakdown.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          ) : formData.checkIn.toDateString() ===
            formData.checkOut.toDateString() ? (
            <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="w-4 h-4 text-warning" />
                <span className="text-warning text-sm font-medium">
                  Select a different check-out date
                </span>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-muted-foreground">Available</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">Your Pick</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-muted-foreground">Check-in</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="text-muted-foreground">Check-out</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-muted-foreground">Occupied</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
          <span className="text-muted-foreground">Full</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
          <span className="text-muted-foreground">Unavailable</span>
        </span>
      </div>
    </div>
  );
}
