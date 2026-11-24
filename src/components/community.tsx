"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDemo } from "@/context/demo-context";
import { hashtagLabel } from "@/lib/hashtags";
import { formatDateTime } from "@/lib/format";
import { Button, Empty, frame, Photo } from "@/components/ui";

export function CommunityPage() {
  const { state, session } = useDemo();
  const [query, setQuery] = useState("");

  const posts = useMemo(() => {
    const terms = query
      .trim()
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((term) => term.replace(/^#+/, ""))
      .filter(Boolean);

    return (Array.isArray(state.posts) ? state.posts : [])
      .filter((post) => post.status === "published")
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
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.posts, state.customers, state.artists, query]);

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
          ) : (
            <Button href="/login">Sign in to post</Button>
          )}
        </div>
      </header>

      <form className="mt-8 max-w-xl" onSubmit={(event) => event.preventDefault()}>
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

      <div className="mt-6 flex items-center justify-between border-b border-panel pb-4">
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
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {posts.map((post) => {
            const customer = state.customers.find((item) => item.id === post.customerId);
            const author = post.authorRole === "artist"
              ? state.artists.find((item) => item.id === post.authorId)
              : customer;
            const artist = post.artistId
              ? state.artists.find((item) => item.id === post.artistId)
              : null;
            const taggedArtists = (post.taggedArtistIds ?? [])
              .map((id) => state.artists.find((item) => item.id === id))
              .filter((item): item is (typeof state.artists)[number] => Boolean(item));
            return (
              <article key={post.id} className="mb-4 break-inside-avoid border border-panel bg-ink">
                <Photo src={post.image} alt={post.caption} className="w-full" />
                <div className="grid gap-3 p-4">
                  <div>
                    {author ? (
                      <p className="text-sm font-medium">{author.name}</p>
                    ) : (
                      <p className="text-sm font-medium">Community member</p>
                    )}
                    {artist ? (
                      <Link href={`/artists/${artist.slug}`} className="mt-1 block text-xs text-mute hover:text-white">
                        Tattoo by {artist.name}
                      </Link>
                    ) : null}
                    {taggedArtists.length ? (
                      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                        {taggedArtists.map((item) => (
                          <Link key={item.id} href={`/artists/${item.slug}`} className="text-xs text-mist hover:text-white">
                            @{item.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6 text-mist">{post.caption}</p>
                  {post.placement ? (
                    <p className="text-xs uppercase tracking-[0.14em] text-mute">{post.placement}</p>
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
                  <p className="text-xs text-mute">{formatDateTime(post.createdAt)}</p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8">
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
