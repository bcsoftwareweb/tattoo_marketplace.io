import Link from "next/link";

export const metadata = { title: "For artists" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 md:px-8">
      <p className="text-xs uppercase tracking-[0.18em] text-mute">Studios</p>
      <h1 className="mt-4 font-express text-5xl leading-none md:text-7xl">Run the chair from one desk.</h1>
      <div className="mt-8 grid gap-4 text-sm leading-7 text-mute">
        <p>The artist demo covers profile, portfolio, services, a working calendar, incoming requests, messages, and a simulated earnings ledger.</p>
        <p>Verification is reviewed by the administrator account. Pending, rejected, and suspended artists stay out of public search.</p>
        <p>Sign in with artist@demo.com to use Nova Reyes at Atelier North. The password is Demo123! and it is not a real account.</p>
      </div>
      <Link href="/login" className="mt-8 inline-flex h-11 items-center bg-ink px-4 text-sm text-paper">Open the artist demo</Link>
    </article>
  );
}
