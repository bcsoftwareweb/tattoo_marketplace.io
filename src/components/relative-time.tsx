"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatRelativeTime } from "@/lib/format";

export function RelativeTime({ dateTime, className }: { dateTime: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  const timestamp = Date.parse(dateTime);
  const label = formatRelativeTime(dateTime, now === null ? new Date() : new Date(now));

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, [dateTime]);

  return (
    <time
      dateTime={dateTime}
      title={Number.isFinite(timestamp) ? formatDateTime(dateTime) : undefined}
      aria-label={label === "Date unavailable" ? label : `Posted ${label}`}
      className={className}
      suppressHydrationWarning
    >
      {label}
    </time>
  );
}
