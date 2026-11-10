import { StyleDetail } from "@/components/discovery";
import { createSeed, styleParams } from "@/lib/seed";

export function generateStaticParams() {
  return styleParams();
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const style = createSeed().styles.find((item) => item.slug === slug);
  return { title: style?.name ?? "Style" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StyleDetail slug={slug} />;
}
