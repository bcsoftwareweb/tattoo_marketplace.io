export const metadata = { title: "How it works" };

const frame = "mx-auto w-full max-w-[1440px] px-5 md:px-8";

const steps = [
  ["Find a chair", "Search by style, borough, price, and who actually has an open day."],
  ["Write the request", "Pick a service or ask for a custom quote, describe the tattoo, and attach a reference."],
  ["Let the artist answer", "They can accept, decline, or propose another time and price. You confirm before any deposit."],
  ["Confirm in the demo", "Checkout records a simulated deposit. The date moves to confirmed. No bank is involved."],
];

export default function Page() {
  return (
    <article className="flex min-h-[calc(100svh-4rem)] flex-col justify-center">
      <div className={`${frame} py-8 md:py-10`}>
        <h1 className="max-w-4xl font-express text-[clamp(2.75rem,5vw,4.75rem)] leading-[0.9] tracking-[-0.045em]">How a booking moves.</h1>
        <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-6">
          {steps.map(([title, body], index) => (
            <li key={title} className="min-w-0">
              <p className="font-display text-xs tracking-[0.18em] text-mute">0{index + 1}</p>
              <h2 className="mt-2 font-display text-2xl md:text-3xl">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-mute">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
