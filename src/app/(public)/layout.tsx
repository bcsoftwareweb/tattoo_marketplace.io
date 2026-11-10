import { PublicFooter, PublicHeader } from "@/components/chrome";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <div id="content" className="min-w-0">{children}</div>
      <PublicFooter />
    </>
  );
}
