import type { Role } from "@/lib/types";

export function homeFor(role: Role) {
  if (role === "customer") return "/customer";
  if (role === "artist") return "/artist";
  return "/admin";
}

export function canAccess(sessionRole: Role, area: Role) {
  return sessionRole === area;
}

export function bookingPath(role: Role, bookingId: string) {
  if (role === "customer") return `/customer/bookings/detail?id=${bookingId}`;
  if (role === "artist") return `/artist/bookings/detail?id=${bookingId}`;
  return `/admin/bookings/detail?id=${bookingId}`;
}

export function messagePath(role: "customer" | "artist", conversationId: string) {
  const base = role === "customer" ? "/customer/messages" : "/artist/messages";
  return `${base}?thread=${conversationId}`;
}

export function safeNextPath(value: string | null, role: Role) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return homeFor(role);
  const path = value.split("?")[0];
  if (role === "customer" && (path.startsWith("/customer") || path.startsWith("/checkout") || path.startsWith("/artists"))) {
    return value;
  }
  if (role === "artist" && path.startsWith("/artist")) return value;
  if (role === "admin" && path.startsWith("/admin")) return value;
  if (path.startsWith("/artists") || path.startsWith("/artwork") || path === "/") return value;
  return homeFor(role);
}
