import type { Metadata } from "next";
import { HomePage } from "@/components/home";

export const metadata: Metadata = { title: "New York tattoo artists" };

export default function Page() {
  return <HomePage />;
}
