import type { BookingStatus, DemoState, Role } from "@/lib/types";

export function artistBySlug(state: DemoState, slug: string) {
  return state.artists.find((artist) => artist.slug === slug) ?? null;
}

export function personName(state: DemoState, role: Role | "customer" | "artist", id: string) {
  if (role === "artist") return state.artists.find((artist) => artist.id === id)?.name ?? "Artist";
  if (role === "customer") return state.customers.find((customer) => customer.id === id)?.name ?? "Customer";
  return "Blackline";
}

export function servicesFor(state: DemoState, artistId: string) {
  return state.services.filter((service) => service.artistId === artistId);
}

export function portfolioFor(state: DemoState, artistId: string) {
  return state.portfolio.filter((item) => item.artistId === artistId);
}

export function reviewsFor(state: DemoState, artistId: string, includeHidden = false) {
  return state.reviews.filter((review) => review.artistId === artistId && (includeHidden || review.status === "published"));
}

export function bookingsFor(state: DemoState, role: Role, userId: string) {
  if (role === "customer") return state.bookings.filter((booking) => booking.customerId === userId);
  if (role === "artist") return state.bookings.filter((booking) => booking.artistId === userId);
  return state.bookings;
}

export function conversationsFor(state: DemoState, role: "customer" | "artist", userId: string) {
  return state.conversations
    .filter((conversation) => (role === "customer" ? conversation.customerId === userId : conversation.artistId === userId))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function unreadCount(state: DemoState, userId: string) {
  return state.notifications.filter((item) => item.userId === userId && !item.read).length;
}

const OPEN: BookingStatus[] = ["pending", "artist_proposed_changes", "awaiting_customer_confirmation", "awaiting_deposit"];

export function isOpenBooking(status: BookingStatus) {
  return OPEN.includes(status);
}

export function adminStats(state: DemoState) {
  const volume = state.transactions.reduce((sum, item) => sum + item.amount, 0);
  const commission = state.transactions.reduce((sum, item) => sum + item.commission, 0);
  const artistNet = state.transactions.reduce((sum, item) => sum + item.artistNet, 0);
  const refunds = state.transactions.filter((item) => item.type === "refund").reduce((sum, item) => sum + Math.abs(item.amount), 0);
  return {
    customers: state.customers.length,
    artists: state.artists.length,
    pendingArtists: state.artists.filter((artist) => artist.verificationStatus === "pending").length,
    approvedArtists: state.artists.filter((artist) => artist.verificationStatus === "approved").length,
    suspendedArtists: state.artists.filter((artist) => artist.verificationStatus === "suspended").length,
    bookings: state.bookings.length,
    completed: state.bookings.filter((booking) => booking.status === "completed").length,
    volume,
    commission,
    artistNet,
    refunds,
  };
}

export function artistFinance(state: DemoState, artistId: string) {
  const transactions = state.transactions.filter((item) => item.artistId === artistId);
  const net = transactions.reduce((sum, item) => sum + item.artistNet, 0);
  const commission = transactions.reduce((sum, item) => sum + item.commission, 0);
  const unsettled = state.bookings
    .filter((booking) => booking.artistId === artistId && booking.status === "confirmed")
    .reduce((sum, booking) => sum + Math.max(0, (booking.quote ?? 0) - (booking.deposit ?? 0)), 0);
  const monthNet = transactions.filter((item) => item.createdAt.startsWith("2026-11")).reduce((sum, item) => sum + item.artistNet, 0);
  return { transactions, net, commission, unsettled, monthNet };
}
