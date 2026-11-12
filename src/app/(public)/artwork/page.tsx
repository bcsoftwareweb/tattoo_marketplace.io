import { Suspense } from "react";
import { ArtworkDetail } from "@/components/artwork-detail";

export const metadata = { title: "Artwork" };

export default function Page() {
  return (
    <Suspense fallback={<p className="px-5 py-16 text-sm text-mute">Opening the piece…</p>}>
      <ArtworkDetail />
    </Suspense>
  );
}
