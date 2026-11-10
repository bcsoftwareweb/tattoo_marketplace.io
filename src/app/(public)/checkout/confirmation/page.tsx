import { Suspense } from "react";
import { ConfirmationScreen } from "@/components/booking-ui";

export const metadata = { title: "Payment confirmation" };

export default function Page() {
  return (
    <Suspense fallback={<p className="px-5 py-16 text-sm text-mute">Loading receipt…</p>}>
      <ConfirmationScreen />
    </Suspense>
  );
}
