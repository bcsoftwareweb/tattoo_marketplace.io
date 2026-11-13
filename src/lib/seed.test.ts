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
