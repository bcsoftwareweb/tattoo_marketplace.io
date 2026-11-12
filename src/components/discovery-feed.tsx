"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useDemo } from "@/context/demo-context";
import { artworkFeed, mixArtwork, type Artwork } from "@/lib/artwork";
import { BOROUGHS, PLACEMENTS } from "@/lib/constants";
import { money } from "@/lib/format";
import { recommendArtists, recommendSketches, type Recommendation, type SearchTaste } from "@/lib/recommend";
import type { Artist } from "@/lib/types";
import { useSearchDock } from "@/components/mobile-dock";
import { Button, frame, Modal, Photo, SelectInput } from "@/components/ui";

const SAVED_KEY = "blackline.saved-art.v1";
const SEARCH_KEY = "blackline.searches.v1";
const NO_ARTISTS: string[] = [];
const inkField = "h-11 w-full border border-detail bg-ink px-3 text-base text-white outline-none md:text-sm";

const ASPECT: Record<Artwork["aspect"], string> = {
  "3/4": "aspect-[3/4]",
  "4/5": "aspect-[4/5]",
  "1/1": "aspect-square",
  "3/5": "aspect-[3/5]",
  "2/3": "aspect-[2/3]",
  "4/3": "aspect-[4/3]",
};

function loadSaved() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function loadSearches(): SearchTaste[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEARCH_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Partial<SearchTaste>;
      if (typeof row.query !== "string" || typeof row.styleId !== "string" || typeof row.borough !== "string" || typeof row.placement !== "string") return [];
      return [{ query: row.query, styleId: row.styleId, borough: row.borough, placement: row.placement }];
    }).slice(0, 8);
  } catch {
    return [];
  }
}

function sameTaste(a: SearchTaste, b: SearchTaste) {
  return a.query === b.query && a.styleId === b.styleId && a.borough === b.borough && a.placement === b.placement;
}

export function DiscoveryFeed() {
  const { state, session } = useDemo();
  const searchOpen = useSearchDock()?.open ?? false;
  const searchRef = useRef<HTMLInputElement>(null);
  const feed = useMemo(() => artworkFeed(state), [state]);
  const catalogKey = feed.map((item) => item.id).join("\n");
  const feedRef = useRef(feed);
  feedRef.current = feed;
  const [mixed, setMixed] = useState<Artwork[] | null>(null);
  const [query, setQuery] = useState("");
  const [styleId, setStyleId] = useState("");
  const [borough, setBorough] = useState("");
  const [placement, setPlacement] = useState("");
  const [shown, setShown] = useState(18);
  const [saved, setSaved] = useState<string[]>([]);
  const [history, setHistory] = useState<SearchTaste[]>([]);
  const [prompt, setPrompt] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);
  const savedArtistIds = session?.role === "customer" ? state.favorites[session.userId] ?? NO_ARTISTS : NO_ARTISTS;

  useEffect(() => {
    setSaved(loadSaved());
    setHistory(loadSearches());
  }, []);

  useEffect(() => {
    setMixed(mixArtwork(feedRef.current));
  }, [catalogKey]);

  useEffect(() => {
    const entry = { query: query.trim(), styleId, borough, placement };
    if (!entry.query && !entry.styleId && !entry.borough && !entry.placement) return;
    if (entry.query.length === 1) return;
    const handle = window.setTimeout(() => {
      setHistory((current) => {
        const next = [entry, ...current.filter((item) => !sameTaste(item, entry))].slice(0, 8);
        window.localStorage.setItem(SEARCH_KEY, JSON.stringify(next));
        return next;
      });
    }, entry.query ? 500 : 0);
    return () => window.clearTimeout(handle);
  }, [query, styleId, borough, placement]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (mixed ?? []).filter((item) => {
      if (styleId && item.styleId !== styleId) return false;
      if (borough && item.borough !== borough) return false;
      if (placement && item.placement !== placement) return false;
      if (!needle) return true;
      const haystack = [item.title, item.description, item.artistName, item.styleName, item.category, item.neighborhood, item.placement, ...item.tags].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [mixed, query, styleId, borough, placement]);

  useEffect(() => setShown(18), [query, styleId, borough, placement]);

  useEffect(() => {
    if (!searchOpen) return;
    searchRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [searchOpen]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setShown((count) => count + 12);
    }, { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length]);

  const taste = useMemo(() => {
    const current = { query: query.trim(), styleId, borough, placement };
    const active = Boolean(current.query || current.styleId || current.borough || current.placement);
    return active ? [current, ...history.filter((item) => !sameTaste(item, current))] : history;
  }, [query, styleId, borough, placement, history]);

  const sketches = useMemo(
    () => recommendSketches(feed, { savedIds: saved, savedArtistIds, searches: taste }),
    [feed, saved, savedArtistIds, taste],
  );
  const artists = useMemo(
    () => recommendArtists(state.artists, state.styles, feed, { savedIds: saved, savedArtistIds, searches: taste }),
    [state.artists, state.styles, feed, saved, savedArtistIds, taste],
  );

  const visible = filtered.slice(0, shown);

  function save(item: Artwork) {
    if (!session || session.role !== "customer") {
      setPrompt("Save the tattoos that inspire you.");
      return;
    }
    setSaved((current) => {
      const next = current.includes(item.id) ? current.filter((id) => id !== item.id) : [item.id, ...current];
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div>
      <section id="discover" className={`${frame} py-8 lg:py-10`}>
        <p className="font-display text-xs uppercase tracking-[0.28em] text-mist">Blackline</p>
        <h1 className="mt-3 font-express text-[clamp(2.6rem,5vw,4.5rem)] leading-[0.9] tracking-[-0.045em]">Discover the art. Find the artist.</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-mist">Explore tattoos, sketches, and original work from independent tattoo artists.</p>
        <form className="mt-6 hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
          <SearchFields query={query} setQuery={setQuery} styleId={styleId} setStyleId={setStyleId} borough={borough} setBorough={setBorough} placement={placement} setPlacement={setPlacement} styles={state.styles} />
        </form>
      </section>
      {searchOpen ? (
        <form id="mobile-search" className="fixed inset-x-0 top-16 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 overflow-y-auto border-t border-panel bg-ink px-5 py-6 md:hidden" onSubmit={(event) => event.preventDefault()}>
          <p className="text-xs uppercase tracking-[0.18em] text-mist">Search</p>
          <div className="mt-4 grid gap-3">
            <SearchFields query={query} setQuery={setQuery} styleId={styleId} setStyleId={setStyleId} borough={borough} setBorough={setBorough} placement={placement} setPlacement={setPlacement} styles={state.styles} inputRef={searchRef} />
          </div>
          <SearchIdeas
            sketches={sketches}
            artists={artists}
            styleName={(id) => state.styles.find((style) => style.id === id)?.name ?? ""}
          />
        </form>
      ) : null}

      <section className={`${frame} pb-20`} aria-label="Artwork">
        {mixed && visible.length ? (
          <div className="artwork-masonry">
            {visible.map((item) => (
              <ArtworkCard key={item.id} item={item} saved={session?.role === "customer" && saved.includes(item.id)} onSave={() => save(item)} />
            ))}
          </div>
        ) : mixed ? (
          <p className="py-16 text-sm text-mist">Nothing in the gallery matches that search.</p>
        ) : null}
        <div ref={sentinel} className="h-8" />
        {shown < filtered.length ? <p className="text-center text-xs uppercase tracking-[0.18em] text-mute">Loading more work</p> : null}
      </section>

      <Modal open={Boolean(prompt)} title="Create an account" onClose={() => setPrompt("")}>
        <p className="text-sm leading-6">{prompt}</p>
        <div className="mt-6 flex gap-3">
          <Button href="/login">Join</Button>
          <Button href="/login" variant="secondary">Sign in</Button>
        </div>
      </Modal>
    </div>
  );
}

function SearchFields({
  query,
  setQuery,
  styleId,
  setStyleId,
  borough,
  setBorough,
  placement,
  setPlacement,
  styles,
  inputRef,
}: {
  query: string;
  setQuery: (value: string) => void;
  styleId: string;
  setStyleId: (value: string) => void;
  borough: string;
  setBorough: (value: string) => void;
  placement: string;
  setPlacement: (value: string) => void;
  styles: Array<{ id: string; name: string }>;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <label className="block md:col-span-2 xl:col-span-1">
        <span className="sr-only">Search artwork</span>
        <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Subject, artist, or style" className={inkField} />
      </label>
      <SelectInput value={styleId} onChange={(event) => setStyleId(event.target.value)} className={inkField} aria-label="Style">
        <option value="">Any style</option>
        {styles.map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}
      </SelectInput>
      <SelectInput value={borough} onChange={(event) => setBorough(event.target.value)} className={inkField} aria-label="Location">
        <option value="">Any borough</option>
        {BOROUGHS.map((item) => <option key={item}>{item}</option>)}
      </SelectInput>
      <SelectInput value={placement} onChange={(event) => setPlacement(event.target.value)} className={inkField} aria-label="Body placement">
        <option value="">Any placement</option>
        {PLACEMENTS.map((item) => <option key={item}>{item}</option>)}
      </SelectInput>
    </>
  );
}

function SearchIdeas({
  sketches,
  artists,
  styleName,
}: {
  sketches: Recommendation<Artwork>;
  artists: Recommendation<Artist>;
  styleName: (id: string) => string;
}) {
  return (
    <div className="mt-8 grid gap-8 pb-6">
      <section aria-label="Tattoo sketches">
        <h2 className="text-xs uppercase tracking-[0.18em] text-mist">Tattoo sketches</h2>
        <p className="mt-1 text-xs text-mute">{sketches.personalized ? "From your saves and searches" : "Popular on Blackline"}</p>
        {sketches.items.length ? (
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {sketches.items.map((item) => (
              <li key={item.id}>
                <Link href={`/artwork/?id=${item.id}`} className="block">
                  <span className="block aspect-[3/4] overflow-hidden">
                    <Photo src={item.image} alt={item.title} className="h-full w-full" />
                  </span>
                  <span className="mt-2 block truncate text-sm">{item.title}</span>
                  <span className="block truncate text-xs text-mute">{item.artistName}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-mute">No sketches match that yet.</p>
        )}
      </section>
      <section aria-label="Tattoo artists">
        <h2 className="text-xs uppercase tracking-[0.18em] text-mist">Tattoo artists</h2>
        <p className="mt-1 text-xs text-mute">{artists.personalized ? "From your saves and searches" : "Popular on Blackline"}</p>
        {artists.items.length ? (
          <ul className="mt-3 grid gap-3">
            {artists.items.map((artist) => {
              const styles = artist.styleIds.map(styleName).filter(Boolean).slice(0, 2);
              return (
                <li key={artist.id}>
                  <Link href={`/artists/${artist.slug}`} className="flex items-center gap-3">
                    <Photo src={artist.photo} alt="" className="h-16 w-14 shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{artist.name}</span>
                      <span className="block truncate text-xs text-mute">{artist.neighborhood} · From {money(artist.startingPrice)}</span>
                      {styles.length ? <span className="block truncate text-xs text-mist">{styles.join(" · ")}</span> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-mute">No artists match that yet.</p>
        )}
      </section>
    </div>
  );
}

function ArtworkCard({ item, saved, onSave }: { item: Artwork; saved: boolean; onSave: () => void }) {
  return (
    <article>
      <div className="relative">
        <Link href={`/artwork/?id=${item.id}`} className={`relative block overflow-hidden ${ASPECT[item.aspect]}`}>
          <Photo src={item.image} alt={item.title} className="absolute inset-0 h-full w-full" />
        </Link>
        <button type="button" onClick={onSave} aria-pressed={saved} aria-label={saved ? "Saved" : "Save"} className="absolute right-2 top-2 grid h-9 w-9 place-items-center bg-white text-ink">
          <Bookmark filled={saved} />
        </button>
      </div>
      <Link href={`/artwork/?id=${item.id}`} className="mt-3 block truncate text-sm">{item.title}</Link>
      <p className="mt-1 truncate text-xs text-mute">
        <Link href={`/artists/${item.artistSlug}`} className="hover:text-white">{item.artistName}</Link>
        {`, ${item.neighborhood}`}
        {item.verified ? " · Verified" : ""}
      </p>
    </article>
  );
}

function Bookmark({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M6.5 3.5h11v17l-5.5-3.4L6.5 20.5z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
