"use client";

import { DEMO_TODAY } from "@/lib/constants";
import { monthLabel, shiftMonth, weekdayIndex } from "@/lib/format";
import { cn } from "@/lib/format";
import type { AppointmentDaySlots } from "@/lib/availability";
import type { AvailabilityDay } from "@/lib/types";

export function MonthCalendar({
  month,
  onMonth,
  days,
  slotsByDate,
  disableUnavailable = false,
  selected,
  onPick,
}: {
  month: string;
  onMonth: (month: string) => void;
  days: AvailabilityDay[];
  slotsByDate?: Record<string, AppointmentDaySlots>;
  disableUnavailable?: boolean;
  selected?: string;
  onPick: (date: string) => void;
}) {
  const first = weekdayIndex(`${month}-01`);
  const cells: Array<string | null> = [...Array(first).fill(null)];
  const inMonth = days.filter((day) => day.date.startsWith(month));
  inMonth.forEach((day) => cells.push(day.date));
  const byDate = new Map(days.map((day) => [day.date, day.status]));

  return (
    <div className="border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="text-sm" onClick={() => onMonth(shiftMonth(month, -1))} disabled={month <= "2026-09"}>Previous</button>
        <h2 className="font-display text-xl">{monthLabel(month)}</h2>
        <button type="button" className="text-sm" onClick={() => onMonth(shiftMonth(month, 1))} disabled={month >= "2027-01"}>Next</button>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-mute sm:text-xs sm:tracking-[0.14em]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />;
          const status = byDate.get(date) ?? "open";
          const slots = slotsByDate?.[date];
          const noAvailableTimes = status === "open" && !!slots && slots.available.length === 0;
          const partiallyBooked = status === "open" && !!slots && slots.available.length > 0 && slots.available.length < slots.scheduled.length;
          const displayStatus = noAvailableTimes ? "booked" : status;
          const statusText = noAvailableTimes ? "no available times" : partiallyBooked ? "partially booked" : displayStatus;
          const past = date < DEMO_TODAY;
          return (
            <button
              key={date}
              type="button"
              disabled={(past && displayStatus !== "booked") || (disableUnavailable && displayStatus !== "open")}
              onClick={() => onPick(date)}
              aria-label={`${date}, ${statusText}`}
              aria-pressed={selected === date}
              className={cn(
                "h-11 border text-sm",
                selected === date && "border-ink bg-ink text-white",
                selected !== date && displayStatus === "open" && !partiallyBooked && "border-line bg-white",
                selected !== date && displayStatus === "open" && partiallyBooked && "border-dashed border-ink bg-white",
                selected !== date && displayStatus === "blocked" && "border-detail bg-detail text-mute",
                selected !== date && displayStatus === "booked" && "border-ink bg-paper",
                past && "opacity-50",
              )}
            >
              {Number(date.slice(-2))}
            </button>
          );
        })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-4 text-xs text-mute">
        <li>Open</li>
        <li>Shaded days are blocked</li>
        <li>Outlined days have no available times</li>
        {slotsByDate && Object.values(slotsByDate).some((item) => item.available.length > 0 && item.available.length < item.scheduled.length) ? (
          <li>Dashed outline: some time slots are booked</li>
        ) : null}
      </ul>
    </div>
  );
}
