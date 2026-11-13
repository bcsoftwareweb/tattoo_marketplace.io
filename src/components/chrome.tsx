"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDemo } from "@/context/demo-context";
import { DEMO_ACCOUNTS } from "@/lib/auth";
import { homeFor } from "@/lib/permissions";
import { unreadCount } from "@/lib/selectors";
import type { Role } from "@/lib/types";
import { frame } from "@/components/ui";

const PUBLIC_LINKS = [
  ["/", "Discover"],
  ["/styles", "Explore styles"],
  ["/artists", "Artists"],
];

function isCurrentPage(pathname: string, href: string) {
  const current = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const target = href.length > 1 && href.endsWith("/") ? href.slice(0, -1) : href;
  return current === target;
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="block">
      {open ? (
        <path d="M5 5 L17 17 M17 5 L5 17" stroke="currentColor" strokeWidth="1.5" />
      ) : (
        <path d="M3 6 H19 M3 11 H19 M3 16 H19" stroke="currentColor" strokeWidth="1.5" />
      )}
    </svg>
  );
}

export function PublicHeader() {
  const { session, state } = useDemo();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  const brand = state.settings.platformName || "BLACKLINE";
  const accountHref = session ? homeFor(session.role) : "/login";
  const openPage = (href: string) => {
    setOpen(false);
    if (!isCurrentPage(pathname, href)) return;
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  };

  return (
    <header className="on-ink sticky top-0 z-[60] border-b border-panel bg-ink text-white">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <div className={`${frame} flex h-16 items-center justify-between gap-3`}>
        <Link href="/" onClick={() => openPage("/")} className="shrink-0 border-b border-transparent font-display text-xs tracking-[0.16em] hover:border-white sm:text-sm sm:tracking-[0.22em]">{brand}</Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {PUBLIC_LINKS.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => openPage(href)} className="border-b border-transparent pb-0.5 text-sm hover:border-white">{label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <Link href={accountHref} onClick={() => openPage(accountHref)} className="hidden h-10 items-center bg-white px-4 text-sm text-ink md:inline-flex">Dashboard</Link>
          ) : (
            <Link href="/login" onClick={() => openPage("/login")} className="hidden border-b border-transparent pb-0.5 text-sm text-white hover:border-white md:inline">Sign In/Sign up</Link>
          )}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>
      <div className={`fixed inset-x-0 top-16 z-50 grid h-[calc(100svh-4rem)] transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:hidden ${open ? "grid-rows-[1fr]" : "pointer-events-none grid-rows-[0fr]"}`}>
        <nav id="mobile-nav" className="flex min-h-0 flex-col overflow-hidden bg-ink" aria-label="Mobile" aria-hidden={!open} inert={!open}>
          <div className={`flex h-full flex-col border-t border-panel px-5 pb-8 pt-12 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}>
            <ul className="grid gap-3">
              {PUBLIC_LINKS.map(([href, label]) => (
                <li key={href}><Link href={href} onClick={() => openPage(href)} className="block py-3 text-lg">{label}</Link></li>
              ))}
            </ul>
            {session ? (
              <Link href={accountHref} onClick={() => openPage(accountHref)} className="mt-14 text-lg">Dashboard</Link>
            ) : (
              <Link href="/login" onClick={() => openPage("/login")} className="mt-14 text-lg">Sign In/Sign up</Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  const { state } = useDemo();
  return (
    <footer className="mt-20 border-t border-line bg-ink text-white max-md:pb-20">
      <div className={`${frame} grid gap-10 py-14 md:grid-cols-4`}>
        <div>
          <p className="font-display tracking-[0.18em]">{state.settings.platformName}</p>
          <p className="mt-4 max-w-xs text-sm leading-6 text-mist">{state.settings.tagline} This prototype stores everything in your browser.</p>
        </div>
        <div className="grid grid-cols-3 gap-x-3 md:contents md:gap-0">
          <FooterColumn title="Marketplace" links={[["/artists", "Find artists"], ["/styles", "Styles"], ["/how-it-works", "How it works"]]} />
          <FooterColumn title="Studios" links={[["/for-artists", "Artist application"]]} />
          <FooterColumn title="About" links={[["/about", "About"], ["/legal/privacy", "Privacy"], ["/legal/terms", "Terms"]]} />
        </div>
      </div>
      <div className={`${frame} border-t border-panel py-5 text-xs text-mist`}>Simulated bookings and payments. No real money, messages, or accounts.</div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-[0.14em] text-mist sm:tracking-[0.18em]">{title}</p>
      <ul className="mt-4 grid gap-2 text-sm">
        {links.map(([href, label]) => (
          <li key={href}><Link href={href} className="hover:text-mist">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { session, ready } = useDemo();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace("/login");
    else if (session.role !== role) router.replace(homeFor(session.role));
  }, [ready, session, role, router]);
  if (!ready || !session || session.role !== role) {
    return <div className="grid min-h-screen place-items-center bg-ink text-sm text-mist">Checking the demo session…</div>;
  }
  return children;
}

export function DashboardShell({ role, items, children }: { role: Role; items: Array<{ href: string; label: string }>; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="min-h-screen bg-ink text-white md:grid md:grid-cols-[240px_1fr]">
      <aside className="on-ink hidden border-r border-panel bg-ink text-white md:flex md:min-h-screen md:flex-col">
        <SideNav role={role} items={items} pathname={pathname} />
      </aside>
      <div className="min-w-0">
        <TopBar role={role} onMenu={() => setOpen(true)} />
        {open ? (
          <div className="fixed inset-0 z-50 bg-ink text-white md:hidden">
            <div className="flex justify-end p-4">
              <button type="button" onClick={() => setOpen(false)} className="text-sm">Close</button>
            </div>
            <SideNav role={role} items={items} pathname={pathname} />
          </div>
        ) : null}
        <div id="content" className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</div>
      </div>
    </div>
  );
}

function SideNav({ role, items, pathname }: { role: Role; items: Array<{ href: string; label: string }>; pathname: string }) {
  const { state } = useDemo();
  return (
    <div className="flex h-full flex-col px-5 py-6">
      <Link href="/" className="font-display text-sm tracking-[0.2em]">{state.settings.platformName}</Link>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-mist">{role}</p>
      <nav className="mt-8 grid gap-1" aria-label="Dashboard">
        {items.map((item) => {
          const active = item.href === `/${role}` ? pathname === item.href || pathname === `${item.href}/` : pathname === item.href || pathname.startsWith(`${item.href}`);
          return (
            <Link key={item.href} href={item.href} className={active ? "bg-white px-3 py-2 text-sm text-ink" : "px-3 py-2 text-sm text-mist hover:text-white"}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function TopBar({ role, onMenu }: { role: Role; onMenu: () => void }) {
  const { session, state, logout, switchTo, resetDemo, readNotification, toast } = useDemo();
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  if (!session) return null;
  const notes = state.notifications.filter((item) => item.userId === session.userId).slice(0, 5);
  const unread = unreadCount(state, session.userId);

  return (
    <div className="flex h-16 items-center justify-between border-b border-panel bg-ink px-4 text-white md:px-8">
      <button type="button" className="text-sm md:hidden" onClick={onMenu}>Menu</button>
      <p className="hidden text-sm text-mist md:block">Demo session · {session.email}</p>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button type="button" className="h-10 border border-detail px-3 text-sm" aria-expanded={notesOpen} onClick={() => { setNotesOpen((value) => !value); setAccountOpen(false); }}>
            Alerts{unread ? ` ${unread}` : ""}
          </button>
          {notesOpen ? (
            <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] border border-line bg-white p-3 shadow-none">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Notifications</p>
                <Link href={`/${role}/notifications`} className="text-xs text-mute" onClick={() => setNotesOpen(false)}>View all</Link>
              </div>
              <ul className="mt-3 grid gap-2">
                {notes.length ? notes.map((note) => (
                  <li key={note.id}>
                    <Link
                      href={note.href}
                      className="block border border-line px-3 py-2 text-sm hover:bg-paper"
                      onClick={() => { readNotification(note.id); setNotesOpen(false); }}
                    >
                      <span className="block font-medium">{note.title}</span>
                      <span className="mt-1 block text-xs text-mute">{note.body}</span>
                    </Link>
                  </li>
                )) : <li className="text-sm text-mute">No notifications yet.</li>}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button type="button" className="h-10 max-w-[8rem] truncate bg-white px-3 text-sm text-ink sm:max-w-none" aria-expanded={accountOpen} onClick={() => { setAccountOpen((value) => !value); setNotesOpen(false); }}>
            {session.name}
          </button>
          {accountOpen ? (
            <div className="absolute right-0 z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] border border-line bg-white p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-mute">Switch demo account</p>
              <div className="mt-2 grid gap-1">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    className="px-2 py-2 text-left text-sm hover:bg-paper"
                    onClick={() => {
                      const result = switchTo(account.role);
                      setAccountOpen(false);
                      if (result.ok) router.push(homeFor(account.role));
                      else toast(result.error);
                    }}
                  >
                    {account.blurb}
                  </button>
                ))}
              </div>
              <button type="button" className="mt-2 w-full border border-line px-2 py-2 text-left text-sm" onClick={() => { resetDemo(); setAccountOpen(false); }}>Reset demo data</button>
              <button type="button" className="mt-1 w-full px-2 py-2 text-left text-sm" onClick={() => { logout(); router.push("/"); }}>Log out</button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
