"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/auth";
import { safeNextPath } from "@/lib/permissions";
import { Button, Field, TextInput } from "@/components/ui";

export function LoginForm() {
  const { login, register, session } = useDemo();
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function finish(role: "customer" | "artist" | "admin") {
    router.push(safeNextPath(params.get("next"), role));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setNotice("");
    if (mode === "sign-up") {
      const result = register(name, email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      finish(result.session.role);
      return;
    }
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    finish(result.session.role);
  }

  const signingUp = mode === "sign-up";

  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <form className="bg-white px-8 py-10 text-ink" onSubmit={submit} noValidate>
          <p className="text-center font-display text-2xl tracking-[0.16em]">BLACKLINE</p>
          <h1 className="mt-6 text-center font-display text-3xl">{signingUp ? "Create an account" : "Welcome"}</h1>
          <p className="mt-3 text-center text-sm text-mute">
            {signingUp ? "Save work, message artists, and request appointments." : "Sign in to continue."}
          </p>
          {session ? <p className="mt-4 text-center text-sm">You are already signed in as {session.name}.</p> : null}
          <div className="mt-8 grid gap-4">
            {signingUp ? (
              <Field label="Name">
                <TextInput autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
              </Field>
            ) : null}
            <Field label="Email address">
              <TextInput type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Field label="Password">
              <div className="relative">
                <TextInput
                  type={show ? "text" : "password"}
                  autoComplete={signingUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-11"
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-mute" aria-pressed={show} aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((value) => !value)}>
                  <Eye open={show} />
                </button>
              </div>
            </Field>
            {signingUp ? null : (
              <button
                type="button"
                className="justify-self-start text-sm underline"
                onClick={() => {
                  setError("");
                  setNotice("Sample accounts use the password Demo123!.");
                }}
              >
                Reset password
              </button>
            )}
            {error ? <p role="alert" className="text-sm">{error}</p> : null}
            {notice ? <p className="text-sm text-mute">{notice}</p> : null}
            <Button type="submit" className="w-full">{signingUp ? "Create account" : "Continue"}</Button>
          </div>
          <p className="mt-6 text-center text-sm">
            {signingUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              className="underline"
              onClick={() => {
                setMode(signingUp ? "sign-in" : "sign-up");
                setError("");
                setNotice("");
              }}
            >
              {signingUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </form>
        {signingUp ? null : (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.16em] text-mist">Sample accounts</p>
            <div className="mt-3 grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="text-left text-sm text-mist hover:text-white"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(DEMO_PASSWORD);
                    setError("");
                    setNotice("");
                  }}
                >
                  {account.blurb}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Eye({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {open ? null : <path d="M5 19 L19 5" stroke="currentColor" strokeWidth="1.6" />}
    </svg>
  );
}
