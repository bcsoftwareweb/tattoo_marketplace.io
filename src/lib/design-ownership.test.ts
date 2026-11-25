import { describe, expect, it } from "vitest";
import { artworkFeed } from "@/lib/artwork";
import { addPortfolio, deletePortfolio, reviewDesignOwnershipRequest, submitDesignOwnershipRequest, updatePortfolio } from "@/lib/mutations";
import { createSeed } from "@/lib/seed";

const artistActor = { role: "artist" as const, userId: "nova-reyes" };
const adminActor = { role: "admin" as const, userId: "avery-quinn" };
const submittedAt = "2026-11-25T18:00:00.000Z";
const statement = "I drew this original design and first published it in my dated studio sketchbook.";

function claimForFirstNovaPiece() {
  const state = createSeed();
  const piece = state.portfolio.find((item) => item.artistId === artistActor.userId);
  if (!piece) throw new Error("Expected Nova Reyes to have a portfolio piece.");
  const result = submitDesignOwnershipRequest(state, piece.id, {
    statement,
    evidenceUrl: "https://example.com/original-post",
    attested: true,
  }, artistActor, submittedAt);
  if (result.error || !result.id) throw new Error(result.error ?? "Expected the ownership claim to be created.");
  return { state: result.state, piece, requestId: result.id };
}

describe("design ownership verification", () => {
  it("records new portfolio publication time and only lets its artist submit a supported claim", () => {
    const state = createSeed();
    const added = addPortfolio(state, artistActor.userId, {
      image: "data:image/jpeg;base64,upload",
      title: "New original design",
      description: "A new design for the portfolio.",
      category: state.categories[0].name,
      styleId: state.artists.find((artist) => artist.id === artistActor.userId)!.styleIds[0],
    }, artistActor, submittedAt);
    expect(added.error).toBeUndefined();
    if (!added.id) throw new Error("Expected the portfolio upload to be created.");
    const item = added.state.portfolio.find((portfolioItem) => portfolioItem.id === added.id);
    if (!item) throw new Error("Expected the new portfolio piece to be present.");
    expect(item.createdAt).toBe(submittedAt);
    expect(artworkFeed(added.state).find((artwork) => artwork.id === item.id)?.uploadedAt).toBe(submittedAt);

    const anotherArtistPiece = state.portfolio.find((portfolioItem) => portfolioItem.artistId !== artistActor.userId);
    if (!anotherArtistPiece) throw new Error("Expected another artist's portfolio piece.");
    const otherArtist = submitDesignOwnershipRequest(state, anotherArtistPiece.id, {
      statement,
      evidenceUrl: "",
      attested: true,
    }, artistActor, submittedAt);
    expect(otherArtist.error).toContain("own portfolio");

    const result = submitDesignOwnershipRequest(added.state, item.id, {
      statement,
      evidenceUrl: "https://example.com/original-post",
      attested: true,
    }, artistActor, submittedAt);
    expect(result.error).toBeUndefined();
    expect(result.state.designOwnershipRequests).toMatchObject([
      { portfolioItemId: item.id, artistId: artistActor.userId, status: "pending", evidenceUrl: "https://example.com/original-post" },
    ]);
    expect(result.state.notifications[0]).toMatchObject({ role: "admin", kind: "verification", read: false });
  });

  it("shows the ownership badge on the exact artwork only after an administrator approves it", () => {
    const { state, piece, requestId } = claimForFirstNovaPiece();
    expect(artworkFeed(state).find((item) => item.id === piece.id)?.ownershipVerified).toBe(false);
    const denied = reviewDesignOwnershipRequest(state, requestId, "approved", "", artistActor, submittedAt);
    expect(denied.error).toContain("administrator");

    const approved = reviewDesignOwnershipRequest(state, requestId, "approved", "Compared the dated source post.", adminActor, submittedAt);
    expect(approved.error).toBeUndefined();
    const feed = artworkFeed(approved.state);
    expect(feed.find((item) => item.id === piece.id)?.ownershipVerified).toBe(true);
    expect(feed.find((item) => item.artistId === piece.artistId && item.id !== piece.id)?.ownershipVerified).toBe(false);
    expect(approved.state.notifications[0]).toMatchObject({ userId: artistActor.userId, title: "Design ownership verified" });
    const secondReview = reviewDesignOwnershipRequest(approved.state, requestId, "rejected", "Changed mind.", adminActor, submittedAt);
    expect(secondReview.error).toContain("already been reviewed");

    const edit = updatePortfolio(approved.state, piece.id, { title: "Altered design" }, artistActor);
    expect(edit.error).toContain("upload it again");
    const descriptionEdit = updatePortfolio(approved.state, piece.id, { description: "Clarified placement notes." }, artistActor);
    expect(descriptionEdit.error).toBeUndefined();
    const deleted = deletePortfolio(approved.state, piece.id, artistActor);
    expect(deleted.state.designOwnershipRequests.some((request) => request.portfolioItemId === piece.id)).toBe(false);
  });

  it("requires a reason to reject and allows an artist to resubmit a rejected claim", () => {
    const { state, piece, requestId } = claimForFirstNovaPiece();
    const missingNote = reviewDesignOwnershipRequest(state, requestId, "rejected", "  ", adminActor, submittedAt);
    expect(missingNote.error).toContain("Add a reason");

    const rejected = reviewDesignOwnershipRequest(state, requestId, "rejected", "The dated source material was not sufficient.", adminActor, submittedAt);
    expect(rejected.error).toBeUndefined();
    expect(rejected.state.designOwnershipRequests[0].reviewerNote).toBe("The dated source material was not sufficient.");

    const resubmitted = submitDesignOwnershipRequest(rejected.state, piece.id, {
      statement: "I created this design and added the original dated publication record for review.",
      evidenceUrl: "",
      attested: true,
    }, artistActor, "2026-11-26T18:00:00.000Z");
    expect(resubmitted.error).toBeUndefined();
    expect(resubmitted.state.designOwnershipRequests).toHaveLength(2);
    expect(resubmitted.state.designOwnershipRequests[1].status).toBe("pending");
  });
});
