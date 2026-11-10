"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDemo } from "@/context/demo-context";
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
      <header className="bg-white">
        <div className={`${frame} artist-intro`}>
          <div className="artist-portrait">
            <Photo src={artist.photo} alt={artist.name} className="block h-full w-full object-cover" />
          </div>
          <div className="artist-copy flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.18em] text-mute">{artist.neighborhood}, {artist.borough}</p>
          <h1 className="mt-2 font-express text-[clamp(2.5rem,4.5vw,4.5rem)] leading-[0.9]">{artist.name}</h1>
          <p className="mt-3 text-sm text-mute">{artist.studioName} · {artist.instagram}</p>
          <div className="mt-3"><Rating value={artist.rating} count={artist.reviewCount} /></div>
          <p className="mt-4 max-w-xl text-sm leading-6">{artist.bio}</p>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="text-mute">Experience</dt><dd>{artist.yearsExperience} years</dd></div>
            <div><dt className="text-mute">Starting price</dt><dd>{money(artist.startingPrice)}</dd></div>
            <div><dt className="text-mute">Styles</dt><dd>{styles.join(", ")}</dd></div>
            <div><dt className="text-mute">Specialties</dt><dd>{artist.specialties.join(", ")}</dd></div>
          </dl>
          {!listed ? <p className="mt-4 border border-line px-3 py-3 text-sm">This profile is {verificationLabel(artist.verificationStatus).toLowerCase()} and is hidden from public search. {artist.verificationNote}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
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
        </div>
      </header>

      <section className={`${frame} border-b border-panel py-16`}>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.28em] text-mist">Studio</p>
            <h2 className="mt-3 font-express text-[clamp(2.25rem,4vw,3.75rem)] leading-[0.95]">{artist.studioName}</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-mist">{artist.studioAddress}</p>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="font-display text-[0.68rem] uppercase tracking-[0.18em] text-mute">Phone</dt>
              <dd className="mt-2 text-sm">{artist.phone}</dd>
            </div>
            <div>
              <dt className="font-display text-[0.68rem] uppercase tracking-[0.18em] text-mute">Email</dt>
              <dd className="mt-2 break-all text-sm">{artist.email}</dd>
            </div>
          </dl>
        </div>
        <ol className="mt-10 grid grid-cols-2 border-t border-panel sm:grid-cols-4 lg:grid-cols-7">
          {artist.workingHours.map((day) => (
            <li key={day.day} className="border-b border-panel px-4 py-5 lg:border-b-0 lg:border-l lg:first:border-l-0">
              <p className="font-display text-[0.68rem] uppercase tracking-[0.18em] text-mute">{weekdayName(day.day).slice(0, 3)}</p>
              {day.closed ? (
                <p className="mt-3 text-sm text-mute">Closed</p>
              ) : (
                <p className="mt-3 text-sm leading-6">{formatTime(day.open)}<span className="block text-mute">{formatTime(day.close)}</span></p>
              )}
            </li>
          ))}
        </ol>
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

      <section className={`${frame} py-16`}>
        <p className="font-display text-xs uppercase tracking-[0.28em] text-mist">Pricing</p>
        <h2 className="mt-3 font-express text-[clamp(2.25rem,4vw,3.5rem)] leading-[0.95]">Services</h2>
        <ul className="mt-8 border-t border-panel">
          {services.map((service) => (
            <li key={service.id} className="border-b border-panel py-6">
              <div className="flex items-baseline justify-between gap-6">
                <h3 className="font-display text-2xl">{service.name}</h3>
                <p className="shrink-0 text-sm">{money(service.minPrice)}–{money(service.maxPrice)}</p>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-mist">{service.description}</p>
              <p className="mt-3 font-display text-[0.68rem] uppercase tracking-[0.18em] text-mute">{formatDuration(service.durationMinutes)}{service.customDesign ? " · Custom drawing" : ""}</p>
            </li>
          ))}
        </ul>
        {!services.length ? <p className="mt-4 text-sm text-mute">No services listed yet.</p> : null}
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
