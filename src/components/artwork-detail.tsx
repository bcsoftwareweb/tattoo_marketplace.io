"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDemo } from "@/context/demo-context";
import { artworkById, relatedArtwork } from "@/lib/artwork";
import { formatDate } from "@/lib/format";
import { Button, frame, Modal, Photo } from "@/components/ui";

const SAVED_KEY = "blackline.saved-art.v1";

function loadSaved() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function ArtworkDetail() {
  const params = useSearchParams();
  const router = useRouter();
  const { state, session, openThread } = useDemo();
  const artwork = artworkById(state, params.get("id") ?? "");
  const related = artwork ? relatedArtwork(state, artwork) : [];
  const [saved, setSaved] = useState(false);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (!artwork) return;
    setSaved(loadSaved().includes(artwork.id));
  }, [artwork]);

  if (!artwork) {
    return (
      <div className={`${frame} py-20`}>
        <h1 className="font-display text-4xl">This piece is not in the gallery.</h1>
        <Link href="/" className="mt-6 inline-block text-sm">Back to discover</Link>
      </div>
    );
  }

  function requireAccount(message: string) {
    if (!session || session.role !== "customer") {
      setPrompt(message);
      return false;
    }
    return true;
  }

  function save() {
    if (!requireAccount("Save the tattoos that inspire you.")) return;
    setSaved((current) => {
      const next = current ? loadSaved().filter((id) => id !== artwork!.id) : [artwork!.id, ...loadSaved().filter((id) => id !== artwork!.id)];
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return !current;
    });
  }

  return (
    <article className={`${frame} py-8 md:py-12`}>
      <Link href="/" className="text-sm text-mist">Discover</Link>
      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[1.3fr_0.7fr]">
        <Photo
          src={artwork.image}
          alt={artwork.title}
          loading="eager"
          className="mx-auto block aspect-[9/16] h-[calc(100svh-13rem)] w-auto max-w-full lg:h-[calc(100svh-11.5rem)]"
        />
        <div>
          <p className="font-display text-xs uppercase tracking-[0.22em] text-mute">{artwork.styleName}</p>
          <h1 className="mt-3 font-express text-5xl leading-[0.9]">{artwork.title}</h1>
          <Link href={`/artists/${artwork.artistSlug}`} className="mt-6 flex items-center gap-3">
            <Photo src={artwork.artistPhoto} alt="" className="h-12 w-12" />
            <span>
              <span className="block text-sm">{artwork.artistName}</span>
              <span className="mt-1 block text-xs text-mute">{artwork.verified ? "Verified artist · " : ""}{artwork.neighborhood}, {artwork.borough}</span>
            </span>
          </Link>
          <p className="mt-6 text-sm leading-7 text-mist">{artwork.description}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs uppercase tracking-[0.16em] text-mute">Placement</dt><dd className="mt-1">{artwork.placement}</dd></div>
            <div><dt className="text-xs uppercase tracking-[0.16em] text-mute">Uploaded</dt><dd className="mt-1">{formatDate(artwork.uploadedAt)}</dd></div>
            <div><dt className="text-xs uppercase tracking-[0.16em] text-mute">Views</dt><dd className="mt-1">{artwork.views}</dd></div>
            <div><dt className="text-xs uppercase tracking-[0.16em] text-mute">Saves</dt><dd className="mt-1">{artwork.saves}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-mute">{artwork.tags.join(" · ")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={`/artists/${artwork.artistSlug}`} variant="inverse">View artist</Button>
            <Button type="button" variant="secondary" onClick={save}>{session?.role === "customer" && saved ? "Saved" : "Save"}</Button>
            <Button type="button" variant="ghost" onClick={() => {
              if (!requireAccount("Create an account to connect with this artist.")) return;
              const opened = openThread(artwork.artistId);
              if (opened.id) router.push(`/customer/messages?thread=${opened.id}`);
            }}>Contact artist</Button>
            <Button type="button" variant="ghost" onClick={() => {
              if (requireAccount("Ready to make it yours? Create an account to request an appointment.")) {
                router.push(`/artists/${artwork.artistSlug}/request`);
              }
            }}>Request appointment</Button>
          </div>
        </div>
      </div>
      {related.length ? (
        <section className="mt-16 border-t border-panel pt-10">
          <h2 className="font-display text-2xl">More like this</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Link key={item.id} href={`/artwork/?id=${item.id}`}>
                <Photo src={item.image} alt={item.title} className="aspect-[3/4] w-full" />
                <p className="mt-2 text-sm">{item.title}</p>
                <p className="mt-1 text-xs text-mute">{item.artistName}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <Modal open={Boolean(prompt)} title="Create an account" onClose={() => setPrompt("")}>
        <p className="text-sm leading-6">{prompt}</p>
        <div className="mt-6 flex gap-3">
          <Button href={`/login?next=${encodeURIComponent(`/artwork/?id=${artwork.id}`)}`}>Join</Button>
          <Button href={`/login?next=${encodeURIComponent(`/artwork/?id=${artwork.id}`)}`} variant="secondary">Sign in</Button>
        </div>
      </Modal>
    </article>
  );
}
