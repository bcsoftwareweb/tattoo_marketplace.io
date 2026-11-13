"use client";

import { useDemo } from "@/context/demo-context";

export function CancellationPolicy() {
  const { state } = useDemo();
  return (
    <>
      <p className="mt-6 text-mute">{state.settings.cancellationPolicy}</p>
      <h2 className="mt-10 font-display text-2xl">Cancelling a booking</h2>
      <p className="mt-3 text-mute">Open the booking from your account and choose Cancel appointment. Add a short note so the artist knows why. Pending requests can be cancelled at any time before the artist confirms.</p>
      <h2 className="mt-10 font-display text-2xl">Deposits and refunds</h2>
      <p className="mt-3 text-mute">A deposit holds the artist&apos;s time and is credited toward the final price. Each artist sets their own rules for returning a deposit after a cancellation. If something went wrong with a confirmed or completed booking, open a dispute from the booking and an administrator will review it and can issue a refund.</p>
    </>
  );
}

export function ContactDetails() {
  const { state } = useDemo();
  const email = state.settings.supportEmail;
  return (
    <>
      <p className="mt-6 text-mute">Questions about a booking, a payment, or an artist on {state.settings.platformName}? Write to us and include the booking date and artist name if it is about an appointment.</p>
      <p className="mt-8">
        <a href={`mailto:${email}`} className="border-b border-white pb-0.5 text-white hover:border-mist hover:text-mist">{email}</a>
      </p>
      <p className="mt-8 text-mute">For anything about the tattoo itself, such as the design, placement, or scheduling, message the artist directly from their profile.</p>
    </>
  );
}
