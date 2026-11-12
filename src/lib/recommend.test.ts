import { describe, expect, it } from "vitest";
import { artworkFeed } from "@/lib/artwork";
import { recommendArtists, recommendSketches, type SearchTaste } from "@/lib/recommend";
import { createSeed } from "@/lib/seed";

const state = createSeed();
const feed = artworkFeed(state);
const empty: SearchTaste = { query: "", styleId: "", borough: "", placement: "" };

describe("search recommendations", () => {
  it("ranks sketches by a saved piece and leaves that piece out", () => {
    const saved = feed.find((item) => item.styleId === "japanese");
    expect(saved).toBeTruthy();
    const result = recommendSketches(feed, { savedIds: [saved!.id], savedArtistIds: [], searches: [] });
    expect(result.personalized).toBe(true);
    expect(result.items.some((item) => item.id === saved!.id)).toBe(false);
    expect(result.items[0]?.styleId).toBe("japanese");
  });

  it("follows the style someone is searching", () => {
    const result = recommendSketches(feed, { savedIds: [], savedArtistIds: [], searches: [{ ...empty, styleId: "lettering" }] });
    expect(result.items[0]?.styleId).toBe("lettering");
    expect(result.items.every((item) => item.styleId === "lettering")).toBe(true);
  });

  it("uses a search phrase when no style is chosen", () => {
    const result = recommendSketches(feed, { savedIds: [], savedArtistIds: [], searches: [{ ...empty, query: "koi" }] });
    expect(result.items[0]?.title.toLowerCase()).toContain("koi");
  });

  it("starts from popular sketches when nothing is saved or searched", () => {
    const result = recommendSketches(feed, { savedIds: [], savedArtistIds: [], searches: [] });
    expect(result.personalized).toBe(false);
    expect(result.items).toHaveLength(6);
    expect(result.items[0]!.saves).toBeGreaterThanOrEqual(result.items[1]!.saves);
  });

  it("recommends other approved artists who share a saved artist's styles", () => {
    const result = recommendArtists(state.artists, state.styles, feed, { savedIds: [], savedArtistIds: ["nova-reyes"], searches: [] });
    expect(result.personalized).toBe(true);
    expect(result.items.some((artist) => artist.id === "nova-reyes")).toBe(false);
    expect(result.items.some((artist) => artist.id === "priya-shah")).toBe(true);
    expect(result.items.every((artist) => artist.verificationStatus === "approved")).toBe(true);
    expect(result.items.some((artist) => artist.id === "mina-park" || artist.id === "ellis-ward")).toBe(false);
  });

  it("puts the searched borough first", () => {
    const result = recommendArtists(state.artists, state.styles, feed, {
      savedIds: [],
      savedArtistIds: [],
      searches: [{ ...empty, borough: "Queens" }],
    });
    expect(result.items[0]?.borough).toBe("Queens");
  });
});
