import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-6 text-white">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.22em] text-mist">404</p>
        <h1 className="mt-4 font-express text-5xl leading-none md:text-7xl">This page is not in the index.</h1>
        <Link href="/" className="mt-8 inline-flex h-11 items-center border border-white px-4 text-sm">Back to Blackline</Link>
      </div>
    </main>
  );
}
