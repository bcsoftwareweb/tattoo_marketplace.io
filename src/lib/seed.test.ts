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

  it("adds the ownership-claim collection to saved demo data", () => {
    const seed = createSeed();
    const saved = { ...seed, designOwnershipRequests: undefined, seedVersion: SEED_VERSION };
    const upgraded = upgradeState(saved as unknown as typeof seed);
    expect(upgraded.designOwnershipRequests).toEqual([]);
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

  it("reopens legacy booked dates so existing appointments reserve only their time slots", () => {
    const seed = createSeed();
    const booking = seed.bookings.find((item) => item.status === "confirmed");
    if (!booking) throw new Error("Expected a confirmed seed booking.");
    const saved = {
      ...seed,
      artists: seed.artists.map((artist) => (
        artist.id === booking.artistId
          ? {
              ...artist,
              availability: artist.availability.map((day) => (
                day.date === booking.appointmentDate ? { ...day, status: "booked" as const } : day
              )),
            }
          : artist
      )),
      seedVersion: SEED_VERSION - 1,
    };

    const upgraded = upgradeState(saved);
    const artist = upgraded.artists.find((item) => item.id === booking.artistId);
    expect(artist?.availability.find((day) => day.date === booking.appointmentDate)?.status).toBe("open");
  });

  it("leaves current data alone", () => {
    const current = createSeed();
    expect(upgradeState(current)).toBe(current);
  });
});
