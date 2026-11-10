"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import { BOROUGHS } from "@/lib/constants";
import { money } from "@/lib/format";
import { filterArtists } from "@/lib/filters";
import { frame, Photo, Rating, SelectInput } from "@/components/ui";

export function HomePage() {
  const { state } = useDemo();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [borough, setBorough] = useState("");
  const [style, setStyle] = useState("");
  const approved = state.artists.filter((artist) => artist.verificationStatus === "approved");
  const featured = filterArtists(approved, { sort: "relevance" }).filter((artist) => artist.featured).slice(0, 3);

  function search(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (borough) params.set("borough", borough);
    if (style) params.set("style", style);
    router.push(`/artists?${params.toString()}`);
  }

  return (
    <div>
      <section className="on-ink grid bg-ink text-white lg:h-[calc(100svh-4rem)] lg:grid-cols-2 lg:grid-rows-1 lg:overflow-hidden">
          <div className="flex flex-col justify-center px-5 py-10 md:px-10 lg:min-h-0 lg:px-14 lg:py-8">
            <p className="font-display text-xs uppercase tracking-[0.28em] text-mist">New York City</p>
            <h1 className="mt-4 max-w-xl font-express text-[clamp(2.75rem,5vw,5.5rem)] leading-[0.9] tracking-[-0.045em]">
              Tattoo artists, indexed.
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-mist">
              A curated marketplace of studios from St. George to Mott Haven. Read the work, request a date, and confirm with a simulated deposit.
            </p>
            <form onSubmit={search} className="mt-6 grid max-w-xl gap-3" role="search">
              <label className="sr-only" htmlFor="home-q">Search artists</label>
              <input id="home-q" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search artists or studios" className="h-11 border border-detail bg-ink px-3 text-sm text-white placeholder:text-mute" />
              <SelectInput aria-label="Borough" value={borough} onChange={(event) => setBorough(event.target.value)} className="h-11 border border-detail bg-ink px-3 text-sm text-white">
                <option value="">All boroughs</option>
                {BOROUGHS.map((item) => <option key={item}>{item}</option>)}
              </SelectInput>
              <SelectInput aria-label="Style" value={style} onChange={(event) => setStyle(event.target.value)} className="h-11 border border-detail bg-ink px-3 text-sm text-white">
                <option value="">All styles</option>
                {state.styles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </SelectInput>
              <button type="submit" className="h-11 bg-white px-5 text-sm font-medium text-ink">Search</button>
            </form>
          </div>
          <div className="h-72 overflow-hidden sm:h-96 lg:h-auto lg:min-h-0">
            <Photo src={state.portfolio[0]?.image} alt="Tattoo work from the Blackline index" className="block h-full w-full object-cover" />
          </div>
      </section>

      <div className="overflow-hidden border-b border-panel py-4">
        <div className="ticker-track gap-10">
          {[...state.styles, ...state.styles].map((item, index) => (
            <span key={`${item.id}-${index}`} className="font-display text-sm tracking-[0.18em] text-mist">{item.name}</span>
          ))}
        </div>
      </div>

      <section className={`${frame} flex flex-col py-10 lg:h-[calc(100svh-4rem)] lg:overflow-hidden lg:py-8`}>
        <div className="flex shrink-0 items-end justify-between gap-4">
          <h2 className="font-display text-3xl tracking-tight md:text-4xl">Selected artists</h2>
          <Link href="/artists" className="shrink-0 text-sm">View the index</Link>
        </div>
        <div className="mt-5 grid gap-10 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:gap-4">
          {featured.map((artist) => (
            <Link key={artist.id} href={`/artists/${artist.slug}`} className="group flex min-w-0 flex-col lg:min-h-0">
              <div className="aspect-[4/5] overflow-hidden lg:aspect-auto lg:min-h-0 lg:flex-1">
                <Photo src={artist.photo} alt={artist.name} className="block h-full w-full object-cover" />
              </div>
              <div className="mt-3 flex shrink-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-2xl group-hover:text-mute lg:text-xl">{artist.name}</h3>
                  <p className="mt-1 text-sm text-mute">{artist.neighborhood}, {artist.borough}</p>
                </div>
                <p className="shrink-0 text-sm">From {money(artist.startingPrice)}</p>
              </div>
              <div className="mt-2 shrink-0"><Rating value={artist.rating} count={artist.reviewCount} /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-panel py-16">
        <div className={frame}>
          <h2 className="font-display text-4xl">Popular styles</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.styles.slice(0, 6).map((item) => (
              <Link key={item.id} href={`/styles/${item.slug}`} className="group flex h-full flex-col">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Photo src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </div>
                <h3 className="mt-3 font-display text-2xl group-hover:text-mute">{item.name}</h3>
                <p className="mt-2 text-sm leading-6 text-mute">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${frame} grid gap-10 py-20 md:grid-cols-3`}>
        {[
          ["01", "Read the work", "Portfolios, prices, and studio notes are on the page before you send a request."],
          ["02", "Ask in writing", "Describe the tattoo, attach a reference, and choose a date the artist has actually opened."],
          ["03", "Confirm in the demo", "Artists accept or counter. A simulated deposit holds the date. No charge is made."],
        ].map(([index, title, body]) => (
          <article key={index}>
            <p className="font-display text-sm tracking-[0.18em] text-mute">{index}</p>
            <h2 className="mt-3 font-display text-3xl">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-mute">{body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
