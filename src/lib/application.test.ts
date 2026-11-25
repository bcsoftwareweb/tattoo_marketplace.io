import { describe, expect, it } from "vitest";
import { ADMIN_ID } from "@/lib/constants";
import { filterArtists } from "@/lib/filters";
import { submitArtistApplication, submitStudioApplication, type ArtistApplication } from "@/lib/mutations";
import { createSeed } from "@/lib/seed";

const now = "2026-11-12T16:00:00Z";

describe("studio applications", () => {
  it("files an organization application separately from artist applications", () => {
    const result = submitStudioApplication(createSeed(), {
      name: "Court Street Collective",
      email: "hello@courtstreetcollective.demo",
      phone: "347-555-0188",
      website: "https://courtstreetcollective.demo",
      photo: "",
      borough: "Brooklyn",
      neighborhood: "Cobble Hill",
      address: "220 Court Street, Brooklyn, NY 11201",
      bio: "An independent Brooklyn tattoo studio with resident artists and a shared private-room practice.",
      representativeName: "Renee Ortiz",
      representativeRole: "Owner",
      studioPermit: "SP-44012",
      permitDocument: "data:image/jpeg;base64,AAAA",
      artistsCount: 6,
      openingDate: "",
      instagram: "@courtstreetcollective",
    }, now);
    expect(result.error).toBeUndefined();
    const shop = result.state.shops.find((item) => item.email === "hello@courtstreetcollective.demo");
    expect(shop).toMatchObject({
      name: "Court Street Collective",
      applicationStatus: "pending",
      status: "active",
    });
  });
});

function draft(overrides: Partial<ArtistApplication> = {}): ArtistApplication {
  return {
    name: "Remy Santos",
    email: "remy.santos@blackline.demo",
    phone: "347-555-0160",
    instagram: "remysantos.ink",
    photo: "",
    borough: "Brooklyn",
    neighborhood: "Carroll Gardens",
    studioName: "Court Street Room",
    studioAddress: "220 Court Street, Brooklyn, NY 11201",
    yearsExperience: 7,
    startingPrice: 220,
    styleIds: ["fine-line"],
    specialties: ["Fine line florals"],
    bio: "Remy draws small fine-line pieces for the forearm and ribs, and turns down portraits that need more scale.",
    licenseNumber: "NYC-TAT-51002",
    studioPermit: "SP-51002",
    bloodbornePathogenDate: "2026-02-01",
    licenseExpiresOn: "2027-08-31",
    licenseDocument: "data:image/jpeg;base64,AAAA",
    notes: "Permit is posted in the room.",
    ...overrides,
  };
}

describe("artist applications", () => {
  it("files a pending artist the public index cannot see", () => {
    const result = submitArtistApplication(createSeed(), draft(), now);
    expect(result.error).toBeUndefined();
    const artist = result.state.artists.find((item) => item.email === "remy.santos@blackline.demo");
    expect(artist?.verificationStatus).toBe("pending");
    expect(artist?.instagram).toBe("@remysantos.ink");
    expect(filterArtists(result.state.artists, {}).some((item) => item.id === artist?.id)).toBe(false);
    expect(result.state.notifications[0]).toMatchObject({
      userId: ADMIN_ID,
      role: "admin",
      kind: "verification",
      href: `/admin/artists/detail?id=${artist?.id}`,
    });
  });

  it("rejects a duplicate email and a missing style", () => {
    const seed = createSeed();
    expect(submitArtistApplication(seed, draft({ email: "artist@demo.com" }), now).error).toMatch(/email/i);
    expect(submitArtistApplication(seed, draft({ styleIds: [] }), now).error).toMatch(/style/i);
  });

  it("requires a license photo and keeps it for review", () => {
    const seed = createSeed();
    expect(submitArtistApplication(seed, draft({ licenseDocument: "" }), now).error).toMatch(/license/i);
    const result = submitArtistApplication(seed, draft(), now);
    const artist = result.state.artists.find((item) => item.email === "remy.santos@blackline.demo");
    expect(artist?.license.document).toBe("data:image/jpeg;base64,AAAA");
  });
});
