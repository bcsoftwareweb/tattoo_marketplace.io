"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-6 text-white">
      <div className="max-w-lg">
        <h1 className="font-display text-4xl">Something went wrong.</h1>
        <p className="mt-3 text-sm text-mute">The page failed to load. You can try again without losing anything you saved.</p>
        <button type="button" className="mt-6 h-11 bg-white px-4 text-sm text-ink" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
