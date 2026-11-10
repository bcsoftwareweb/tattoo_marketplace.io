import type { DemoState } from "@/lib/types";

export function deriveState(state: DemoState): DemoState {
  const artists = state.artists.map((artist) => {
    const reviews = state.reviews.filter((review) => review.artistId === artist.id && review.status === "published");
    const rating = reviews.length
      ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
      : 0;
    const priced = state.services.filter(
      (service) => service.artistId === artist.id && !/consult/i.test(service.name),
    );
    const startingPrice = priced.length ? Math.min(...priced.map((service) => service.minPrice)) : artist.startingPrice;
    const featured = artist.verificationStatus === "approved" ? artist.featured : false;
    return { ...artist, rating, reviewCount: reviews.length, startingPrice, featured };
  });
  return { ...state, artists };
}
