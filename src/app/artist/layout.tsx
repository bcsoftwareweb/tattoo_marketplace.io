"use client";

import { DashboardShell, RequireRole } from "@/components/chrome";

const items = [
  { href: "/artist", label: "Overview" },
  { href: "/artist/profile", label: "Profile" },
  { href: "/artist/portfolio", label: "Portfolio" },
  { href: "/artist/services", label: "Services" },
  { href: "/artist/availability", label: "Calendar" },
  { href: "/artist/bookings", label: "Bookings" },
  { href: "/artist/messages", label: "Messages" },
  { href: "/artist/earnings", label: "Earnings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="artist">
      <DashboardShell role="artist" items={items}>{children}</DashboardShell>
    </RequireRole>
  );
}
