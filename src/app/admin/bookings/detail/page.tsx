import { Suspense } from "react";
import { BookingScreen } from "@/components/booking-ui";

export const metadata = { title: "Booking" };

export default function Page() {
  return <Suspense fallback={<p className="text-sm text-mute">Loading booking…</p>}><BookingScreen role="admin" /></Suspense>;
}
