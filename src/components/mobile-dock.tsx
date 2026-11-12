"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { PublicFooter, PublicHeader } from "@/components/chrome";
import { useDemo } from "@/context/demo-context";
import { homeFor } from "@/lib/permissions";
import { ADMIN_PROFILE } from "@/lib/seed";

interface SearchDockValue {
  open: boolean;
}

const SearchDockContext = createContext<SearchDockValue | null>(null);

export function useSearchDock() {
  return useContext(SearchDockContext);
}

function isHome(pathname: string) {
  return pathname === "/" || pathname === "";
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!isHome(pathname)) setSearchOpen(false);
  }, [pathname]);

  return (
    <SearchDockContext.Provider value={{ open: searchOpen }}>
      <PublicHeader />
      <div id="content" className="min-w-0">{children}</div>
      <PublicFooter />
      <MobileDock searchOpen={searchOpen} setSearchOpen={setSearchOpen} />
    </SearchDockContext.Provider>
  );
}

function MobileDock({ searchOpen, setSearchOpen }: { searchOpen: boolean; setSearchOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, state } = useDemo();
  const home = isHome(pathname);
  const accountHref = session ? homeFor(session.role) : "/login";
  const photo = accountPhoto(session, state);

  function openSearch() {
    if (!home) {
      setSearchOpen(true);
      router.push("/");
      return;
    }
    setSearchOpen(!searchOpen);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-panel bg-ink pb-[env(safe-area-inset-bottom)] text-white md:hidden" aria-label="Mobile">
      <ul className="grid h-14 grid-cols-3">
        <li>
          <Link
            href="/"
            className={`flex h-full flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.14em] ${home && !searchOpen ? "text-white" : "text-mist"}`}
            onClick={() => setSearchOpen(false)}
          >
            <HomeIcon active={home && !searchOpen} />
            Home
          </Link>
        </li>
        <li>
          <button
            type="button"
            className={`flex h-full w-full flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.14em] ${searchOpen ? "text-white" : "text-mist"}`}
            aria-expanded={searchOpen}
            aria-controls="mobile-search"
            onClick={openSearch}
          >
            <SearchIcon active={searchOpen} />
            Search
          </button>
        </li>
        <li>
          <Link
            href={accountHref}
            className="flex h-full flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.14em] text-mist"
            aria-label={session ? `Profile, ${session.name}` : "Sign in"}
          >
            <AccountMark src={photo} />
            {session ? "Profile" : "Sign in"}
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function accountPhoto(session: { role: string; userId: string } | null, state: ReturnType<typeof useDemo>["state"]) {
  if (!session) return "";
  if (session.role === "customer") return state.customers.find((item) => item.id === session.userId)?.photo ?? "";
  if (session.role === "artist") return state.artists.find((item) => item.id === session.userId)?.photo ?? "";
  if (session.role === "admin") return ADMIN_PROFILE.photo;
  return "";
}

function AccountMark({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span aria-hidden="true" className="text-xl leading-none">👤</span>;
  return <img src={src} alt="" className="h-6 w-6 rounded-full object-cover" onError={() => setFailed(true)} />;
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M4 11.5 12 4l8 7.5V20h-5.5v-6h-5v6H4z" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <circle cx="11" cy="11" r="6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.5 15.5 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
