"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useDemo } from "@/context/demo-context";
import { BOROUGHS, PRICE_FILTERS, SORTS } from "@/lib/constants";
import { money } from "@/lib/format";
import { filterArtists, type ArtistQuery, type ArtistSort, type AvailabilityFilter, type PriceFilter } from "@/lib/filters";
import { Button, Empty, frame, Photo, Rating, SelectInput, TextInput } from "@/components/ui";

export function ArtistCard({ artistId }: { artistId: string }) {
  const { state } = useDemo();
  const artist = state.artists.find((item) => item.id === artistId);
  if (!artist) return null;
  const styles = artist.styleIds.map((id) => state.styles.find((style) => style.id === id)?.name).filter(Boolean).slice(0, 3);
  return (
    <Link href={`/artists/${artist.slug}`} className="group block border border-line bg-white">
      <Photo src={artist.photo} alt="" className="aspect-[4/5] w-full transition-transform duration-300 group-hover:scale-[1.02]" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl">{artist.name}</h2>
          <p className="text-sm">From {money(artist.startingPrice)}</p>
        </div>
        <p className="mt-1 text-sm text-mute">{artist.neighborhood}, {artist.borough}</p>
        <p className="mt-3 text-sm">{styles.join(" · ")}</p>
        <div className="mt-3"><Rating value={artist.rating} count={artist.reviewCount} /></div>
      </div>
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
    neighborhood: params.get("neighborhood") ?? "",
    specialty: params.get("specialty") ?? "",
    price: (params.get("price") as PriceFilter) || "any",
    availability: (params.get("availability") as AvailabilityFilter) || "any",
    sort: (params.get("sort") as ArtistSort) || "relevance",
  };
  const neighborhoods = useMemo(
    () => [...new Set(state.artists.filter((artist) => artist.verificationStatus === "approved" && (!query.borough || artist.borough === query.borough)).map((artist) => artist.neighborhood))].sort(),
    [state.artists, query.borough],
  );
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

  return (
    <div className={`${frame} py-10 md:py-14`}>
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-mute">The index</p>
        <h1 className="mt-3 font-express text-5xl leading-none md:text-7xl">Artists across the city.</h1>
      </header>
      <form className="mt-8 grid gap-3 border border-line bg-white p-4 md:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
        <label className="md:col-span-2 text-sm">
          <span className="mb-2 block">Search</span>
          <TextInput value={query.q} onChange={(event) => update({ q: event.target.value })} placeholder="Name, studio, neighborhood" />
        </label>
        <label className="text-sm"><span className="mb-2 block">Style</span>
          <SelectInput value={query.style} onChange={(event) => update({ style: event.target.value })}>
            <option value="">Any style</option>
            {state.styles.map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}
          </SelectInput>
        </label>
        <label className="text-sm"><span className="mb-2 block">Borough</span>
          <SelectInput value={query.borough} onChange={(event) => update({ borough: event.target.value, neighborhood: "" })}>
            <option value="">Any borough</option>
            {BOROUGHS.map((borough) => <option key={borough}>{borough}</option>)}
          </SelectInput>
        </label>
        <label className="text-sm"><span className="mb-2 block">Neighborhood</span>
          <SelectInput value={query.neighborhood} onChange={(event) => update({ neighborhood: event.target.value })}>
            <option value="">Any neighborhood</option>
            {neighborhoods.map((item) => <option key={item}>{item}</option>)}
          </SelectInput>
        </label>
        <label className="text-sm"><span className="mb-2 block">Specialty</span>
          <SelectInput value={query.specialty} onChange={(event) => update({ specialty: event.target.value })}>
            <option value="">Any specialty</option>
            {specialties.map((item) => <option key={item}>{item}</option>)}
          </SelectInput>
        </label>
        <label className="text-sm"><span className="mb-2 block">Price</span>
          <SelectInput value={query.price} onChange={(event) => update({ price: event.target.value })}>
            {PRICE_FILTERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </SelectInput>
        </label>
        <label className="text-sm"><span className="mb-2 block">Availability</span>
          <SelectInput value={query.availability} onChange={(event) => update({ availability: event.target.value })}>
            <option value="any">Any time</option>
            <option value="open-7">Open in 7 days</option>
            <option value="open-30">Open in 30 days</option>
          </SelectInput>
        </label>
        <label className="text-sm"><span className="mb-2 block">Sort</span>
          <SelectInput value={query.sort} onChange={(event) => update({ sort: event.target.value })}>
            {SORTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </SelectInput>
        </label>
      </form>
      <p className="mt-6 text-sm text-mute">{results.length} artist{results.length === 1 ? "" : "s"}</p>
      {results.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((artist) => <ArtistCard key={artist.id} artistId={artist.id} />)}
        </div>
      ) : (
        <div className="mt-6">
          <Empty title="No artists match" body="Clear a filter or try another borough." action={<Button type="button" variant="secondary" onClick={() => router.replace("/artists")}>Clear filters</Button>} />
        </div>
      )}
    </div>
  );
}

export function StylesPage() {
  const { state } = useDemo();
  const params = useSearchParams();
  const selected = state.styles.find((style) => style.id === params.get("style")) ?? null;
  const artists = filterArtists(state.artists, { style: selected?.id });
  return (
    <div className={`${frame} py-12`}>
      <h1 className="font-express text-5xl leading-none md:text-7xl">Styles</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-mute">Twelve ways the city actually gets tattooed. Choose one to see who is approved for it.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.styles.map((style) => (
          <Link key={style.id} href={`/styles?style=${style.id}`} className={selected?.id === style.id ? "border border-ink" : "border border-line"}>
            <Photo src={style.image} alt="" className="aspect-[4/3] w-full" />
            <div className="bg-white p-4">
              <h2 className="font-display text-2xl">{style.name}</h2>
              <p className="mt-2 text-sm leading-6 text-mute">{style.description}</p>
            </div>
          </Link>
        ))}
      </div>
      {selected ? (
        <section className="mt-14">
          <h2 className="font-display text-3xl">{selected.name} artists</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => <ArtistCard key={artist.id} artistId={artist.id} />)}
          </div>
          {!artists.length ? <p className="mt-4 text-sm text-mute">No approved artist lists this style right now.</p> : null}
        </section>
      ) : null}
    </div>
  );
}
