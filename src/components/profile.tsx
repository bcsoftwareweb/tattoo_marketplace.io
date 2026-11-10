"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDemo } from "@/context/demo-context";
import { DEMO_TODAY } from "@/lib/constants";
import { formatDate, formatDuration, formatTime, money, weekdayName } from "@/lib/format";
import { portfolioFor, reviewsFor, servicesFor } from "@/lib/selectors";
import { verificationLabel } from "@/lib/status";
import { Button, frame, Photo, Rating } from "@/components/ui";

export function ArtistProfile({ slug }: { slug: string }) {
  const { state, session, favorite, openThread, toast } = useDemo();
  const router = useRouter();
  const artist = state.artists.find((item) => item.slug === slug);
  if (!artist) {
    return <div className={`${frame} py-20`}><h1 className="font-display text-4xl">Artist not found</h1><p className="mt-3 text-sm text-mute">That profile is not in the demo index.</p></div>;
  }
  const services = servicesFor(state, artist.id);
  const portfolio = portfolioFor(state, artist.id);
  const reviews = reviewsFor(state, artist.id);
  const styles = artist.styleIds.map((id) => state.styles.find((style) => style.id === id)?.name).filter(Boolean);
  const saved = session?.role === "customer" && (state.favorites[session.userId] ?? []).includes(artist.id);
  const openings = artist.availability.filter((day) => day.date >= DEMO_TODAY && day.status === "open").slice(0, 8);
  const listed = artist.verificationStatus === "approved";

  function message() {
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(`/artists/${artist!.slug}`)}`);
      return;
    }
    if (session.role !== "customer") {
      toast("Sign in with the customer demo to message artists.");
      return;
    }
    const result = openThread(artist!.id);
    if (result.error || !result.id) {
      toast(result.error ?? "Could not open the conversation.");
      return;
    }
    router.push(`/customer/messages?thread=${result.id}`);
  }

  function book() {
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(`/artists/${artist!.slug}/request`)}`);
      return;
    }
    if (session.role !== "customer") {
      toast("Sign in with the customer demo to request an appointment.");
      return;
    }
    router.push(`/artists/${artist!.slug}/request`);
  }

  return (
    <article>
      <header className="grid lg:grid-cols-2">
        <Photo src={artist.photo} alt={artist.name} className="min-h-[420px] w-full" />
        <div className="flex flex-col justify-end bg-white px-5 py-10 md:px-10">
          <p className="text-xs uppercase tracking-[0.18em] text-mute">{artist.neighborhood}, {artist.borough}</p>
          <h1 className="mt-3 font-express text-5xl leading-none md:text-7xl">{artist.name}</h1>
          <p className="mt-4 text-sm text-mute">{artist.studioName} · {artist.instagram}</p>
          <div className="mt-4"><Rating value={artist.rating} count={artist.reviewCount} /></div>
          <p className="mt-6 max-w-xl text-sm leading-7">{artist.bio}</p>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-mute">Experience</dt><dd>{artist.yearsExperience} years</dd></div>
            <div><dt className="text-mute">Starting price</dt><dd>{money(artist.startingPrice)}</dd></div>
            <div><dt className="text-mute">Styles</dt><dd>{styles.join(", ")}</dd></div>
            <div><dt className="text-mute">Specialties</dt><dd>{artist.specialties.join(", ")}</dd></div>
          </dl>
          {!listed ? <p className="mt-6 border border-line px-3 py-3 text-sm">This profile is {verificationLabel(artist.verificationStatus).toLowerCase()} and is hidden from public search. {artist.verificationNote}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button type="button" onClick={book} disabled={!listed}>Request appointment</Button>
            <Button type="button" variant="secondary" onClick={message} disabled={!listed}>Message artist</Button>
            <Button type="button" variant="ghost" onClick={() => {
              if (!session || session.role !== "customer") {
                router.push(`/login?next=${encodeURIComponent(`/artists/${artist.slug}`)}`);
                return;
              }
              favorite(artist.id);
            }}>{saved ? "Saved" : "Save"}</Button>
          </div>
        </div>
      </header>

      <section className={`${frame} py-14`}>
        <h2 className="font-display text-3xl">Studio</h2>
        <p className="mt-3 text-sm leading-6">{artist.studioAddress}</p>
        <p className="mt-2 text-sm text-mute">{artist.phone} · {artist.email}</p>
        <ul className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          {artist.workingHours.map((day) => (
            <li key={day.day} className="flex justify-between border-b border-line py-2">
              <span>{weekdayName(day.day)}</span>
              <span className="text-mute">{day.closed ? "Closed" : `${formatTime(day.open)} – ${formatTime(day.close)}`}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line bg-white py-14">
        <div className={frame}>
          <h2 className="font-display text-3xl">Portfolio</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((item) => (
              <figure key={item.id}>
                <Photo src={item.image} alt={item.title} className="aspect-[4/5] w-full" />
                <figcaption className="mt-3">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-mute">{item.category} · {item.description}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          {!portfolio.length ? <p className="mt-4 text-sm text-mute">No portfolio pieces yet.</p> : null}
        </div>
      </section>

      <section className={`${frame} grid gap-10 py-14 lg:grid-cols-2`}>
        <div>
          <h2 className="font-display text-3xl">Services and pricing</h2>
          <ul className="mt-6 grid gap-4">
            {services.map((service) => (
              <li key={service.id} className="border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-medium">{service.name}</h3>
                  <p className="text-sm">{money(service.minPrice)}–{money(service.maxPrice)}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-mute">{service.description}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-mute">{formatDuration(service.durationMinutes)}{service.customDesign ? " · Custom drawing" : ""}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-3xl">Open dates</h2>
          <ul className="mt-6 grid grid-cols-2 gap-2">
            {openings.map((day) => (
              <li key={day.date} className="border border-line bg-white px-3 py-3 text-sm">{formatDate(day.date)}</li>
            ))}
          </ul>
          {!openings.length ? <p className="mt-4 text-sm text-mute">No open dates in the published calendar.</p> : null}
          <p className="mt-4 text-xs text-mute">A date is held only after the artist accepts and the simulated deposit is confirmed.</p>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className={frame}>
          <h2 className="font-display text-3xl">Reviews</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.map((review) => {
              const customer = state.customers.find((item) => item.id === review.customerId);
              return (
                <li key={review.id} className="border border-line p-4">
                  <Rating value={review.rating} />
                  <h3 className="mt-3 font-medium">{review.title}</h3>
                  <p className="mt-2 text-sm leading-6">{review.body}</p>
                  <p className="mt-3 text-xs text-mute">{customer?.name} · {formatDate(review.createdAt)}</p>
                </li>
              );
            })}
          </ul>
          {!reviews.length ? <p className="mt-4 text-sm text-mute">No published reviews yet.</p> : null}
          <Link href="/artists" className="mt-10 inline-block text-sm">Back to the index</Link>
        </div>
      </section>
    </article>
  );
}
