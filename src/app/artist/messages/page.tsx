import { Suspense } from "react";
import { Inbox } from "@/components/inbox";

export const metadata = { title: "Messages" };

export default function Page() {
  return <Suspense fallback={<p className="text-sm text-mute">Loading messages…</p>}><Inbox role="artist" /></Suspense>;
}
