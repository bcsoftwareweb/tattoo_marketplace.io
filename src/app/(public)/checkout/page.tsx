import { Suspense } from "react";
import { CheckoutScreen } from "@/components/booking-ui";

export const metadata = { title: "Checkout" };

export default function Page() {
  return (
    <Suspense fallback={<p className="px-5 py-16 text-sm text-mute">Loading checkout…</p>}>
      <CheckoutScreen />
    </Suspense>
  );
}
