"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookingCards } from "@/components/booking-ui";
import { MonthCalendar } from "@/components/calendar";
import { useDemo } from "@/context/demo-context";
import { BOROUGHS, WEEKDAYS } from "@/lib/constants";
import { readImageFile } from "@/lib/files";
import { formatDate, formatDateTime, formatDuration, money, weekdayName } from "@/lib/format";
import { isOpenBooking, portfolioFor, servicesFor } from "@/lib/selectors";
import { adminStats, artistFinance } from "@/lib/selectors";
import { verificationLabel } from "@/lib/status";
import type { Artist, BookingStatus, Category, Customer, Service, TattooStyle } from "@/lib/types";
import { Button, Empty, Field, PageHeader, Photo, SelectInput, StatGrid, Tabs, TextInput, Area } from "@/components/ui";

function useSignedArtist() {
  const { state, session } = useDemo();
  return state.artists.find((artist) => artist.id === session?.userId) ?? null;
}

function useSignedCustomer() {
  const { state, session } = useDemo();
  return state.customers.find((customer) => customer.id === session?.userId) ?? null;
}

export function NotificationList() {
  const { state, session, readNotification, readAll } = useDemo();
  if (!session) return null;
  const items = state.notifications.filter((item) => item.userId === session.userId);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Inbox" title="Notifications" action={<Button type="button" variant="secondary" onClick={readAll}>Mark all read</Button>} />
      {items.length ? (
        <ul className="border border-line bg-white">
          {items.map((item) => (
            <li key={item.id} className="border-b border-line last:border-b-0">
              <Link href={item.href} onClick={() => readNotification(item.id)} className="block px-4 py-4 hover:bg-paper">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-mute">{item.read ? "Read" : "New"}</span>
                </span>
                <span className="mt-1 block text-sm text-mute">{item.body}</span>
                <span className="mt-2 block text-xs text-mute">{formatDateTime(item.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <Empty title="No notifications" body="Booking updates and messages will collect here." />}
    </div>
  );
}

export function CustomerOverview() {
  const { state, session } = useDemo();
  const customer = useSignedCustomer();
  if (!session || !customer) return null;
  const bookings = state.bookings.filter((booking) => booking.customerId === customer.id);
  const upcoming = bookings.filter((booking) => booking.status === "confirmed");
  const pending = bookings.filter((booking) => isOpenBooking(booking.status));
  const favorites = state.favorites[customer.id] ?? [];
  const threads = state.conversations.filter((item) => item.customerId === customer.id).slice(0, 3);
  const activity = state.activity.filter((item) => item.userId === customer.id).slice(0, 4);
  return (
    <div className="grid gap-8">
      <PageHeader eyebrow="Customer" title={`Hello, ${customer.name.split(" ")[0]}.`} description="Upcoming sittings, open requests, and the artists you saved." />
      <StatGrid items={[
        { label: "Upcoming", value: String(upcoming.length) },
        { label: "Open requests", value: String(pending.length) },
        { label: "Saved artists", value: String(favorites.length) },
        { label: "Conversations", value: String(threads.length) },
      ]} />
      <section>
        <h2 className="mb-3 font-display text-2xl">Upcoming</h2>
        <BookingCards bookings={upcoming} role="customer" empty="No confirmed appointments yet." />
      </section>
      <section>
        <h2 className="mb-3 font-display text-2xl">Pending requests</h2>
        <BookingCards bookings={pending} role="customer" empty="You have no open requests." />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-2xl">Recent conversations</h2>
          <ul className="border border-line bg-white">
            {threads.map((thread) => {
              const artist = state.artists.find((item) => item.id === thread.artistId);
              const last = thread.messages.at(-1);
              return <li key={thread.id} className="border-b border-line px-4 py-3 last:border-b-0"><Link href={`/customer/messages?thread=${thread.id}`} className="text-sm"><span className="font-medium">{artist?.name}</span><span className="mt-1 block text-mute">{last?.body}</span></Link></li>;
            })}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-display text-2xl">Favorites</h2>
          <ul className="grid gap-2">
            {favorites.map((id) => {
              const artist = state.artists.find((item) => item.id === id);
              return artist ? <li key={id}><Link className="block border border-line bg-white px-4 py-3 text-sm" href={`/artists/${artist.slug}`}>{artist.name}</Link></li> : null;
            })}
          </ul>
          <h2 className="mt-6 mb-3 font-display text-2xl">Activity</h2>
          <ul className="text-sm text-mute">{activity.map((item) => <li key={item.id} className="border-b border-line py-2">{item.text}</li>)}</ul>
        </div>
      </section>
    </div>
  );
}

export function CustomerBookings() {
  const customer = useSignedCustomer();
  const { state } = useDemo();
  const [tab, setTab] = useState("upcoming");
  if (!customer) return null;
  const mine = state.bookings.filter((booking) => booking.customerId === customer.id);
  const groups: Record<string, typeof mine> = {
    upcoming: mine.filter((booking) => booking.status === "confirmed"),
    pending: mine.filter((booking) => isOpenBooking(booking.status)),
    completed: mine.filter((booking) => booking.status === "completed"),
    closed: mine.filter((booking) => ["cancelled", "declined", "disputed", "refunded"].includes(booking.status)),
  };
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Customer" title="My bookings" description="Open a booking to accept a proposal, pay the deposit, or cancel." />
      <Tabs tabs={[{ id: "upcoming", label: "Upcoming" }, { id: "pending", label: "Pending" }, { id: "completed", label: "Completed" }, { id: "closed", label: "Closed" }]} value={tab} onChange={setTab} />
      <BookingCards key={tab} bookings={groups[tab] ?? []} role="customer" empty="Nothing in this tab." pageSize={3} />
    </div>
  );
}

export function CustomerFavorites() {
  const customer = useSignedCustomer();
  const { state, favorite } = useDemo();
  const [shown, setShown] = useState(3);
  if (!customer) return null;
  const ids = state.favorites[customer.id] ?? [];
  const artists = ids.map((id) => state.artists.find((artist) => artist.id === id)).filter(Boolean);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Customer" title="Saved artists" />
      {artists.length ? (
        <>
        <ul className="grid gap-3">
          {artists.slice(0, shown).map((artist) => artist ? (
            <li key={artist.id} className="flex items-center justify-between gap-3 border border-line bg-white p-3">
              <Link href={`/artists/${artist.slug}`} className="flex items-center gap-3">
                <Photo src={artist.photo} alt="" className="h-16 w-14" />
                <span><span className="block font-medium">{artist.name}</span><span className="text-sm text-mute">{artist.neighborhood}</span></span>
              </Link>
              <Button type="button" variant="secondary" onClick={() => favorite(artist.id)}>Remove</Button>
            </li>
          ) : null)}
        </ul>
        {shown < artists.length ? (
          <div>
            <Button type="button" variant="secondary" onClick={() => setShown((count) => count + 3)}>See More</Button>
          </div>
        ) : null}
        </>
      ) : <Empty title="No saved artists" body="Save an artist from their profile." action={<Button href="/artists">Browse artists</Button>} />}
    </div>
  );
}

export function CustomerProfile() {
  const customer = useSignedCustomer();
  const { saveCustomer, logout, resetDemo, toast } = useDemo();
  const [form, setForm] = useState<Customer | null>(customer);
  useEffect(() => setForm(customer), [customer]);
  if (!form || !customer) return null;
  return (
    <form className="grid max-w-2xl gap-4" onSubmit={(event) => { event.preventDefault(); saveCustomer(form); }}>
      <PageHeader eyebrow="Customer" title="Profile and settings" description={customer.email} />
      <Photo src={form.photo} alt="" className="h-28 w-28" />
      <label className="text-sm">Replace photo<input className="mt-2 block text-sm" type="file" accept="image/*" onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try { setForm({ ...form, photo: await readImageFile(file, 640) }); }
        catch (reason) { toast(reason instanceof Error ? reason.message : "Could not read that image."); }
      }} /></label>
      <Field label="Name"><TextInput value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
      <Field label="Phone"><TextInput value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
      <Field label="Borough"><SelectInput value={form.borough} onChange={(event) => setForm({ ...form, borough: event.target.value })}>{BOROUGHS.map((item) => <option key={item}>{item}</option>)}</SelectInput></Field>
      <Field label="Neighborhood"><TextInput value={form.neighborhood} onChange={(event) => setForm({ ...form, neighborhood: event.target.value })} /></Field>
      <Field label="About"><Area value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></Field>
      <p className="text-xs text-mute">Email cannot be changed here so sign-in keeps working.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="secondary" onClick={resetDemo}>Reset demo data</Button>
        <Button type="button" variant="ghost" onClick={logout}>Log out</Button>
      </div>
    </form>
  );
}

export function ArtistOverview() {
  const artist = useSignedArtist();
  const { state } = useDemo();
  if (!artist) return null;
  const bookings = state.bookings.filter((booking) => booking.artistId === artist.id);
  const finance = artistFinance(state, artist.id);
  const threads = state.conversations.filter((item) => item.artistId === artist.id).slice(0, 3);
  const activity = state.activity.filter((item) => item.userId === artist.id).slice(0, 4);
  return (
    <div className="grid gap-8">
      {artist.verificationStatus !== "approved" ? <p className="border border-line bg-white px-4 py-3 text-sm">Public status: {verificationLabel(artist.verificationStatus)}. {artist.verificationNote}</p> : null}
      <PageHeader eyebrow="Artist" title={artist.studioName} description="Bookings, earnings, and the conversations waiting on you." />
      <StatGrid items={[
        { label: "Total bookings", value: String(bookings.length) },
        { label: "Upcoming", value: String(bookings.filter((item) => item.status === "confirmed").length) },
        { label: "Open requests", value: String(bookings.filter((item) => isOpenBooking(item.status)).length) },
        { label: "Completed", value: String(bookings.filter((item) => item.status === "completed").length) },
        { label: "November net", value: money(finance.monthNet), note: "November 2026." },
      ]} />
      <section>
        <h2 className="mb-3 font-display text-2xl">Needs a response</h2>
        <BookingCards bookings={bookings.filter((item) => item.status === "pending")} role="artist" empty="No new requests." />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-2xl">Recent conversations</h2>
          <ul className="border border-line bg-white">
            {threads.map((thread) => {
              const customer = state.customers.find((item) => item.id === thread.customerId);
              return <li key={thread.id} className="border-b border-line px-4 py-3 text-sm last:border-b-0"><Link href={`/artist/messages?thread=${thread.id}`}><span className="font-medium">{customer?.name}</span><span className="mt-1 block text-mute">{thread.messages.at(-1)?.body}</span></Link></li>;
            })}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-display text-2xl">Activity</h2>
          <ul className="text-sm text-mute">{activity.map((item) => <li key={item.id} className="border-b border-line py-2">{item.text}</li>)}</ul>
        </div>
      </section>
    </div>
  );
}

export function ArtistProfileEditor() {
  const artist = useSignedArtist();
  const { state, updateArtist, toast } = useDemo();
  const [form, setForm] = useState<Artist | null>(artist);
  const [specialty, setSpecialty] = useState("");
  useEffect(() => setForm(artist), [artist]);
  if (!form) return null;
  return (
    <form className="grid max-w-3xl gap-4" onSubmit={(event) => { event.preventDefault(); updateArtist(form); }}>
      <PageHeader eyebrow="Artist" title="Profile" description="Changes show on your public page." />
      <Photo src={form.photo} alt="" className="h-32 w-28" />
      <label className="text-sm">Profile photo<input className="mt-2 block" type="file" accept="image/*" onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try { setForm({ ...form, photo: await readImageFile(file, 800) }); } catch (reason) { toast(reason instanceof Error ? reason.message : "Could not read that image."); }
      }} /></label>
      <Field label="Name"><TextInput value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
      <Field label="Biography"><Area value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Borough"><SelectInput value={form.borough} onChange={(event) => setForm({ ...form, borough: event.target.value })}>{BOROUGHS.map((item) => <option key={item}>{item}</option>)}</SelectInput></Field>
        <Field label="Neighborhood"><TextInput value={form.neighborhood} onChange={(event) => setForm({ ...form, neighborhood: event.target.value })} /></Field>
        <Field label="Studio"><TextInput value={form.studioName} onChange={(event) => setForm({ ...form, studioName: event.target.value })} /></Field>
        <Field label="Phone"><TextInput value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
      </div>
      <Field label="Studio address"><TextInput value={form.studioAddress} onChange={(event) => setForm({ ...form, studioAddress: event.target.value })} /></Field>
      <Field label="Years of experience"><TextInput inputMode="numeric" value={form.yearsExperience} onChange={(event) => setForm({ ...form, yearsExperience: Number(event.target.value) })} /></Field>
      <fieldset>
        <legend className="text-sm font-medium">Styles</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {state.styles.map((style) => (
            <label key={style.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.styleIds.includes(style.id)} onChange={() => setForm({ ...form, styleIds: form.styleIds.includes(style.id) ? form.styleIds.filter((id) => id !== style.id) : [...form.styleIds, style.id] })} />
              {style.name}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Add a specialty">
        <div className="flex gap-2">
          <TextInput value={specialty} onChange={(event) => setSpecialty(event.target.value)} />
          <Button type="button" variant="secondary" onClick={() => { if (!specialty.trim()) return; setForm({ ...form, specialties: [...form.specialties, specialty.trim()] }); setSpecialty(""); }}>Add</Button>
        </div>
      </Field>
      <ul className="flex flex-wrap gap-2">{form.specialties.map((item) => <li key={item}><button type="button" className="border border-line px-2 py-1 text-sm" onClick={() => setForm({ ...form, specialties: form.specialties.filter((entry) => entry !== item) })}>{item} ×</button></li>)}</ul>
      <Button type="submit">Save profile</Button>
    </form>
  );
}

export function ArtistPortfolio() {
  const artist = useSignedArtist();
  const { state, addPortfolioItem, editPortfolio, removePortfolio, toast } = useDemo();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(state.categories[0]?.name ?? "");
  const [styleId, setStyleId] = useState(artist?.styleIds[0] ?? state.styles[0]?.id ?? "");
  const [image, setImage] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  if (!artist) return null;
  const items = portfolioFor(state, artist.id);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Artist" title="Portfolio" description="Add, edit, and remove the pieces on your public page." />
      <form className="grid gap-3 border border-line bg-white p-4 md:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        const error = addPortfolioItem({ title, description, category, styleId, image });
        if (!error) { setTitle(""); setDescription(""); setImage(""); }
      }}>
        <Field label="Title"><TextInput value={title} onChange={(event) => setTitle(event.target.value)} required /></Field>
        <Field label="Category"><SelectInput value={category} onChange={(event) => setCategory(event.target.value)}>{state.categories.map((item) => <option key={item.id}>{item.name}</option>)}</SelectInput></Field>
        <Field label="Style"><SelectInput value={styleId} onChange={(event) => setStyleId(event.target.value)}>{state.styles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectInput></Field>
        <label className="text-sm">Image<input className="mt-2 block" type="file" accept="image/*" required={!image} onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          try { setImage(await readImageFile(file, 900)); } catch (reason) { toast(reason instanceof Error ? reason.message : "Could not read that image."); }
        }} /></label>
        <div className="md:col-span-2"><Field label="Description"><Area value={description} onChange={(event) => setDescription(event.target.value)} required /></Field></div>
        {image ? <Photo src={image} alt="Preview" className="h-32 w-24" /> : null}
        <div className="md:col-span-2"><Button type="submit">Add piece</Button></div>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="border border-line bg-white">
            <Photo src={item.image} alt={item.title} className="aspect-[4/5] w-full" />
            <div className="p-3">
              <h2 className="font-medium">{item.title}</h2>
              <p className="mt-1 text-xs text-mute">{item.category}</p>
              {editing === item.id ? (
                <div className="mt-2 grid gap-2">
                  <Area value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
                  <Button type="button" onClick={() => { editPortfolio(item.id, { description: editDescription }); setEditing(null); }}>Save description</Button>
                </div>
              ) : <p className="mt-2 text-sm text-mute">{item.description}</p>}
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => { setEditing(item.id); setEditDescription(item.description); }}>Edit</Button>
                <Button type="button" variant="ghost" onClick={() => removePortfolio(item.id)}>Delete</Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const blankService = (styleId: string): Omit<Service, "id" | "artistId"> => ({
  name: "",
  description: "",
  styleIds: styleId ? [styleId] : [],
  minPrice: 150,
  maxPrice: 400,
  durationMinutes: 120,
  customDesign: true,
});

export function ArtistServices() {
  const artist = useSignedArtist();
  const { state, addArtistService, editService, removeService } = useDemo();
  const [draft, setDraft] = useState(blankService(artist?.styleIds[0] ?? ""));
  const [editing, setEditing] = useState<Service | null>(null);
  if (!artist) return null;
  const services = servicesFor(state, artist.id);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Artist" title="Services and pricing" description="Starting price on your public card follows the lowest non-consult minimum." />
      <form className="grid gap-3 border border-line bg-white p-4" onSubmit={(event) => { event.preventDefault(); if (!addArtistService(draft)) setDraft(blankService(artist.styleIds[0] ?? "")); }}>
        <ServiceFields value={draft} styles={state.styles} onChange={setDraft} />
        <Button type="submit">Create service</Button>
      </form>
      <ul className="grid gap-3">
        {services.map((service) => (
          <li key={service.id} className="border border-line bg-white p-4">
            {editing?.id === service.id ? (
              <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); if (!editService(service.id, editing)) setEditing(null); }}>
                <ServiceFields value={editing} styles={state.styles} onChange={(next) => setEditing({ ...editing, ...next })} />
                <Button type="submit">Save service</Button>
              </form>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">{service.name}</h2>
                  <p className="mt-1 text-sm text-mute">{service.description}</p>
                  <p className="mt-2 text-sm">{money(service.minPrice)}–{money(service.maxPrice)} · {formatDuration(service.durationMinutes)}{service.customDesign ? " · Custom drawing" : ""}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setEditing(service)}>Edit</Button>
                  <Button type="button" variant="ghost" onClick={() => removeService(service.id)}>Delete</Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ServiceFields({ value, onChange, styles }: { value: Omit<Service, "id" | "artistId">; onChange: (value: Omit<Service, "id" | "artistId">) => void; styles: TattooStyle[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Name"><TextInput value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} required /></Field>
      <Field label="Duration (minutes)"><TextInput inputMode="numeric" value={value.durationMinutes} onChange={(event) => onChange({ ...value, durationMinutes: Number(event.target.value) })} /></Field>
      <Field label="Minimum price"><TextInput inputMode="numeric" value={value.minPrice} onChange={(event) => onChange({ ...value, minPrice: Number(event.target.value) })} /></Field>
      <Field label="Maximum price"><TextInput inputMode="numeric" value={value.maxPrice} onChange={(event) => onChange({ ...value, maxPrice: Number(event.target.value) })} /></Field>
      <div className="md:col-span-2"><Field label="Description"><Area value={value.description} onChange={(event) => onChange({ ...value, description: event.target.value })} /></Field></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.customDesign} onChange={(event) => onChange({ ...value, customDesign: event.target.checked })} /> Custom drawing available</label>
      <div className="md:col-span-2 flex flex-wrap gap-3">
        {styles.map((style) => (
          <label key={style.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={value.styleIds.includes(style.id)} onChange={() => onChange({ ...value, styleIds: value.styleIds.includes(style.id) ? value.styleIds.filter((id) => id !== style.id) : [...value.styleIds, style.id] })} />
            {style.name}
          </label>
        ))}
      </div>
    </div>
  );
}

export function ArtistCalendar() {
  const artist = useSignedArtist();
  const { state, toggleDay, saveHours } = useDemo();
  const [month, setMonth] = useState("2026-11");
  const [selected, setSelected] = useState("2026-11-18");
  const [hours, setHours] = useState(artist?.workingHours ?? []);
  useEffect(() => { if (artist) setHours(artist.workingHours); }, [artist]);
  if (!artist) return null;
  const dayBookings = state.bookings.filter((booking) => booking.artistId === artist.id && (booking.appointmentDate === selected || booking.requestedDate === selected));
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Artist" title="Availability" description="Open days can be requested. Confirmed appointments lock the day. Block a day to take it off the public calendar." />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <MonthCalendar month={month} onMonth={setMonth} days={artist.availability} selected={selected} onPick={(date) => { setSelected(date); const status = artist.availability.find((day) => day.date === date)?.status; if (date >= "2026-11-10" && status !== "booked") toggleDay(date); }} />
        <div>
          <h2 className="font-display text-2xl">{formatDate(selected)}</h2>
          <BookingCards bookings={dayBookings} role="artist" empty="No appointments on this day." />
          <form className="mt-6 grid gap-2" onSubmit={(event) => { event.preventDefault(); saveHours(hours); }}>
            <h2 className="font-display text-2xl">Working hours</h2>
            {hours.map((day, index) => (
              <div key={WEEKDAYS[day.day]} className="grid grid-cols-1 gap-2 border-b border-line py-3 text-sm last:border-b-0 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:border-0 sm:py-1">
                <span>{weekdayName(day.day)}</span>
                <input aria-label={`${weekdayName(day.day)} opens`} type="time" value={day.open} disabled={day.closed} className="w-full min-w-0" onChange={(event) => setHours(hours.map((item, itemIndex) => itemIndex === index ? { ...item, open: event.target.value } : item))} />
                <input aria-label={`${weekdayName(day.day)} closes`} type="time" value={day.close} disabled={day.closed} className="w-full min-w-0" onChange={(event) => setHours(hours.map((item, itemIndex) => itemIndex === index ? { ...item, close: event.target.value } : item))} />
                <label className="flex items-center gap-1"><input type="checkbox" checked={day.closed} onChange={(event) => setHours(hours.map((item, itemIndex) => itemIndex === index ? { ...item, closed: event.target.checked } : item))} /> Closed</label>
              </div>
            ))}
            <Button type="submit">Save hours</Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ArtistBookings() {
  const artist = useSignedArtist();
  const { state } = useDemo();
  const [tab, setTab] = useState("requests");
  if (!artist) return null;
  const mine = state.bookings.filter((booking) => booking.artistId === artist.id);
  const groups: Record<string, typeof mine> = {
    requests: mine.filter((booking) => isOpenBooking(booking.status)),
    upcoming: mine.filter((booking) => booking.status === "confirmed"),
    completed: mine.filter((booking) => booking.status === "completed"),
    closed: mine.filter((booking) => ["declined", "cancelled", "disputed", "refunded"].includes(booking.status)),
  };
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Artist" title="Bookings" description="Accept, propose a new time, or mark a confirmed sitting complete." />
      <Tabs tabs={[{ id: "requests", label: "Requests" }, { id: "upcoming", label: "Upcoming" }, { id: "completed", label: "Completed" }, { id: "closed", label: "Closed" }]} value={tab} onChange={setTab} />
      <BookingCards bookings={groups[tab] ?? []} role="artist" empty="Nothing in this tab." />
    </div>
  );
}

export function ArtistEarnings() {
  const artist = useSignedArtist();
  const { state } = useDemo();
  if (!artist) return null;
  const finance = artistFinance(state, artist.id);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Artist" title="Earnings" description="The platform commission is deducted from the artist side of each payment." />
      <StatGrid items={[
        { label: "Recorded artist net", value: money(finance.net), note: "Deposits, balances, and refunds." },
        { label: "Commission deducted", value: money(finance.commission) },
        { label: "Unsettled balances", value: money(finance.unsettled), note: "Confirmed sittings not yet completed." },
        { label: "November net", value: money(finance.monthNet) },
      ]} />
      <TransactionTable rows={finance.transactions} />
    </div>
  );
}

function TransactionTable({ rows }: { rows: ReturnType<typeof artistFinance>["transactions"] }) {
  const { state } = useDemo();
  if (!rows.length) return <Empty title="No transactions" body="Payments will show up here." />;
  return (
    <div className="overflow-x-auto border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-[0.14em] text-mute">
          <tr><th className="px-3 py-3">When</th><th>Type</th><th>Booking</th><th>Amount</th><th>Commission</th><th>Artist net</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line">
              <td className="px-3 py-3">{formatDate(row.createdAt)}</td>
              <td>{row.type}</td>
              <td>{state.bookings.find((booking) => booking.id === row.bookingId)?.serviceName}</td>
              <td>{money(row.amount)}</td>
              <td>{money(row.commission)}</td>
              <td>{money(row.artistNet)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminOverview() {
  const { state } = useDemo();
  const stats = adminStats(state);
  const activity = state.activity.filter((item) => item.role === "admin").slice(0, 5);
  return (
    <div className="grid gap-8">
      <PageHeader eyebrow="Administrator" title="Marketplace" description="Totals across artists, customers, bookings, and payments." />
      <StatGrid items={[
        { label: "Customers", value: String(stats.customers) },
        { label: "Artists", value: String(stats.artists) },
        { label: "Pending applications", value: String(stats.pendingArtists) },
        { label: "Approved artists", value: String(stats.approvedArtists) },
        { label: "Suspended", value: String(stats.suspendedArtists) },
        { label: "Bookings", value: String(stats.bookings) },
        { label: "Completed", value: String(stats.completed) },
        { label: "Transaction volume", value: money(stats.volume) },
        { label: "Commission", value: money(stats.commission) },
      ]} />
      <section>
        <h2 className="mb-3 font-display text-2xl">Recent admin activity</h2>
        <ul className="text-sm">{activity.map((item) => <li key={item.id} className="border-b border-line py-2">{item.text}</li>)}</ul>
      </section>
    </div>
  );
}

export function AdminArtists() {
  const { state } = useDemo();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const artists = state.artists.filter((artist) => {
    const matches = !q || `${artist.name} ${artist.studioName} ${artist.borough}`.toLowerCase().includes(q.toLowerCase());
    return matches && (status === "all" || artist.verificationStatus === status);
  });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Administrator" title="Artists" />
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <TextInput value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search artists" aria-label="Search artists" />
        <SelectInput aria-label="Verification" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </SelectInput>
      </div>
      <ul className="border border-line bg-white">
        {artists.map((artist) => (
          <li key={artist.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
            <span><span className="block font-medium">{artist.name}</span><span className="text-sm text-mute">{artist.studioName} · {verificationLabel(artist.verificationStatus)}</span></span>
            <Button href={`/admin/artists/detail?id=${artist.id}`} variant="secondary">Review</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminArtistDetail() {
  const params = useSearchParams();
  const { state, verifyArtist, featureArtist } = useDemo();
  const artist = state.artists.find((item) => item.id === params.get("id"));
  const [note, setNote] = useState(artist?.verificationNote ?? "");
  useEffect(() => setNote(artist?.verificationNote ?? ""), [artist]);
  if (!artist) return <Empty title="Artist not found" body="That application could not be found." />;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="License review" title={artist.name} description={artist.verificationNote} action={<Button href={`/artists/${artist.slug}`} variant="secondary">Public profile</Button>} />
      <dl className="grid gap-3 border border-line bg-white p-5 text-sm md:grid-cols-2">
        <div><dt className="text-mute">Status</dt><dd>{verificationLabel(artist.verificationStatus)}</dd></div>
        <div><dt className="text-mute">License</dt><dd>{artist.license.licenseNumber}</dd></div>
        <div><dt className="text-mute">Type</dt><dd>{artist.license.licenseType}</dd></div>
        <div><dt className="text-mute">Issued by</dt><dd>{artist.license.issuedBy}</dd></div>
        <div><dt className="text-mute">Expires</dt><dd>{formatDate(artist.license.expiresOn)}</dd></div>
        <div><dt className="text-mute">Bloodborne training</dt><dd>{formatDate(artist.license.bloodbornePathogenDate)}</dd></div>
        <div><dt className="text-mute">Studio permit</dt><dd>{artist.license.studioPermit}</dd></div>
        <div><dt className="text-mute">Studio</dt><dd>{artist.studioAddress}</dd></div>
      </dl>
      <p className="text-sm">{artist.license.notes}</p>
      <section className="grid gap-3 border border-line bg-white p-5 text-sm">
        <h2 className="font-medium">License photo</h2>
        {artist.license.document ? (
          <>
            <Photo src={artist.license.document} alt={`${artist.name} license`} className="block max-h-[32rem] w-auto max-w-full" />
            <p className="text-mute">Compare the number, name, and expiration on the photo with the details above.</p>
          </>
        ) : (
          <p className="text-mute">No license photo was uploaded with this application.</p>
        )}
      </section>
      <Field label="Review note"><Area value={note} onChange={(event) => setNote(event.target.value)} /></Field>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => verifyArtist(artist.id, "approved", note)}>Approve</Button>
        <Button type="button" variant="secondary" onClick={() => verifyArtist(artist.id, "rejected", note)}>Reject</Button>
        <Button type="button" variant="secondary" onClick={() => verifyArtist(artist.id, "suspended", note)}>Suspend</Button>
        <Button type="button" variant="ghost" onClick={() => featureArtist(artist.id)}>{artist.featured ? "Unfeature" : "Feature"}</Button>
      </div>
    </div>
  );
}

export function AdminCustomers() {
  const { state } = useDemo();
  const [q, setQ] = useState("");
  const customers = state.customers.filter((customer) => `${customer.name} ${customer.email} ${customer.neighborhood}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Administrator" title="Customers" />
      <TextInput value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search customers" aria-label="Search customers" />
      <ul className="border border-line bg-white">
        {customers.map((customer) => (
          <li key={customer.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
            <span><span className="block font-medium">{customer.name}</span><span className="text-sm text-mute">{customer.email} · {customer.status}</span></span>
            <Button href={`/admin/customers/detail?id=${customer.id}`} variant="secondary">Open</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminCustomerDetail() {
  const params = useSearchParams();
  const { state, setCustomerAccess } = useDemo();
  const customer = state.customers.find((item) => item.id === params.get("id"));
  if (!customer) return <Empty title="Customer not found" body="That account could not be found." />;
  const bookings = state.bookings.filter((booking) => booking.customerId === customer.id);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Customer" title={customer.name} description={`${customer.email} · ${customer.neighborhood}, ${customer.borough}`} />
      <Photo src={customer.photo} alt="" className="h-28 w-28" />
      <p className="max-w-2xl text-sm leading-6">{customer.bio}</p>
      <p className="text-sm">Status: {customer.status} · Phone {customer.phone}</p>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => setCustomerAccess(customer.id, "suspended")}>Suspend</Button>
        <Button type="button" onClick={() => setCustomerAccess(customer.id, "active")}>Reactivate</Button>
      </div>
      <BookingCards bookings={bookings} role="admin" empty="No bookings for this customer." />
    </div>
  );
}

export function AdminBookings() {
  const { state } = useDemo();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const bookings = state.bookings.filter((booking) => {
    const artist = state.artists.find((item) => item.id === booking.artistId);
    const customer = state.customers.find((item) => item.id === booking.customerId);
    const haystack = `${booking.serviceName} ${artist?.name ?? ""} ${customer?.name ?? ""}`.toLowerCase();
    return haystack.includes(q.toLowerCase()) && (status === "all" || booking.status === status);
  });
  const statuses: Array<BookingStatus | "all"> = ["all", "pending", "artist_proposed_changes", "awaiting_customer_confirmation", "awaiting_deposit", "confirmed", "completed", "declined", "cancelled", "disputed", "refunded"];
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Administrator" title="Bookings" description="Review history. Status changes still follow the booking rules." />
      <div className="grid gap-3 md:grid-cols-[1fr_260px]">
        <TextInput value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search bookings" aria-label="Search bookings" />
        <SelectInput aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          {statuses.map((item) => <option key={item} value={item}>{item === "all" ? "All statuses" : item.replaceAll("_", " ")}</option>)}
        </SelectInput>
      </div>
      <BookingCards bookings={bookings} role="admin" empty="No bookings match." />
    </div>
  );
}

export function AdminFinance() {
  const { state } = useDemo();
  const stats = adminStats(state);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Administrator" title="Finance" description="Transaction volume, commission, artist net, and refunds from every recorded payment." />
      <StatGrid items={[
        { label: "Volume", value: money(stats.volume) },
        { label: "Commission revenue", value: money(stats.commission) },
        { label: "Artist earnings", value: money(stats.artistNet) },
        { label: "Refunds", value: money(stats.refunds) },
      ]} />
      <TransactionTable rows={state.transactions} />
    </div>
  );
}

export function AdminMarketplace() {
  const { state, editStyle, removeStyle, editCategory, removeCategory, featureArtist, moderateReview, resolveReport } = useDemo();
  const [style, setStyle] = useState<TattooStyle>({ id: "", name: "", slug: "", description: "", image: state.styles[0]?.image ?? "" });
  const [category, setCategory] = useState<Category>({ id: "", name: "", description: "" });
  return (
    <div className="grid gap-10">
      <PageHeader eyebrow="Administrator" title="Marketplace" description="Styles, categories, featured artists, reports, and reviews." />
      <section className="grid gap-3">
        <h2 className="font-display text-2xl">Styles</h2>
        <form className="grid gap-3 border border-line bg-white p-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); if (!editStyle(style)) setStyle({ id: "", name: "", slug: "", description: "", image: state.styles[0]?.image ?? "" }); }}>
          <Field label="Name"><TextInput value={style.name} onChange={(event) => setStyle({ ...style, name: event.target.value })} /></Field>
          <Field label="Description"><TextInput value={style.description} onChange={(event) => setStyle({ ...style, description: event.target.value })} /></Field>
          <Button type="submit">Save style</Button>
        </form>
        <ul className="text-sm">{state.styles.map((item) => <li key={item.id} className="flex items-center justify-between border-b border-line py-2"><span>{item.name}</span><button type="button" className="text-mute" onClick={() => removeStyle(item.id)}>Delete</button></li>)}</ul>
      </section>
      <section className="grid gap-3">
        <h2 className="font-display text-2xl">Categories</h2>
        <form className="grid gap-3 border border-line bg-white p-4" onSubmit={(event) => { event.preventDefault(); if (!editCategory(category)) setCategory({ id: "", name: "", description: "" }); }}>
          <Field label="Name"><TextInput value={category.name} onChange={(event) => setCategory({ ...category, name: event.target.value })} /></Field>
          <Field label="Description"><TextInput value={category.description} onChange={(event) => setCategory({ ...category, description: event.target.value })} /></Field>
          <Button type="submit">Save category</Button>
        </form>
        <ul className="text-sm">{state.categories.map((item) => <li key={item.id} className="flex justify-between border-b border-line py-2"><span>{item.name}</span><button type="button" className="text-mute" onClick={() => removeCategory(item.id)}>Delete</button></li>)}</ul>
      </section>
      <section>
        <h2 className="font-display text-2xl">Featured artists</h2>
        <ul className="mt-3 border border-line bg-white">
          {state.artists.filter((artist) => artist.verificationStatus === "approved").map((artist) => (
            <li key={artist.id} className="flex items-center justify-between border-b border-line px-4 py-3 text-sm last:border-b-0">
              <span>{artist.name}</span>
              <Button type="button" variant="secondary" onClick={() => featureArtist(artist.id)}>{artist.featured ? "Featured" : "Feature"}</Button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-2xl">Reports</h2>
        <ul className="mt-3 grid gap-3">
          {state.reports.map((report) => (
            <li key={report.id} className="border border-line bg-white p-4 text-sm">
              <p className="font-medium">{report.targetLabel}</p>
              <p className="mt-1 text-mute">{report.reason}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em]">{report.status}</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => resolveReport(report.id, "reviewed")}>Mark reviewed</Button>
                <Button type="button" variant="ghost" onClick={() => resolveReport(report.id, "dismissed")}>Dismiss</Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-2xl">Reviews</h2>
        <ul className="mt-3 grid gap-3">
          {state.reviews.map((review) => (
            <li key={review.id} className="border border-line bg-white p-4 text-sm">
              <p className="font-medium">{review.title} · {review.status}</p>
              <p className="mt-1 text-mute">{review.body}</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => moderateReview(review.id, "published")}>Publish</Button>
                <Button type="button" variant="secondary" onClick={() => moderateReview(review.id, "flagged")}>Flag</Button>
                <Button type="button" variant="ghost" onClick={() => moderateReview(review.id, "removed")}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function AdminSettings() {
  const { state, savePlatform, resetDemo } = useDemo();
  const [form, setForm] = useState(state.settings);
  useEffect(() => setForm(state.settings), [state.settings]);
  return (
    <form className="grid max-w-2xl gap-4" onSubmit={(event) => { event.preventDefault(); savePlatform(form); }}>
      <PageHeader eyebrow="Administrator" title="Platform settings" description="Commission applies to new payments. Existing payments stay as recorded." />
      <Field label="Platform name"><TextInput value={form.platformName} onChange={(event) => setForm({ ...form, platformName: event.target.value })} /></Field>
      <Field label="Tagline"><TextInput value={form.tagline} onChange={(event) => setForm({ ...form, tagline: event.target.value })} /></Field>
      <Field label="City"><TextInput value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field>
      <Field label="Support email"><TextInput value={form.supportEmail} onChange={(event) => setForm({ ...form, supportEmail: event.target.value })} /></Field>
      <Field label="Commission percent"><TextInput inputMode="numeric" value={form.commissionPercent} onChange={(event) => setForm({ ...form, commissionPercent: Number(event.target.value) })} /></Field>
      <Field label="Booking policy"><Area value={form.bookingPolicy} onChange={(event) => setForm({ ...form, bookingPolicy: event.target.value })} /></Field>
      <Field label="Cancellation policy"><Area value={form.cancellationPolicy} onChange={(event) => setForm({ ...form, cancellationPolicy: event.target.value })} /></Field>
      <div className="flex gap-2">
        <Button type="submit">Save settings</Button>
        <Button type="button" variant="secondary" onClick={resetDemo}>Reset demo data</Button>
      </div>
    </form>
  );
}
