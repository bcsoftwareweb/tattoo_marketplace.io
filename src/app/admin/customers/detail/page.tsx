import { Suspense } from "react";
import { AdminCustomerDetail } from "@/components/workspaces";

export const metadata = { title: "Customer" };

export default function Page() {
  return <Suspense fallback={<p className="text-sm text-mute">Loading customer…</p>}><AdminCustomerDetail /></Suspense>;
}
