"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useDemo } from "@/context/demo-context";
import { BOROUGHS, PRICE_FILTERS, SORTS } from "@/lib/constants";
import { money } from "@/lib/format";
import { filterArtists, type ArtistQuery, type ArtistSort, type AvailabilityFilter, type PriceFilter } from "@/lib/filters";
import { createSeed } from "@/lib/seed";
import { Button, Empty, frame, Photo, Rating, SelectInput } from "@/components/ui";

const inkField = "h-11 w-full border border-detail bg-ink px-3 text-sm text-white outline-none";

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block font-display text-[0.68rem] uppercase tracking-[0.18em] text-mute">{label}</span>
      {children}
    </label>
  );
}

export function ArtistCard({ artistId }: { artistId: string }) {
  const { state } = useDemo();
  const artist = state.artists.find((item) => item.id === artistId);
  if (!artist) return null;
  const styles = artist.styleIds.map((id) => state.styles.find((style) => style.id === id)?.name).filter(Boolean).slice(0, 3);
  return (
    <Link href={`/artists/${artist.slug}`} className="group block">
      <div className="overflow-hidden">
        <Photo src={artist.photo} alt={artist.name} className="aspect-[4/5] w-full" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <h2 className="font-display text-2xl tracking-tight group-hover:text-mute">{artist.name}</h2>
        <p className="pt-1 text-sm">From {money(artist.startingPrice)}</p>
      </div>
      <p className="mt-1 text-sm text-mute">{artist.neighborhood}, {artist.borough}</p>
      <p className="mt-3 text-sm text-mist">{styles.join(" · ")}</p>
      <div className="mt-3"><Rating value={artist.rating} count={artist.reviewCount} /></div>
    </Link>
  );
}

export function Discovery() {
  const { state } = useDemo();
  const params = useSearchParams();
  const router = useRouter();
  const query: ArtistQuery = {
    q: params.get("q") ?? "",
    style: params.get("style") ?? "",
    borough: params.get("borough") ?? "",
    specialty: params.get("specialty") ?? "",
    price: (params.get("price") as PriceFilter) || "any",
    availability: (params.get("availability") as AvailabilityFilter) || "any",
    sort: (params.get("sort") as ArtistSort) || "relevance",
  };
  const specialties = useMemo(
    () => [...new Set(state.artists.filter((artist) => artist.verificationStatus === "approved").flatMap((artist) => artist.specialties))].sort(),
    [state.artists],
  );
  const results = filterArtists(state.artists, query);

  function update(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === "any") search.delete(key);
      else search.set(key, value);
    });
    router.replace(`/artists?${search.toString()}`, { scroll: false });
  }

  const filtered = Boolean(query.q || query.style || query.borough || query.specialty || query.price !== "any" || query.availability !== "any");

  return (
    <div className={`${frame} py-10 md:py-16`}>
      <header className="grid items-end gap-6 border-b border-panel pb-8 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-mist">The index</p>
          <h1 className="mt-4 max-w-3xl font-express text-[clamp(2.75rem,5vw,5.5rem)] leading-[0.9] tracking-[-0.045em]">Artists across the city.</h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-mist lg:justify-self-end">Approved studios, read by style, borough, and the next open date.</p>
      </header>
      <form className="mt-8 grid gap-6" onSubmit={(event) => event.preventDefault()}>
        <label className="block">
          <span className="sr-only">Search artists</span>
          <input value={query.q} onChange={(event) => update({ q: event.target.value })} placeholder="Search name or studio" className={`${inkField} h-12 px-4`} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <FilterField label="Style">
            <SelectInput value={query.style} onChange={(event) => update({ style: event.target.value })} className={inkField}>
              <option value="">Any style</option>
              {state.styles.map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}
            </SelectInput>
          </FilterField>
          <FilterField label="Borough">
            <SelectInput value={query.borough} onChange={(event) => update({ borough: event.target.value })} className={inkField}>
              <option value="">Any borough</option>
              {BOROUGHS.map((borough) => <option key={borough}>{borough}</option>)}
            </SelectInput>
          </FilterField>
          <FilterField label="Specialty">
            <SelectInput value={query.specialty} onChange={(event) => update({ specialty: event.target.value })} className={inkField}>
              <option value="">Any specialty</option>
              {specialties.map((item) => <option key={item}>{item}</option>)}
            </SelectInput>
          </FilterField>
          <FilterField label="Price">
            <SelectInput value={query.price} onChange={(event) => update({ price: event.target.value })} className={inkField}>
              {PRICE_FILTERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </SelectInput>
          </FilterField>
          <FilterField label="Availability">
            <SelectInput value={query.availability} onChange={(event) => update({ availability: event.target.value })} className={inkField}>
              <option value="any">Any time</option>
              <option value="open-7">Open in 7 days</option>
              <option value="open-30">Open in 30 days</option>
            </SelectInput>
          </FilterField>
        </div>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-panel pb-4">
        <p className="font-display text-xs uppercase tracking-[0.18em] text-mist">{results.length} artist{results.length === 1 ? "" : "s"}</p>
        <div className="flex items-center gap-5">
          {filtered ? <button type="button" onClick={() => router.replace("/artists")} className="text-sm text-mist hover:text-white">Clear</button> : null}
          <label className="flex items-center gap-3 text-sm text-mist">
            <span className="font-display text-[0.68rem] uppercase tracking-[0.18em]">Sort</span>
            <SelectInput value={query.sort} onChange={(event) => update({ sort: event.target.value })} className="h-11 w-auto border border-detail bg-ink px-3 text-sm text-white outline-none">
              {SORTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </SelectInput>
          </label>
        </div>
      </div>
      {results.length ? (
        <div className="mt-8 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((artist) => <ArtistCard key={artist.id} artistId={artist.id} />)}
        </div>
      ) : (
        <div className="mt-8">
          <Empty title="No artists match" body="Clear a filter or try another borough." action={<Button type="button" variant="secondary" onClick={() => router.replace("/artists")}>Clear filters</Button>} />
        </div>
      )}
    </div>
  );
}

export function StylesPage() {
  const { state } = useDemo();
  return (
    <div className={`${frame} py-12`}>
      <h1 className="font-express text-5xl leading-none md:text-7xl">Styles</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-mute">Twelve ways the city actually gets tattooed. Open one to read the style and the artists approved for it.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.styles.map((style) => (
          <Link key={style.id} href={`/styles/${style.slug}`} className="border border-line">
            <Photo src={style.image} alt="" className="aspect-[4/3] w-full" />
            <div className="bg-white p-4">
              <h2 className="font-display text-2xl">{style.name}</h2>
              <p className="mt-2 text-sm leading-6 text-mute">{style.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function StyleDetail({ slug }: { slug: string }) {
  const { state } = useDemo();
  const style = state.styles.find((item) => item.slug === slug);
  if (!style) {
    return (
      <div className={`${frame} py-20`}>
        <h1 className="font-display text-4xl">Style not found</h1>
        <p className="mt-3 text-sm text-mute">That style is not in the demo index.</p>
        <Link href="/styles" className="mt-6 inline-block text-sm">All styles</Link>
      </div>
    );
  }
  const artists = filterArtists(state.artists, { style: style.id });
  const about = style.about ?? createSeed().styles.find((item) => item.slug === style.slug)?.about ?? style.description;
  return (
    <article>
      <header className={`${frame} pt-8 pb-12 md:pt-10`}>
        <Link href="/styles" className="text-sm text-mist">All styles</Link>
        <div className="mt-6 grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.28em] text-mist">Style</p>
            <h1 className="mt-3 font-express text-[clamp(3rem,6vw,5.5rem)] leading-[0.9]">{style.name}</h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-mist">{about}</p>
          </div>
          <Photo src={style.image} alt={style.name} className="aspect-[4/3] w-full" />
        </div>
      </header>
      <section className={`${frame} border-t border-panel py-14`}>
        <h2 className="font-display text-3xl">Artists</h2>
        <p className="mt-3 text-sm text-mute">
          {artists.length
            ? `${artists.length} approved ${artists.length === 1 ? "artist works" : "artists work"} in ${style.name}.`
            : `No approved artist works in ${style.name} right now.`}
        </p>
        {artists.length ? (
          <div className="mt-8 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => <ArtistCard key={artist.id} artistId={artist.id} />)}
          </div>
        ) : null}
      </section>
    </article>
  );
}
