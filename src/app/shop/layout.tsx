"use client";

import { DashboardShell, RequireRole } from "@/components/chrome";

const items = [
  { href: "/shop", label: "Overview" },
  { href: "/shop/profile", label: "Shop profile" },
  { href: "/shop/hiring", label: "Hire artists" },
  { href: "/shop/artists", label: "Associated artists" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="shop">
      <DashboardShell role="shop" items={items}>{children}</DashboardShell>
    </RequireRole>
  );
}
