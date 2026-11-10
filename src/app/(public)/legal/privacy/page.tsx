export const metadata = { title: "Privacy" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 text-sm leading-7 md:px-8">
      <h1 className="font-display text-4xl">Privacy</h1>
      <p className="mt-6 text-mute">This demo keeps data in localStorage on your device. It does not create an account on a server, send email, or transmit card details. Clearing site data or choosing Reset demo data removes the saved prototype state.</p>
    </article>
  );
}
