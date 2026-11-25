import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "@/lib/format";

describe("formatRelativeTime", () => {
  const now = new Date("2026-11-25T18:00:00.000Z");

  it.each([
    ["2026-11-25T17:10:00.000Z", "50 min ago"],
    ["2026-11-24T18:00:00.000Z", "1 day ago"],
    ["2026-11-23T18:00:00.000Z", "2 days ago"],
    ["2026-11-18T18:00:00.000Z", "1 week ago"],
    ["2026-10-25T18:00:00.000Z", "1 month ago"],
  ])("formats %s as %s", (timestamp, expected) => {
    expect(formatRelativeTime(timestamp, now)).toBe(expected);
  });

  it("handles just-posted, future, and invalid timestamps", () => {
    expect(formatRelativeTime("2026-11-25T17:59:30.000Z", now)).toBe("Just now");
    expect(formatRelativeTime("2026-11-27T18:00:00.000Z", now)).toBe("in 2 days");
    expect(formatRelativeTime("not-a-date", now)).toBe("Date unavailable");
  });
});
