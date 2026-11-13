"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import { readImageFile } from "@/lib/files";
import { formatDateTime } from "@/lib/format";
import { conversationsFor } from "@/lib/selectors";
import { Empty, Photo } from "@/components/ui";

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M20.5 16l-5-5-8 8" />
    </svg>
  );
}

export function Inbox({ role }: { role: "customer" | "artist" }) {
  const { state, session, postMessage, toast } = useDemo();
  const params = useSearchParams();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<{ name: string; url: string } | null>(null);
  const [error, setError] = useState("");
  if (!session) return null;
  const threads = conversationsFor(state, role, session.userId);
  const requested = params.get("thread");
  const open = threads.find((thread) => thread.id === requested);
  const active = open ?? threads[0];
  if (!threads.length) return <Empty title="No conversations" body="Messages appear here after you contact an artist or receive a request." />;

  const base = role === "customer" ? "/customer/messages" : "/artist/messages";
  const person = (thread: (typeof threads)[number]) => {
    if (role === "customer") {
      const artist = state.artists.find((item) => item.id === thread.artistId);
      return { name: artist?.name ?? "Conversation", photo: artist?.photo, detail: artist?.studioName ?? "", href: artist ? `/artists/${artist.slug}` : null };
    }
    const customer = state.customers.find((item) => item.id === thread.customerId);
    return { name: customer?.name ?? "Conversation", photo: customer?.photo, detail: customer ? `${customer.neighborhood}, ${customer.borough}` : "", href: null };
  };

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const url = await readImageFile(file, 720);
      setAttachment({ name: file.name, url });
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Could not attach that image.");
    }
  }

  function send(event: React.FormEvent) {
    event.preventDefault();
    if (!active) return;
    const failure = postMessage(active.id, body, attachment);
    if (failure) return setError(failure);
    setBody("");
    setAttachment(null);
    setError("");
  }

  const other = active ? person(active) : null;

  return (
    <div className="grid h-[calc(100svh-7rem)] min-w-0 grid-rows-[minmax(0,1fr)] overflow-hidden border border-line bg-white md:h-[calc(100svh-8rem)] lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className={`min-h-0 flex-col border-line lg:flex lg:border-r ${open ? "hidden" : "flex"}`}>
        <h1 className="border-b border-line px-4 py-4 font-display text-2xl">Messages</h1>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {threads.map((thread) => {
            const who = person(thread);
            const last = thread.messages[thread.messages.length - 1];
            const selected = active?.id === thread.id;
            return (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => router.push(`${base}?thread=${thread.id}`)}
                  className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left hover:bg-[#252525] ${selected ? "lg:bg-[#2a2a2a]" : ""}`}
                >
                  <Photo src={who.photo} alt="" className="h-12 w-12 shrink-0 rounded-full" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{who.name}</span>
                      {last ? <span className="shrink-0 text-xs text-mute">{shortDate(last.createdAt)}</span> : null}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-mute">{last?.body || (last?.attachment ? "Photo" : "No messages yet")}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {active && other ? (
        <section className={`min-h-0 min-w-0 flex-col lg:flex ${open ? "flex" : "hidden"}`}>
          <header className="flex items-center gap-3 border-b border-line px-2 py-2.5 lg:px-4">
            <button type="button" aria-label="Back to messages" className="grid h-10 w-10 shrink-0 place-items-center lg:hidden" onClick={() => router.push(base)}>
              <BackIcon />
            </button>
            <Photo src={other.photo} alt="" className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0">
              {other.href ? (
                <Link href={other.href} className="block truncate text-sm font-medium">{other.name}</Link>
              ) : (
                <p className="truncate text-sm font-medium">{other.name}</p>
              )}
              {other.detail ? <p className="truncate text-xs text-mute">{other.detail}</p> : null}
            </div>
          </header>

          <ol className="flex min-h-0 flex-1 flex-col-reverse gap-2 overflow-y-auto px-3 py-4 lg:px-5">
            {[...active.messages].reverse().map((message) => {
              const mine = message.senderId === session.userId;
              return (
                <li key={message.id} className={`flex max-w-[80%] flex-col ${mine ? "ml-auto items-end" : "items-start"}`}>
                  <div className={`rounded-2xl px-3.5 py-2 text-sm leading-6 ${mine ? "rounded-br-md bg-[#d9d9d9] text-[#151515]" : "rounded-bl-md bg-[#2a2a2a] text-[#e2e2e2]"}`}>
                    {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}
                    {message.attachment ? (
                      <Photo src={message.attachment.url} alt={message.attachment.name} className={`max-h-56 w-full rounded-xl ${message.body ? "mt-2" : ""}`} />
                    ) : null}
                  </div>
                  <p className="mt-1 px-1 text-[11px] text-mute">{formatDateTime(message.createdAt)}</p>
                </li>
              );
            })}
          </ol>

          <form className="border-t border-line px-3 py-3" onSubmit={send}>
            {attachment ? (
              <div className="mb-2 flex items-center gap-3">
                <Photo src={attachment.url} alt={attachment.name} className="h-14 w-14 rounded-lg" />
                <button type="button" className="text-sm text-mute" onClick={() => setAttachment(null)}>Remove photo</button>
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-line" title="Attach a photo">
                <span className="sr-only">Attach a photo</span>
                <AttachIcon />
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => void onFile(event.target.files?.[0])} />
              </label>
              <label className="min-w-0 flex-1">
                <span className="sr-only">Message</span>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={1}
                  className="block max-h-32 min-h-11 w-full resize-none rounded-3xl border border-line bg-white px-4 py-2.5 text-base outline-none md:text-sm"
                  placeholder="Message"
                />
              </label>
              <button type="submit" className="h-11 shrink-0 rounded-full bg-[#d9d9d9] px-4 text-sm font-medium text-[#151515] disabled:opacity-40" disabled={!body.trim() && !attachment}>
                Send
              </button>
            </div>
            {error ? <p role="alert" className="mt-2 text-sm">{error}</p> : null}
          </form>
        </section>
      ) : null}
    </div>
  );
}
