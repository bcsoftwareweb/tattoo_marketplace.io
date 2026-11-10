import { Suspense } from "react";
import { Discovery } from "@/components/discovery";

export const metadata = { title: "Artists" };

export default function Page() {
  return (
    <Suspense fallback={<p className="px-5 py-16 text-sm text-mute">Loading artists…</p>}>
      <Discovery />
    </Suspense>
  );
}
