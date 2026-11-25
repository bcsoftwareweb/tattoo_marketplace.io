import type { Metadata } from "next";
import { StudioApplicationForm } from "@/components/studio-application";

export const metadata: Metadata = { title: "Studio application" };

export default function Page() {
  return <StudioApplicationForm />;
}
