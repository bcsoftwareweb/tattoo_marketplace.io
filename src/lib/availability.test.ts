import { describe, expect, it } from "vitest";
import { appointmentSlotsForDate } from "@/lib/availability";

const date = "2026-11-20";
const artist = {
  id: "artist-test",
  availability: [{ date, status: "open" as const }],
  workingHours: Array.from({ length: 7 }, (_, day) => ({ day, closed: false, open: "11:00", close: "19:00" })),
};
const heldLongSession = {
  artistId: artist.id,
  appointmentDate: date,
  appointmentTime: "11:00",
  serviceId: "long-session",
  durationMinutes: 240,
  status: "confirmed" as const,
};

describe("appointment slot availability", () => {
  it("keeps other times available while excluding overlaps with a reserved appointment", () => {
    const slots = appointmentSlotsForDate(artist, date, [heldLongSession]);

    expect(slots.available).toEqual(["15:30", "17:00"]);
  });

  it("only offers starts that fit the requested service duration within working hours", () => {
    const slots = appointmentSlotsForDate(artist, date, [heldLongSession], 240);

    expect(slots.scheduled).toEqual(["11:00", "12:30", "14:00"]);
    expect(slots.available).toEqual([]);
  });
});
