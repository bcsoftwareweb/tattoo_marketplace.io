# Booking deposits

## Purpose

A deposit lets a customer reserve an artist's time after both sides agree on the appointment terms. The artist sets the quote and deposit; the customer pays the deposit to confirm the booking.

## Customer and artist workflow

1. The customer browses artists and submits an appointment request with the tattoo idea, placement, size, reference images, budget, and preferred date and time.
2. The request appears as **Pending** for the artist.
3. The artist reviews the request and responds with a quote and deposit. The deposit must be greater than zero and cannot exceed the quote.
4. If the artist accepts at the customer's budget, the booking moves directly to **Awaiting deposit**. If the quote or appointment terms differ, the customer first reviews and accepts the artist's terms.
5. Once the booking is **Awaiting deposit**, the customer can open **Customer → My Bookings → Pending**, select the booking, and choose **Continue to checkout**. The artist can also send a deposit link from the booking details; the link appears in Messages.
6. The customer reviews the quote, deposit due, and remaining balance, then enters card details and submits checkout.
7. After a successful payment, the booking becomes **Confirmed**, the customer and artist are notified, and the agreed appointment time is reserved. Other available times that day remain bookable.
8. When the artist marks the confirmed appointment complete, the demo records the remaining balance as settled.

## Current demo behavior

This application is currently a frontend-only demo:

- The checkout form validates card details locally. It does not contact a payment processor or charge a card.
- Booking state and simulated transactions are stored in the browser; there is no server-side payment record.
- Confirming a deposit creates a simulated transaction and changes the booking status to **Confirmed**.
- Confirmed appointments reserve their scheduled time range, not the entire day. The selected service duration is saved with the request and determines the range, with a 90-minute minimum; custom quotes use the 90-minute minimum.
- Cancelled or refunded appointments release their time range. Older saved demo data is migrated from date-wide booking markers to appointment-level reservations.
- Marking an appointment complete records a simulated balance transaction. It does not charge the customer's card.
- An administrator can record a simulated refund for a booking with recorded payments. This does not issue a real card refund.

## Current commission calculation

The demo's seeded commission setting is **12%**, and an administrator can change the setting. The current implementation calculates commission on the **full quoted price**, then allocates part of that commission to the deposit and the rest to the balance. This is different from taking a percentage of only the deposit.

Example using a $420 quote, a $126 deposit, and a 12% commission:

| Item | Amount |
| --- | ---: |
| Deposit due now | $126.00 |
| Remaining balance | $294.00 |
| Commission on the full $420 quote | $50.40 |
| Commission allocated to deposit | $15.12 |
| Artist's deposit proceeds after commission | $110.88 |
| Commission allocated to balance | $35.28 |
| Artist's balance proceeds after commission | $258.72 |

Under the intended **deposit-only fee** model, the platform's gross fee in this example would instead be $15.12 (12% of $126). The artist would receive $110.88 from the deposit, and no additional platform commission would be taken from the $294 balance unless the business rule is changed to include it.

Card-processing fees, refunds, and chargebacks are separate from the platform commission and need a defined policy before real payments go live.

## Recommended live-payment flow

When real payments are introduced:

1. Store the agreed quote, deposit, fee rate, and currency in the server-side booking record.
2. Create the deposit payment on the server using the booking's stored deposit amount. Do not trust an amount supplied only by the browser.
3. Apply the platform's agreed fee rule to the deposit and route the artist's net proceeds through a marketplace payment setup such as Stripe Connect.
4. Confirm payment and update the booking from a verified payment-provider event, not only from a browser redirect.
5. Store provider payment IDs and statuses so refunds, disputes, reconciliation, and duplicate event handling can be managed reliably.

The platform should clearly disclose the deposit amount, what the deposit reserves, the artist's cancellation/refund policy, and whether the customer or artist bears processing fees. Stripe and Supabase are not currently integrated.

## Code map

- [Booking UI and checkout](src/components/booking-ui.tsx) — booking details, artist deposit-link action, customer checkout.
- [Booking state transitions](src/lib/booking.ts) — quote acceptance, customer confirmation, deposit confirmation, completion, and refund transitions.
- [Appointment availability](src/lib/availability.ts) — working-hour checks, service-duration windows, and overlap detection.
- [Money splits](src/lib/money.ts) — current commission calculations for deposit and balance.
- [Deposit-link mutation](src/lib/mutations.ts) — creates a message containing the booking's deposit link.
- [Booking and transaction types](src/lib/types.ts) — booking statuses, commission settings, and transaction records.
- [Demo data migration](src/lib/seed.ts) — snapshots service duration and migrates older date-wide booking states.
