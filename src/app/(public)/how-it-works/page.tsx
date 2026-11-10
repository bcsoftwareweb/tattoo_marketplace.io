export const metadata = { title: "How it works" };

const steps = [
  ["Find a chair", "Search by style, borough, price, and who actually has an open day."],
  ["Write the request", "Pick a service or ask for a custom quote, describe the tattoo, and attach a reference."],
  ["Let the artist answer", "They can accept, decline, or propose another time and price. You confirm before any deposit."],
  ["Confirm in the demo", "Checkout records a simulated deposit. The date moves to confirmed. No bank is involved."],
];

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 md:px-8">
      <h1 className="font-express text-5xl leading-none md:text-7xl">How a booking moves.</h1>
      <ol className="mt-12 grid gap-8">
        {steps.map(([title, body], index) => (
          <li key={title}>
            <p className="text-xs tracking-[0.18em] text-mute">0{index + 1}</p>
            <h2 className="mt-2 font-display text-3xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-mute">{body}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}
