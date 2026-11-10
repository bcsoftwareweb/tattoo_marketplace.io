"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/auth";
import { safeNextPath } from "@/lib/permissions";
import { Button, Field, TextInput } from "@/components/ui";

export function LoginForm() {
  const { login, session } = useDemo();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(safeNextPath(params.get("next"), result.session.role));
  }

  return (
    <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-12 px-5 py-12 md:grid-cols-2 md:px-8">
      <div>
        <p className="font-display text-xs tracking-[0.22em]">BLACKLINE</p>
        <h1 className="mt-4 font-express text-5xl leading-none md:text-7xl">Sign in to the demo.</h1>
        <p className="mt-6 max-w-md text-sm leading-6 text-mute">One page for customers, artists, and administrators. These are simulated accounts. They are not real people, and the password is not a production credential.</p>
        {session ? (
          <p className="mt-6 text-sm">You are already signed in as {session.name}.</p>
        ) : null}
      </div>
      <form className="border border-line bg-white p-6" onSubmit={submit} noValidate>
        <div className="grid gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="border border-line px-3 py-3 text-left text-sm hover:border-ink"
              onClick={() => { setEmail(account.email); setPassword(DEMO_PASSWORD); setError(""); }}
            >
              <span className="block font-medium">{account.blurb}</span>
              <span className="text-mute">{account.email}</span>
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4">
          <Field label="Email" error={error && !email ? error : undefined}>
            <TextInput type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field label="Password">
            <div className="flex gap-2">
              <TextInput type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="button" className="h-11 border border-line px-3 text-sm" aria-pressed={show} onClick={() => setShow((value) => !value)}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </Field>
          {error ? <p role="alert" className="text-sm">{error}</p> : null}
          <Button type="submit">Sign in</Button>
        </div>
      </form>
    </div>
  );
}
