"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDemo } from "@/context/demo-context";
import { FlashVideo } from "@/components/flash-video";
import { RelativeTime } from "@/components/relative-time";
import { hashtagLabel } from "@/lib/hashtags";
import { Button, Empty, frame, Photo } from "@/components/ui";
import type { PostComment, Role } from "@/lib/types";

function displayName(state: ReturnType<typeof useDemo>["state"], role: Role, userId: string) {
  if (role === "customer") return state.customers.find((item) => item.id === userId)?.name ?? "Community member";
  if (role === "artist") return state.artists.find((item) => item.id === userId)?.name ?? "Artist";
  if (role === "shop") return state.shops.find((item) => item.id === userId)?.name ?? "Tattoo shop";
  return "BLACKLINE";
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M20.8 8.7c0 4.1-8.8 10-8.8 10s-8.8-5.9-8.8-10a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.2 11.6a8.2 8.2 0 0 1-8.4 8.1 9 9 0 0 1-3.6-.7L3 20l1.2-4.1a7.8 7.8 0 0 1-1.3-4.3 8.2 8.2 0 0 1 8.5-8.1 8.2 8.2 0 0 1 8.8 8.1Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CommunityPage() {
  const { state, session, likePost, commentOnPost, toast } = useDemo();
  const [query, setQuery] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [feedFilter, setFeedFilter] = useState<"all" | "posts" | "flashes">("all");

  const posts = useMemo(() => {
    const terms = query
      .trim()
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((term) => term.replace(/^#+/, ""))
      .filter(Boolean);

    return (Array.isArray(state.posts) ? state.posts : [])
      .filter((post) => post.status === "published")
      .filter((post) => feedFilter === "all" || (feedFilter === "flashes" ? post.mediaType === "video" : post.mediaType !== "video"))
      .filter((post) => {
        if (!terms.length) return true;
        const customer = state.customers.find((item) => item.id === post.customerId);
        const author = post.authorRole === "artist"
          ? state.artists.find((item) => item.id === post.authorId)
          : customer;
        const artist = post.artistId
          ? state.artists.find((item) => item.id === post.artistId)
          : null;
        const taggedArtists = (post.taggedArtistIds ?? [])
          .map((id) => state.artists.find((item) => item.id === id))
          .filter(Boolean);
        const haystack = [
          post.caption,
          post.placement,
          author?.name,
          customer?.name,
          customer?.borough,
          customer?.neighborhood,
          artist?.name,
          artist?.borough,
          artist?.neighborhood,
          ...post.hashtags,
          ...taggedArtists.flatMap((item) => item ? [item.name, item.neighborhood, item.borough] : []),
        ].join(" ").toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => Number(a.authorRole === "artist") - Number(b.authorRole === "artist") || b.createdAt.localeCompare(a.createdAt));
  }, [state.posts, state.customers, state.artists, query, feedFilter]);

  const handleComment = (event: React.FormEvent<HTMLFormElement>, postId: string) => {
    event.preventDefault();
    const body = commentDrafts[postId] ?? "";
    if (!body.trim()) return;
    if (!session) {
      toast("Sign in to join the conversation.");
      return;
    }
    const error = commentOnPost(postId, body);
    if (!error) setCommentDrafts((drafts) => ({ ...drafts, [postId]: "" }));
  };

  return (
    <div className={`${frame} py-10 md:py-16`}>
      <header className="grid items-end gap-6 border-b border-panel pb-8 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-mist">Community</p>
          <h1 className="mt-4 max-w-3xl font-express text-[clamp(2.75rem,5vw,5.5rem)] leading-[0.9] tracking-[-0.045em]">
            Tattoos, shared.
          </h1>
        </div>
        <div className="lg:justify-self-end">
          {session?.role === "customer" ? (
            <Button href="/customer/posts">Post your tattoo</Button>
          ) : session?.role === "artist" ? (
            <Button href="/artist/posts">Post to community</Button>
          ) : session ? null : (
            <Button href="/login">Sign in to post</Button>
          )}
        </div>
      </header>

      <form className="mx-auto mt-8 max-w-xl" onSubmit={(event) => event.preventDefault()}>
        <label>
          <span className="sr-only">Search the tattoo community</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people, locations, or #tattoo-style"
            className="h-12 w-full border border-detail bg-ink px-4 text-sm text-white outline-none"
          />
        </label>
      </form>

      <div className="mx-auto mt-6 flex max-w-xl gap-6 border-b border-panel" role="tablist" aria-label="Community feed type">
        {([
          ["all", "All"],
          ["posts", "Posts"],
          ["flashes", "Flashes"],
        ] as const).map(([filter, label]) => (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={feedFilter === filter}
            className={`border-b-2 px-1 pb-3 text-sm ${feedFilter === filter ? "border-white text-white" : "border-transparent text-mute hover:text-white"}`}
            onClick={() => setFeedFilter(filter)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-6 flex max-w-xl items-center justify-between border-b border-panel pb-4">
        <p className="font-display text-xs uppercase tracking-[0.18em] text-mist">
          {posts.length} post{posts.length === 1 ? "" : "s"}
        </p>
        {query ? (
          <button type="button" className="text-sm text-mist hover:text-white" onClick={() => setQuery("")}>
            Clear
          </button>
        ) : null}
      </div>

      {posts.length ? (
        <div className="mx-auto mt-8 grid max-w-xl gap-7">
          {posts.map((post) => {
            const customer = state.customers.find((item) => item.id === post.customerId);
            const author = post.authorRole === "artist"
              ? state.artists.find((item) => item.id === post.authorId)
              : customer;
            const authorName = author?.name ?? "Community member";
            const artist = post.artistId
              ? state.artists.find((item) => item.id === post.artistId)
              : null;
            const taggedArtists = (post.taggedArtistIds ?? [])
              .map((id) => state.artists.find((item) => item.id === id))
              .filter((item): item is (typeof state.artists)[number] => Boolean(item));
            const likes = post.likes ?? [];
            const comments = post.comments ?? [];
            const liked = Boolean(session && likes.some((like) => like.role === session.role && like.userId === session.userId));

            return (
              <article key={post.id} className="overflow-hidden border border-panel bg-ink">
                <header className="flex items-center gap-3 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-detail bg-panel font-display text-xs text-white" aria-hidden="true">
                    {initials(authorName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{authorName}</p>
                    <p className="truncate text-xs text-mute">
                      {artist ? `Tattoo by ${artist.name}` : post.placement || "Tattoo community"}
                      {author?.neighborhood ? ` · ${author.neighborhood}` : ""}
                    </p>
                  </div>
                </header>

                <div className="relative">
                  {post.mediaType === "video" && post.videoId ? (
                    <FlashVideo videoId={post.videoId} caption={post.caption} className="max-h-[70vh] w-full bg-black object-contain" />
                  ) : (
                    <Photo src={post.image} alt={post.caption} className="max-h-[70vh] w-full bg-panel object-contain" />
                  )}
                  {post.mediaType === "video" ? (
                    <span className="pointer-events-none absolute left-3 top-3 bg-ink/80 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white">Flash</span>
                  ) : null}
                </div>

                <div className="grid gap-3 p-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      aria-label={liked ? "Unlike post" : "Like post"}
                      aria-pressed={liked}
                      className={`inline-flex items-center gap-2 text-sm transition-colors hover:text-mist ${liked ? "text-white" : "text-mist"}`}
                      onClick={() => likePost(post.id)}
                    >
                      <Heart filled={liked} />
                      <span>Like</span>
                    </button>
                    <a href={`#comments-${post.id}`} aria-label="View comments" className="inline-flex items-center gap-2 text-sm text-mist hover:text-white">
                      <CommentIcon />
                      <span>Comment</span>
                    </a>
                  </div>

                  <p className="text-sm font-semibold text-white">
                    {likes.length} like{likes.length === 1 ? "" : "s"}
                  </p>

                  <div className="text-sm leading-6">
                    <span className="mr-2 font-semibold text-white">{authorName}</span>
                    <span className="text-mist">{post.caption}</span>
                  </div>

                  {artist ? (
                    <Link href={`/artists/${artist.slug}`} className="text-xs text-mist hover:text-white">
                      Tattoo by {artist.name}
                    </Link>
                  ) : null}
                  {taggedArtists.length ? (
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {taggedArtists.map((item) => (
                        <Link key={item.id} href={`/artists/${item.slug}`} className="text-xs text-mist hover:text-white">
                          @{item.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {post.hashtags.length ? (
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {post.hashtags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="text-xs text-mist hover:text-white"
                          onClick={() => setQuery(hashtagLabel(tag))}
                        >
                          {hashtagLabel(tag)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <RelativeTime dateTime={post.createdAt} className="text-[11px] text-mute" />

                  <section id={`comments-${post.id}`} className="grid gap-3 border-t border-panel pt-3" aria-label="Comments">
                    {comments.map((comment: PostComment) => (
                      <p key={comment.id} className="text-sm leading-5 text-mist">
                        <span className="mr-2 font-semibold text-white">{displayName(state, comment.role, comment.userId)}</span>
                        {comment.body}
                      </p>
                    ))}
                    {session ? (
                      <form className="flex items-center gap-3 border-t border-panel pt-3" onSubmit={(event) => handleComment(event, post.id)}>
                        <label className="sr-only" htmlFor={`comment-input-${post.id}`}>Add a comment</label>
                        <input
                          id={`comment-input-${post.id}`}
                          value={commentDrafts[post.id] ?? ""}
                          onChange={(event) => setCommentDrafts((drafts) => ({ ...drafts, [post.id]: event.target.value }))}
                          maxLength={500}
                          placeholder="Add a comment..."
                          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-mute"
                        />
                        <button type="submit" disabled={!(commentDrafts[post.id] ?? "").trim()} className="text-sm font-semibold text-mist hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                          Post
                        </button>
                      </form>
                    ) : (
                      <p className="border-t border-panel pt-3 text-sm text-mute">
                        <Link href="/login" className="text-mist hover:text-white">Sign in</Link> to join the conversation.
                      </p>
                    )}
                  </section>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-xl">
          <Empty
            title="No community posts match"
            body="Try a location, artist, placement, or hashtag."
            action={<Button type="button" variant="secondary" onClick={() => setQuery("")}>Clear search</Button>}
          />
        </div>
      )}
    </div>
  );
}
