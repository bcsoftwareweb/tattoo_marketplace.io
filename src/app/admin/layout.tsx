"use client";

import { DashboardShell, RequireRole } from "@/components/chrome";

const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/artists", label: "Artists" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/marketplace", label: "Marketplace" },
  { href: "/admin/settings", label: "Settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="admin">
      <DashboardShell role="admin" items={items}>{children}</DashboardShell>
    </RequireRole>
  );
}
