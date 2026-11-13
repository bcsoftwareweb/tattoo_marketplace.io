"use client";

import { DashboardShell, RequireRole } from "@/components/chrome";

const items = [
  { href: "/customer/bookings", label: "Bookings" },
  { href: "/customer/messages", label: "Messages" },
  { href: "/customer/favorites", label: "Favorites" },
  { href: "/customer/profile", label: "Profile" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="customer">
      <DashboardShell role={ "customer" } items={items}>{children}</DashboardShell>
    </RequireRole>
  );
}
