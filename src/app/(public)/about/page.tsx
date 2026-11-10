export const metadata = { title: "About" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 md:px-8">
      <p className="text-xs uppercase tracking-[0.18em] text-mute">About the demo</p>
      <h1 className="mt-4 font-express text-5xl leading-none md:text-7xl">A marketplace you can click through.</h1>
      <div className="mt-8 grid gap-4 text-sm leading-7 text-mute">
        <p>Blackline is a frontend prototype of a New York tattoo marketplace. It is meant for conversations with artists, customers, and partners, not for taking real bookings.</p>
        <p>Profiles, messages, calendars, and payments live in this browser. Refreshing keeps your edits. Reset demo data puts the sample city back.</p>
        <p>There is no production account system, no card processing, and no message that leaves the page.</p>
      </div>
    </article>
  );
}
