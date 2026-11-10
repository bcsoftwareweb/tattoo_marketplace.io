"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import { MonthCalendar } from "@/components/calendar";
import { PLACEMENTS, SIZES } from "@/lib/constants";
import { readImageFile } from "@/lib/files";
import { formatTime, money } from "@/lib/format";
import { slotsFor } from "@/lib/mutations";
import { portfolioFor, servicesFor } from "@/lib/selectors";
import type { ReferenceImage } from "@/lib/types";
import { Button, Field, frame, Photo, SelectInput, TextInput, Area } from "@/components/ui";

export function RequestForm({ slug }: { slug: string }) {
  const { state, session, requestAppointment, toast } = useDemo();
  const router = useRouter();
  const artist = state.artists.find((item) => item.slug === slug);
  const services = artist ? servicesFor(state, artist.id) : [];
  const samples = artist ? portfolioFor(state, artist.id) : [];
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "custom");
  const [idea, setIdea] = useState("");
  const [placement, setPlacement] = useState<string>(PLACEMENTS[0]);
  const [size, setSize] = useState<string>(SIZES[1]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [budget, setBudget] = useState(String(artist?.startingPrice ?? 200));
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [month, setMonth] = useState("2026-11");
  const [error, setError] = useState("");
  const slots = artist && date ? slotsFor(state, artist.id, date) : [];

  if (!artist) return <div className={`${frame} py-16`}><h1 className="font-display text-4xl">Artist not found</h1></div>;
  if (!session || session.role !== "customer") {
    return (
      <div className={`${frame} max-w-2xl py-16`}>
        <h1 className="font-display text-4xl">Sign in to request {artist.name}</h1>
        <p className="mt-4 text-sm leading-6 text-mute">Appointment requests use the customer demo. The artist and administrator accounts cannot book a chair.</p>
        <div className="mt-6"><Button href={`/login?next=${encodeURIComponent(`/artists/${artist.slug}/request`)}`}>Customer sign in</Button></div>
      </div>
    );
  }
  if (artist.verificationStatus !== "approved") {
    return <div className={`${frame} py-16`}><h1 className="font-display text-4xl">{artist.name} is not booking</h1><p className="mt-3 text-sm text-mute">This profile is {artist.verificationStatus}.</p></div>;
  }

  async function addFile(file: File | undefined) {
    if (!file || references.length >= 4) return;
    try {
      const url = await readImageFile(file, 800);
      setReferences((current) => [...current, { id: `local-${current.length}-${file.name}`, name: file.name, url }]);
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Could not add that image.");
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = requestAppointment({
      customerId: session!.userId,
      artistId: artist!.id,
      serviceId: serviceId === "custom" ? null : serviceId,
      idea,
      placement,
      size,
      references,
      requestedDate: date,
      requestedTime: time,
      customerBudget: Number(budget),
    });
    if (result.error || !result.id) {
      setError(result.error ?? "Could not send the request.");
      return;
    }
    router.push(`/customer/bookings/detail?id=${result.id}`);
  }

  return (
    <form className={`${frame} grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]`} onSubmit={submit}>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-mute">{artist.studioName}</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Request {artist.name}</h1>
        <div className="mt-8 grid gap-4">
          <Field label="Service">
            <SelectInput value={serviceId} onChange={(event) => {
              setServiceId(event.target.value);
              const service = services.find((item) => item.id === event.target.value);
              if (service) setBudget(String(service.minPrice));
            }}>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name} · {money(service.minPrice)}–{money(service.maxPrice)}</option>)}
              <option value="custom">Custom quote</option>
            </SelectInput>
          </Field>
          <Field label="Tattoo idea" hint="At least a sentence. Placement and scale help the artist quote.">
            <Area required value={idea} onChange={(event) => setIdea(event.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Placement">
              <SelectInput value={placement} onChange={(event) => setPlacement(event.target.value)}>
                {PLACEMENTS.map((item) => <option key={item}>{item}</option>)}
              </SelectInput>
            </Field>
            <Field label="Size">
              <SelectInput value={size} onChange={(event) => setSize(event.target.value)}>
                {SIZES.map((item) => <option key={item}>{item}</option>)}
              </SelectInput>
            </Field>
          </div>
          <Field label="Budget">
            <TextInput inputMode="numeric" value={budget} onChange={(event) => setBudget(event.target.value)} />
          </Field>
          <fieldset>
            <legend className="text-sm font-medium">Reference images</legend>
            <div className="mt-3 flex min-w-0 gap-2 overflow-x-auto">
              {samples.map((item) => {
                const chosen = references.some((reference) => reference.url === item.image);
                return (
                  <button key={item.id} type="button" className={chosen ? "border border-ink" : "border border-transparent"} onClick={() => setReferences((current) => chosen ? current.filter((reference) => reference.url !== item.image) : [...current, { id: item.id, name: item.title, url: item.image }].slice(0, 4))}>
                    <Photo src={item.image} alt={item.title} className="h-24 w-20" />
                  </button>
                );
              })}
            </div>
            <label className="mt-3 inline-block text-sm">
              <span className="border border-line px-3 py-2">Upload a reference</span>
              <input className="sr-only" type="file" accept="image/*" onChange={(event) => void addFile(event.target.files?.[0])} />
            </label>
          </fieldset>
        </div>
      </div>
      <div className="grid gap-4">
        <MonthCalendar month={month} onMonth={setMonth} days={artist.availability} selected={date} onPick={(next) => { setDate(next); setTime(""); }} />
        <Field label="Time">
          <SelectInput value={time} onChange={(event) => setTime(event.target.value)} required>
            <option value="">Choose a time</option>
            {slots.map((slot) => <option key={slot} value={slot}>{formatTime(slot)}</option>)}
          </SelectInput>
        </Field>
        {!date ? <p className="text-sm text-mute">Choose an open day. Shaded days are blocked and booked days are already held.</p> : null}
        {error ? <p role="alert" className="text-sm">{error}</p> : null}
        <Button type="submit">Submit request</Button>
        <p className="text-xs leading-5 text-mute">Submitting creates a pending request. Nothing is charged.</p>
      </div>
    </form>
  );
}
