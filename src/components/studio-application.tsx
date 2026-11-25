"use client";

import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import { BOROUGHS } from "@/lib/constants";
import { readImageFile } from "@/lib/files";
import type { StudioApplication } from "@/lib/mutations";
import { Area, Button, Field, frame, Photo, SelectInput, TextInput } from "@/components/ui";

const empty: StudioApplication = {
  name: "",
  email: "",
  phone: "",
  website: "",
  photo: "",
  borough: "",
  neighborhood: "",
  address: "",
  bio: "",
  representativeName: "",
  representativeRole: "",
  studioPermit: "",
  permitDocument: "",
  artistsCount: 1,
  openingDate: "",
  instagram: "",
};

export function StudioApplicationForm() {
  const { submitStudioApplication, toast } = useDemo();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  function patch(next: Partial<StudioApplication>) {
    setForm((current) => ({ ...current, ...next }));
  }

  async function addPhoto(file: File | undefined) {
    if (!file) return;
    try {
      patch({ photo: await readImageFile(file, 800) });
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Could not use that image.");
    }
  }

  async function addPermit(file: File | undefined) {
    if (!file) return;
    try {
      patch({ permitDocument: await readImageFile(file, 1600) });
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Could not use that permit.");
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const result = submitStudioApplication(form);
    if (result.error || !result.id) {
      setError(result.error ?? "Could not submit the studio application.");
      return;
    }
    setSent(form.name.trim());
  }

  if (sent) {
    return (
      <article className={`${frame} max-w-3xl py-16 md:py-24`}>
        <p className="text-xs uppercase tracking-[0.18em] text-mist">Studio application</p>
        <h1 className="mt-4 font-express text-5xl leading-none md:text-7xl">Studio received.</h1>
        <p className="mt-8 max-w-xl text-sm leading-7 text-mist">
          {sent} is pending organization review. An administrator will verify the studio permit and business details before the studio account is activated.
        </p>
      </article>
    );
  }

  return (
    <article className={`${frame} py-14 md:py-20`}>
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-mist">Studio application</p>
        <h1 className="mt-4 font-express text-5xl leading-[0.9] md:text-7xl">Bring your shop.</h1>
        <p className="mt-6 max-w-xl text-sm leading-7 text-mist">
          Apply to add a tattoo studio or organization to BLACKLINE. This is separate from an individual artist profile and is reviewed for business details and a valid studio permit.
        </p>
      </header>
      <form className="application-form mt-12 grid w-full min-w-0 max-w-3xl gap-10" onSubmit={submit} noValidate>
        <section className="grid gap-4">
          <h2 className="font-display text-2xl">Studio</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Studio name"><TextInput value={form.name} onChange={(event) => patch({ name: event.target.value })} required /></Field>
            <Field label="Studio email"><TextInput type="email" value={form.email} onChange={(event) => patch({ email: event.target.value })} required /></Field>
            <Field label="Studio phone"><TextInput type="tel" value={form.phone} onChange={(event) => patch({ phone: event.target.value })} required /></Field>
            <Field label="Website" hint="Optional."><TextInput value={form.website} onChange={(event) => patch({ website: event.target.value })} placeholder="https://" /></Field>
            <Field label="Instagram" hint="Optional."><TextInput value={form.instagram} onChange={(event) => patch({ instagram: event.target.value })} placeholder="@studio" /></Field>
            <Field label="Number of resident artists"><TextInput inputMode="numeric" value={form.artistsCount} onChange={(event) => patch({ artistsCount: Number(event.target.value) })} required /></Field>
          </div>
          <Field label="Studio photo" hint="Optional.">
            <input type="file" accept="image/*" className="block w-full min-w-0 max-w-full text-base text-mist" onChange={(event) => void addPhoto(event.target.files?.[0])} />
          </Field>
          {form.photo ? <Photo src={form.photo} alt="" className="h-28 w-28" /> : null}
          <Field label="About the studio" hint="Identity, focus, resident artists, and what makes the shop different.">
            <Area value={form.bio} onChange={(event) => patch({ bio: event.target.value })} required />
          </Field>
        </section>

        <section className="grid gap-4">
          <h2 className="font-display text-2xl">Location</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Borough">
              <SelectInput value={form.borough} onChange={(event) => patch({ borough: event.target.value })} required>
                <option value="">Select a borough</option>
                {BOROUGHS.map((borough) => <option key={borough} value={borough}>{borough}</option>)}
              </SelectInput>
            </Field>
            <Field label="Neighborhood"><TextInput value={form.neighborhood} onChange={(event) => patch({ neighborhood: event.target.value })} required /></Field>
          </div>
          <Field label="Full street address"><TextInput autoComplete="street-address" value={form.address} onChange={(event) => patch({ address: event.target.value })} required /></Field>
        </section>

        <section className="grid gap-4">
          <h2 className="font-display text-2xl">Business representative</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Representative name"><TextInput autoComplete="name" value={form.representativeName} onChange={(event) => patch({ representativeName: event.target.value })} required /></Field>
            <Field label="Role"><TextInput value={form.representativeRole} onChange={(event) => patch({ representativeRole: event.target.value })} placeholder="Owner, manager, studio director" required /></Field>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="font-display text-2xl">Verification</h2>
          <Field label="Studio permit number"><TextInput value={form.studioPermit} onChange={(event) => patch({ studioPermit: event.target.value })} required /></Field>
          <Field label="Permit or business document"><input type="file" accept="image/*" className="block w-full min-w-0 max-w-full text-base text-mist" onChange={(event) => void addPermit(event.target.files?.[0])} required={!form.permitDocument} /></Field>
          {form.permitDocument ? <Photo src={form.permitDocument} alt="" className="max-h-80 w-auto max-w-full" /> : null}
          <Field label="Expected opening date" hint="Optional for an existing studio."><TextInput type="date" value={form.openingDate} onChange={(event) => patch({ openingDate: event.target.value })} /></Field>
        </section>

        {error ? <p role="alert" className="text-sm">{error}</p> : null}
        <Button type="submit" className="justify-self-start">Submit studio application</Button>
      </form>
    </article>
  );
}
