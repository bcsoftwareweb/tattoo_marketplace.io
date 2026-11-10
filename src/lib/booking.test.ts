import { describe, expect, it } from "vitest";
import { transitionBooking } from "@/lib/booking";
import { balanceSplit, depositSplit } from "@/lib/money";
import { createSeed } from "@/lib/seed";
import { createBookingRequest, slotsFor } from "@/lib/mutations";
import { filterArtists } from "@/lib/filters";
import type { Actor, Booking, PlatformSettings } from "@/lib/types";

const settings: PlatformSettings = {
  commissionPercent: 12,
  bookingPolicy: "Hold the date after the simulated deposit.",
  cancellationPolicy: "Customers can cancel before the sitting.",
  platformName: "BLACKLINE",
  supportEmail: "hello@blackline.demo",
  tagline: "Index",
  city: "New York",
};

const artist: Actor = { role: "artist", userId: "nova-reyes" };
const customer: Actor = { role: "customer", userId: "maya-chen" };
const admin: Actor = { role: "admin", userId: "avery-quinn" };
const now = "2026-11-10T18:00:00Z";

function pending(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "bk-test",
    customerId: "maya-chen",
    artistId: "nova-reyes",
    serviceId: "svc-nova-reyes-small",
    serviceName: "Small piece",
    idea: "A four-inch olive branch on the inner forearm.",
    placement: "Forearm",
    size: "Small (2–4 in)",
    references: [],
    requestedDate: "2026-11-20",
    requestedTime: "14:00",
    appointmentDate: "2026-11-20",
    appointmentTime: "14:00",
    proposedDate: null,
    proposedTime: null,
    quote: null,
    deposit: null,
    customerBudget: 400,
    artistNote: "",
    status: "pending",
    history: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("booking transitions", () => {
  it("accepts an unchanged quote into the deposit step", () => {
    const result = transitionBooking(pending(), { type: "accept", quote: 400, deposit: 120, note: "" }, artist, settings, [], now);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.booking.status).toBe("awaiting_deposit");
  });

  it("asks the customer to confirm a revised quote", () => {
    const result = transitionBooking(pending(), { type: "accept", quote: 520, deposit: 160, note: "Needs more time." }, artist, settings, [], now);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.booking.status).toBe("awaiting_customer_confirmation");
  });

  it("rejects a deposit larger than the quote", () => {
    const result = transitionBooking(pending(), { type: "accept", quote: 200, deposit: 240, note: "" }, artist, settings, [], now);
    expect(result.ok).toBe(false);
  });

  it("walks propose, accept, pay, complete, and blocks the wrong role", () => {
    const proposed = transitionBooking(
      pending(),
      { type: "propose", quote: 480, deposit: 144, date: "2026-11-25", time: "14:00", note: "The 20th is full." },
      artist,
      settings,
      [],
      now,
    );
    expect(proposed.ok).toBe(true);
    if (!proposed.ok) return;
    expect(proposed.booking.status).toBe("artist_proposed_changes");

    const wrong = transitionBooking(proposed.booking, { type: "customer_accept" }, artist, settings, [], now);
    expect(wrong.ok).toBe(false);

    const accepted = transitionBooking(proposed.booking, { type: "customer_accept" }, customer, settings, [], now);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.booking.status).toBe("awaiting_deposit");
    expect(accepted.booking.appointmentDate).toBe("2026-11-25");

    const paid = transitionBooking(accepted.booking, { type: "pay_deposit" }, customer, settings, [], now);
    expect(paid.ok).toBe(true);
    if (!paid.ok) return;
    expect(paid.booking.status).toBe("confirmed");
    expect(paid.transactions[0]?.type).toBe("deposit");
    expect(paid.blockDate).toBe("2026-11-25");

    const done = transitionBooking(paid.booking, { type: "complete" }, artist, settings, paid.transactions.map((item, index) => ({ ...item, id: `tx-${index}` })), now);
    expect(done.ok).toBe(true);
    if (!done.ok) return;
    expect(done.booking.status).toBe("completed");
    expect(done.transactions[0]?.type).toBe("balance");
  });

  it("refunds only after money exists", () => {
    const confirmed = pending({ status: "confirmed", quote: 400, deposit: 120, history: [] });
    const early = transitionBooking(confirmed, { type: "refund", note: "Too soon." }, admin, settings, [], now);
    expect(early.ok).toBe(false);
    const deposit = depositSplit(400, 120, 12);
    const refunded = transitionBooking(
      confirmed,
      { type: "refund", note: "Demo refund." },
      admin,
      settings,
      [{ id: "tx", bookingId: "bk-test", customerId: "maya-chen", artistId: "nova-reyes", type: "deposit", amount: deposit.amount, commission: deposit.commission, artistNet: deposit.artistNet, createdAt: now, note: "deposit" }],
      now,
    );
    expect(refunded.ok).toBe(true);
    if (refunded.ok) {
      expect(refunded.booking.status).toBe("refunded");
      expect(refunded.transactions[0]?.amount).toBe(-deposit.amount);
    }
  });
});

describe("money", () => {
  it("splits commission so deposit and balance add up", () => {
    const deposit = depositSplit(420, 126, 12);
    const balance = balanceSplit(420, 126, 12);
    expect(deposit.commission + balance.commission).toBe(Math.round((420 * 12) / 100));
    expect(deposit.artistNet + balance.artistNet).toBe(420 - Math.round((420 * 12) / 100));
  });
});

describe("marketplace data", () => {
  it("filters public artists and hides unlisted applications", () => {
    const artists = createSeed().artists;
    expect(filterArtists(artists, { q: "harbor" }).map((artist) => artist.id)).toEqual(["leo-marino"]);
    expect(filterArtists(artists, { borough: "Queens" }).some((artist) => artist.id === "mina-park")).toBe(false);
    expect(filterArtists(artists, { borough: "Queens", includeUnlisted: true }).some((artist) => artist.id === "mina-park")).toBe(true);
    expect(filterArtists(artists, { price: "500-plus" }).map((artist) => artist.id)).toContain("julian-cho");
    expect(filterArtists(artists, { style: "fine-line" }).every((artist) => artist.verificationStatus === "approved")).toBe(true);
  });

  it("creates a pending request on an open slot", () => {
    const state = createSeed();
    const artistId = "sage-okonkwo";
    const date = state.artists.find((artist) => artist.id === artistId)?.availability.find((day) => day.date > "2026-11-10" && day.status === "open")?.date;
    expect(date).toBeTruthy();
    const time = slotsFor(state, artistId, date!)[0];
    expect(time).toBeTruthy();
    const result = createBookingRequest(
      state,
      {
        customerId: "maya-chen",
        artistId,
        serviceId: "svc-sage-okonkwo-small",
        idea: "A narrow geometric band that can be extended later.",
        placement: "Ankle",
        size: "Small (2–4 in)",
        references: [],
        requestedDate: date!,
        requestedTime: time,
        customerBudget: 220,
      },
      customer,
      now,
    );
    expect(result.error).toBeUndefined();
    expect(result.state.bookings[0]?.status).toBe("pending");
  });
});
