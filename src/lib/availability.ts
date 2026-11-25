import { DEMO_TODAY, TIME_SLOTS } from "@/lib/constants";
import { weekdayIndex } from "@/lib/format";
import type { Artist, Booking, Service } from "@/lib/types";

const MINIMUM_APPOINTMENT_MINUTES = 90;

type SlotBooking = Pick<Booking, "artistId" | "appointmentDate" | "appointmentTime" | "status"> & Partial<Pick<Booking, "durationMinutes">>;
type SlotService = Pick<Service, "id" | "durationMinutes">;
type SlotArtist = Pick<Artist, "id" | "availability" | "workingHours">;

export function holdsAppointmentSlot(booking: Pick<Booking, "status">) {
  return booking.status === "confirmed" || booking.status === "completed" || booking.status === "disputed";
}

function normalizedDuration(duration: number | undefined) {
  return typeof duration === "number" && Number.isFinite(duration) && duration > 0
    ? Math.max(MINIMUM_APPOINTMENT_MINUTES, Math.round(duration))
    : MINIMUM_APPOINTMENT_MINUTES;
}

export function appointmentDurationForService(serviceId: string | null, services: readonly SlotService[]) {
  return normalizedDuration(services.find((service) => service.id === serviceId)?.durationMinutes);
}

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function appointmentSlotsForDate(
  artist: SlotArtist,
  date: string,
  bookings: readonly SlotBooking[],
  durationMinutes = MINIMUM_APPOINTMENT_MINUTES,
  today = DEMO_TODAY,
) {
  const day = artist.availability.find((item) => item.date === date);
  const hours = artist.workingHours.find((item) => item.day === weekdayIndex(date));
  if (date < today || !day || day.status !== "open" || !hours || hours.closed) {
    return { scheduled: [] as string[], available: [] as string[] };
  }

  const duration = normalizedDuration(durationMinutes);
  const open = minutesFromTime(hours.open);
  const close = minutesFromTime(hours.close);
  const scheduled = TIME_SLOTS.filter((slot) => {
    const start = minutesFromTime(slot);
    return start >= open && start + duration <= close;
  });
  const heldAppointments = bookings
    .filter((booking) => booking.artistId === artist.id && booking.appointmentDate === date && holdsAppointmentSlot(booking))
    .map((booking) => {
      const start = minutesFromTime(booking.appointmentTime);
      return { start, end: start + normalizedDuration(booking.durationMinutes) };
    });

  const available = scheduled.filter((slot) => {
    const start = minutesFromTime(slot);
    const end = start + duration;
    return !heldAppointments.some((held) => start < held.end && held.start < end);
  });

  return { scheduled, available };
}

export type AppointmentDaySlots = ReturnType<typeof appointmentSlotsForDate>;
