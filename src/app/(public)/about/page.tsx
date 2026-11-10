import Link from "next/link";

const frame = "mx-auto w-full max-w-[1440px] px-5 md:px-8";

export const metadata = { title: "About" };

const points = [
  ["The index", "Approved artists only. Each listing carries a neighborhood, the styles they tattoo, a starting price, and the next open day."],
  ["The page", "Portfolio, services, hours, and reviews are public before anyone sends a message. You can read a studio without an account."],
  ["The request", "A sitting starts as a written brief: the idea, placement, size, budget, references, and a day the artist has opened."],
  ["The answer", "The artist accepts, declines, or counters with another time and price. The date is held only after you confirm."],
];

export default function Page() {
  return (
    <article>
      <header className={`${frame} py-14 md:py-20`}>
        <p className="font-display text-xs uppercase tracking-[0.28em] text-mist">About</p>
        <h1 className="mt-4 max-w-4xl font-express text-[clamp(2.75rem,6vw,5.75rem)] leading-[0.9] tracking-[-0.045em]">
          Read the studio before you ask for the chair.
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-7 text-mist">
          Blackline is a marketplace of tattoo artists across New York. The work, the price, and the open dates live on one page, and the conversation stays attached to the request.
        </p>
      </header>

      <section className={`${frame} border-t border-panel py-14 md:py-20`}>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <h2 className="font-display text-3xl tracking-tight md:text-4xl">Built for the appointment, not the feed.</h2>
          <div className="grid max-w-xl gap-5 text-sm leading-7 text-mist lg:max-w-none">
            <p>
              Most tattoo booking still happens in direct messages. The portfolio is on one app, the price is a guess, and the calendar is a screenshot. Blackline puts those on the studio page so the first message is already a brief.
            </p>
            <p>
              The index runs from St. George to Mott Haven: Manhattan, Brooklyn, Queens, the Bronx, and Staten Island. Neighborhood is part of the listing, because the trip is part of the sitting.
            </p>
            <p>
              Artists are reviewed before they appear in search. A style with no approved artist stays empty. What you can open is what you can request.
            </p>
          </div>
        </div>
      </section>

      <section className={`${frame} border-t border-panel py-14 md:py-20`}>
        <h2 className="font-display text-3xl tracking-tight md:text-4xl">How the marketplace is set up</h2>
        <ol className="mt-10 grid gap-10 sm:grid-cols-2">
          {points.map(([title, body], index) => (
            <li key={title} className="min-w-0 border-t border-panel pt-5">
              <p className="font-display text-xs tracking-[0.18em] text-mute">0{index + 1}</p>
              <h3 className="mt-3 font-display text-2xl">{title}</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-mist">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${frame} border-t border-panel py-14 md:py-20`}>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="font-display text-xs uppercase tracking-[0.28em] text-mist">Clients</p>
            <h2 className="mt-4 font-display text-3xl tracking-tight">Find a chair you can book.</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-mist">
              Search by style, borough, price, and who has an open day. Save a studio, write the artist, and confirm a deposit only after the quote is agreed.
            </p>
            <Link href="/artists" className="mt-6 inline-flex h-11 items-center bg-white px-4 text-sm font-medium text-ink">Find artists</Link>
          </div>
          <div className="min-w-0">
            <p className="font-display text-xs uppercase tracking-[0.28em] text-mist">Studios</p>
            <h2 className="mt-4 font-display text-3xl tracking-tight">One desk for the room.</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-mist">
              Profile, portfolio, services, calendar, requests, and messages stay together. A platform fee comes off the artist side of a confirmed sitting. The client pays the quote they accepted.
            </p>
            <Link href="/for-artists" className="mt-6 inline-flex h-11 items-center border border-detail px-4 text-sm text-white">For artists</Link>
          </div>
        </div>
      </section>
    </article>
  );
}
