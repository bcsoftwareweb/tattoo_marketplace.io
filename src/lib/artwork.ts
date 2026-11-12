import { PLACEMENTS } from "@/lib/constants";
import { GALLERY } from "@/lib/gallery";
import type { DemoState, PortfolioItem } from "@/lib/types";

export type ArtworkLane = "featured" | "popular" | "recent";

export interface Artwork {
  id: string;
  artistId: string;
  artistName: string;
  artistSlug: string;
  artistPhoto: string;
  verified: boolean;
  borough: string;
  neighborhood: string;
  image: string;
  title: string;
  description: string;
  styleId: string;
  styleName: string;
  category: string;
  placement: string;
  tags: string[];
  views: number;
  saves: number;
  uploadedAt: string;
  lane: ArtworkLane;
  aspect: "3/4" | "4/5" | "1/1" | "3/5" | "2/3" | "4/3";
}

const ASPECTS: Artwork["aspect"][] = ["4/5", "3/4", "1/1", "2/3", "3/4", "4/5"];

function hash(id: string) {
  let value = 0;
  for (const char of id) value = (value * 33 + char.charCodeAt(0)) >>> 0;
  return value;
}

function dayOffset(days: number) {
  const date = new Date(Date.UTC(2026, 10, 10));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function toArtwork(piece: PortfolioItem, state: DemoState): Artwork | null {
  const artist = state.artists.find((item) => item.id === piece.artistId);
  if (!artist || artist.verificationStatus !== "approved") return null;
  const style = state.styles.find((item) => item.id === piece.styleId);
  const n = hash(piece.id);
  const views = 120 + (n % 4800);
  const lane: ArtworkLane = n % 5 === 0 ? "featured" : views > 2200 ? "popular" : "recent";
  return {
    id: piece.id,
    artistId: artist.id,
    artistName: artist.name,
    artistSlug: artist.slug,
    artistPhoto: artist.photo,
    verified: true,
    borough: artist.borough,
    neighborhood: artist.neighborhood,
    image: piece.image,
    title: piece.title,
    description: piece.description,
    styleId: piece.styleId,
    styleName: style?.name ?? "Tattoo",
    category: piece.category,
    placement: PLACEMENTS[n % PLACEMENTS.length],
    tags: [piece.category, style?.name ?? "Tattoo", artist.neighborhood].filter(Boolean),
    views,
    saves: 6 + (n % 380),
    uploadedAt: dayOffset(n % 140),
    lane,
    aspect: ASPECTS[n % ASPECTS.length],
  };
}

export function artworkFeed(state: DemoState) {
  const seen = new Set<string>();
  const feed: Artwork[] = [];
  for (const piece of GALLERY) {
    if (seen.has(piece.image)) continue;
    const artwork = toArtwork(piece, state);
    if (!artwork) continue;
    seen.add(piece.image);
    feed.push(artwork);
  }
  return feed;
}

export function artworkById(state: DemoState, id: string) {
  return artworkFeed(state).find((item) => item.id === id) ?? null;
}

export function relatedArtwork(state: DemoState, artwork: Artwork) {
  return artworkFeed(state).filter((item) => item.id !== artwork.id && (item.styleId === artwork.styleId || item.artistId === artwork.artistId)).slice(0, 4);
}
