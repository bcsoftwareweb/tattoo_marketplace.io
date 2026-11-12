import type { Metadata } from "next";
import { HomePage } from "@/components/home";

export const metadata: Metadata = { title: "Discover" };

export default function Page() {
  return <HomePage />;
}
