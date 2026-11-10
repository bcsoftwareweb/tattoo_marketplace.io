import { Suspense } from "react";
import { StylesPage } from "@/components/discovery";

export const metadata = { title: "Styles" };

export default function Page() {
  return (
    <Suspense fallback={<p className="px-5 py-16 text-sm text-mute">Loading styles…</p>}>
      <StylesPage />
    </Suspense>
  );
}
