"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useDemo } from "@/context/demo-context";
import type { BookingAction } from "@/lib/booking";
import { TIME_SLOTS } from "@/lib/constants";
import { formatDate, formatDateTime, formatTime, money } from "@/lib/format";
import { quoteSplit } from "@/lib/money";
import { bookingPath } from "@/lib/permissions";
import type { Booking, Role } from "@/lib/types";
import { Button, Empty, Field, PageHeader, Photo, SelectInput, StatusPill, TextInput, Area } from "@/components/ui";

export function BookingCards({ bookings, role, empty }: { bookings: Booking[]; role: Role; empty: string }) {
  const { state } = useDemo();
  if (!bookings.length) return <Empty title="Nothing here" body={empty} />;
  return (
    <ul className="border border-line bg-white">
      {bookings.map((booking) => {
        const artist = state.artists.find((item) => item.id === booking.artistId);
        const customer = state.customers.find((item) => item.id === booking.customerId);
        const who = role === "customer" ? artist?.name : role === "artist" ? customer?.name : `${customer?.name} · ${artist?.name}`;
        return (
          <li key={booking.id} className="border-b border-line last:border-b-0">
            <Link href={bookingPath(role, booking.id)} className="grid gap-3 px-4 py-4 transition-colors hover:bg-paper md:grid-cols-[1.4fr_1fr_auto] md:items-center">
              <span>
                <span className="block font-medium">{booking.serviceName}</span>
                <span className="mt-1 block text-sm text-mute">{who}</span>
              </span>
              <span className="text-sm text-mute">{formatDate(booking.appointmentDate)} · {formatTime(booking.appointmentTime)}</span>
              <StatusPill status={booking.status} role={role} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function BookingScreen({ role }: { role: Role }) {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const { state, session, act, toast } = useDemo();
  const booking = state.bookings.find((item) => item.id === id);
  if (!session || !booking) return <Empty title="Booking not found" body="That appointment is not on this account." />;
  const owns = (role === "customer" && booking.customerId === session.userId) || (role === "artist" && booking.artistId === session.userId) || role === "admin";
  if (!owns) return <Empty title="Outside this account" body="This account cannot open that booking." />;
  return <BookingBody role={role} booking={booking} onAct={(action) => { const error = act(booking.id, action); if (!error) toast("Booking updated."); }} />;
}

function BookingBody({ role, booking, onAct }: { role: Role; booking: Booking; onAct: (action: BookingAction) => void }) {
  const { state } = useDemo();
  const artist = state.artists.find((item) => item.id === booking.artistId);
  const customer = state.customers.find((item) => item.id === booking.customerId);
  const split = booking.quote && booking.deposit ? quoteSplit(booking.quote, booking.deposit, state.settings.commissionPercent) : null;
  const [quote, setQuote] = useState(String(booking.quote ?? booking.customerBudget));
  const [deposit, setDeposit] = useState(String(booking.deposit ?? Math.round(booking.customerBudget * 0.3)));
  const [note, setNote] = useState("");
  const [date, setDate] = useState(booking.proposedDate ?? booking.requestedDate);
  const [time, setTime] = useState(booking.proposedTime ?? booking.requestedTime);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const numbers = useMemo(() => ({ quote: Number(quote), deposit: Number(deposit) }), [quote, deposit]);

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Appointment"
        title={booking.serviceName}
        description={booking.idea}
        action={<StatusPill status={booking.status} role={role} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="grid gap-6">
          <div className="grid gap-4 border border-line bg-white p-5 md:grid-cols-2">
            <Info label="Customer" value={customer?.name ?? "Customer"} href={role === "admin" && customer ? `/admin/customers/detail?id=${customer.id}` : undefined} />
            <Info label="Artist" value={artist?.name ?? "Artist"} href={artist ? (role === "admin" ? `/admin/artists/detail?id=${artist.id}` : `/artists/${artist.slug}`) : undefined} />
            <Info label="Requested" value={`${formatDate(booking.requestedDate)} · ${formatTime(booking.requestedTime)}`} />
            <Info label="Appointment" value={`${formatDate(booking.appointmentDate)} · ${formatTime(booking.appointmentTime)}`} />
            <Info label="Placement" value={`${booking.placement} · ${booking.size}`} />
            <Info label="Customer budget" value={money(booking.customerBudget)} />
            {booking.proposedDate ? <Info label="Proposed time" value={`${formatDate(booking.proposedDate)} · ${formatTime(booking.proposedTime ?? booking.appointmentTime)}`} /> : null}
            {booking.artistNote ? <Info label="Artist note" value={booking.artistNote} /> : null}
          </div>
          {booking.references.length ? (
            <div>
              <h2 className="font-display text-2xl">Reference images</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {booking.references.map((image) => (
                  <figure key={image.id} className="border border-line bg-white">
                    <Photo src={image.url} alt={image.name} className="aspect-square w-full" />
                    <figcaption className="px-3 py-2 text-xs text-mute">{image.name}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <h2 className="font-display text-2xl">History</h2>
            <ol className="mt-4 border border-line bg-white">
              {booking.history.map((event, index) => (
                <li key={`${event.at}-${index}`} className="border-b border-line px-4 py-3 last:border-b-0">
                  <p className="text-sm font-medium">{statusLabelSafe(event.status)} · {event.actor}</p>
                  <p className="mt-1 text-sm text-mute">{event.note}</p>
                  <p className="mt-1 text-xs text-mute">{formatDateTime(event.at)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <aside className="grid h-fit gap-4 border border-line bg-white p-5">
          <h2 className="font-display text-2xl">Price</h2>
          {split ? (
            <dl className="grid gap-2 text-sm">
              <Row label="Quoted price" value={money(split.quote)} />
              <Row label="Deposit" value={money(split.deposit)} />
              <Row label="Remaining at the appointment" value={money(split.balance)} />
              <Row label={`Platform commission (${state.settings.commissionPercent}%)`} value={money(split.commission)} />
              <Row label="Artist net after commission" value={money(split.artistNet)} />
            </dl>
          ) : <p className="text-sm text-mute">The artist has not sent a quote yet. Budget on the request is {money(booking.customerBudget)}.</p>}
          {role === "customer" && booking.status === "awaiting_deposit" ? <Button href={`/checkout?booking=${booking.id}`}>Continue to checkout</Button> : null}
          {role === "artist" && (booking.status === "pending" || booking.status === "artist_proposed_changes") ? (
            <form className="grid gap-3" onSubmit={(event) => event.preventDefault()}>
              <Field label="Quote"><TextInput inputMode="numeric" value={quote} onChange={(event) => setQuote(event.target.value)} /></Field>
              <Field label="Deposit"><TextInput inputMode="numeric" value={deposit} onChange={(event) => setDeposit(event.target.value)} /></Field>
              <Field label="Note"><Area value={note} onChange={(event) => setNote(event.target.value)} /></Field>
              {booking.status === "pending" ? (
                <Button type="button" onClick={() => onAct({ type: "accept", quote: numbers.quote, deposit: numbers.deposit, note })}>Accept request</Button>
              ) : null}
              <Field label="Proposed date"><TextInput type="date" value={date} min="2026-11-10" onChange={(event) => setDate(event.target.value)} /></Field>
              <Field label="Proposed time">
                <SelectInput value={time} onChange={(event) => setTime(event.target.value)}>
                  {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{formatTime(slot)}</option>)}
                </SelectInput>
              </Field>
              <Button type="button" variant="secondary" onClick={() => onAct({ type: "propose", quote: numbers.quote, deposit: numbers.deposit, date, time, note })}>Propose changes</Button>
              <Button type="button" variant="ghost" onClick={() => onAct({ type: "decline", note })}>Decline request</Button>
            </form>
          ) : null}
          {role === "artist" && booking.status === "confirmed" ? <Button type="button" onClick={() => onAct({ type: "complete" })}>Mark completed</Button> : null}
          {role === "customer" && (booking.status === "artist_proposed_changes" || booking.status === "awaiting_customer_confirmation") ? (
            <div className="grid gap-2">
              <Button type="button" onClick={() => onAct({ type: "customer_accept" })}>Accept terms</Button>
              <Button type="button" variant="secondary" onClick={() => onAct({ type: "customer_decline", note: note || "Declined the proposed terms." })}>Decline terms</Button>
              <Field label="Optional note"><Area value={note} onChange={(event) => setNote(event.target.value)} /></Field>
            </div>
          ) : null}
          {role === "customer" && ["pending", "artist_proposed_changes", "awaiting_customer_confirmation", "awaiting_deposit", "confirmed"].includes(booking.status) ? (
            confirmCancel ? (
              <div className="grid gap-2">
                <Field label="Cancellation note"><Area value={note} onChange={(event) => setNote(event.target.value)} /></Field>
                <Button type="button" onClick={() => onAct({ type: "cancel", note })}>Confirm cancellation</Button>
              </div>
            ) : <Button type="button" variant="secondary" onClick={() => setConfirmCancel(true)}>Cancel appointment</Button>
          ) : null}
          {role === "customer" && (booking.status === "confirmed" || booking.status === "completed") ? (
            <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); onAct({ type: "dispute", note }); }}>
              <Field label="Dispute"><Area value={note} onChange={(event) => setNote(event.target.value)} placeholder="Describe what should be reviewed." /></Field>
              <Button type="submit" variant="secondary">Open dispute</Button>
            </form>
          ) : null}
          {role === "admin" && ["disputed", "confirmed", "completed"].includes(booking.status) ? (
            <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); onAct({ type: "refund", note }); }}>
              <Field label="Refund note"><Area required value={note} onChange={(event) => setNote(event.target.value)} /></Field>
              <Button type="submit">Record refund</Button>
            </form>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function statusLabelSafe(status: Booking["status"]) {
  return status.replaceAll("_", " ");
}

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <p>
      <span className="block text-xs uppercase tracking-[0.16em] text-mute">{label}</span>
      {href ? <Link href={href} className="mt-1 inline-block text-sm underline">{value}</Link> : <span className="mt-1 block text-sm">{value}</span>}
    </p>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-mute">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function CheckoutScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("booking") ?? "";
  const { state, session, act } = useDemo();
  const booking = state.bookings.find((item) => item.id === id);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: session?.name ?? "", number: "", expiry: "", cvc: "" });
  if (!session) return <Empty title="Sign in to check out" body="Sign in with the customer account that made this booking." action={<Button href={`/login?next=${encodeURIComponent(`/checkout?booking=${id}`)}`}>Sign in</Button>} />;
  if (session.role !== "customer") return <Empty title="Customers check out" body="Sign in with a customer account to pay a deposit." />;
  if (!booking || booking.customerId !== session.userId) return <Empty title="Booking not found" body="This checkout does not belong to the signed-in customer." />;
  if (booking.status !== "awaiting_deposit" || booking.quote == null || booking.deposit == null) {
    return <Empty title="Nothing to pay" body="This booking is not waiting on a deposit." action={<Button href={bookingPath("customer", booking.id)}>View booking</Button>} />;
  }
  const split = quoteSplit(booking.quote, booking.deposit, state.settings.commissionPercent);
  const artist = state.artists.find((item) => item.id === booking.artistId);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const digits = form.number.replace(/\s/g, "");
    if (form.name.trim().length < 2) return setError("Enter the name on the card.");
    if (!/^\d{16}$/.test(digits)) return setError("Enter a 16-digit card number.");
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) return setError("Enter an expiry as MM/YY.");
    if (!/^\d{3,4}$/.test(form.cvc)) return setError("Enter a 3 or 4 digit CVC.");
    const failure = act(booking!.id, { type: "pay_deposit" });
    if (failure) return setError(failure);
    router.push(`/checkout/confirmation?booking=${booking!.id}`);
  }

  return (
    <div className={`${"mx-auto grid max-w-5xl gap-8 px-5 py-12 md:grid-cols-2 md:px-8"}`}>
      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-mute">Checkout</p>
        <h1 className="mt-3 font-display text-4xl">Hold {formatDate(booking.appointmentDate)}</h1>
        <p className="mt-4 text-sm leading-6 text-mute">Paying the deposit confirms {booking.serviceName} with {artist?.name}.</p>
        <dl className="mt-8 grid gap-3 border border-line bg-white p-5 text-sm">
          <Row label="Tattoo price" value={money(split.quote)} />
          <Row label="Deposit due now" value={money(split.deposit)} />
          <Row label="Remaining balance" value={money(split.balance)} />
          <Row label="Platform commission, from the artist" value={money(split.commission)} />
        </dl>
      </section>
      <form className="grid gap-4 border border-line bg-white p-5" onSubmit={submit}>
        <Field label="Name on card"><TextInput value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" /></Field>
        <Field label="Card number"><TextInput inputMode="numeric" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} placeholder="4242 4242 4242 4242" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry"><TextInput value={form.expiry} onChange={(event) => setForm({ ...form, expiry: event.target.value })} placeholder="12/28" /></Field>
          <Field label="CVC"><TextInput value={form.cvc} onChange={(event) => setForm({ ...form, cvc: event.target.value })} placeholder="123" /></Field>
        </div>
        {error ? <p role="alert" className="text-sm">{error}</p> : null}
        <Button type="submit">Pay {money(split.deposit)} deposit</Button>
      </form>
    </div>
  );
}

export function ConfirmationScreen() {
  const params = useSearchParams();
  const id = params.get("booking") ?? "";
  const { state, session } = useDemo();
  const booking = state.bookings.find((item) => item.id === id);
  if (!booking) return <Empty title="No receipt" body="That payment could not be found." />;
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-mute">Receipt</p>
      <h1 className="mt-3 font-express text-5xl leading-none">Deposit paid.</h1>
      <p className="mt-6 text-sm leading-6 text-mute">
        {booking.status === "confirmed"
          ? `${booking.serviceName} is confirmed for ${formatDate(booking.appointmentDate)} at ${formatTime(booking.appointmentTime)}.`
          : "This booking is not in a paid state yet."}
      </p>
      {session?.role === "customer" ? <div className="mt-8"><Button href={bookingPath("customer", booking.id)}>View booking</Button></div> : null}
    </div>
  );
}
