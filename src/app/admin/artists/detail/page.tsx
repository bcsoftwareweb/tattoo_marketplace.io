import { Suspense } from "react";
import { AdminArtistDetail } from "@/components/workspaces";

export const metadata = { title: "Artist review" };

export default function Page() {
  return <Suspense fallback={<p className="text-sm text-mute">Loading artist…</p>}><AdminArtistDetail /></Suspense>;
}
