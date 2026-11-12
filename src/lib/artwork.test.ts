import { describe, expect, it } from "vitest";
import { artworkFeed } from "@/lib/artwork";
import { createSeed } from "@/lib/seed";

describe("artwork feed", () => {
  const feed = artworkFeed(createSeed());

  it("keeps one card per image and only approved artists", () => {
    const images = feed.map((item) => item.image);
    expect(new Set(images).size).toBe(images.length);
    expect(feed.every((item) => item.verified)).toBe(true);
    expect(feed.some((item) => item.artistId === "ellis-ward")).toBe(false);
    expect(feed.length).toBeGreaterThan(8);
  });
});
