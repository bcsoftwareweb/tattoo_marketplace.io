import { DEMO_TODAY } from "@/lib/constants";
import { addDays } from "@/lib/format";
import type { Artist } from "@/lib/types";

export type PriceFilter = "any" | "under-200" | "200-350" | "350-500" | "500-plus";
export type AvailabilityFilter = "any" | "open-7" | "open-30";
export type ArtistSort = "relevance" | "rating" | "price-asc" | "price-desc";

export interface ArtistQuery {
  q?: string;
  style?: string;
  borough?: string;
  neighborhood?: string;
  specialty?: string;
  price?: PriceFilter;
  availability?: AvailabilityFilter;
  sort?: ArtistSort;
  includeUnlisted?: boolean;
  today?: string;
}

function matchesPrice(price: number, filter: PriceFilter) {
  if (filter === "under-200") return price < 200;
  if (filter === "200-350") return price >= 200 && price <= 350;
  if (filter === "350-500") return price > 350 && price <= 500;
  if (filter === "500-plus") return price > 500;
  return true;
}

function hasOpening(artist: Artist, today: string, days: number) {
  const end = addDays(today, days);
  return artist.availability.some((day) => day.status === "open" && day.date >= today && day.date <= end);
}

export function filterArtists(artists: Artist[], query: ArtistQuery) {
  const today = query.today ?? DEMO_TODAY;
  const needle = query.q?.trim().toLowerCase() ?? "";
  const filtered = artists.filter((artist) => {
    if (!query.includeUnlisted && artist.verificationStatus !== "approved") return false;
    if (query.borough && artist.borough !== query.borough) return false;
    if (query.neighborhood && artist.neighborhood !== query.neighborhood) return false;
    if (query.style && !artist.styleIds.includes(query.style)) return false;
    if (query.specialty && !artist.specialties.includes(query.specialty)) return false;
    if (query.price && !matchesPrice(artist.startingPrice, query.price)) return false;
    if (query.availability === "open-7" && !hasOpening(artist, today, 7)) return false;
    if (query.availability === "open-30" && !hasOpening(artist, today, 30)) return false;
    if (!needle) return true;
    const haystack = [
      artist.name,
      artist.studioName,
      artist.neighborhood,
      artist.borough,
      artist.bio,
      ...artist.specialties,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });

  const sort = query.sort ?? "relevance";
  return filtered.sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating || b.reviewCount - a.reviewCount;
    if (sort === "price-asc") return a.startingPrice - b.startingPrice;
    if (sort === "price-desc") return b.startingPrice - a.startingPrice;
    return Number(b.featured) - Number(a.featured) || b.rating - a.rating || b.reviewCount - a.reviewCount;
  });
}
