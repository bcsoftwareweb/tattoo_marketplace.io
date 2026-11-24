import { describe, expect, it } from "vitest";
import { hashtagLabel, normalizeHashtag, parseHashtags } from "@/lib/hashtags";

describe("social hashtags", () => {
  it("normalizes custom hashtags", () => {
    expect(normalizeHashtag("#Fine Line!")).toBe("fine-line");
    expect(hashtagLabel("NYC Tattoo")).toBe("#nyc-tattoo");
  });

  it("extracts unique hashtags from captions", () => {
    expect(parseHashtags("Healed #FineLine work, plus #nyctattoo and #FineLine")).toEqual([
      "fineline",
      "nyctattoo",
    ]);
  });
});
