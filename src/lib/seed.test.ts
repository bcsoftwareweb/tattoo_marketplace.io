import { describe, expect, it } from "vitest";
import { createSeed, SEED_VERSION, upgradeState } from "@/lib/seed";

function savedBeforeUpgrade() {
  const seed = createSeed();
  const added = new Set(["tess-callahan", "marco-ruiz"]);
  return {
    ...seed,
    artists: seed.artists.filter((artist) => !added.has(artist.id)),
    bookings: seed.bookings.filter((booking) => !added.has(booking.artistId)),
    favorites: { "maya-chen": ["julian-cho"] },
    seedVersion: undefined,
  };
}

describe("saved data upgrade", () => {
  it("adds social posts to saved demo state", () => {
    const seed = createSeed();
    const saved = { ...seed, posts: undefined, seedVersion: SEED_VERSION };
    const upgraded = upgradeState(saved as unknown as typeof seed);
    expect(upgraded.posts.length).toBeGreaterThan(0);
  });

  it("adds engagement fields to older posts while preserving existing interactions", () => {
    const seed = createSeed();
    const saved = {
      ...seed,
      posts: seed.posts.map(({ likes, comments, ...post }, index) => (
        index === 0 ? post : { ...post, likes, comments }
      )),
      seedVersion: SEED_VERSION - 1,
    } as unknown as typeof seed;
    const upgraded = upgradeState(saved);
    expect(upgraded.posts[0]).toMatchObject({ likes: [], comments: [] });
    expect(upgraded.posts[1].likes).toEqual(seed.posts[1].likes);
    expect(upgraded.posts[1].comments).toEqual(seed.posts[1].comments);
  });

  it("adds new sample artists and bookings without undoing visitor changes", () => {
    const upgraded = upgradeState(savedBeforeUpgrade());
    expect(upgraded.seedVersion).toBe(SEED_VERSION);
    expect(upgraded.artists.some((artist) => artist.id === "tess-callahan")).toBe(true);
    expect(upgraded.bookings.some((booking) => booking.artistId === "marco-ruiz")).toBe(true);
    expect(upgraded.favorites["maya-chen"]).toEqual(["julian-cho", "tess-callahan", "marco-ruiz"]);
  });

  it("leaves current data alone", () => {
    const current = createSeed();
    expect(upgradeState(current)).toBe(current);
  });
});
