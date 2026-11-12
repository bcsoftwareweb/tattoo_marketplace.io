import type { Artwork } from "@/lib/artwork";
import type { Artist } from "@/lib/types";

export interface SearchTaste {
  query: string;
  styleId: string;
  borough: string;
  placement: string;
}

export interface TasteInput {
  savedIds: string[];
  savedArtistIds: string[];
  searches: SearchTaste[];
}

export interface Recommendation<T> {
  items: T[];
  personalized: boolean;
}

const STOP = new Set(["the", "and", "for", "with", "from", "that", "this", "any"]);

function tokens(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP.has(token));
}

function bump(map: Map<string, number>, key: string, weight: number) {
  if (!key || weight <= 0) return;
  map.set(key, (map.get(key) ?? 0) + weight);
}

function searchWeight(index: number) {
  return index === 0 ? 5 : Math.max(1, 4 - index);
}

function tasteWords(searches: SearchTaste[], words: Map<string, number>) {
  searches.forEach((search, index) => {
    const weight = searchWeight(index);
    for (const token of tokens(search.query)) bump(words, token, weight);
  });
}

function wordScore(haystack: string, words: Map<string, number>) {
  let score = 0;
  for (const token of new Set(tokens(haystack))) score += words.get(token) ?? 0;
  return score;
}

export function recommendSketches(feed: Artwork[], input: TasteInput, limit = 6): Recommendation<Artwork> {
  const saved = new Set(input.savedIds);
  const savedArtists = new Set(input.savedArtistIds);
  const styles = new Map<string, number>();
  const boroughs = new Map<string, number>();
  const placements = new Map<string, number>();
  const words = new Map<string, number>();

  for (const piece of feed) {
    if (!saved.has(piece.id)) continue;
    savedArtists.add(piece.artistId);
    bump(styles, piece.styleId, 5);
    bump(boroughs, piece.borough, 2);
    bump(placements, piece.placement, 3);
  }

  input.searches.forEach((search, index) => {
    const weight = searchWeight(index);
    bump(styles, search.styleId, weight);
    bump(boroughs, search.borough, Math.max(1, weight - 2));
    bump(placements, search.placement, Math.max(1, weight - 1));
  });
  tasteWords(input.searches, words);

  const personalized = styles.size + boroughs.size + placements.size + words.size + savedArtists.size > 0;
  const ranked = feed
    .filter((item) => !saved.has(item.id))
    .map((item) => {
      let score = styles.get(item.styleId) ?? 0;
      score += boroughs.get(item.borough) ?? 0;
      score += placements.get(item.placement) ?? 0;
      if (savedArtists.has(item.artistId)) score += 4;
      score += wordScore([item.title, item.artistName, item.styleName, item.category, item.neighborhood, item.placement, ...item.tags].join(" "), words);
      score += item.saves / 10000;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || b.item.saves - a.item.saves || a.item.id.localeCompare(b.item.id));

  const matched = personalized ? ranked.filter((row) => row.score >= 1) : ranked;
  const pool = matched.length ? matched : ranked;
  return { items: pool.slice(0, limit).map((row) => row.item), personalized: personalized && matched.length > 0 };
}

export function recommendArtists(
  artists: Artist[],
  styleNames: Array<{ id: string; name: string }>,
  feed: Artwork[],
  input: TasteInput,
  limit = 4,
): Recommendation<Artist> {
  const approved = artists.filter((artist) => artist.verificationStatus === "approved");
  const names = new Map(styleNames.map((style) => [style.id, style.name]));
  const savedArtists = new Set(input.savedArtistIds);
  const styles = new Map<string, number>();
  const boroughs = new Map<string, number>();
  const words = new Map<string, number>();

  for (const piece of feed) {
    if (!input.savedIds.includes(piece.id)) continue;
    savedArtists.add(piece.artistId);
    bump(styles, piece.styleId, 5);
    bump(boroughs, piece.borough, 2);
  }
  for (const artist of approved) {
    if (!savedArtists.has(artist.id)) continue;
    for (const styleId of artist.styleIds) bump(styles, styleId, 4);
    bump(boroughs, artist.borough, 2);
  }
  input.searches.forEach((search, index) => {
    const weight = searchWeight(index);
    bump(styles, search.styleId, weight);
    bump(boroughs, search.borough, Math.max(1, weight - 2));
  });
  tasteWords(input.searches, words);

  const personalized = styles.size + boroughs.size + words.size > 0;
  const ranked = approved
    .map((artist) => {
      let score = 0;
      for (const styleId of artist.styleIds) score += styles.get(styleId) ?? 0;
      score += boroughs.get(artist.borough) ?? 0;
      score += wordScore(
        [artist.name, artist.studioName, artist.neighborhood, artist.borough, ...artist.specialties, ...artist.styleIds.map((id) => names.get(id) ?? "")].join(" "),
        words,
      );
      score += artist.rating / 100;
      if (artist.featured) score += 0.2;
      return { artist, score };
    })
    .sort((a, b) => b.score - a.score || b.artist.rating - a.artist.rating || b.artist.reviewCount - a.artist.reviewCount || a.artist.name.localeCompare(b.artist.name));

  const fresh = ranked.filter((row) => !savedArtists.has(row.artist.id) && row.score >= 1);
  const matched = personalized ? (fresh.length ? fresh : ranked.filter((row) => row.score >= 1)) : ranked;
  const pool = matched.length ? matched : ranked;
  return { items: pool.slice(0, limit).map((row) => row.artist), personalized: personalized && matched.length > 0 };
}
