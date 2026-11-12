"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDemo } from "@/context/demo-context";
import { artworkFeed, type Artwork } from "@/lib/artwork";
import { BOROUGHS, PLACEMENTS } from "@/lib/constants";
import { Button, frame, Modal, Photo, SelectInput } from "@/components/ui";

const SAVED_KEY = "blackline.saved-art.v1";
const inkField = "h-11 w-full border border-detail bg-ink px-3 text-sm text-white outline-none";

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

export function DiscoveryFeed() {
  const { state, session } = useDemo();
  const feed = useMemo(() => artworkFeed(state), [state]);
  const [query, setQuery] = useState("");
  const [styleId, setStyleId] = useState("");
  const [borough, setBorough] = useState("");
  const [placement, setPlacement] = useState("");
  const [shown, setShown] = useState(18);
  const [saved, setSaved] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => setSaved(loadSaved()), []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return feed.filter((item) => {
      if (styleId && item.styleId !== styleId) return false;
      if (borough && item.borough !== borough) return false;
      if (placement && item.placement !== placement) return false;
      if (!needle) return true;
      const haystack = [item.title, item.description, item.artistName, item.styleName, item.category, item.neighborhood, item.placement, ...item.tags].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [feed, query, styleId, borough, placement]);

  useEffect(() => setShown(18), [query, styleId, borough, placement]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setShown((count) => count + 12);
    }, { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length]);

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
        <form className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
          <label className="block md:col-span-2 xl:col-span-1">
            <span className="sr-only">Search artwork</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Subject, artist, or style" className={inkField} />
          </label>
          <SelectInput value={styleId} onChange={(event) => setStyleId(event.target.value)} className={inkField} aria-label="Style">
            <option value="">Any style</option>
            {state.styles.map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}
          </SelectInput>
          <SelectInput value={borough} onChange={(event) => setBorough(event.target.value)} className={inkField} aria-label="Location">
            <option value="">Any borough</option>
            {BOROUGHS.map((item) => <option key={item}>{item}</option>)}
          </SelectInput>
          <SelectInput value={placement} onChange={(event) => setPlacement(event.target.value)} className={inkField} aria-label="Body placement">
            <option value="">Any placement</option>
            {PLACEMENTS.map((item) => <option key={item}>{item}</option>)}
          </SelectInput>
        </form>
      </section>

      <section className={`${frame} pb-20`} aria-label="Artwork">
        {visible.length ? (
          <div className="artwork-masonry">
            {visible.map((item) => (
              <ArtworkCard key={item.id} item={item} saved={session?.role === "customer" && saved.includes(item.id)} onSave={() => save(item)} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-sm text-mist">Nothing in the gallery matches that search.</p>
        )}
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

function ArtworkCard({ item, saved, onSave }: { item: Artwork; saved: boolean; onSave: () => void }) {
  return (
    <article>
      <div className="relative">
        <Link href={`/artwork/?id=${item.id}`} className={`relative block overflow-hidden ${ASPECT[item.aspect]}`}>
          <Photo src={item.image} alt={item.title} className="absolute inset-0 h-full w-full" />
        </Link>
        <button type="button" onClick={onSave} aria-pressed={saved} aria-label={saved ? "Saved" : "Save"} className="absolute right-2 top-2 grid h-9 w-9 place-items-center bg-white text-ink">
          <Heart filled={saved} />
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

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
