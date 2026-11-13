"use client";

import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import { BOROUGHS } from "@/lib/constants";
import { readImageFile } from "@/lib/files";
import type { ArtistApplication } from "@/lib/mutations";
import { Area, Button, Field, frame, Photo, SelectInput, TextInput } from "@/components/ui";

const empty: ArtistApplication = {
  name: "",
  email: "",
  phone: "",
  instagram: "",
  photo: "",
  borough: "",
  neighborhood: "",
  studioName: "",
  studioAddress: "",
  yearsExperience: 0,
  startingPrice: 0,
  styleIds: [],
  specialties: [],
  bio: "",
  licenseNumber: "",
  studioPermit: "",
  bloodbornePathogenDate: "",
  licenseExpiresOn: "",
  notes: "",
};

export function ArtistApplicationForm() {
  const { state, submitApplication, toast } = useDemo();
  const [form, setForm] = useState(empty);
  const [specialtyText, setSpecialtyText] = useState("");
  const [years, setYears] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ name: string; studio: string } | null>(null);

  function patch(next: Partial<ArtistApplication>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function toggleStyle(id: string) {
    patch({
      styleIds: form.styleIds.includes(id) ? form.styleIds.filter((item) => item !== id) : [...form.styleIds, id],
    });
  }

  async function addPortrait(file: File | undefined) {
    if (!file) return;
    try {
      patch({ photo: await readImageFile(file, 800) });
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Could not use that portrait.");
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const result = submitApplication({
      ...form,
      yearsExperience: Number(years),
      startingPrice: Number(price),
      specialties: specialtyText.split(","),
    });
    if (result.error || !result.id) {
      setError(result.error ?? "Could not submit the application.");
      return;
    }
    setSent({ name: form.name.trim(), studio: form.studioName.trim() });
  }

  if (sent) {
    return (
      <article className={`${frame} max-w-3xl py-16 md:py-24`}>
        <p className="text-xs uppercase tracking-[0.18em] text-mist">Artist application</p>
        <h1 className="mt-4 font-express text-5xl leading-none md:text-7xl">Application received.</h1>
        <p className="mt-8 max-w-xl text-sm leading-7 text-mist">
          {sent.name} at {sent.studio} is pending review. The profile stays out of search until an administrator approves the license and studio permit. This does not create a customer account.
        </p>
      </article>
    );
  }

  return (
    <article className={`${frame} py-14 md:py-20`}>
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-mist">Artist application</p>
        <h1 className="mt-4 font-express text-5xl leading-[0.9] md:text-7xl">Apply for a chair.</h1>
        <p className="mt-6 max-w-xl text-sm leading-7 text-mist">
          Tattoo artists use this form to join the index. An administrator reviews the license, studio permit, and portfolio note before the profile can be booked. Customer sign-in stays in the navigation.
        </p>
      </header>
      <form className="mt-12 grid w-full min-w-0 max-w-3xl gap-10" onSubmit={submit} noValidate>
        <section className="grid gap-4">
          <h2 className="font-display text-2xl">You</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <TextInput autoComplete="name" value={form.name} onChange={(event) => patch({ name: event.target.value })} required />
            </Field>
            <Field label="Email">
              <TextInput type="email" autoComplete="email" value={form.email} onChange={(event) => patch({ email: event.target.value })} required />
            </Field>
            <Field label="Phone">
              <TextInput type="tel" autoComplete="tel" value={form.phone} onChange={(event) => patch({ phone: event.target.value })} required />
            </Field>
            <Field label="Instagram" hint="Optional.">
              <TextInput value={form.instagram} onChange={(event) => patch({ instagram: event.target.value })} placeholder="@studio" />
            </Field>
          </div>
          <Field label="Portrait" hint="Optional. Stored only in this browser.">
            <input type="file" accept="image/*" className="block w-full min-w-0 max-w-full text-base text-mist" onChange={(event) => void addPortrait(event.target.files?.[0])} />
          </Field>
          {form.photo ? <Photo src={form.photo} alt="" className="h-28 w-28" /> : null}
        </section>

        <section className="grid gap-4">
          <h2 className="font-display text-2xl">Studio</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Borough">
              <SelectInput value={form.borough} onChange={(event) => patch({ borough: event.target.value })} required>
                <option value="">Select a borough</option>
                {BOROUGHS.map((borough) => <option key={borough} value={borough}>{borough}</option>)}
              </SelectInput>
            </Field>
            <Field label="Neighborhood">
              <TextInput value={form.neighborhood} onChange={(event) => patch({ neighborhood: event.target.value })} required />
            </Field>
            <Field label="Studio name">
              <TextInput value={form.studioName} onChange={(event) => patch({ studioName: event.target.value })} required />
            </Field>
            <Field label="Years tattooing">
              <TextInput inputMode="numeric" value={years} onChange={(event) => setYears(event.target.value)} required />
            </Field>
          </div>
          <Field label="Studio address">
            <TextInput autoComplete="street-address" value={form.studioAddress} onChange={(event) => patch({ studioAddress: event.target.value })} required />
          </Field>
          <Field label="Starting price" hint="The lowest piece you will book, in dollars.">
            <TextInput inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} required />
          </Field>
        </section>

        <section className="grid gap-4">
          <h2 className="font-display text-2xl">Work</h2>
          <fieldset>
            <legend className="text-sm font-medium">Styles</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {state.styles.map((style) => {
                const on = form.styleIds.includes(style.id);
                return (
                  <button
                    key={style.id}
                    type="button"
                    aria-pressed={on}
                    className={on ? "border border-white bg-white px-3 py-2 text-sm text-ink" : "border border-panel px-3 py-2 text-sm text-mist hover:text-white"}
                    onClick={() => toggleStyle(style.id)}
                  >
                    {style.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <Field label="Specialties" hint="Separate with commas. Up to six.">
            <TextInput value={specialtyText} onChange={(event) => setSpecialtyText(event.target.value)} placeholder="Fine line florals, Small script" required />
          </Field>
          <Field label="About the work" hint="Where you tattoo, what you take, and what you turn down.">
            <Area value={form.bio} onChange={(event) => patch({ bio: event.target.value })} required />
          </Field>
        </section>

        <section className="grid gap-4">
          <h2 className="font-display text-2xl">License</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="NYC tattoo license number">
              <TextInput value={form.licenseNumber} onChange={(event) => patch({ licenseNumber: event.target.value })} required />
            </Field>
            <Field label="Studio permit">
              <TextInput value={form.studioPermit} onChange={(event) => patch({ studioPermit: event.target.value })} required />
            </Field>
            <Field label="Bloodborne pathogen training">
              <TextInput type="date" value={form.bloodbornePathogenDate} max="2026-11-10" onChange={(event) => patch({ bloodbornePathogenDate: event.target.value })} required />
            </Field>
            <Field label="License expires">
              <TextInput type="date" value={form.licenseExpiresOn} min="2026-11-10" onChange={(event) => patch({ licenseExpiresOn: event.target.value })} required />
            </Field>
          </div>
          <Field label="Note for review" hint="Optional. Anything the administrator should check on the permit.">
            <Area value={form.notes} onChange={(event) => patch({ notes: event.target.value })} />
          </Field>
        </section>

        {error ? <p role="alert" className="text-sm text-mist">{error}</p> : null}
        <div>
          <Button type="submit" variant="inverse">Submit application</Button>
        </div>
      </form>
    </article>
  );
}
