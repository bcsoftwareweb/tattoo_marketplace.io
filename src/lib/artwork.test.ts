import { describe, expect, it } from "vitest";
import { artworkFeed, mixArtwork } from "@/lib/artwork";
import { addPortfolio } from "@/lib/mutations";
import { createSeed } from "@/lib/seed";

function series(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

describe("artwork feed", () => {
  const feed = artworkFeed(createSeed());

  it("keeps one card per image and only approved artists", () => {
    const images = feed.map((item) => item.image);
    expect(new Set(images).size).toBe(images.length);
    expect(feed.every((item) => item.verified)).toBe(true);
    expect(feed.some((item) => item.artistId === "ellis-ward")).toBe(false);
    expect(feed.length).toBeGreaterThan(8);
  });

  it("shows artist portfolio uploads in Discover", () => {
    const state = createSeed();
    const result = addPortfolio(state, "nova-reyes", {
      image: "data:image/jpeg;base64,artist-upload",
      title: "New artist upload",
      description: "A new piece added to the artist portfolio.",
      category: state.categories[0].name,
      styleId: state.artists.find((artist) => artist.id === "nova-reyes")!.styleIds[0],
    }, { role: "artist", userId: "nova-reyes" });

    expect(result.error).toBeUndefined();
    expect(artworkFeed(result.state).some((item) => item.title === "New artist upload")).toBe(true);
  });

  it("opens each reload with a different mix of every artist", () => {
    const artists = new Set(feed.map((item) => item.artistId));
    const first = mixArtwork(feed, series(1));
    const second = mixArtwork(feed, series(99));
    expect(first.map((item) => item.id).sort()).toEqual(feed.map((item) => item.id).sort());
    expect(new Set(first.slice(0, artists.size).map((item) => item.artistId)).size).toBe(artists.size);
    expect(first.slice(0, 8).map((item) => item.id)).not.toEqual(second.slice(0, 8).map((item) => item.id));
  });
});
