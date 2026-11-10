"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import { readImageFile } from "@/lib/files";
import { formatDateTime } from "@/lib/format";
import { conversationsFor } from "@/lib/selectors";
import { Button, Empty, Photo } from "@/components/ui";

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
  const active = threads.find((thread) => thread.id === requested) ?? threads[0];

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

  if (!threads.length) return <Empty title="No conversations" body="Messages appear here after you contact an artist or receive a request." />;

  return (
    <div className="grid min-h-[70vh] min-w-0 border border-line bg-white md:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-b border-line md:border-r md:border-b-0">
        <ul>
          {threads.map((thread) => {
            const otherId = role === "customer" ? thread.artistId : thread.customerId;
            const other = role === "customer"
              ? state.artists.find((artist) => artist.id === otherId)
              : state.customers.find((customer) => customer.id === otherId);
            const last = thread.messages[thread.messages.length - 1];
            const selected = active?.id === thread.id;
            return (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => router.replace(role === "customer" ? `/customer/messages?thread=${thread.id}` : `/artist/messages?thread=${thread.id}`)}
                  className={`block w-full border-b border-line px-4 py-3 text-left ${selected ? "bg-paper" : "bg-white"}`}
                >
                  <span className="block text-sm font-medium">{other?.name ?? "Conversation"}</span>
                  <span className="mt-1 line-clamp-2 block text-xs text-mute">{last?.body || "No messages yet"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      {active ? (
        <section className="flex min-h-[60vh] flex-col">
          <header className="border-b border-line px-4 py-3 text-sm">
            {role === "customer"
              ? state.artists.find((artist) => artist.id === active.artistId)?.studioName
              : state.customers.find((customer) => customer.id === active.customerId)?.neighborhood}
          </header>
          <ol className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            {active.messages.map((message) => {
              const mine = message.senderId === session.userId;
              return (
                <li key={message.id} className={mine ? "ml-auto max-w-[80%] bg-ink px-3 py-2 text-sm text-white" : "max-w-[80%] border border-line px-3 py-2 text-sm"}>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  {message.attachment ? (
                    <figure className="mt-2">
                      <Photo src={message.attachment.url} alt={message.attachment.name} className="max-h-48 w-full" />
                      <figcaption className="mt-1 text-xs opacity-70">{message.attachment.name}</figcaption>
                    </figure>
                  ) : null}
                  <p className="mt-2 text-[11px] opacity-70">{formatDateTime(message.createdAt)}</p>
                </li>
              );
            })}
          </ol>
          <form className="border-t border-line p-4" onSubmit={send}>
            {attachment ? (
              <div className="mb-3 flex items-center gap-3">
                <Photo src={attachment.url} alt={attachment.name} className="h-16 w-16" />
                <button type="button" className="text-sm text-mute" onClick={() => setAttachment(null)}>Remove image</button>
              </div>
            ) : null}
            <label className="block text-sm">
              <span className="sr-only">Message</span>
              <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} className="w-full border border-line px-3 py-2" placeholder="Write a message" />
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="text-sm">
                <span className="cursor-pointer border border-line px-3 py-2">Attach image</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => void onFile(event.target.files?.[0])} />
              </label>
              <Button type="submit">Send</Button>
            </div>
            {error ? <p role="alert" className="mt-2 text-sm">{error}</p> : null}
          </form>
        </section>
      ) : null}
    </div>
  );
}
