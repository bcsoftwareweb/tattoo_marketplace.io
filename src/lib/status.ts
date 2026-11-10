import type { BookingStatus, Role } from "@/lib/types";

const LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  artist_proposed_changes: "Changes proposed",
  awaiting_customer_confirmation: "Awaiting confirmation",
  awaiting_deposit: "Awaiting deposit",
  confirmed: "Confirmed",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
  disputed: "Disputed",
  refunded: "Refunded",
};

export function statusLabel(status: BookingStatus, role?: Role) {
  if (status === "pending" && role === "artist") return "New request";
  if (status === "awaiting_customer_confirmation" && role === "customer") return "Confirm quote";
  if (status === "awaiting_customer_confirmation" && role === "artist") return "Awaiting customer";
  return LABELS[status];
}

export function verificationLabel(status: string) {
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "suspended") return "Suspended";
  return status;
}
