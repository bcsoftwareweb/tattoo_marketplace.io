import { ContactDetails } from "@/components/support";

export const metadata = { title: "Contact" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 text-sm leading-7 md:px-8">
      <h1 className="font-display text-4xl">Contact</h1>
      <ContactDetails />
    </article>
  );
}
