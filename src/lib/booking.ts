import { ADMIN_ID, DEMO_TODAY, TIME_SLOTS } from "@/lib/constants";
import { balanceSplit, depositSplit } from "@/lib/money";
import { bookingPath } from "@/lib/permissions";
import type {
  Activity,
  Actor,
  AppNotification,
  Booking,
  BookingStatus,
  PlatformSettings,
  Transaction,
} from "@/lib/types";

export type BookingAction =
  | { type: "accept"; quote: number; deposit: number; note: string }
  | { type: "propose"; quote: number; deposit: number; date: string; time: string; note: string }
  | { type: "decline"; note: string }
  | { type: "customer_accept" }
  | { type: "customer_decline"; note: string }
  | { type: "pay_deposit" }
  | { type: "cancel"; note: string }
  | { type: "complete" }
  | { type: "dispute"; note: string }
  | { type: "refund"; note: string };

type Notice = Omit<AppNotification, "id" | "read" | "createdAt">;
type ActivityDraft = Omit<Activity, "id">;
type TransactionDraft = Omit<Transaction, "id">;

export interface TransitionOk {
  ok: true;
  booking: Booking;
  transactions: TransactionDraft[];
  notifications: Notice[];
  activity: ActivityDraft[];
  blockDate: string | null;
  releaseDate: string | null;
}

export type TransitionResult = TransitionOk | { ok: false; error: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function fail(error: string): TransitionResult {
  return { ok: false, error };
}

function priceError(quote: number, deposit: number) {
  if (!Number.isFinite(quote) || quote <= 0) return "Enter a price greater than zero.";
  if (!Number.isFinite(deposit) || deposit <= 0) return "Enter a deposit greater than zero.";
  if (Math.round(deposit) > Math.round(quote)) return "Deposit cannot exceed the quoted price.";
  return null;
}

function isArtist(actor: Actor, booking: Booking) {
  return actor.role === "artist" && actor.userId === booking.artistId;
}

function isCustomer(actor: Actor, booking: Booking) {
  return actor.role === "customer" && actor.userId === booking.customerId;
}

function stamp(booking: Booking, status: BookingStatus, note: string, actor: Actor["role"] | "system", now: string): Booking {
  return {
    ...booking,
    status,
    updatedAt: now,
    history: [...booking.history, { at: now, status, note, actor }],
  };
}

function notice(role: Notice["role"], userId: string, title: string, body: string, bookingId: string, kind: Notice["kind"]): Notice {
  return { role, userId, title, body, href: bookingPath(role, bookingId), kind };
}

export function transitionBooking(
  booking: Booking,
  action: BookingAction,
  actor: Actor,
  settings: PlatformSettings,
  transactions: Transaction[],
  now: string,
): TransitionResult {
  if (action.type === "accept") {
    if (!isArtist(actor, booking)) return fail("Only the booked artist can accept this request.");
    if (booking.status !== "pending") return fail("Only a pending request can be accepted.");
    const quote = Math.round(action.quote);
    const deposit = Math.round(action.deposit);
    const invalid = priceError(quote, deposit);
    if (invalid) return fail(invalid);
    const status = quote === booking.customerBudget ? "awaiting_deposit" : "awaiting_customer_confirmation";
    const note = action.note.trim() || (status === "awaiting_deposit"
      ? "Accepted at the requested time."
      : "Accepted the time and sent a revised quote.");
    return {
      ok: true,
      booking: {
        ...stamp(booking, status, note, "artist", now),
        quote,
        deposit,
        artistNote: action.note.trim(),
        proposedDate: null,
        proposedTime: null,
      },
      transactions: [],
      notifications: [
        notice(
          "customer",
          booking.customerId,
          status === "awaiting_deposit" ? "Request accepted" : "Quote needs confirmation",
          status === "awaiting_deposit"
            ? "Your appointment was accepted. A deposit will hold the date."
            : "The artist kept your date and sent a revised quote to confirm.",
          booking.id,
          "booking",
        ),
      ],
      activity: [
        { userId: booking.artistId, role: "artist", text: `Updated ${booking.serviceName} to ${status.replaceAll("_", " ")}.`, createdAt: now },
        { userId: booking.customerId, role: "customer", text: `The artist responded to ${booking.serviceName}.`, createdAt: now },
      ],
      blockDate: null,
      releaseDate: null,
    };
  }

  if (action.type === "propose") {
    if (!isArtist(actor, booking)) return fail("Only the booked artist can propose a change.");
    if (booking.status !== "pending" && booking.status !== "artist_proposed_changes") {
      return fail("A new time can only be proposed on an open request.");
    }
    const quote = Math.round(action.quote);
    const deposit = Math.round(action.deposit);
    const invalid = priceError(quote, deposit);
    if (invalid) return fail(invalid);
    if (!action.note.trim()) return fail("Add a note explaining the proposed change.");
    if (!DATE_PATTERN.test(action.date) || action.date < DEMO_TODAY) return fail("Choose a future date.");
    if (!TIME_SLOTS.includes(action.time as (typeof TIME_SLOTS)[number])) return fail("Choose a valid time.");
    const sameSlot = action.date === booking.requestedDate && action.time === booking.requestedTime;
    if (sameSlot && quote === booking.customerBudget) {
      return fail("Change the date, time, or price, or accept the request as submitted.");
    }
    return {
      ok: true,
      booking: {
        ...stamp(booking, "artist_proposed_changes", action.note.trim(), "artist", now),
        quote,
        deposit,
        proposedDate: action.date,
        proposedTime: action.time,
        artistNote: action.note.trim(),
      },
      transactions: [],
      notifications: [
        notice(
          "customer",
          booking.customerId,
          "Artist proposed a change",
          "Review the new date, time, or quote before paying a deposit.",
          booking.id,
          "booking",
        ),
      ],
      activity: [
        { userId: booking.artistId, role: "artist", text: `Proposed a new time for ${booking.serviceName}.`, createdAt: now },
        { userId: booking.customerId, role: "customer", text: `A new time was proposed for ${booking.serviceName}.`, createdAt: now },
      ],
      blockDate: null,
      releaseDate: null,
    };
  }

  if (action.type === "decline") {
    if (!isArtist(actor, booking)) return fail("Only the booked artist can decline this request.");
    if (booking.status !== "pending" && booking.status !== "artist_proposed_changes") {
      return fail("This request can no longer be declined.");
    }
    if (!action.note.trim()) return fail("Add a short note for the customer.");
    return {
      ok: true,
      booking: stamp(booking, "declined", action.note.trim(), "artist", now),
      transactions: [],
      notifications: [
        notice("customer", booking.customerId, "Request declined", action.note.trim(), booking.id, "booking"),
      ],
      activity: [
        { userId: booking.artistId, role: "artist", text: `Declined ${booking.serviceName}.`, createdAt: now },
        { userId: booking.customerId, role: "customer", text: `${booking.serviceName} was declined.`, createdAt: now },
      ],
      blockDate: null,
      releaseDate: null,
    };
  }

  if (action.type === "customer_accept") {
    if (!isCustomer(actor, booking)) return fail("Only the customer can accept this proposal.");
    if (booking.status !== "artist_proposed_changes" && booking.status !== "awaiting_customer_confirmation") {
      return fail("There is no proposal to accept.");
    }
    if (booking.quote == null || booking.deposit == null) return fail("The proposal is missing a price.");
    const nextDate = booking.proposedDate ?? booking.appointmentDate;
    const nextTime = booking.proposedTime ?? booking.appointmentTime;
    return {
      ok: true,
      booking: {
        ...stamp(booking, "awaiting_deposit", "Customer accepted the artist's terms.", "customer", now),
        appointmentDate: nextDate,
        appointmentTime: nextTime,
      },
      transactions: [],
      notifications: [
        notice("artist", booking.artistId, "Customer accepted your terms", "The booking is waiting on the deposit.", booking.id, "booking"),
      ],
      activity: [
        { userId: booking.customerId, role: "customer", text: `Accepted terms for ${booking.serviceName}.`, createdAt: now },
        { userId: booking.artistId, role: "artist", text: `Customer accepted ${booking.serviceName}.`, createdAt: now },
      ],
      blockDate: null,
      releaseDate: null,
    };
  }

  if (action.type === "customer_decline") {
    if (!isCustomer(actor, booking)) return fail("Only the customer can decline this proposal.");
    if (booking.status !== "artist_proposed_changes" && booking.status !== "awaiting_customer_confirmation") {
      return fail("There is no proposal to decline.");
    }
    const note = action.note.trim() || "Customer declined the proposed terms.";
    return {
      ok: true,
      booking: stamp(booking, "declined", note, "customer", now),
      transactions: [],
      notifications: [
        notice("artist", booking.artistId, "Customer declined the proposal", note, booking.id, "booking"),
      ],
      activity: [
        { userId: booking.customerId, role: "customer", text: `Declined the proposal for ${booking.serviceName}.`, createdAt: now },
        { userId: booking.artistId, role: "artist", text: `Customer declined ${booking.serviceName}.`, createdAt: now },
      ],
      blockDate: null,
      releaseDate: null,
    };
  }

  if (action.type === "pay_deposit") {
    if (!isCustomer(actor, booking)) return fail("Only the customer can pay the deposit.");
    if (booking.status !== "awaiting_deposit") return fail("This booking is not waiting on a deposit.");
    if (booking.quote == null || booking.deposit == null) return fail("This booking has no quoted deposit.");
    const split = depositSplit(booking.quote, booking.deposit, settings.commissionPercent);
    return {
      ok: true,
      booking: stamp(booking, "confirmed", "Deposit recorded.", "customer", now),
      transactions: [
        {
          bookingId: booking.id,
          customerId: booking.customerId,
          artistId: booking.artistId,
          type: "deposit",
          amount: split.amount,
          commission: split.commission,
          artistNet: split.artistNet,
          createdAt: now,
          note: "Deposit paid at checkout.",
        },
      ],
      notifications: [
        notice("customer", booking.customerId, "Deposit confirmed", "Your appointment is now confirmed.", booking.id, "payment"),
        notice("artist", booking.artistId, "Deposit received", "The deposit confirmed the appointment.", booking.id, "payment"),
      ],
      activity: [
        { userId: booking.customerId, role: "customer", text: `Confirmed ${booking.serviceName} with a deposit.`, createdAt: now },
        { userId: booking.artistId, role: "artist", text: `Deposit confirmed for ${booking.serviceName}.`, createdAt: now },
      ],
      blockDate: booking.appointmentDate,
      releaseDate: null,
    };
  }

  if (action.type === "cancel") {
    if (!isCustomer(actor, booking)) return fail("Only the customer can cancel this appointment.");
    const allowed: BookingStatus[] = [
      "pending",
      "artist_proposed_changes",
      "awaiting_customer_confirmation",
      "awaiting_deposit",
      "confirmed",
    ];
    if (!allowed.includes(booking.status)) return fail("This appointment can no longer be cancelled.");
    const note = action.note.trim() || "Cancelled by the customer.";
    return {
      ok: true,
      booking: stamp(booking, "cancelled", note, "customer", now),
      transactions: [],
      notifications: [
        notice("artist", booking.artistId, "Appointment cancelled", note, booking.id, "booking"),
        notice("customer", booking.customerId, "Cancellation saved", "The appointment is marked cancelled.", booking.id, "booking"),
      ],
      activity: [
        { userId: booking.customerId, role: "customer", text: `Cancelled ${booking.serviceName}.`, createdAt: now },
        { userId: booking.artistId, role: "artist", text: `${booking.serviceName} was cancelled.`, createdAt: now },
      ],
      blockDate: null,
      releaseDate: booking.status === "confirmed" ? booking.appointmentDate : null,
    };
  }

  if (action.type === "complete") {
    if (!isArtist(actor, booking)) return fail("Only the booked artist can complete this appointment.");
    if (booking.status !== "confirmed") return fail("Only a confirmed appointment can be completed.");
    if (booking.quote == null || booking.deposit == null) return fail("This booking is missing a quote.");
    const split = balanceSplit(booking.quote, booking.deposit, settings.commissionPercent);
    const transactions: TransactionDraft[] = [];
    if (split.amount > 0) {
      transactions.push({
        bookingId: booking.id,
        customerId: booking.customerId,
        artistId: booking.artistId,
        type: "balance",
        amount: split.amount,
        commission: split.commission,
        artistNet: split.artistNet,
        createdAt: now,
        note: "Remaining balance settled at the appointment.",
      });
    }
    return {
      ok: true,
      booking: stamp(booking, "completed", "Marked complete. Remaining balance settled.", "artist", now),
      transactions,
      notifications: [
        notice("customer", booking.customerId, "Appointment completed", "The artist marked this sitting complete.", booking.id, "booking"),
      ],
      activity: [
        { userId: booking.artistId, role: "artist", text: `Completed ${booking.serviceName}.`, createdAt: now },
        { userId: booking.customerId, role: "customer", text: `${booking.serviceName} was marked complete.`, createdAt: now },
      ],
      blockDate: null,
      releaseDate: null,
    };
  }

  if (action.type === "dispute") {
    if (!isCustomer(actor, booking)) return fail("Only the customer can open a dispute.");
    if (booking.status !== "confirmed" && booking.status !== "completed") {
      return fail("Only a confirmed or completed appointment can be disputed.");
    }
    if (action.note.trim().length < 10) return fail("Describe the issue in at least a sentence.");
    return {
      ok: true,
      booking: stamp(booking, "disputed", action.note.trim(), "customer", now),
      transactions: [],
      notifications: [
        notice("artist", booking.artistId, "Appointment disputed", action.note.trim(), booking.id, "booking"),
        notice("admin", ADMIN_ID, "Dispute opened", `${booking.serviceName} was disputed and needs review.`, booking.id, "booking"),
      ],
      activity: [
        { userId: booking.customerId, role: "customer", text: `Opened a dispute on ${booking.serviceName}.`, createdAt: now },
        { userId: ADMIN_ID, role: "admin", text: `Dispute opened on ${booking.serviceName}.`, createdAt: now },
      ],
      blockDate: null,
      releaseDate: null,
    };
  }

  if (action.type === "refund") {
    if (actor.role !== "admin") return fail("Only an administrator can refund a booking.");
    if (booking.status !== "disputed" && booking.status !== "confirmed" && booking.status !== "completed") {
      return fail("Only a paid booking can be refunded.");
    }
    if (!action.note.trim()) return fail("Add a note for the refund.");
    const related = transactions.filter((item) => item.bookingId === booking.id);
    const amount = related.reduce((sum, item) => sum + item.amount, 0);
    const commission = related.reduce((sum, item) => sum + item.commission, 0);
    const artistNet = related.reduce((sum, item) => sum + item.artistNet, 0);
    if (amount <= 0) return fail("There is no payment to refund.");
    return {
      ok: true,
      booking: stamp(booking, "refunded", action.note.trim(), "admin", now),
      transactions: [
        {
          bookingId: booking.id,
          customerId: booking.customerId,
          artistId: booking.artistId,
          type: "refund",
          amount: -amount,
          commission: -commission,
          artistNet: -artistNet,
          createdAt: now,
          note: `Refunded. ${action.note.trim()}`,
        },
      ],
      notifications: [
        notice("customer", booking.customerId, "Refund recorded", "A refund was applied to your deposit.", booking.id, "payment"),
        notice("artist", booking.artistId, "Booking refunded", "An administrator recorded a refund.", booking.id, "payment"),
      ],
      activity: [
        { userId: ADMIN_ID, role: "admin", text: `Refunded ${booking.serviceName}.`, createdAt: now },
        { userId: booking.customerId, role: "customer", text: `${booking.serviceName} was refunded.`, createdAt: now },
      ],
      blockDate: null,
      releaseDate: booking.appointmentDate,
    };
  }

  return fail("That action is not available.");
}
