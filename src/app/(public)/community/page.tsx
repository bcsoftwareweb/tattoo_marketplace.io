import type { Metadata } from "next";
import { CommunityPage } from "@/components/community";

export const metadata: Metadata = { title: "Community" };

export default function Page() {
  return <CommunityPage />;
}
