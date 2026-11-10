import { ArtistProfile } from "@/components/profile";
import { artistParams } from "@/lib/seed";

export function generateStaticParams() {
  return artistParams();
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ArtistProfile slug={slug} />;
}
